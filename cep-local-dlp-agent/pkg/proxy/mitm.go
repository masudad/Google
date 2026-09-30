package proxy

import (
	"bufio"
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

// debugEnabled reports whether verbose passthrough/inspection tracing is on (CEP_AGENT_DEBUG=1).
func debugEnabled() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("CEP_AGENT_DEBUG")))
	return v == "1" || v == "true" || v == "yes"
}

// Server implements the Layer-2 Smart HTTPS MITM & Transparent Pass-through Proxy.
type Server struct {
	CA                *CertificateAuthority
	Filter            *SmartFilter
	WebProtect        *webprotect.Client
	TokenInfo         *dmtoken.TokenInfo
	Notifier          notifier.Notifier
	UpstreamTransport http.RoundTripper
}

// NewServer constructs a new Smart Proxy Server.
func NewServer(ca *CertificateAuthority, filter *SmartFilter, wp *webprotect.Client, token *dmtoken.TokenInfo, notif notifier.Notifier) *Server {
	if filter == nil {
		filter = NewSmartFilter(DefaultMinPayloadBytes, DefaultDeviceQPS)
	}
	if notif == nil {
		notif = notifier.NewOSNotifier(true)
	}
	return &Server{
		CA:         ca,
		Filter:     filter,
		WebProtect: wp,
		TokenInfo:  token,
		Notifier:   notif,
		UpstreamTransport: &http.Transport{
			Proxy:                 nil, // Connect directly to upstream without looping back
			ForceAttemptHTTP2:     false,
			ResponseHeaderTimeout: 60 * time.Second,
			IdleConnTimeout:       90 * time.Second,
		},
	}
}

// ServeHTTP handles local Control Plane endpoints (/healthz, /__cep_agent/*),
// standard HTTP proxy requests, and HTTPS CONNECT tunneling.
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodConnect && s.isLocalControlRequest(r) {
		s.handleControlPlane(w, r)
		return
	}
	if r.Method == http.MethodConnect {
		s.handleConnect(w, r)
		return
	}
	s.handleHTTPRequest(w, r, "http")
}

func (s *Server) isLocalControlRequest(r *http.Request) bool {
	if r.URL.Path == "/healthz" || strings.HasPrefix(r.URL.Path, "/__cep_agent/") {
		// Direct request to 127.0.0.1:8843 or localhost:8843 (not a proxy request to an external host)
		host := strings.ToLower(r.Host)
		return strings.HasPrefix(host, "127.0.0.1") || strings.HasPrefix(host, "localhost") || r.URL.Host == ""
	}
	return false
}

func (s *Server) handleControlPlane(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-CEP-Challenge")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	switch r.URL.Path {
	case "/healthz", "/__cep_agent/v1/status":
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		hasToken := s.TokenInfo != nil && s.TokenInfo.DMToken != ""
		status := "ok"
		if !hasToken {
			status = "awaiting_dm_token"
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":               true,
			"status":           status,
			"agent":            "cep-local-dlp-agent",
			"version":          "1.1.0",
			"dm_token_present": hasToken,
			"has_token":        hasToken,
			"token_source":     s.TokenInfo.TokenSource,
			"user_email":       s.TokenInfo.UserEmail,
			"device_name":      s.TokenInfo.DeviceName,
			"os_platform":      s.TokenInfo.OSPlatform,
			"timestamp":        time.Now().UTC().Format(time.RFC3339),
		})
	case "/__cep_agent/v1/bootstrap-token":
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var payload struct {
			DMToken        string `json:"dm_token"`
			ProfileDMToken string `json:"profile_dm_token"`
			UserEmail      string `json:"user_email"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 16384)).Decode(&payload); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.DMToken) != "" {
			s.TokenInfo.DMToken = strings.TrimSpace(payload.DMToken)
			s.TokenInfo.TokenSource = "companion_extension"
		}
		if strings.TrimSpace(payload.ProfileDMToken) != "" {
			s.TokenInfo.ProfileDMToken = strings.TrimSpace(payload.ProfileDMToken)
		}
		if strings.TrimSpace(payload.UserEmail) != "" {
			s.TokenInfo.UserEmail = strings.TrimSpace(payload.UserEmail)
			// The Companion Extension runs inside one specific Chrome profile. Pin that account and,
			// when no explicit dm_token was pushed, switch to that profile's cached Profile DM Token so a
			// multi-tenant BYOD machine never reports to the wrong tenant.
			_ = dmtoken.SavePreferredProfileEmail(s.TokenInfo.UserEmail)
			if strings.TrimSpace(payload.DMToken) == "" {
				if cand, ok := dmtoken.FindProfileTokenByEmail(s.TokenInfo.UserEmail); ok {
					s.TokenInfo.DMToken = cand.DMToken
					s.TokenInfo.ProfileDMToken = cand.DMToken
					s.TokenInfo.TokenSource = "chrome_profile:" + filepath.Base(cand.ProfileDir)
					log.Printf("[control] Switched to Chrome profile %s (%s) requested by Companion Extension",
						filepath.Base(cand.ProfileDir), s.TokenInfo.UserEmail)
				}
			}
		}
		_ = dmtoken.SaveBYODBootstrapToken(s.TokenInfo.DMToken, s.TokenInfo.UserEmail)
		log.Printf("[control] Updated BYOD credentials from Companion Chrome Extension (user=%s, dm_token_present=%v)",
			s.TokenInfo.UserEmail, s.TokenInfo.DMToken != "")
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":               true,
			"dm_token_present": s.TokenInfo.DMToken != "",
			"user_email":       s.TokenInfo.UserEmail,
		})
	default:
		http.NotFound(w, r)
	}
}

func (s *Server) handleConnect(w http.ResponseWriter, r *http.Request) {
	targetHostPort := r.Host
	if !strings.Contains(targetHostPort, ":") {
		targetHostPort += ":443"
	}

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "hijacking not supported", http.StatusInternalServerError)
		return
	}
	clientConn, clientBuf, err := hijacker.Hijack()
	if err != nil {
		return
	}

	// Acknowledge the CONNECT request to the client
	_, _ = clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	// Fast-path: If host is on the bypass list, learned as Certificate Pinning, or originates
	// from Google Chrome itself (already protected by native CEP), tunnel raw TCP
	clientProc := IdentifyLocalProcess(r.RemoteAddr)
	if s.Filter.ShouldBypassTLS(targetHostPort) || IsBypassedProcess(clientProc) || s.CA == nil {
		if debugEnabled() {
			reason := "host-bypass"
			if IsBypassedProcess(clientProc) {
				reason = "process-bypass:" + clientProc
			}
			log.Printf("[proxy] passthrough %s (%s)", targetHostPort, reason)
		}
		s.tunnelRawTCP(clientConn, clientBuf, targetHostPort)
		return
	}
	if debugEnabled() {
		log.Printf("[proxy] inspecting %s (client=%q)", targetHostPort, clientProc)
	}

	leafCert, err := s.CA.GetCertificateForHost(targetHostPort)
	if err != nil {
		log.Printf("[proxy] mint cert error for %s: %v", targetHostPort, err)
		_ = clientConn.Close()
		return
	}

	tlsConn := tls.Server(clientConn, &tls.Config{
		Certificates: []tls.Certificate{*leafCert},
	})
	if err := tlsConn.Handshake(); err != nil {
		// Detect TLS Certificate Pinning rejection and automatically add host to bypass cache!
		log.Printf("[proxy] TLS handshake rejected by client for %s (%v) -> auto-adding to TLS pinning bypass cache", targetHostPort, err)
		s.Filter.RecordTLSPinningFailure(targetHostPort)
		_ = tlsConn.Close()
		return
	}
	defer tlsConn.Close()

	reader := bufio.NewReader(tlsConn)
	for {
		req, err := http.ReadRequest(reader)
		if err != nil {
			return
		}
		req.URL.Scheme = "https"
		req.URL.Host = r.Host
		req.RequestURI = ""

		respWriter := newBufferedResponseWriter()
		s.handleHTTPRequest(respWriter, req, "https")
		if err := respWriter.WriteTo(tlsConn); err != nil {
			return
		}
		if req.Close || respWriter.header.Get("Connection") == "close" {
			return
		}
	}
}

func (s *Server) tunnelRawTCP(clientConn net.Conn, clientBuf *bufio.ReadWriter, targetHostPort string) {
	defer clientConn.Close()
	upstreamConn, err := net.DialTimeout("tcp", targetHostPort, 15*time.Second)
	if err != nil {
		return
	}
	defer upstreamConn.Close()

	if clientBuf != nil && clientBuf.Reader.Buffered() > 0 {
		buffered := make([]byte, clientBuf.Reader.Buffered())
		_, _ = clientBuf.Read(buffered)
		_, _ = upstreamConn.Write(buffered)
	}

	done := make(chan struct{}, 2)
	go func() {
		_, _ = io.Copy(upstreamConn, clientConn)
		done <- struct{}{}
	}()
	go func() {
		_, _ = io.Copy(clientConn, upstreamConn)
		done <- struct{}{}
	}()
	<-done
}

func (s *Server) handleHTTPRequest(w http.ResponseWriter, r *http.Request, defaultScheme string) {
	if r.URL.Scheme == "" {
		r.URL.Scheme = defaultScheme
	}
	if r.URL.Host == "" {
		r.URL.Host = r.Host
	}
	r.RequestURI = ""

	var bodyBytes []byte
	if r.Body != nil {
		var err error
		bodyBytes, err = io.ReadAll(io.LimitReader(r.Body, webprotect.MaxPayloadBytes+1024))
		_ = r.Body.Close()
		if err != nil {
			http.Error(w, fmt.Sprintf("read request body: %v", err), http.StatusBadGateway)
			return
		}
	}

	// Evaluate Smart Pre-filter (Method POST/PUT/PATCH and Payload >= MinPayloadBytes)
	if s.Filter.ShouldInspectRequest(r, bodyBytes) {
		blocked, blockVerdict := s.inspectOutboundPayload(r.Context(), r.URL.String(), r.Header.Get("Content-Type"), bodyBytes)
		if blocked {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("X-CEP-DLP-Verdict", "BLOCK")
			w.WriteHeader(http.StatusForbidden)
			respObj := map[string]any{
				"error": map[string]any{
					"code":           "CEP_DLP_POLICY_BLOCKED",
					"message":        "Chrome Enterprise Premium DLP ポリシーにより送信がブロックされました。",
					"rule_name":      blockVerdict.RuleName,
					"rule_id":        blockVerdict.RuleID,
					"custom_message": blockVerdict.CustomMessage,
					"request_token":  blockVerdict.RequestToken,
				},
			}
			_ = json.NewEncoder(w).Encode(respObj)
			return
		}
	}

	// Restore body and forward to upstream destination
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	r.ContentLength = int64(len(bodyBytes))

	resp, err := s.UpstreamTransport.RoundTrip(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("upstream error: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for k, vals := range resp.Header {
		for _, v := range vals {
			w.Header().Add(k, v)
		}
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (s *Server) inspectOutboundPayload(ctx context.Context, targetURL, contentType string, body []byte) (bool, *webprotect.ScanVerdict) {
	items := ExtractInspectableItems(contentType, body, s.Filter.MinPayloadBytes)
	logURL := RedactURL(targetURL)
	for _, item := range items {
		if s.Filter.MarkRecentlyScanned(targetURL, item.Payload) {
			if debugEnabled() {
				log.Printf("[proxy] identical payload for %s scanned <30s ago, reusing verdict (quota saved)", logURL)
			}
			continue
		}
		if !s.Filter.AllowQuota() {
			log.Printf("[proxy] local rate limiter active (protecting 50 QPS device / 100 QPS enterprise quota), skipping scan for %s", logURL)
			break
		}

		verdict, err := s.WebProtect.Scan(ctx, webprotect.ScanInput{
			DMToken:        s.TokenInfo.DMToken,
			ProfileDMToken: s.TokenInfo.ProfileDMToken,
			UserEmail:      s.TokenInfo.UserEmail,
			URL:            targetURL,
			Filename:       item.Filename,
			ContentType:    item.ContentType,
			Connector:      item.Connector,
			Payload:        item.Payload,
			DeviceName:     s.TokenInfo.DeviceName,
			OSPlatform:     s.TokenInfo.OSPlatform,
			OSVersion:      s.TokenInfo.OSVersion,
			MachineUser:    s.TokenInfo.MachineUser,
		})
		if err != nil {
			log.Printf("[proxy] WebProtect scan error for %s: %v (failing open)", logURL, err)
			continue
		}

		log.Printf("[proxy] CEP DLP Verdict for %s (%s, %d bytes): %s (rule=%q, %dms)",
			logURL, item.Connector, len(item.Payload), verdict.ActionName, verdict.RuleName, verdict.LatencyMs)

		if !verdict.Allowed {
			s.Notifier.NotifyBlock(targetURL, verdict.RuleName, verdict.CustomMessage)
			return true, verdict
		}
		if verdict.Action == webprotect.ActionWarn {
			if !s.Notifier.PromptWarn(targetURL, verdict.RuleName, verdict.CustomMessage) {
				return true, verdict
			}
		}
	}
	return false, nil
}

type bufferedResponseWriter struct {
	header http.Header
	status int
	body   bytes.Buffer
}

func newBufferedResponseWriter() *bufferedResponseWriter {
	return &bufferedResponseWriter{
		header: make(http.Header),
		status: http.StatusOK,
	}
}

func (w *bufferedResponseWriter) Header() http.Header  { return w.header }
func (w *bufferedResponseWriter) WriteHeader(code int) { w.status = code }
func (w *bufferedResponseWriter) Write(b []byte) (int, error) {
	return w.body.Write(b)
}

func (w *bufferedResponseWriter) WriteTo(conn io.Writer) error {
	resp := &http.Response{
		StatusCode:    w.status,
		ProtoMajor:    1,
		ProtoMinor:    1,
		Header:        w.header,
		Body:          io.NopCloser(bytes.NewReader(w.body.Bytes())),
		ContentLength: int64(w.body.Len()),
	}
	return resp.Write(conn)
}
