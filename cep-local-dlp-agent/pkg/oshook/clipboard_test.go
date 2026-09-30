package oshook

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

func TestClipboardGuardAndAppURLResolution(t *testing.T) {
	// 1. Verify browsers, OS shell, and the agent itself are bypassed
	for _, app := range []string{"Google Chrome", "chrome.exe", "msedge.exe", "firefox.exe", "cep-dlp-agent-windows-amd64", "explorer"} {
		if _, bypass := ResolveAppURL(app); !bypass {
			t.Errorf("expected %q to be bypassed", app)
		}
	}

	// 2. Verify native apps map to local-app.internal URLs (so content-detector DLP rules run without false-positive URL blocks)
	cursorURL, bypass := ResolveAppURL("Cursor")
	if bypass || cursorURL != "https://local-app.internal/cursor" {
		t.Errorf("unexpected Cursor URL: %q (bypass=%v)", cursorURL, bypass)
	}
	notepadURL, bypass := ResolveAppURL("Notepad")
	if bypass || notepadURL != "https://local-app.internal/notepad" {
		t.Errorf("unexpected Notepad URL: %q (bypass=%v)", notepadURL, bypass)
	}

	// 3. Verify ClipboardGuard blocks sensitive paste in native apps AND re-blocks if the user
	// immediately re-copies the exact same secret after the clipboard was cleared.
	var blockScans int32
	mockWP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&blockScans, 1)
		resp := &webprotect.ContentAnalysisResponse{
			RequestToken: "clip-1",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
					TriggeredRules: []webprotect.TriggeredRule{
						{
							Action:   webprotect.ActionBlock,
							RuleName: "Block My Number Paste in Native Apps",
							RuleID:   "rule-clip-01",
						},
					},
				},
			},
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(resp.MarshalProto())
	}))
	defer mockWP.Close()

	guard := NewClipboardGuard(
		webprotect.NewClient(mockWP.URL),
		&dmtoken.TokenInfo{DMToken: "test-token", DeviceName: "macbook", OSPlatform: "Mac OS X"},
		notifier.NewOSNotifier(true),
		1,
	)

	secret := "マイナンバー: 1234-5678-9012"
	allowed, verdict, err := guard.EvaluateClipboardOnce(context.Background(), "Cursor", secret)
	if err != nil {
		t.Fatalf("EvaluateClipboardOnce failed: %v", err)
	}
	if allowed {
		t.Errorf("expected clipboard paste in Cursor to be blocked")
	}
	if verdict == nil || !strings.Contains(verdict.RuleName, "Block My Number") {
		t.Errorf("unexpected verdict: %+v", verdict)
	}

	// Edge case: User immediately presses Ctrl+C on the exact same secret a second time -> must NOT be bypassed!
	allowed2, _, err := guard.EvaluateClipboardOnce(context.Background(), "Notepad", secret)
	if err != nil {
		t.Fatalf("second EvaluateClipboardOnce failed: %v", err)
	}
	if allowed2 {
		t.Fatalf("re-copied blocked secret must be scanned and blocked again, not bypassed by LastEvaluatedHash")
	}
	if got := atomic.LoadInt32(&blockScans); got != 2 {
		t.Fatalf("expected 2 scans for 2 copies of blocked secret, got %d", got)
	}
}

func TestClipboardGuardDoesNotRescanOnWindowSwitchAndLogsVerdict(t *testing.T) {
	var scans int32
	mockWP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&scans, 1)
		resp := &webprotect.ContentAnalysisResponse{
			RequestToken: "clip-allow",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
				},
			},
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(resp.MarshalProto())
	}))
	defer mockWP.Close()

	var logBuf bytes.Buffer
	origOut := log.Writer()
	log.SetOutput(&logBuf)
	defer log.SetOutput(origOut)

	guard := NewClipboardGuard(
		webprotect.NewClient(mockWP.URL),
		&dmtoken.TokenInfo{DMToken: "test-token", DeviceName: "win-pc", OSPlatform: "Windows"},
		notifier.NewOSNotifier(true),
		1,
	)

	text := "社内資料の抜粋テキスト"

	// Step 1: User copies text inside Chrome -> bypassed, 0 scans
	if _, _, err := guard.EvaluateClipboardOnce(context.Background(), "chrome.exe", text); err != nil {
		t.Fatalf("chrome bypass failed: %v", err)
	}
	if got := atomic.LoadInt32(&scans); got != 0 {
		t.Fatalf("expected 0 scans while in chrome.exe, got %d", got)
	}

	// Step 2: User switches to Cursor -> scanned ONCE and logged even when ALLOWED
	if _, _, err := guard.EvaluateClipboardOnce(context.Background(), "Cursor", text); err != nil {
		t.Fatalf("Cursor scan failed: %v", err)
	}
	if got := atomic.LoadInt32(&scans); got != 1 {
		t.Fatalf("expected 1 scan upon switching from Chrome to Cursor, got %d", got)
	}
	if !strings.Contains(logBuf.String(), "[oshook] CEP DLP Clipboard Verdict for app=Cursor") {
		t.Fatalf("expected verdict log line for allowed clipboard scan, got log: %s", logBuf.String())
	}

	// Step 3: User Alt-Tabs across Slack, Notepad, Code, Explorer with the SAME clipboard text -> 0 additional scans
	for _, app := range []string{"Slack", "notepad", "Code", "explorer"} {
		if _, _, err := guard.EvaluateClipboardOnce(context.Background(), app, text); err != nil {
			t.Fatalf("window switch to %s failed: %v", app, err)
		}
	}
	if got := atomic.LoadInt32(&scans); got != 1 {
		t.Fatalf("expected no additional scans on window switch, got total scans=%d", got)
	}

	// Step 4: User copies DIFFERENT text in Slack -> scanned once (total=2)
	if _, _, err := guard.EvaluateClipboardOnce(context.Background(), "Slack", "新しいコピー文字列"); err != nil {
		t.Fatalf("new clipboard text scan failed: %v", err)
	}
	if got := atomic.LoadInt32(&scans); got != 2 {
		t.Fatalf("expected 2 total scans after copying new text, got %d", got)
	}
}
