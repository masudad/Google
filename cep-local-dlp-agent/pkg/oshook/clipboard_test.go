package oshook

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

func TestClipboardGuardAndAppURLResolution(t *testing.T) {
	// 1. Verify Chrome itself is bypassed
	if _, bypass := ResolveAppURL("Google Chrome"); !bypass {
		t.Errorf("expected Google Chrome to be bypassed")
	}

	// 2. Verify Cursor and Slack map to canonical URLs
	cursorURL, bypass := ResolveAppURL("Cursor")
	if bypass || cursorURL != "https://cursor.com/local-app/cursor" {
		t.Errorf("unexpected Cursor URL: %q (bypass=%v)", cursorURL, bypass)
	}
	slackURL, bypass := ResolveAppURL("Slack.exe")
	if bypass || slackURL != "https://slack.com/local-app/slack-desktop" {
		t.Errorf("unexpected Slack URL: %q (bypass=%v)", slackURL, bypass)
	}

	// 3. Verify ClipboardGuard blocks sensitive paste in native apps
	mockWP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

	allowed, verdict, err := guard.EvaluateClipboardOnce(context.Background(), "Cursor", "マイナンバー: 1234-5678-9012")
	if err != nil {
		t.Fatalf("EvaluateClipboardOnce failed: %v", err)
	}
	if allowed {
		t.Errorf("expected clipboard paste in Cursor to be blocked")
	}
	if verdict == nil || !strings.Contains(verdict.RuleName, "Block My Number") {
		t.Errorf("unexpected verdict: %+v", verdict)
	}
}
