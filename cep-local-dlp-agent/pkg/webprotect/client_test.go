package webprotect

import (
	"context"
	"encoding/base64"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestProtoRoundTripAndMultipartScan(t *testing.T) {
	var receivedMetaB64 string
	var receivedPayload string

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Goog-Upload-Protocol") != "multipart" {
			t.Errorf("expected X-Goog-Upload-Protocol: multipart, got %q", r.Header.Get("X-Goog-Upload-Protocol"))
		}
		mediaType, params, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if err != nil || mediaType != "multipart/related" {
			t.Fatalf("unexpected Content-Type: %v (%v)", r.Header.Get("Content-Type"), err)
		}

		mr := multipart.NewReader(r.Body, params["boundary"])
		part1, err := mr.NextPart()
		if err != nil {
			t.Fatalf("read part 1: %v", err)
		}
		b1, _ := io.ReadAll(part1)
		receivedMetaB64 = strings.TrimSpace(string(b1))

		part2, err := mr.NextPart()
		if err != nil {
			t.Fatalf("read part 2: %v", err)
		}
		b2, _ := io.ReadAll(part2)
		receivedPayload = string(b2)

		action := ActionUnspecified
		if strings.Contains(receivedPayload, "MY_NUMBER_SECRET") {
			action = ActionBlock
		} else if strings.Contains(receivedPayload, "WARN_ME") {
			action = ActionWarn
		}

		respProto := &ContentAnalysisResponse{
			RequestToken: "test-req-token",
			Results: []Result{
				{
					Tag:    "dlp",
					Status: StatusSuccess,
					TriggeredRules: []TriggeredRule{
						{
							Action:   action,
							RuleName: "Block Sensitive Source & PII",
							RuleID:   "rule-12345",
							MessageSegments: []CustomRuleMessageSegment{
								{Text: "機密情報の外部送信は禁止されています。詳しくは"},
								{Text: "社内セキュリティ規定", Link: "https://intra.example.com/policy"},
							},
						},
					},
				},
			},
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(respProto.MarshalProto())
	}))
	defer mockServer.Close()

	client := NewClient(mockServer.URL)

	// 1. Test BLOCK verdict
	verdict, err := client.Scan(context.Background(), ScanInput{
		DMToken:     "test-dm-token-xyz",
		UserEmail:   "user@example.com",
		ClientID:    "client-uuid-123",
		URL:         "https://api.anthropic.com/v1/messages",
		Source:      "chrome.exe",
		Destination: "Cursor (https://cursor.com/local-app/cursor)",
		ContentType: "application/json",
		Connector:   BulkDataEntry,
		Reason:      ReasonClipboardPaste,
		Payload:     []byte(`{"prompt": "Here is MY_NUMBER_SECRET 1234-5678-9012"}`),
		DeviceName:  "macbook-pro.local",
		OSPlatform:  "macOS",
	})
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}
	if verdict.Allowed {
		t.Errorf("expected Allowed=false for BLOCK verdict")
	}
	if verdict.Action != ActionBlock {
		t.Errorf("expected ActionBlock, got %v", verdict.Action)
	}
	if verdict.RuleName != "Block Sensitive Source & PII" {
		t.Errorf("unexpected RuleName: %q", verdict.RuleName)
	}
	if !strings.Contains(verdict.CustomMessage, "https://intra.example.com/policy") {
		t.Errorf("unexpected CustomMessage: %q", verdict.CustomMessage)
	}

	// Verify metadata part was valid base64 proto containing our DM token, URL, ChromeVersion, Source, Destination, and ClientID
	rawMeta, err := base64.StdEncoding.DecodeString(receivedMetaB64)
	if err != nil {
		t.Fatalf("metadata is not valid base64: %v", err)
	}
	metaStr := string(rawMeta)
	for _, want := range []string{
		"test-dm-token-xyz",
		"https://api.anthropic.com/v1/messages",
		DefaultChromeVersion,
		"Clipboard text",
		"chrome.exe",
		"Cursor (https://cursor.com/local-app/cursor)",
		"client-uuid-123",
		"user@example.com",
	} {
		if !strings.Contains(metaStr, want) {
			t.Errorf("serialized ContentAnalysisRequest missing %q", want)
		}
	}

	// 2. Test ALLOW verdict
	allowVerdict, err := client.Scan(context.Background(), ScanInput{
		DMToken: "test-dm-token-xyz",
		URL:     "https://slack.com/api/chat.postMessage",
		Payload: []byte("Hello team, meeting is at 3pm."),
	})
	if err != nil {
		t.Fatalf("Allow Scan failed: %v", err)
	}
	if !allowVerdict.Allowed {
		t.Errorf("expected Allowed=true for clean payload")
	}
}
