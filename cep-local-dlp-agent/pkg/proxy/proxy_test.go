package proxy

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

func TestSmartProxyE2E(t *testing.T) {
	var webProtectCalls int32

	// 1. Mock CEP WebProtect Server
	mockWebProtect := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&webProtectCalls, 1)
		bodyBytes, _ := io.ReadAll(r.Body)
		bodyStr := string(bodyBytes)

		action := webprotect.ActionUnspecified
		if strings.Contains(bodyStr, "CONFIDENTIAL_MY_NUMBER_9999") {
			action = webprotect.ActionBlock
		}

		respProto := &webprotect.ContentAnalysisResponse{
			RequestToken: "req-e2e-1",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
					TriggeredRules: []webprotect.TriggeredRule{
						{
							Action:   action,
							RuleName: "Block Confidential Source & PII",
							RuleID:   "dlp-rule-001",
						},
					},
				},
			},
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(respProto.MarshalProto())
	}))
	defer mockWebProtect.Close()

	// 2. Mock Upstream AI / Native App Backend (e.g., Cursor / Claude / Slack API)
	mockUpstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer mockUpstream.Close()

	// 3. Initialize Smart Proxy Server
	ca, err := LoadOrCreateCA(t.TempDir())
	if err != nil {
		t.Fatalf("LoadOrCreateCA: %v", err)
	}
	filter := NewSmartFilter(50, 50.0) // min 50 bytes
	wpClient := webprotect.NewClient(mockWebProtect.URL)
	tokInfo := &dmtoken.TokenInfo{
		DMToken:    "test-cbcm-dm-token",
		DeviceName: "test-workstation",
		OSPlatform: "Linux",
	}
	proxySrv := NewServer(ca, filter, wpClient, tokInfo, notifier.NewOSNotifier(true))
	proxyListener := httptest.NewServer(proxySrv)
	defer proxyListener.Close()

	proxyURL, _ := url.Parse(proxyListener.URL)
	rootPool := x509.NewCertPool()
	rootPool.AddCert(ca.RootCert)

	client := &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
			TLSClientConfig: &tls.Config{
				RootCAs: rootPool,
			},
		},
	}

	// Case A: GET request -> Smart Filter must bypass without calling WebProtect
	resp, err := client.Get(mockUpstream.URL + "/v1/models")
	if err != nil {
		t.Fatalf("GET failed: %v", err)
	}
	_ = resp.Body.Close()
	if got := atomic.LoadInt32(&webProtectCalls); got != 0 {
		t.Errorf("expected 0 WebProtect calls on GET, got %d", got)
	}

	// Case B: Tiny heartbeat POST (<50 bytes) -> Smart Filter must bypass without calling WebProtect
	resp, err = client.Post(mockUpstream.URL+"/v1/ping", "application/json", strings.NewReader(`{"ping":1}`))
	if err != nil {
		t.Fatalf("tiny POST failed: %v", err)
	}
	_ = resp.Body.Close()
	if got := atomic.LoadInt32(&webProtectCalls); got != 0 {
		t.Errorf("expected 0 WebProtect calls on tiny heartbeat POST, got %d", got)
	}

	// Case C: Cursor / Claude Desktop JSON POST containing clean prompt (>=50 bytes) -> Allowed
	cleanJSON := `{"model":"claude-3-7-sonnet","messages":[{"role":"user","content":"Please refactor this sorting function to use quicksort in Go."}]}`
	resp, err = client.Post(mockUpstream.URL+"/v1/messages", "application/json", strings.NewReader(cleanJSON))
	if err != nil {
		t.Fatalf("clean POST failed: %v", err)
	}
	_ = resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected HTTP 200 for clean prompt, got %d", resp.StatusCode)
	}
	if got := atomic.LoadInt32(&webProtectCalls); got != 1 {
		t.Errorf("expected 1 WebProtect call after clean POST, got %d", got)
	}

	// Case D: Cursor / Claude Desktop JSON POST containing sensitive data -> Blocked with HTTP 403
	secretJSON := `{"model":"claude-3-7-sonnet","messages":[{"role":"user","content":"Analyze customer record CONFIDENTIAL_MY_NUMBER_9999 for production debugging."}]}`
	resp, err = client.Post(mockUpstream.URL+"/v1/messages", "application/json", strings.NewReader(secretJSON))
	if err != nil {
		t.Fatalf("secret POST failed: %v", err)
	}
	respBody, _ := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("expected HTTP 403 Forbidden for blocked DLP payload, got %d (%s)", resp.StatusCode, string(respBody))
	}
	if resp.Header.Get("X-CEP-DLP-Verdict") != "BLOCK" {
		t.Errorf("expected X-CEP-DLP-Verdict: BLOCK header")
	}

	// Case E: Slack / Native App Multipart File Upload with sensitive content -> Blocked with HTTP 403
	var mpBuf bytes.Buffer
	mw := multipart.NewWriter(&mpBuf)
	fw, _ := mw.CreateFormFile("file", "customer_export.csv")
	_, _ = fw.Write([]byte("id,name,my_number\n1,Taro Yamada,CONFIDENTIAL_MY_NUMBER_9999\n"))
	_ = mw.Close()

	resp, err = client.Post(mockUpstream.URL+"/api/files.upload", mw.FormDataContentType(), &mpBuf)
	if err != nil {
		t.Fatalf("multipart file upload failed: %v", err)
	}
	_ = resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("expected HTTP 403 Forbidden for blocked file attachment, got %d", resp.StatusCode)
	}

	// Case F: TLS Pinning Auto-Bypass verification
	filter.RecordTLSPinningFailure("pinned.example.com:443")
	if !filter.ShouldBypassTLS("pinned.example.com:443") {
		t.Errorf("expected pinned.example.com to be bypassed after TLS pinning failure")
	}

	// Case G: Local Control Plane (/healthz & BYOD Extension Token Bootstrap)
	healthResp, err := http.Get(proxyListener.URL + "/healthz")
	if err != nil {
		t.Fatalf("GET /healthz failed: %v", err)
	}
	healthBody, _ := io.ReadAll(healthResp.Body)
	_ = healthResp.Body.Close()
	if healthResp.StatusCode != http.StatusOK || !strings.Contains(string(healthBody), `"ok":true`) {
		t.Errorf("unexpected /healthz response: %d %s", healthResp.StatusCode, string(healthBody))
	}

	bootstrapPayload := `{"dm_token":"byod-ext-pushed-token-777","user_email":"user@example.com"}`
	bootResp, err := http.Post(
		proxyListener.URL+"/__cep_agent/v1/bootstrap-token",
		"application/json",
		strings.NewReader(bootstrapPayload),
	)
	if err != nil {
		t.Fatalf("POST /__cep_agent/v1/bootstrap-token failed: %v", err)
	}
	_ = bootResp.Body.Close()
	if bootResp.StatusCode != http.StatusOK {
		t.Errorf("expected HTTP 200 from bootstrap-token, got %d", bootResp.StatusCode)
	}
	if got := proxySrv.TokenInfo.DMToken; got != "byod-ext-pushed-token-777" {
		t.Errorf("expected live DMToken to update to byod-ext-pushed-token-777, got %q", got)
	}
}


