package proxy

import (
	"bufio"
	"bytes"
	"context"
	"crypto/tls"
	"encoding/binary"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"cep-local-dlp-agent/pkg/webprotect"
)

// IsWebSocketUpgrade reports whether the HTTP request is an RFC 6455 WebSocket upgrade handshake.
func IsWebSocketUpgrade(r *http.Request) bool {
	if r == nil {
		return false
	}
	return strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade") &&
		strings.EqualFold(strings.TrimSpace(r.Header.Get("Upgrade")), "websocket")
}

// handleWebSocketUpgrade dials the upstream WebSocket server, completes the 101 Switching Protocols
// handshake, and relays WebSocket frames while inspecting every client->server Text (0x1) and
// Binary (0x2) frame against CEP WebProtect before forwarding it upstream.
func (s *Server) handleWebSocketUpgrade(clientConn net.Conn, r *http.Request, useTLS bool, clientProc string) error {
	targetHost := r.URL.Host
	if targetHost == "" {
		targetHost = r.Host
	}
	if !strings.Contains(targetHost, ":") {
		if useTLS {
			targetHost += ":443"
		} else {
			targetHost += ":80"
		}
	}

	var upstreamConn net.Conn
	var err error
	dialer := &net.Dialer{Timeout: 15 * time.Second}
	if useTLS {
		hostOnly := targetHost
		if h, _, splitErr := net.SplitHostPort(targetHost); splitErr == nil {
			hostOnly = h
		}
		upstreamConn, err = tls.DialWithDialer(dialer, "tcp", targetHost, &tls.Config{
			ServerName: hostOnly,
		})
	} else {
		upstreamConn, err = dialer.Dial("tcp", targetHost)
	}
	if err != nil {
		return writeSyntheticResponse(clientConn, http.StatusBadGateway, nil, []byte("websocket upstream dial failed"))
	}
	defer upstreamConn.Close()

	// Forward the client's HTTP Upgrade request to upstream
	if err := r.Write(upstreamConn); err != nil {
		return err
	}

	upReader := bufio.NewReader(upstreamConn)
	resp, err := http.ReadResponse(upReader, r)
	if err != nil {
		return err
	}

	// Write the 101 Switching Protocols response headers back to the client
	var respBuf bytes.Buffer
	_ = resp.Header.Write(&respBuf)
	statusLine := "HTTP/1.1 " + resp.Status + "\r\n"
	if _, err := clientConn.Write(append([]byte(statusLine), append(respBuf.Bytes(), []byte("\r\n")...)...)); err != nil {
		return err
	}

	if resp.StatusCode != http.StatusSwitchingProtocols {
		if resp.Body != nil {
			_, _ = io.Copy(clientConn, resp.Body)
			_ = resp.Body.Close()
		}
		return nil
	}

	// Flush any bytes already buffered from upstream after the 101 response headers
	if upReader.Buffered() > 0 {
		buffered := make([]byte, upReader.Buffered())
		n, _ := upReader.Read(buffered)
		if n > 0 {
			_, _ = clientConn.Write(buffered[:n])
		}
	}

	wsURL := r.URL.String()
	done := make(chan struct{}, 2)

	// Upstream -> Client relay (server-to-client frames flow directly)
	go func() {
		_, _ = io.Copy(clientConn, upstreamConn)
		done <- struct{}{}
	}()

	// Client -> Upstream relay with RFC 6455 frame-by-frame CEP DLP inspection
	go func() {
		defer func() { done <- struct{}{} }()
		s.relayClientWebSocketFrames(clientConn, upstreamConn, wsURL, clientProc)
	}()

	<-done
	return nil
}

// relayClientWebSocketFrames reads RFC 6455 frames from clientConn, unmasks Text (0x1) and
// Binary (0x2) payloads for CEP WebProtect DLP evaluation, and drops/closes the connection
// before forwarding to upstreamConn if a BLOCK rule matches.
func (s *Server) relayClientWebSocketFrames(clientConn net.Conn, upstreamConn net.Conn, wsURL, clientProc string) {
	reader := bufio.NewReader(clientConn)
	for {
		rawFrame, opcode, unmaskedPayload, err := readWebSocketFrame(reader)
		if err != nil {
			return
		}

		// Inspect Text (0x1), Binary (0x2), and Continuation (0x0) frames carrying user data
		if (opcode == 0x1 || opcode == 0x2 || opcode == 0x0) && len(unmaskedPayload) > 0 {
			contentType := "text/plain"
			if opcode == 0x2 {
				contentType = http.DetectContentType(unmaskedPayload)
			}
			if len(unmaskedPayload) >= s.Filter.MinPayloadBytes || (len(unmaskedPayload) >= 4 && (unmaskedPayload[0] == '{' || unmaskedPayload[0] == '[')) {
				ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
				blocked, verdict := s.inspectOutboundPayload(ctx, wsURL, contentType, clientProc, unmaskedPayload)
				cancel()
				if blocked {
					ruleName := ""
					if verdict != nil {
						ruleName = verdict.RuleName
					}
					log.Printf("[proxy/ws] BLOCKED outbound WebSocket frame to %s (%d bytes, rule=%q)",
						RedactURL(wsURL), len(unmaskedPayload), ruleName)
					// Send RFC 6455 Close Frame (1008 Policy Violation) to client and abort upstream write
					closeFrame := buildWebSocketCloseFrame(1008, "Blocked by Chrome Enterprise Premium DLP: "+ruleName)
					_, _ = clientConn.Write(closeFrame)
					return
				}
			}
		}

		if _, err := upstreamConn.Write(rawFrame); err != nil {
			return
		}
		// Opcode 0x8 is Close frame
		if opcode == 0x8 {
			return
		}
	}
}

func readWebSocketFrame(r io.Reader) (rawFrame []byte, opcode byte, unmasked []byte, err error) {
	var hdr [2]byte
	if _, err = io.ReadFull(r, hdr[:]); err != nil {
		return nil, 0, nil, err
	}
	rawFrame = append(rawFrame, hdr[:]...)

	opcode = hdr[0] & 0x0F
	masked := (hdr[1] & 0x80) != 0
	payloadLen := uint64(hdr[1] & 0x7F)

	switch payloadLen {
	case 126:
		var ext [2]byte
		if _, err = io.ReadFull(r, ext[:]); err != nil {
			return nil, 0, nil, err
		}
		rawFrame = append(rawFrame, ext[:]...)
		payloadLen = uint64(binary.BigEndian.Uint16(ext[:]))
	case 127:
		var ext [8]byte
		if _, err = io.ReadFull(r, ext[:]); err != nil {
			return nil, 0, nil, err
		}
		rawFrame = append(rawFrame, ext[:]...)
		payloadLen = binary.BigEndian.Uint64(ext[:])
	}

	if payloadLen > uint64(webprotect.MaxPayloadBytes) {
		payloadLen = uint64(webprotect.MaxPayloadBytes)
	}

	var maskKey [4]byte
	if masked {
		if _, err = io.ReadFull(r, maskKey[:]); err != nil {
			return nil, 0, nil, err
		}
		rawFrame = append(rawFrame, maskKey[:]...)
	}

	payload := make([]byte, payloadLen)
	if payloadLen > 0 {
		if _, err = io.ReadFull(r, payload); err != nil {
			return nil, 0, nil, err
		}
		rawFrame = append(rawFrame, payload...)
	}

	unmasked = make([]byte, len(payload))
	copy(unmasked, payload)
	if masked {
		for i := range unmasked {
			unmasked[i] ^= maskKey[i%4]
		}
	}
	return rawFrame, opcode, unmasked, nil
}

func buildWebSocketCloseFrame(code uint16, reason string) []byte {
	if len(reason) > 120 {
		reason = reason[:120]
	}
	payloadLen := 2 + len(reason)
	frame := make([]byte, 2+payloadLen)
	frame[0] = 0x88 // FIN=1, Opcode=0x8 (Close)
	frame[1] = byte(payloadLen)
	binary.BigEndian.PutUint16(frame[2:4], code)
	copy(frame[4:], []byte(reason))
	return frame
}
