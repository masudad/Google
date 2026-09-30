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
	ShutdownFunc      func()
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
	s.handleHTTPRequest(w, r, "http", IdentifyLocalProcess(r.RemoteAddr))
}

func (s *Server) isLocalControlRequest(r *http.Request) bool {
	if r.URL.Path == "/healthz" || strings.HasPrefix(r.URL.Path, "/__cep_agent/") {
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
		if s.TokenInfo != nil {
			s.TokenInfo.RefreshIfNeeded()
		}
		dmTok, tokSource, userEmail := s.TokenInfo.Snapshot()
		hasToken := dmTok != ""
		status := "ok"
		if !hasToken {
			status = "awaiting_dm_token"
		}
		var devName, osPlat string
		if s.TokenInfo != nil {
			devName = s.TokenInfo.DeviceName
			osPlat = s.TokenInfo.OSPlatform
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":               true,
			"status":           status,
			"agent":            "cep-local-dlp-agent",
			"version":          "1.4.0",
			"dm_token_present": hasToken,
			"has_token":        hasToken,
			"token_source":     tokSource,
			"user_email":       userEmail,
			"device_name":      devName,
			"os_platform":      osPlat,
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
		if s.TokenInfo != nil {
			s.TokenInfo.UpdateFromBootstrap(payload.DMToken, payload.ProfileDMToken, payload.UserEmail)
		}
		dmTok, tokSource, userEmail := s.TokenInfo.Snapshot()
		log.Printf("[control] Updated credentials (source=%s, user=%s, dm_token_present=%v)",
			tokSource, userEmail, dmTok != "")
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":               true,
			"dm_token_present": dmTok != "",
			"token_source":     tokSource,
			"user_email":       userEmail,
		})
	case "/__cep_agent/v1/shutdown":
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "shutting_down": true})
		if s.ShutdownFunc != nil {
			go func() {
				time.Sleep(50 * time.Millisecond)
				s.ShutdownFunc()
			}()
		}
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
	// from a standalone web browser (Managed Chrome is already protected by native CEP; Personal
	// Chrome / personal browsers are personal space on BYOD), tunnel raw TCP untouched.
	clientProc := IdentifyLocalProcess(r.RemoteAddr)
	if s.Filter.ShouldBypassTLS(targetHostPort) || IsBypassedProcess(clientProc) || IsBrowserRequest(r) || s.CA == nil {
		if debugEnabled() {
			reason := "host-bypass"
			if IsBypassedProcess(clientProc) {
				reason = "process-bypass:" + clientProc
			} else if IsBrowserRequest(r) {
				reason = "browser-ua-bypass"
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

		closeConn, err := s.handleHTTPSConnRequest(tlsConn, req, clientProc)
		if err != nil || closeConn || req.Close {
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

// handleHTTPSConnRequest inspects a decrypted HTTPS request inside a CONNECT tunnel and
// streams the upstream HTTP/SSE response directly to tlsConn in real time without buffering.
func (s *Server) handleHTTPSConnRequest(tlsConn net.Conn, r *http.Request, clientProc string) (bool, error) {
	var bodyBytes []byte
	if r.Body != nil {
		var err error
		bodyBytes, err = io.ReadAll(io.LimitReader(r.Body, webprotect.MaxPayloadBytes+1024))
		_ = r.Body.Close()
		if err != nil {
			return true, writeSyntheticResponse(tlsConn, http.StatusBadGateway, nil, []byte(fmt.Sprintf("read request body: %v", err)))
		}
	}

	inspectBytes := DecompressBodyIfNeeded(r.Header.Get("Content-Encoding"), bodyBytes)
	if s.Filter.ShouldInspectRequest(r, inspectBytes) {
		blocked, blockVerdict := s.inspectOutboundPayload(r.Context(), r.URL.String(), r.Header.Get("Content-Type"), clientProc, inspectBytes)
		if blocked {
			hdr := make(http.Header)
			hdr.Set("Content-Type", "application/json; charset=utf-8")
			hdr.Set("X-CEP-DLP-Verdict", "BLOCK")
			payload, _ := json.Marshal(map[string]any{
				"error": map[string]any{
					"code":           "CEP_DLP_POLICY_BLOCKED",
					"message":        "Chrome Enterprise Premium DLP ポリシーにより送信がブロックされました。",
					"rule_name":      blockVerdict.RuleName,
					"rule_id":        blockVerdict.RuleID,
					"custom_message": blockVerdict.CustomMessage,
					"request_token":  blockVerdict.RequestToken,
				},
			})
			return false, writeSyntheticResponse(tlsConn, http.StatusForbidden, hdr, payload)
		}
	}

	// Restore original wire body (preserving any gzip/deflate encoding) before forwarding to upstream
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	r.ContentLength = int64(len(bodyBytes))
	r.TransferEncoding = nil
	r.Header.Del("Transfer-Encoding")

	resp, err := s.UpstreamTransport.RoundTrip(r)
	if err != nil {
		return true, writeSyntheticResponse(tlsConn, http.StatusBadGateway, nil, []byte(fmt.Sprintf("upstream error: %v", err)))
	}
	defer resp.Body.Close()

	// If upstream response has unknown length (e.g. SSE text/event-stream or chunked stream),
	// preserve HTTP/1.1 chunked framing so resp.Write streams chunks immediately in real time.
	if resp.ContentLength < 0 && resp.StatusCode >= 200 && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusNotModified {
		resp.TransferEncoding = []string{"chunked"}
	}
	err = resp.Write(tlsConn)
	return resp.Close || strings.EqualFold(resp.Header.Get("Connection"), "close"), err
}

func writeSyntheticResponse(w io.Writer, status int, hdr http.Header, body []byte) error {
	if hdr == nil {
		hdr = make(http.Header)
		hdr.Set("Content-Type", "text/plain; charset=utf-8")
	}
	resp := &http.Response{
		StatusCode:    status,
		ProtoMajor:    1,
		ProtoMinor:    1,
		Header:        hdr,
		Body:          io.NopCloser(bytes.NewReader(body)),
		ContentLength: int64(len(body)),
	}
	return resp.Write(w)
}

func (s *Server) handleHTTPRequest(w http.ResponseWriter, r *http.Request, defaultScheme, clientProc string) {
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

	inspectBytes := DecompressBodyIfNeeded(r.Header.Get("Content-Encoding"), bodyBytes)

	// Evaluate Smart Pre-filter (Method POST/PUT/PATCH and Payload >= MinPayloadBytes)
	if s.Filter.ShouldInspectRequest(r, inspectBytes) {
		blocked, blockVerdict := s.inspectOutboundPayload(r.Context(), r.URL.String(), r.Header.Get("Content-Type"), clientProc, inspectBytes)
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

	// Restore body and normalize framing before forwarding to upstream destination
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	r.ContentLength = int64(len(bodyBytes))
	r.TransferEncoding = nil
	r.Header.Del("Transfer-Encoding")

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
	if flusher, ok := w.(http.Flusher); ok {
		buf := make([]byte, 4096)
		for {
			n, readErr := resp.Body.Read(buf)
			if n > 0 {
				_, _ = w.Write(buf[:n])
				flusher.Flush()
			}
			if readErr != nil {
				break
			}
		}
		return
	}
	_, _ = io.Copy(w, resp.Body)
}

func (s *Server) inspectOutboundPayload(ctx context.Context, targetURL, contentType, clientProc string, body []byte) (bool, *webprotect.ScanVerdict) {
	items := ExtractInspectableItems(contentType, body, s.Filter.MinPayloadBytes)
	if len(items) == 0 {
		return false, nil
	}
	logURL := RedactURL(targetURL)
	sourceApp := clientProc
	if sourceApp == "" {
		sourceApp = "LOCAL_HTTPS_PROXY"
	}

	if s.TokenInfo != nil {
		s.TokenInfo.RefreshIfNeeded()
	}
	var dmToken, profileDMToken, userEmail, clientID, deviceName, osPlatform, osVersion, machineUser string
	if s.TokenInfo != nil {
		dmToken, profileDMToken, userEmail, clientID = s.TokenInfo.Credentials()
		deviceName = s.TokenInfo.DeviceName
		osPlatform = s.TokenInfo.OSPlatform
		osVersion = s.TokenInfo.OSVersion
		machineUser = s.TokenInfo.MachineUser
	}

	for _, item := range items {
		if cachedBlock, ok := s.Filter.WasRecentlyBlocked(targetURL, item.Payload); ok {
			log.Printf("[proxy] identical blocked payload for %s retried <60s ago -> enforcing cached BLOCK (rule=%q)",
				logURL, cachedBlock.RuleName)
			s.Notifier.NotifyBlock(logURL, cachedBlock.RuleName, cachedBlock.CustomMessage)
			return true, cachedBlock
		}
		if s.Filter.WasRecentlyAllowed(targetURL, item.Payload) {
			if debugEnabled() {
				log.Printf("[proxy] identical allowed payload for %s scanned <30s ago, reusing ALLOW verdict (quota saved)", logURL)
			}
			continue
		}
		if !s.Filter.AllowQuota() {
			log.Printf("[proxy] local rate limiter active (protecting 50 QPS device / 100 QPS enterprise quota), skipping scan for %s", logURL)
			break
		}

		verdict, err := s.WebProtect.Scan(ctx, webprotect.ScanInput{
			DMToken:        dmToken,
			ProfileDMToken: profileDMToken,
			UserEmail:      userEmail,
			ClientID:       clientID,
			URL:            targetURL,
			Filename:       item.Filename,
			Source:         sourceApp,
			Destination:    logURL,
			ContentType:    item.ContentType,
			Connector:      item.Connector,
			Payload:        item.Payload,
			DeviceName:     deviceName,
			OSPlatform:     osPlatform,
			OSVersion:      osVersion,
			MachineUser:    machineUser,
		})
		if err != nil {
			log.Printf("[proxy] WebProtect scan error for %s: %v (failing open)", logURL, err)
			continue
		}

		log.Printf("[proxy] CEP DLP Verdict for %s (%s, %d bytes): %s (rule=%q, %dms)",
			logURL, item.Connector, len(item.Payload), verdict.ActionName, verdict.RuleName, verdict.LatencyMs)

		if !verdict.Allowed {
			s.Filter.RecordBlockedScan(targetURL, item.Payload, verdict)
			s.Notifier.NotifyBlock(logURL, verdict.RuleName, verdict.CustomMessage)
			return true, verdict
		}
		if verdict.Action == webprotect.ActionWarn {
			if !s.Notifier.PromptWarn(logURL, verdict.RuleName, verdict.CustomMessage) {
				return true, verdict
			}
			continue
		}

		// Cache only clean ALLOWED verdicts so retried BLOCK/WARN payloads are never bypassed.
		s.Filter.RecordAllowedScan(targetURL, item.Payload)
	}
	return false, nil
}
