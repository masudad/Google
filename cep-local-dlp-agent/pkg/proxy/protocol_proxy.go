package proxy

import (
	"bufio"
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"cep-local-dlp-agent/pkg/egress"
)

// peekConn wraps a net.Conn with a bufio.Reader so the first byte can be inspected
// to multiplex SOCKS5 (0x05) and HTTP/HTTPS proxy traffic on the same TCP listener.
type peekConn struct {
	net.Conn
	r *bufio.Reader
}

func (c *peekConn) Read(b []byte) (int, error) {
	return c.r.Read(b)
}

// MultiplexedListener intercepts incoming TCP connections on the proxy port:
//   - First byte == 0x05 -> handled natively as RFC 1928 SOCKS5 proxy connection
//   - Otherwise          -> returned to http.Server for HTTP/HTTPS CONNECT & Control Plane
type MultiplexedListener struct {
	net.Listener
	Server *Server
}

// NewMultiplexedListener wraps ln so a single port (127.0.0.1:8843) simultaneously serves
// HTTP Proxy, HTTPS CONNECT, Control Plane (/healthz), and SOCKS5 (socks5://127.0.0.1:8843).
func NewMultiplexedListener(ln net.Listener, srv *Server) net.Listener {
	return &MultiplexedListener{
		Listener: ln,
		Server:   srv,
	}
}

func (m *MultiplexedListener) Accept() (net.Conn, error) {
	for {
		conn, err := m.Listener.Accept()
		if err != nil {
			return nil, err
		}
		br := bufio.NewReader(conn)
		first, peekErr := br.Peek(1)
		if peekErr == nil && len(first) == 1 && first[0] == 0x05 && m.Server != nil {
			go m.Server.HandleSOCKS5Conn(&peekConn{Conn: conn, r: br})
			continue
		}
		return &peekConn{Conn: conn, r: br}, nil
	}
}

// HandleSOCKS5Conn implements RFC 1928 SOCKS5 handshake (No-Auth 0x00) + CONNECT (0x01)
// and funnels the established stream through our Multi-Protocol DLP Inspector (HTTP/TLS/SMTP/FTP/Raw TCP).
func (s *Server) HandleSOCKS5Conn(clientConn net.Conn) {
	defer clientConn.Close()

	// 1. Read greeting: [VER=0x05, NMETHODS, METHODS...]
	var hdr [2]byte
	if _, err := io.ReadFull(clientConn, hdr[:]); err != nil || hdr[0] != 0x05 {
		return
	}
	methods := make([]byte, int(hdr[1]))
	if _, err := io.ReadFull(clientConn, methods); err != nil {
		return
	}
	// Reply: [VER=0x05, METHOD=0x00 (No Auth)]
	if _, err := clientConn.Write([]byte{0x05, 0x00}); err != nil {
		return
	}

	// 2. Read request: [VER=0x05, CMD, RSV=0x00, ATYP, DST.ADDR, DST.PORT]
	var reqHdr [4]byte
	if _, err := io.ReadFull(clientConn, reqHdr[:]); err != nil || reqHdr[0] != 0x05 {
		return
	}
	if reqHdr[1] != 0x01 { // Only CONNECT (0x01) supported
		_, _ = clientConn.Write([]byte{0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0})
		return
	}

	var host string
	switch reqHdr[3] {
	case 0x01: // IPv4
		var ip [4]byte
		if _, err := io.ReadFull(clientConn, ip[:]); err != nil {
			return
		}
		host = net.IP(ip[:]).String()
	case 0x03: // Domain name
		var dlen [1]byte
		if _, err := io.ReadFull(clientConn, dlen[:]); err != nil {
			return
		}
		domain := make([]byte, int(dlen[0]))
		if _, err := io.ReadFull(clientConn, domain); err != nil {
			return
		}
		host = string(domain)
	case 0x04: // IPv6
		var ip [16]byte
		if _, err := io.ReadFull(clientConn, ip[:]); err != nil {
			return
		}
		host = net.IP(ip[:]).String()
	default:
		return
	}

	var portBytes [2]byte
	if _, err := io.ReadFull(clientConn, portBytes[:]); err != nil {
		return
	}
	port := binary.BigEndian.Uint16(portBytes[:])
	targetHostPort := net.JoinHostPort(host, strconv.Itoa(int(port)))

	// Reply success: [0x05, 0x00, 0x00, 0x01, 0,0,0,0, 0,0]
	if _, err := clientConn.Write([]byte{0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0}); err != nil {
		return
	}

	clientProc := IdentifyLocalProcess(clientConn.RemoteAddr().String())
	if IsBypassedProcess(clientProc) {
		s.tunnelRawTCP(clientConn, nil, targetHostPort)
		return
	}

	s.inspectTunnelStream(clientConn, targetHostPort, int(port), clientProc)
}

// inspectTunnelStream sniffs the application protocol inside a SOCKS5 or non-standard CONNECT tunnel
// and applies protocol-aware CEP DLP inspection for TLS (HTTPS/WSS/SMTPS/FTPS), HTTP, SMTP, FTP, and Raw TCP.
func (s *Server) inspectTunnelStream(clientConn net.Conn, targetHostPort string, port int, clientProc string) {
	br := bufio.NewReader(clientConn)

	// For server-speaks-first protocols (SMTP 25/587, FTP 21), dial upstream first and relay greeting
	if port == 25 || port == 587 || port == 21 {
		s.inspectServerFirstProtocol(clientConn, br, targetHostPort, port, clientProc)
		return
	}

	// Peek at the client's first bytes to detect TLS (0x16 0x03) vs HTTP vs Raw TCP/SMTP/FTP
	_ = clientConn.SetReadDeadline(time.Now().Add(3 * time.Second))
	peeked, _ := br.Peek(3)
	_ = clientConn.SetReadDeadline(time.Time{})

	wrappedClient := &peekConn{Conn: clientConn, r: br}

	// Case 1: TLS ClientHello (0x16 0x03 ...)
	if len(peeked) >= 2 && peeked[0] == 0x16 && peeked[1] == 0x03 {
		if s.Filter.ShouldBypassTLS(targetHostPort) || s.CA == nil {
			s.tunnelRawTCP(wrappedClient, nil, targetHostPort)
			return
		}
		s.handleTLSInTunnel(wrappedClient, targetHostPort, clientProc)
		return
	}

	// Case 2: Cleartext HTTP inside tunnel
	if isHTTPMethodPrefix(peeked) {
		for {
			req, err := http.ReadRequest(br)
			if err != nil {
				return
			}
			req.URL.Scheme = "http"
			req.URL.Host = targetHostPort
			req.RequestURI = ""
			if IsWebSocketUpgrade(req) {
				_ = s.handleWebSocketUpgrade(wrappedClient, req, false, clientProc)
				return
			}
			closeConn, err := s.handleHTTPSConnRequest(wrappedClient, req, clientProc)
			if err != nil || closeConn || req.Close {
				return
			}
		}
	}

	// Case 3: Generic TCP / Custom Protocol Stream (inspect outbound chunks before forwarding)
	s.inspectRawTCPStream(wrappedClient, targetHostPort, port, clientProc)
}

func isHTTPMethodPrefix(b []byte) bool {
	if len(b) < 3 {
		return false
	}
	s := string(b[:3])
	return s == "GET" || s == "POS" || s == "PUT" || s == "PAT" || s == "DEL" || s == "HEA" || s == "OPT"
}

// inspectServerFirstProtocol inspects SMTP (25/587) and FTP (21) command/data streams.
func (s *Server) inspectServerFirstProtocol(clientConn net.Conn, clientReader *bufio.Reader, targetHostPort string, port int, clientProc string) {
	upstreamConn, err := net.DialTimeout("tcp", targetHostPort, 15*time.Second)
	if err != nil {
		return
	}
	defer upstreamConn.Close()

	hostOnly := targetHostPort
	if h, _, splitErr := net.SplitHostPort(targetHostPort); splitErr == nil {
		hostOnly = h
	}
	protoName := "tcp"
	switch port {
	case 25, 587, 465:
		protoName = "smtp"
	case 21, 990:
		protoName = "ftp"
	}
	syntheticURL := egress.BuildProtocolURL(protoName, hostOnly)

	done := make(chan struct{}, 2)
	go func() {
		_, _ = io.Copy(clientConn, upstreamConn)
		done <- struct{}{}
	}()

	// Client -> Upstream with line/DATA buffer inspection
	go func() {
		defer func() { done <- struct{}{} }()
		inSMTPData := false
		var smtpBuf bytes.Buffer

		for {
			line, err := clientReader.ReadBytes('\n')
			if len(line) > 0 {
				trimmedUpper := strings.ToUpper(strings.TrimSpace(string(line)))
				if protoName == "smtp" && !inSMTPData && trimmedUpper == "DATA" {
					inSMTPData = true
					smtpBuf.Reset()
					if _, werr := upstreamConn.Write(line); werr != nil {
						return
					}
					continue
				}

				if inSMTPData {
					if bytes.Equal(bytes.TrimRight(line, "\r\n"), []byte(".")) {
						// End of SMTP DATA block -> inspect full message before sending ".\r\n"
						payload := smtpBuf.Bytes()
						inSMTPData = false
						if len(payload) >= s.Filter.MinPayloadBytes {
							ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
							blocked, verdict := s.inspectOutboundPayload(ctx, syntheticURL, "text/plain", clientProc, payload)
							cancel()
							if blocked {
								ruleName := ""
								if verdict != nil {
									ruleName = verdict.RuleName
								}
								log.Printf("[proxy/smtp] BLOCKED outbound SMTP email to %s (%d bytes, rule=%q)",
									syntheticURL, len(payload), ruleName)
								_, _ = clientConn.Write([]byte(fmt.Sprintf("554 5.7.1 Message blocked by Chrome Enterprise Premium DLP (rule: %s)\r\n", ruleName)))
								_, _ = upstreamConn.Write([]byte("\r\n.\r\nRSET\r\nQUIT\r\n"))
								return
							}
						}
						// Allowed: flush buffered DATA body and terminating ".\r\n" to upstream SMTP server
						_, _ = upstreamConn.Write(payload)
						_, _ = upstreamConn.Write(line)
						smtpBuf.Reset()
						continue
					}
					smtpBuf.Write(line)
					continue
				}

				// Inspect non-DATA command lines (e.g. FTP STOR or inline payloads)
				if len(line) >= s.Filter.MinPayloadBytes {
					ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
					blocked, _ := s.inspectOutboundPayload(ctx, syntheticURL, "text/plain", clientProc, line)
					cancel()
					if blocked {
						return
					}
				}
				if _, werr := upstreamConn.Write(line); werr != nil {
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()

	<-done
}

// inspectRawTCPStream inspects outbound TCP payload chunks on arbitrary protocols/ports
// (e.g. custom TCP protocols, FTP data channels, raw socket streams) before forwarding upstream.
func (s *Server) inspectRawTCPStream(clientConn net.Conn, targetHostPort string, port int, clientProc string) {
	upstreamConn, err := net.DialTimeout("tcp", targetHostPort, 15*time.Second)
	if err != nil {
		return
	}
	defer upstreamConn.Close()

	syntheticURL := egress.BuildProtocolURL("tcp", targetHostPort)
	done := make(chan struct{}, 2)

	go func() {
		_, _ = io.Copy(clientConn, upstreamConn)
		done <- struct{}{}
	}()

	go func() {
		defer func() { done <- struct{}{} }()
		buf := make([]byte, 32*1024)
		for {
			n, rerr := clientConn.Read(buf)
			if n > 0 {
				chunk := buf[:n]
				if len(chunk) >= s.Filter.MinPayloadBytes {
					contentType := http.DetectContentType(chunk)
					ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
					blocked, verdict := s.inspectOutboundPayload(ctx, syntheticURL, contentType, clientProc, chunk)
					cancel()
					if blocked {
						ruleName := ""
						if verdict != nil {
							ruleName = verdict.RuleName
						}
						log.Printf("[proxy/tcp] BLOCKED outbound TCP payload to %s (%d bytes, rule=%q)",
							syntheticURL, len(chunk), ruleName)
						return
					}
				}
				if _, werr := upstreamConn.Write(chunk); werr != nil {
					return
				}
			}
			if rerr != nil {
				return
			}
		}
	}()

	<-done
}
