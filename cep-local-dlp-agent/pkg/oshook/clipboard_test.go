package oshook

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

type countingNotifier struct {
	mu          sync.Mutex
	blockCalls  int
	warnCalls   int
	lastTarget  string
	lastRule    string
	lastMessage string
	warnProceed bool
}

func (n *countingNotifier) NotifyBlock(targetURL, ruleName, customMessage string) {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.blockCalls++
	n.lastTarget = targetURL
	n.lastRule = ruleName
	n.lastMessage = customMessage
}

func (n *countingNotifier) PromptWarn(targetURL, ruleName, customMessage string) bool {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.warnCalls++
	n.lastTarget = targetURL
	n.lastRule = ruleName
	n.lastMessage = customMessage
	return n.warnProceed
}

func (n *countingNotifier) BlockCount() int {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.blockCalls
}

func TestClipboardGuardAndAppURLResolution(t *testing.T) {
	// 1. Verify browsers, OS shell, and the agent itself are bypassed
	for _, app := range []string{"Google Chrome", "chrome.exe", "msedge.exe", "firefox.exe", "cep-dlp-agent-windows-amd64", "explorer"} {
		if _, bypass := ResolveAppURL(app); !bypass {
			t.Errorf("expected %q to be bypassed", app)
		}
	}

	// Verify prefix-like native app names and UWP host ("docker", "architect", "ApplicationFrameHost") are NOT falsely bypassed
	for _, app := range []string{"docker", "architect", "Claude", "Cursor", "Notepad", "ApplicationFrameHost"} {
		if _, bypass := ResolveAppURL(app); bypass {
			t.Errorf("expected native app %q NOT to be bypassed", app)
		}
	}

	// 2. Verify native apps map to local-app.internal URLs (so content-detector DLP rules run without false-positive URL blocks)
	cursorURL, bypass := ResolveAppURL("Cursor")
	if bypass || cursorURL != "https://local-app.internal/cursor" {
		t.Errorf("unexpected Cursor URL: %q (bypass=%v)", cursorURL, bypass)
	}
	claudeURL, bypass := ResolveAppURL("Claude")
	if bypass || claudeURL != "https://local-app.internal/claude" {
		t.Errorf("unexpected Claude URL: %q (bypass=%v)", claudeURL, bypass)
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
		t.Fatalf("expected 2 scans for 2 copies of blocked secret across Cursor and Notepad, got %d", got)
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

func TestWindowSwitchNeverPopupsAndCtrlVSpamAlwaysBlocks(t *testing.T) {
	mockWP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := &webprotect.ContentAnalysisResponse{
			RequestToken: "clip-block-claude",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
					TriggeredRules: []webprotect.TriggeredRule{
						{
							Action:   webprotect.ActionBlock,
							RuleName: "Block Credit Card Paste",
							RuleID:   "rule-cc-01",
						},
					},
				},
			},
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(resp.MarshalProto())
	}))
	defer mockWP.Close()

	notif := &countingNotifier{}
	guard := NewClipboardGuard(
		webprotect.NewClient(mockWP.URL),
		&dmtoken.TokenInfo{DMToken: "test-token", DeviceName: "win-pc", OSPlatform: "Windows"},
		notif,
		1,
	)

	var clipMu sync.Mutex
	simClipboard := "4532-0151-1283-0366"
	simApp := "Claude"

	guard.readClipboardFn = func() string {
		clipMu.Lock()
		defer clipMu.Unlock()
		return simClipboard
	}
	guard.readClipboardFilesFn = func() []string { return nil }
	guard.writeClipboardFn = func(s string) error {
		clipMu.Lock()
		defer clipMu.Unlock()
		simClipboard = s
		return nil
	}
	guard.clearClipboardFn = func() error {
		clipMu.Lock()
		defer clipMu.Unlock()
		simClipboard = ""
		return nil
	}
	guard.detectAppFn = func() string {
		clipMu.Lock()
		defer clipMu.Unlock()
		return simApp
	}

	ctx := context.Background()

	// 1. User switches window to Claude WITHOUT pressing Ctrl+V -> PrewarmClipboardOnce runs.
	//    Must quarantine the clipboard (emptying OS clipboard) and MUST NOT show any popup dialog!
	allowed, _, err := guard.PrewarmClipboardOnce(ctx, "Claude", simClipboard)
	if err != nil {
		t.Fatalf("PrewarmClipboardOnce failed: %v", err)
	}
	if allowed {
		t.Fatalf("expected secret clipboard to be marked not-allowed during prewarm")
	}
	if got := notif.BlockCount(); got != 0 {
		t.Fatalf("switching window to Claude without pressing Ctrl+V must NEVER show a popup dialog, got %d popups", got)
	}
	if got := guard.readClip(); got != "" {
		t.Fatalf("expected OS clipboard to be silently emptied during quarantine, got %q", got)
	}

	// 2. Transient Windows focus loss ("local-app" or "explorer") must NOT restore the quarantined secret
	_, _, _ = guard.PrewarmClipboardOnce(ctx, "local-app", "")
	_, _, _ = guard.PrewarmClipboardOnce(ctx, "explorer", "")
	if got := guard.readClip(); got != "" {
		t.Fatalf("transient focus loss to local-app/explorer must NOT restore quarantined secret, got %q", got)
	}

	// 3. If user switches back to Chrome WITHOUT having pressed Ctrl+V in Claude, clipboard is seamlessly restored!
	_, _, _ = guard.PrewarmClipboardOnce(ctx, "chrome.exe", "")
	if got := guard.readClip(); got != "4532-0151-1283-0366" {
		t.Fatalf("switching back to Chrome without pasting must restore clipboard, got %q", got)
	}
	if got := notif.BlockCount(); got != 0 {
		t.Fatalf("expected 0 popups after switching back to Chrome, got %d", got)
	}

	// 4. User switches back to Claude (prewarm quarantines again, 0 popups) and then spams Ctrl+V 5 times in a row!
	_, _, _ = guard.PrewarmClipboardOnce(ctx, "Claude", guard.readClip())
	if got := notif.BlockCount(); got != 0 {
		t.Fatalf("expected 0 popups before Ctrl+V is pressed, got %d", got)
	}

	for i := 1; i <= 5; i++ {
		if guard.HandlePasteAttempt(ctx) {
			t.Fatalf("Ctrl+V press #%d must be blocked (return false), but was allowed!", i)
		}
		if got := notif.BlockCount(); got != i {
			t.Fatalf("Ctrl+V press #%d must trigger NotifyBlock (expected %d calls, got %d)", i, i, got)
		}
	}

	// 5. Even if the user presses Ctrl+V while the cep-dlp-agent dialog window itself is focused,
	//    it must still return false and re-notify/focus the dialog.
	clipMu.Lock()
	simApp = "cep-dlp-agent-windows-amd64"
	clipMu.Unlock()
	if guard.HandlePasteAttempt(ctx) {
		t.Fatalf("Ctrl+V while cep-dlp-agent dialog is focused must return false")
	}
	if got := notif.BlockCount(); got != 6 {
		t.Fatalf("expected 6 NotifyBlock calls, got %d", got)
	}
}

func TestInflightCoalescingAndClipboardFileCopyBlock(t *testing.T) {
	var wpCalls int32
	mockWP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&wpCalls, 1)
		time.Sleep(80 * time.Millisecond)
		resp := &webprotect.ContentAnalysisResponse{
			RequestToken: "clip-coalesce",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
					TriggeredRules: []webprotect.TriggeredRule{
						{
							Action:   webprotect.ActionBlock,
							RuleName: "Block Sensitive File or Text Paste",
							RuleID:   "rule-file-01",
						},
					},
				},
			},
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(resp.MarshalProto())
	}))
	defer mockWP.Close()

	notif := &countingNotifier{}
	guard := NewClipboardGuard(
		webprotect.NewClient(mockWP.URL),
		&dmtoken.TokenInfo{DMToken: "test-token", DeviceName: "win-pc", OSPlatform: "Windows"},
		notif,
		1,
	)

	var clipMu sync.Mutex
	simClipboard := "CONFIDENTIAL-SECRET-9876"
	var simFiles []string
	guard.readClipboardFn = func() string {
		clipMu.Lock()
		defer clipMu.Unlock()
		return simClipboard
	}
	guard.readClipboardFilesFn = func() []string {
		clipMu.Lock()
		defer clipMu.Unlock()
		return append([]string(nil), simFiles...)
	}
	guard.clearClipboardFn = func() error {
		clipMu.Lock()
		defer clipMu.Unlock()
		simClipboard = ""
		simFiles = nil
		return nil
	}
	guard.detectAppFn = func() string { return "Claude" }

	// Part A: Start background PrewarmClipboardOnce and concurrently trigger HandlePasteAttempt (Ctrl+V).
	// They must coalesce into 1 WebProtect HTTP call, block the paste, and trigger NotifyBlock!
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		_, _, _ = guard.PrewarmClipboardOnce(context.Background(), "Claude", "CONFIDENTIAL-SECRET-9876")
	}()
	time.Sleep(15 * time.Millisecond)
	if guard.HandlePasteAttempt(context.Background()) {
		t.Fatalf("expected concurrent HandlePasteAttempt to block")
	}
	wg.Wait()

	if got := atomic.LoadInt32(&wpCalls); got != 1 {
		t.Fatalf("expected in-flight scan coalescing to make exactly 1 WebProtect HTTP call, got %d", got)
	}
	if got := notif.BlockCount(); got < 1 {
		t.Fatalf("expected NotifyBlock to be called when HandlePasteAttempt joined in-flight prewarm scan")
	}

	// Part B: Verify CF_HDROP copied file (Ctrl+C on sensitive file in Explorer -> Ctrl+V in Claude) is scanned & blocked!
	tmpFile := filepath.Join(t.TempDir(), "confidential_customers.csv")
	if err := os.WriteFile(tmpFile, []byte("name,my_number\nYamada,1234-5678-9012\n"), 0600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	clipMu.Lock()
	simClipboard = ""
	simFiles = []string{tmpFile}
	clipMu.Unlock()

	if guard.HandlePasteAttempt(context.Background()) {
		t.Fatalf("expected CF_HDROP file paste into Claude to be blocked")
	}
	if got := len(guard.readClipFiles()); got != 0 {
		t.Fatalf("expected blocked CF_HDROP file clipboard to be cleared")
	}
}
