package proxy

import (
	"bufio"
	"encoding/binary"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

func buildMaskedClientWSFrame(opcode byte, payload []byte) []byte {
	maskKey := [4]byte{0x12, 0x34, 0x56, 0x78}
	var frame []byte
	frame = append(frame, 0x80|(opcode&0x0F)) // FIN=1 + opcode
	if len(payload) < 126 {
		frame = append(frame, 0x80|byte(len(payload)))
	} else {
		frame = append(frame, 0x80|126)
		var ext [2]byte
		binary.BigEndian.PutUint16(ext[:], uint16(len(payload)))
		frame = append(frame, ext[:]...)
	}
	frame = append(frame, maskKey[:]...)
	masked := make([]byte, len(payload))
	for i := range payload {
		masked[i] = payload[i] ^ maskKey[i%4]
	}
	frame = append(frame, masked...)
	return frame
}

func TestWebSocketFrameUnmaskAndCloseFrame(t *testing.T) {
	want := "MyNumber: 1234-5678-9012 inside WebSocket frame"
	raw := buildMaskedClientWSFrame(0x1, []byte(want))

	gotRaw, opcode, unmasked, err := readWebSocketFrame(strings.NewReader(string(raw)))
	if err != nil {
		t.Fatalf("readWebSocketFrame failed: %v", err)
	}
	if opcode != 0x1 || string(unmasked) != want || len(gotRaw) != len(raw) {
		t.Fatalf("unexpected frame parse: opcode=%d unmasked=%q", opcode, string(unmasked))
	}

	closeFrame := buildWebSocketCloseFrame(1008, "Blocked by CEP DLP")
	_, closeOp, closePayload, err := readWebSocketFrame(strings.NewReader(string(closeFrame)))
	if err != nil || closeOp != 0x8 {
		t.Fatalf("expected close opcode 0x8, got %d (err=%v)", closeOp, err)
	}
	code := binary.BigEndian.Uint16(closePayload[:2])
	if code != 1008 {
		t.Fatalf("expected close code 1008, got %d", code)
	}
}

func TestMultiplexedSOCKS5AndSMTPDataDLP(t *testing.T) {
	// 1. Mock CEP WebProtect Server
	mockWP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = r.Body.Close()
		action := webprotect.ActionUnspecified
		ruleName := ""
		if strings.Contains(string(body), "CONFIDENTIAL_MY_NUMBER_9999") {
			action = webprotect.ActionBlock
			ruleName = "Block-SMTP-Exfil"
		}
		respProto := &webprotect.ContentAnalysisResponse{
			RequestToken: "req-smtp-1",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
					TriggeredRules: []webprotect.TriggeredRule{
						{
							Action:   action,
							RuleName: ruleName,
							RuleID:   "rule-smtp",
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/x-protobuf")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(respProto.MarshalProto())
	}))
	defer mockWP.Close()

	// 2. Mock Upstream SMTP Server listening on a local TCP port
	smtpLn, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen mock smtp: %v", err)
	}
	defer smtpLn.Close()

	receivedEmails := make(chan string, 4)
	go func() {
		for {
			conn, err := smtpLn.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				_, _ = c.Write([]byte("220 smtp.example.com ESMTP ready\r\n"))
				r := bufio.NewReader(c)
				inData := false
				var msg strings.Builder
				for {
					line, err := r.ReadString('\n')
					if err != nil {
						return
					}
					upper := strings.ToUpper(strings.TrimSpace(line))
					if !inData {
						switch {
						case strings.HasPrefix(upper, "EHLO") || strings.HasPrefix(upper, "HELO"):
							_, _ = c.Write([]byte("250 OK\r\n"))
						case strings.HasPrefix(upper, "MAIL FROM") || strings.HasPrefix(upper, "RCPT TO"):
							_, _ = c.Write([]byte("250 OK\r\n"))
						case upper == "DATA":
							inData = true
							msg.Reset()
							_, _ = c.Write([]byte("354 End data with <CR><LF>.<CR><LF>\r\n"))
						case upper == "RSET":
							inData = false
							msg.Reset()
							_, _ = c.Write([]byte("250 Reset OK\r\n"))
						case upper == "QUIT":
							_, _ = c.Write([]byte("221 Bye\r\n"))
							return
						}
					} else {
						if strings.TrimRight(line, "\r\n") == "." {
							inData = false
							receivedEmails <- msg.String()
							_, _ = c.Write([]byte("250 2.0.0 Queued\r\n"))
						} else if strings.ToUpper(strings.TrimSpace(line)) == "RSET" {
							inData = false
							msg.Reset()
						} else {
							msg.WriteString(line)
						}
					}
				}
			}(conn)
		}
	}()

	// 3. Start Multiplexed Proxy Server (serving both HTTP and SOCKS5 on the same port)
	ca, err := LoadOrCreateCA(t.TempDir())
	if err != nil {
		t.Fatalf("LoadOrCreateCA: %v", err)
	}
	wpClient := webprotect.NewClient(mockWP.URL)
	filter := NewSmartFilter(20, 50.0)
	tok := &dmtoken.TokenInfo{DMToken: "dm-tok", UserEmail: "user@example.com", DeviceName: "pc", OSPlatform: "Linux"}
	srv := NewServer(ca, filter, wpClient, tok, notifier.NewOSNotifier(true))

	rawLn, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen proxy: %v", err)
	}
	defer rawLn.Close()
	muxLn := NewMultiplexedListener(rawLn, srv)
	httpSrv := &http.Server{Handler: srv}
	go func() {
		_ = httpSrv.Serve(muxLn)
	}()
	defer httpSrv.Close()

	// Connect via SOCKS5 (0x05) to the mock SMTP server
	conn, err := net.DialTimeout("tcp", rawLn.Addr().String(), 5*time.Second)
	if err != nil {
		t.Fatalf("dial proxy: %v", err)
	}
	defer conn.Close()

	// SOCKS5 greeting: [0x05, 0x01, 0x00]
	_, _ = conn.Write([]byte{0x05, 0x01, 0x00})
	var greetReply [2]byte
	if _, err := io.ReadFull(conn, greetReply[:]); err != nil || greetReply != [2]byte{0x05, 0x00} {
		t.Fatalf("unexpected SOCKS5 greeting reply: %v (err=%v)", greetReply, err)
	}

	// SOCKS5 CONNECT to 127.0.0.1:<smtpPort>
	_, smtpPortStr, _ := net.SplitHostPort(smtpLn.Addr().String())
	smtpPort, _ := strconv.Atoi(smtpPortStr)
	req := []byte{0x05, 0x01, 0x00, 0x01, 127, 0, 0, 1, byte(smtpPort >> 8), byte(smtpPort & 0xFF)}
	_, _ = conn.Write(req)
	var connReply [10]byte
	if _, err := io.ReadFull(conn, connReply[:]); err != nil || connReply[1] != 0x00 {
		t.Fatalf("unexpected SOCKS5 connect reply: %v (err=%v)", connReply, err)
	}

	// Drive SMTP DATA conversation inside the SOCKS5 tunnel ( forcing port=25 behavior via inspectServerFirstProtocol )
	// Note: since smtpPort is ephemeral in test, let's test inspectServerFirstProtocol directly for SMTP port 25 as well.
	_ = conn.Close()

	clientPipe, proxySide := net.Pipe()
	defer clientPipe.Close()
	go srv.inspectServerFirstProtocol(proxySide, bufio.NewReader(proxySide), smtpLn.Addr().String(), 25, "thunderbird")

	r := bufio.NewReader(clientPipe)
	banner, _ := r.ReadString('\n')
	if !strings.HasPrefix(banner, "220 ") {
		t.Fatalf("expected 220 SMTP banner, got %q", banner)
	}
	_, _ = clientPipe.Write([]byte("DATA\r\n"))
	resp354, _ := r.ReadString('\n')
	if !strings.HasPrefix(resp354, "354 ") {
		t.Fatalf("expected 354 response, got %q", resp354)
	}

	// Send sensitive email body + ".\r\n" -> must be BLOCKED with 554 5.7.1!
	_, _ = clientPipe.Write([]byte("Subject: Leak\r\n\r\nHere is CONFIDENTIAL_MY_NUMBER_9999 in email body.\r\n.\r\n"))
	blockReply, _ := r.ReadString('\n')
	if !strings.HasPrefix(blockReply, "554 5.7.1") {
		t.Fatalf("expected 554 5.7.1 DLP block reply, got %q", blockReply)
	}
}
