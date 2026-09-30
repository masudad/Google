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
	"os/exec"
	"runtime"
	"strings"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

// AppURLMap maps common native desktop application process/bundle names to canonical URLs
// so Google Admin Console DLP URL rules apply seamlessly across both browser and desktop apps.
var DefaultAppURLMap = map[string]string{
	"cursor":         "https://cursor.com/local-app/cursor",
	"claude":         "https://claude.ai/local-app/claude-desktop",
	"chatgpt":        "https://chatgpt.com/local-app/chatgpt-desktop",
	"slack":          "https://slack.com/local-app/slack-desktop",
	"microsoft teams": "https://teams.microsoft.com/local-app/teams",
	"teams":          "https://teams.microsoft.com/local-app/teams",
	"outlook":        "https://outlook.office.com/local-app/outlook",
	"thunderbird":    "https://local-app.internal/thunderbird",
	"mail":           "https://local-app.internal/apple-mail",
	"line":           "https://line.me/local-app/line-desktop",
	"discord":        "https://discord.com/local-app/discord",
	"notion":         "https://www.notion.so/local-app/notion",
	"code":           "https://vscode.dev/local-app/vscode",
	"windsurf":       "https://codeium.com/local-app/windsurf",
}

// ClipboardGuard monitors the OS clipboard and active foreground application, evaluating
// copied/pasted text against CEP WebProtect (BULK_DATA_ENTRY) and clearing the clipboard
// if a BLOCK rule is triggered for the active native app.
type ClipboardGuard struct {
	WebProtect      *webprotect.Client
	TokenInfo       *dmtoken.TokenInfo
	Notifier        notifier.Notifier
	MinChars        int
	PollInterval    time.Duration
	LastEvaluatedHash string
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

// EvaluateClipboardOnce inspects the given clipboard text in the context of activeApp.
// Returns (allowed, verdict, error).
func (g *ClipboardGuard) EvaluateClipboardOnce(ctx context.Context, activeApp string, clipboardText string) (bool, *webprotect.ScanVerdict, error) {
	if len(strings.TrimSpace(clipboardText)) < g.MinChars {
		return true, nil, nil
	}

	targetURL, bypass := ResolveAppURL(activeApp)
	if bypass {
		return true, nil, nil
	}

	sum := sha256.Sum256([]byte(activeApp + "\x00" + clipboardText))
	hashHex := hex.EncodeToString(sum[:])
	if hashHex == g.LastEvaluatedHash {
		return true, nil, nil
	}
	g.LastEvaluatedHash = hashHex

	verdict, err := g.WebProtect.Scan(ctx, webprotect.ScanInput{
		DMToken:        g.TokenInfo.DMToken,
		ProfileDMToken: g.TokenInfo.ProfileDMToken,
		UserEmail:      g.TokenInfo.UserEmail,
		URL:            targetURL,
		TabURL:         targetURL,
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
		return true, nil, err
	}

	if !verdict.Allowed {
		_ = clearOSClipboard()
		if g.Notifier != nil {
			g.Notifier.NotifyBlock(fmt.Sprintf("%s (%s)", activeApp, targetURL), verdict.RuleName, verdict.CustomMessage)
		}
		return false, verdict, nil
	}
	if verdict.Action == webprotect.ActionWarn && g.Notifier != nil {
		if !g.Notifier.PromptWarn(fmt.Sprintf("%s (%s)", activeApp, targetURL), verdict.RuleName, verdict.CustomMessage) {
			_ = clearOSClipboard()
			return false, verdict, nil
		}
	}
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
			clipText := readOSClipboard()
			if len(strings.TrimSpace(clipText)) < g.MinChars {
				continue
			}
			activeApp := detectForegroundApp()
			allowed, verdict, err := g.EvaluateClipboardOnce(ctx, activeApp, clipText)
			if err != nil {
				continue
			}
			if !allowed && verdict != nil {
				log.Printf("[oshook] BLOCKED clipboard content in app=%q rule=%q", activeApp, verdict.RuleName)
			}
		}
	}
}

func readOSClipboard() string {
	switch runtime.GOOS {
	case "darwin":
		out, err := exec.Command("pbpaste").Output()
		if err == nil {
			return string(out)
		}
	case "windows":
		out, err := exec.Command("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", "Get-Clipboard").Output()
		if err == nil {
			return string(out)
		}
	default:
		out, err := exec.Command("xclip", "-o", "-selection", "clipboard").Output()
		if err == nil {
			return string(out)
		}
	}
	return ""
}

func clearOSClipboard() error {
	switch runtime.GOOS {
	case "darwin":
		cmd := exec.Command("pbcopy")
		cmd.Stdin = strings.NewReader("")
		return cmd.Run()
	case "windows":
		return exec.Command("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", "Set-Clipboard -Value $null").Run()
	default:
		cmd := exec.Command("xclip", "-i", "-selection", "clipboard")
		cmd.Stdin = strings.NewReader("")
		return cmd.Run()
	}
}

func detectForegroundApp() string {
	switch runtime.GOOS {
	case "darwin":
		out, err := exec.Command("osascript", "-e", `tell application "System Events" to get name of first application process whose frontmost is true`).Output()
		if err == nil {
			return strings.TrimSpace(string(out))
		}
	case "windows":
		ps := `Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@; $hwnd = [Win32]::GetForegroundWindow(); $pidOut = 0; [Win32]::GetWindowThreadProcessId($hwnd, [ref]$pidOut) | Out-Null; (Get-Process -Id $pidOut).ProcessName`
		out, err := exec.Command("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", ps).Output()
		if err == nil {
			return strings.TrimSpace(string(out))
		}
	default:
		out, err := exec.Command("xdotool", "getwindowfocus", "getwindowname").Output()
		if err == nil {
			return strings.TrimSpace(string(out))
		}
	}
	return "local-app"
}
