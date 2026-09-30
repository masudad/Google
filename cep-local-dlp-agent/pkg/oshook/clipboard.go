// Package oshook implements the Layer-1 OS Clipboard and Active Application Hook,
// inspecting sensitive clipboard data against CEP WebProtect across native desktop apps
// (Cursor, Claude Desktop, Slack, Outlook, Teams, etc.) without requiring TLS decryption.
package oshook

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

// DefaultAppURLMap maps common native desktop application process/bundle names to canonical URLs
// so Google Admin Console DLP URL rules apply seamlessly across both browser and desktop apps.
var DefaultAppURLMap = map[string]string{
	"cursor":          "https://cursor.com/local-app/cursor",
	"claude":          "https://claude.ai/local-app/claude-desktop",
	"chatgpt":         "https://chatgpt.com/local-app/chatgpt-desktop",
	"slack":           "https://slack.com/local-app/slack-desktop",
	"microsoft teams": "https://teams.microsoft.com/local-app/teams",
	"teams":           "https://teams.microsoft.com/local-app/teams",
	"outlook":         "https://outlook.office.com/local-app/outlook",
	"thunderbird":     "https://local-app.internal/thunderbird",
	"mail":            "https://local-app.internal/apple-mail",
	"line":            "https://line.me/local-app/line-desktop",
	"discord":         "https://discord.com/local-app/discord",
	"notion":          "https://www.notion.so/local-app/notion",
	"code":            "https://vscode.dev/local-app/vscode",
	"windsurf":        "https://codeium.com/local-app/windsurf",
}

// ClipboardGuard monitors the OS clipboard and active foreground application, evaluating
// copied/pasted text against CEP WebProtect (BULK_DATA_ENTRY) and clearing the clipboard
// if a BLOCK rule is triggered for the active native app.
//
// Windows uses in-process Win32 APIs (GetClipboardSequenceNumber, OpenClipboard/GetClipboardData,
// GetForegroundWindow/QueryFullProcessImageNameW) so polling costs <0.1ms and never spawns PowerShell.
type ClipboardGuard struct {
	WebProtect          *webprotect.Client
	TokenInfo           *dmtoken.TokenInfo
	Notifier            notifier.Notifier
	MinChars            int
	PollInterval        time.Duration
	LastEvaluatedHash   string
	lastSeenHash        string
	lastSourceApp       string
	lastBypassLogHash   string
	lastSeqNum          uint32
	lastCachedClipboard string
}

// NewClipboardGuard creates a new Layer-1 OS Clipboard DLP guard.
func NewClipboardGuard(wp *webprotect.Client, token *dmtoken.TokenInfo, notif notifier.Notifier, minChars int) *ClipboardGuard {
	if minChars <= 0 {
		minChars = 1 // Support 12-digit My Number and short sensitive IDs
	}
	return &ClipboardGuard{
		WebProtect:   wp,
		TokenInfo:    token,
		Notifier:     notif,
		MinChars:     minChars,
		PollInterval: 500 * time.Millisecond,
	}
}

// ResolveAppURL converts an OS foreground application name into a canonical URL for CEP rule matching.
func ResolveAppURL(appName string) (string, bool) {
	lower := strings.ToLower(strings.TrimSpace(appName))
	if lower == "" {
		return "https://local-app.internal/unknown", false
	}
	// Bypass Google Chrome itself (already protected by Chrome's built-in CEP engine)
	if strings.Contains(lower, "google chrome") || lower == "chrome" || lower == "chrome.exe" {
		return "", true
	}
	for key, targetURL := range DefaultAppURLMap {
		if strings.Contains(lower, key) {
			return targetURL, false
		}
	}
	sanitized := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return '-'
	}, lower)
	return fmt.Sprintf("https://local-app.internal/%s", strings.Trim(sanitized, "-")), false
}

// hashClipboardContent computes the SHA-256 hex digest of clipboard text alone.
// Deduplicating by clipboard content (rather than activeApp + clipboardText) ensures that:
//  1. Copying text in a native app scans it once (when allowed); Alt-Tabbing across windows never re-scans.
//  2. Copying text inside Chrome is bypassed while in Chrome, and scanned once the first time
//     the user switches to any native app (before they can paste), without re-scanning on
//     subsequent native-to-native window switches.
//  3. Blocked content is cleared from the clipboard and never cached in LastEvaluatedHash, so
//     re-copying the same secret is always scanned and blocked again.
func hashClipboardContent(clipboardText string) string {
	sum := sha256.Sum256([]byte(clipboardText))
	return hex.EncodeToString(sum[:])
}

// EvaluateClipboardOnce inspects the given clipboard text in the context of activeApp.
// Returns (allowed, verdict, error).
func (g *ClipboardGuard) EvaluateClipboardOnce(ctx context.Context, activeApp string, clipboardText string) (bool, *webprotect.ScanVerdict, error) {
	trimmed := strings.TrimSpace(clipboardText)
	if len(trimmed) == 0 {
		g.LastEvaluatedHash = ""
		g.lastSeenHash = ""
		g.lastSourceApp = ""
		return true, nil, nil
	}
	if len(trimmed) < g.MinChars {
		return true, nil, nil
	}

	hashHex := hashClipboardContent(clipboardText)
	if hashHex != g.lastSeenHash {
		g.lastSeenHash = hashHex
		g.lastSourceApp = activeApp
	}
	if hashHex == g.LastEvaluatedHash {
		return true, nil, nil
	}

	targetURL, bypass := ResolveAppURL(activeApp)
	if bypass {
		if debugEnabled() && hashHex != g.lastBypassLogHash {
			g.lastBypassLogHash = hashHex
			log.Printf("[oshook] clipboard change (%d bytes) in browser app=%q -> bypassed (will scan if switched to native app)",
				len(clipboardText), activeApp)
		}
		return true, nil, nil
	}

	sourceLabel := g.lastSourceApp
	if sourceLabel == "" {
		sourceLabel = "OS_CLIPBOARD"
	}
	destLabel := fmt.Sprintf("%s (%s)", activeApp, targetURL)

	verdict, err := g.WebProtect.Scan(ctx, webprotect.ScanInput{
		DMToken:        g.TokenInfo.DMToken,
		ProfileDMToken: g.TokenInfo.ProfileDMToken,
		UserEmail:      g.TokenInfo.UserEmail,
		ClientID:       g.TokenInfo.ClientID,
		URL:            targetURL,
		TabURL:         targetURL,
		Filename:       "Clipboard text",
		Source:         sourceLabel,
		Destination:    destLabel,
		ContentType:    "text/plain",
		Connector:      webprotect.BulkDataEntry,
		Reason:         webprotect.ReasonClipboardPaste,
		Payload:        []byte(clipboardText),
		DeviceName:     g.TokenInfo.DeviceName,
		OSPlatform:     g.TokenInfo.OSPlatform,
		OSVersion:      g.TokenInfo.OSVersion,
		MachineUser:    g.TokenInfo.MachineUser,
	})
	if err != nil {
		log.Printf("[oshook] WebProtect clipboard scan error for app=%s (%s): %v (failing open)", activeApp, targetURL, err)
		return true, nil, err
	}

	log.Printf("[oshook] CEP DLP Clipboard Verdict for app=%s url=%s (%d bytes): %s (rule=%q, %dms)",
		activeApp, targetURL, len(clipboardText), verdict.ActionName, verdict.RuleName, verdict.LatencyMs)

	if !verdict.Allowed {
		_ = clearOSClipboard()
		// Reset dedupe state so if the user copies the exact same secret again, it is re-scanned and blocked.
		g.LastEvaluatedHash = ""
		g.lastSeenHash = ""
		g.lastCachedClipboard = ""
		log.Printf("[oshook] BLOCKED clipboard content in app=%q (%s) rule=%q -> clipboard cleared", activeApp, targetURL, verdict.RuleName)
		if g.Notifier != nil {
			g.Notifier.NotifyBlock(destLabel, verdict.RuleName, verdict.CustomMessage)
		}
		return false, verdict, nil
	}
	if verdict.Action == webprotect.ActionWarn && g.Notifier != nil {
		if !g.Notifier.PromptWarn(destLabel, verdict.RuleName, verdict.CustomMessage) {
			_ = clearOSClipboard()
			g.LastEvaluatedHash = ""
			g.lastSeenHash = ""
			g.lastCachedClipboard = ""
			log.Printf("[oshook] WARN declined by user in app=%q (%s) rule=%q -> clipboard cleared", activeApp, targetURL, verdict.RuleName)
			return false, verdict, nil
		}
	}

	// Only cache the hash once the content has been evaluated and allowed in a native app.
	g.LastEvaluatedHash = hashHex
	return true, verdict, nil
}

// Run starts the background clipboard + foreground application monitor loop.
func (g *ClipboardGuard) Run(ctx context.Context) error {
	ticker := time.NewTicker(g.PollInterval)
	defer ticker.Stop()

	log.Printf("[oshook] Layer-1 OS Clipboard & Active App Guard started (min_chars=%d)", g.MinChars)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			clipText := g.currentClipboardText()
			trimmed := strings.TrimSpace(clipText)
			if len(trimmed) == 0 {
				g.LastEvaluatedHash = ""
				g.lastSeenHash = ""
				continue
			}
			if len(trimmed) < g.MinChars {
				continue
			}
			// Fast path: if this exact clipboard content was already evaluated and allowed in a native app,
			// skip foreground-window detection and WebProtect scanning entirely.
			if hashClipboardContent(clipText) == g.LastEvaluatedHash {
				continue
			}
			activeApp := detectForegroundApp()
			_, _, _ = g.EvaluateClipboardOnce(ctx, activeApp, clipText)
		}
	}
}

// currentClipboardText returns the current OS clipboard text, using the Win32 sequence number
// on Windows to avoid calling OpenClipboard when the clipboard has not changed since the last tick.
func (g *ClipboardGuard) currentClipboardText() string {
	if seq := clipboardSequenceNumber(); seq != 0 {
		if seq == g.lastSeqNum {
			return g.lastCachedClipboard
		}
		g.lastSeqNum = seq
		g.lastCachedClipboard = readOSClipboard()
		return g.lastCachedClipboard
	}
	return readOSClipboard()
}

func debugEnabled() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("CEP_AGENT_DEBUG")))
	return v == "1" || v == "true" || v == "yes"
}
