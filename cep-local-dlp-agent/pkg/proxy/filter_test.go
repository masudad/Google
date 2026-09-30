package proxy

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"cep-local-dlp-agent/pkg/webprotect"
)

func TestChromeInfraHostsAreTunnelledWithoutMITM(t *testing.T) {
	f := NewSmartFilter(100, 40)
	for _, h := range []string{
		"clients4.google.com:443",
		"signaler-pa.clients6.google.com:443",
		"optimizationguide-pa.googleapis.com:443",
		"chromereporting-pa.googleapis.com:443",
		"oauthaccountmanager.googleapis.com:443",
		"accounts.google.com:443",
		"chromewebstore.google.com:443",
		"redirector.gvt1.com:443",
		"ohttp-relay-safebrowsing-chrome.google.fastly-edge.com:443",
		"safebrowsing.google.com:443",
	} {
		if !f.ShouldBypassTLS(h) {
			t.Errorf("%s should be TLS-bypassed (Chrome/Google infra)", h)
		}
	}
	for _, h := range []string{
		"api.anthropic.com:443",
		"api2.cursor.sh:443",
		"slack.com:443",
		"www.googleapis.com:443", // Drive uploads from native apps must stay inspectable
		"drive.google.com:443",
	} {
		if f.ShouldBypassTLS(h) {
			t.Errorf("%s must NOT be TLS-bypassed", h)
		}
	}
}

func TestTelemetryRequestsAreNotScanned(t *testing.T) {
	f := NewSmartFilter(100, 40)
	body := bytes.Repeat([]byte("x"), 2048)
	skip := []string{
		"https://play.google.com/log?format=json&hasfast=true",
		"https://browser-intake-datadoghq.com/api/v2/rum?dd-api-key=abc",
		"https://a.nel.cloudflare.com/report/v4?s=xyz",
		"https://csp.withgoogle.com/csp/report",
		"https://discordapp.com/api/v9/science",
		"https://api.anthropic.com/api/event_logging",
		"https://api.anthropic.com/v1/messages/count_tokens",
		"https://claude.ai/api/v2/rum",
		"https://ab.chatgpt.com/v1/initialize",
		"https://chatgpt.com:443/backend-api/ps/mcp",
		"https://chatgpt.com/backend-api/sentinel/chat-requirements",
		"https://chat.google.com/punctual/prod-04-us/v1/chooseServer?key=abc",
		"https://api.github.com/graphql",
		"https://o123.ingest.sentry.io/api/1/envelope/",
		"https://mobile.events.data.microsoft.com/OneCollector/1.0/",
	}
	for _, u := range skip {
		r := httptest.NewRequest(http.MethodPost, u, bytes.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		if f.ShouldInspectRequest(r, body) {
			t.Errorf("telemetry endpoint %s must be skipped", u)
		}
	}
	inspect := []string{
		"https://api.anthropic.com/v1/messages",
		"https://api.openai.com/v1/chat/completions",
		"https://chatgpt.com/backend-api/conversation",
		"https://api2.cursor.sh/aiserver.v1.AiService/StreamChat",
		"https://slack.com/api/chat.postMessage",
		"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
		"https://graph.microsoft.com/v1.0/me/sendMail",
	}
	for _, u := range inspect {
		r := httptest.NewRequest(http.MethodPost, u, bytes.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		if !f.ShouldInspectRequest(r, body) {
			t.Errorf("user-content endpoint %s must be inspected", u)
		}
	}
	// protobuf / gRPC framing is opaque for CEP text detectors
	r := httptest.NewRequest(http.MethodPost, "https://clients4.google.com/chrome-sync/command", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/x-protobuf")
	if f.ShouldInspectRequest(r, body) {
		t.Errorf("protobuf body must be skipped")
	}

	// Browser requests (Personal Chrome Profile or Managed Chrome Profile) must NEVER be inspected by proxy
	chromeReq := httptest.NewRequest(http.MethodPost, "https://chatgpt.com/backend-api/conversation", bytes.NewReader(body))
	chromeReq.Header.Set("Content-Type", "application/json")
	chromeReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36")
	chromeReq.Header.Set("Sec-Ch-Ua", `"Google Chrome";v="146", "Chromium";v="146", "Not_A Brand";v="24"`)
	if f.ShouldInspectRequest(chromeReq, body) {
		t.Errorf("Chrome browser request must be bypassed by proxy")
	}

	// Electron apps (Cursor / Claude Desktop / Slack) MUST still be inspected
	electronReq := httptest.NewRequest(http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	electronReq.Header.Set("Content-Type", "application/json")
	electronReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/0.48.0 Chrome/132.0.0.0 Electron/34.0.0 Safari/537.36")
	if !f.ShouldInspectRequest(electronReq, body) {
		t.Errorf("Cursor Electron app request must be inspected by proxy")
	}
}

func TestExtractorConnectorClassification(t *testing.T) {
	big := strings.Repeat("hello world ", 50)
	cases := []struct {
		name string
		ct   string
		body []byte
		want webprotect.AnalysisConnector
		skip bool
	}{
		{"json prompt", "application/json", []byte(`{"messages":[{"role":"user","content":"` + big + `"}]}`), webprotect.BulkDataEntry, false},
		{"protobuf", "application/x-protobuf", bytes.Repeat([]byte{0x0a, 0x10, 0xff}, 200), 0, true},
		{"octet-stream text", "application/octet-stream", []byte(big), webprotect.BulkDataEntry, false},
		{"octet-stream random binary", "application/octet-stream", bytes.Repeat([]byte{0x00, 0x01, 0xfe, 0x80}, 200), 0, true},
		{"pdf magic", "application/octet-stream", append([]byte("%PDF-1.7\n"), []byte(big)...), webprotect.FileAttached, false},
		{"explicit pdf", "application/pdf", []byte(big), webprotect.FileAttached, false},
		{"zip magic", "application/octet-stream", append([]byte{0x50, 0x4B, 0x03, 0x04}, bytes.Repeat([]byte{0x00}, 300)...), webprotect.FileAttached, false},
		{"form urlencoded", "application/x-www-form-urlencoded", []byte("text=" + strings.Repeat("abc+", 100)), webprotect.BulkDataEntry, false},
	}
	for _, c := range cases {
		items := ExtractInspectableItems(c.ct, c.body, 100)
		if c.skip {
			if len(items) != 0 {
				t.Errorf("%s: expected no inspectable items, got %d (%s)", c.name, len(items), items[0].Connector)
			}
			continue
		}
		if len(items) == 0 {
			t.Errorf("%s: expected an inspectable item", c.name)
			continue
		}
		if items[0].Connector != c.want {
			t.Errorf("%s: connector=%s want %s", c.name, items[0].Connector, c.want)
		}
	}
	// multipart file part must be FILE_ATTACHED with the real filename
	var mp bytes.Buffer
	boundary := "XBOUNDARY"
	mp.WriteString("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"secret.csv\"\r\nContent-Type: text/csv\r\n\r\n")
	mp.WriteString(big)
	mp.WriteString("\r\n--" + boundary + "--\r\n")
	items := ExtractInspectableItems("multipart/form-data; boundary="+boundary, mp.Bytes(), 100)
	if len(items) != 1 || items[0].Connector != webprotect.FileAttached || items[0].Filename != "secret.csv" {
		t.Fatalf("multipart classification wrong: %+v", items)
	}
}

func TestRedactURLStripsSecrets(t *testing.T) {
	in := "https://play.google.com:443/log?hasfast=true&auth=SAPISIDHASH+deadbeef&authuser=0&format=json"
	out := RedactURL(in)
	if strings.Contains(out, "deadbeef") || strings.Contains(out, "SAPISIDHASH") {
		t.Fatalf("secret leaked: %s", out)
	}
	if !strings.HasPrefix(out, "https://play.google.com:443/log?<") || !strings.Contains(out, "auth,") {
		t.Fatalf("unexpected redaction format: %s", out)
	}
	if got := RedactURL("https://api.anthropic.com/v1/messages"); got != "https://api.anthropic.com/v1/messages" {
		t.Fatalf("query-less URL must be unchanged, got %s", got)
	}
}

func TestDedupeCacheSuppressesIdenticalPayloads(t *testing.T) {
	f := NewSmartFilter(100, 40)
	payload := []byte(strings.Repeat("same prompt ", 20))
	if f.MarkRecentlyScanned("https://api.anthropic.com/v1/messages?x=1", payload) {
		t.Fatal("first scan must not be deduped")
	}
	if !f.MarkRecentlyScanned("https://api.anthropic.com/v1/messages?x=2", payload) {
		t.Fatal("identical payload to same path within TTL must be deduped (query ignored)")
	}
	if f.MarkRecentlyScanned("https://api.anthropic.com/v1/messages", []byte(strings.Repeat("other prompt ", 20))) {
		t.Fatal("different payload must be scanned")
	}
}

func TestIsBypassedProcessRecognisesChromeVariants(t *testing.T) {
	for _, p := range []string{"chrome.exe", "CHROME.EXE", "Google Chrome", "Google Chrome Helper (Renderer)", "google chrome canary", "msedge.exe", "firefox.exe", "brave.exe"} {
		if !IsBypassedProcess(p) {
			t.Errorf("%q should be bypassed", p)
		}
	}
	for _, p := range []string{"", "Cursor.exe", "Claude.exe", "slack.exe", "Code.exe"} {
		if IsBypassedProcess(p) {
			t.Errorf("%q must not be bypassed", p)
		}
	}
}
