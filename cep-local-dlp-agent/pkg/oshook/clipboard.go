// Package oshook implements the Layer-1 OS Clipboard and Active Application Hook,
// inspecting sensitive clipboard data against CEP WebProtect across native desktop apps
// (Cursor, Claude Desktop, Slack, Outlook, Teams, Notepad, etc.) without requiring TLS decryption.
//
// Architecture (Enterprise-Ready Synchronous Paste Interception):
//  1. Silent Background Pre-Warm & Quarantine:
//     When the user copies text or switches to a native desktop application, ClipboardGuard
//     silently evaluates the clipboard content against CEP WebProtect (https://local-app.internal/<app>)
//     WITHOUT showing any popup dialog on window switch. If a BLOCK rule matches, the clipboard text
//     is silently quarantined in memory and the OS clipboard is emptied (preventing mouse Right-Click -> Paste).
//     If the user switches back to a standalone web browser without pasting, the quarantined clipboard text is
//     seamlessly restored.
//  2. Synchronous OS Paste Shortcut Hook (WH_KEYBOARD_LL on Windows):
//     When the user physically presses Ctrl+V, Ctrl+Shift+V, or Shift+Insert in a monitored native app,
//     the low-level keyboard hook intercepts the keystroke BEFORE the target application receives it.
//     If the verdict is BLOCK, the keystroke is dropped at the OS level (return 1) so zero characters
//     are pasted — whether on the 1st press, 2nd press, rapid Ctrl+V spam, or while the block dialog
//     is left open on screen — and the block alert dialog is displayed (or brought back to the front).
package oshook

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

const (
	allowedVerdictTTL = 5 * time.Minute
	blockedVerdictTTL = 10 * time.Minute
	syncPasteWaitMax  = 250 * time.Millisecond
)

// standaloneBrowserApps are web browsers whose clipboard actions are governed by Chrome's native
// CEP engine (for Managed Profiles) or are the user's personal browser space on BYOD machines.
var standaloneBrowserApps = map[string]bool{
	"google chrome":        true,
	"google chrome helper": true,
	"google chrome beta":   true,
	"google chrome dev":    true,
	"google chrome canary": true,
	"chrome":               true,
	"msedge":               true,
	"microsoft edge":       true,
	"brave":                true,
	"brave browser":        true,
	"firefox":              true,
	"vivaldi":              true,
	"opera":                true,
	"arc":                  true,
	"safari":               true,
	"island":               true,
	"waterfox":             true,
	"floorp":               true,
}

// osSystemBypassApps are OS shell/window-manager processes and the agent's own process.
var osSystemBypassApps = map[string]bool{
	// Agent's own process (prevent MessageBoxW popup from triggering a clipboard scan)
	"cep-dlp-agent":               true,
	"cep-dlp-agent-windows-amd64": true,
	"cep-dlp-agent-windows-arm64": true,
	// Windows / macOS OS Shell & Window Manager processes
	"explorer":                true,
	"searchhost":              true,
	"shellexperiencehost":     true,
	"startmenuexperiencehost": true,
	"applicationframehost":    true,
	"lockapp":                 true,
	"dwm":                     true,
	"taskmgr":                 true,
	"finder":                  true,
	"dock":                    true,
	"systemuiserver":          true,
	"loginwindow":             true,
}

type cachedVerdictEntry struct {
	verdict *webprotect.ScanVerdict
	expiry  time.Time
}

// ClipboardGuard monitors OS paste shortcuts and clipboard state across native applications.
type ClipboardGuard struct {
	WebProtect        *webprotect.Client
	TokenInfo         *dmtoken.TokenInfo
	Notifier          notifier.Notifier
	MinChars          int
	PollInterval      time.Duration
	LastEvaluatedHash string

	// Optional test hooks (nil in production -> uses OS functions)
	readClipboardFn  func() string
	writeClipboardFn func(string) error
	clearClipboardFn func() error
	detectAppFn      func() string

	mu                  sync.Mutex
	allowedVerdicts     map[string]time.Time
	blockedVerdicts     map[string]cachedVerdictEntry
	lastBlockedHash     string
	lastBlockedVerdict  *webprotect.ScanVerdict
	lastBlockedExpiry   time.Time
	quarantinedText     string
	quarantinedHash     string
	quarantinedVerdict  *webprotect.ScanVerdict
	quarantinedApp      string
	quarantinedTarget   string
	quarantinedNotified bool
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
		WebProtect:      wp,
		TokenInfo:       token,
		Notifier:        notif,
		MinChars:        minChars,
		PollInterval:    defaultPollInterval(),
		allowedVerdicts: make(map[string]time.Time),
		blockedVerdicts: make(map[string]cachedVerdictEntry),
	}
}

func normalizeAppBaseName(appName string) string {
	lower := strings.ToLower(strings.TrimSpace(appName))
	lower = strings.TrimSuffix(lower, ".exe")
	lower = strings.TrimSuffix(lower, ".app")
	return strings.TrimSpace(lower)
}

func isBrowserApp(appName string) bool {
	lower := normalizeAppBaseName(appName)
	if standaloneBrowserApps[lower] {
		return true
	}
	return strings.HasPrefix(lower, "google chrome ") ||
		strings.HasPrefix(lower, "microsoft edge ") ||
		strings.HasPrefix(lower, "brave browser ")
}

func isAgentProcess(appName string) bool {
	lower := normalizeAppBaseName(appName)
	return lower == "cep-dlp-agent" || strings.HasPrefix(lower, "cep-dlp-agent-")
}

// ResolveAppURL converts an OS foreground application name into a canonical `https://local-app.internal/<app>`
// URL for CEP content-detector rule matching, or returns bypass=true for standalone browsers and OS shell processes.
func ResolveAppURL(appName string) (string, bool) {
	lower := normalizeAppBaseName(appName)
	if lower == "" || lower == "local-app" {
		return "", true
	}
	if isBrowserApp(lower) || osSystemBypassApps[lower] || isAgentProcess(lower) {
		return "", true
	}
	sanitized := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return '-'
	}, lower)
	trimmed := strings.Trim(sanitized, "-")
	if trimmed == "" {
		return "", true
	}
	return fmt.Sprintf("https://local-app.internal/%s", trimmed), false
}

// hashClipboardContent computes the SHA-256 hex digest of clipboard text alone.
func hashClipboardContent(clipboardText string) string {
	sum := sha256.Sum256([]byte(clipboardText))
	return hex.EncodeToString(sum[:])
}

func (g *ClipboardGuard) readClip() string {
	if g.readClipboardFn != nil {
		return g.readClipboardFn()
	}
	return readOSClipboard()
}

func (g *ClipboardGuard) writeClip(text string) error {
	if g.writeClipboardFn != nil {
		return g.writeClipboardFn(text)
	}
	return writeOSClipboard(text)
}

func (g *ClipboardGuard) clearClip() error {
	if g.clearClipboardFn != nil {
		return g.clearClipboardFn()
	}
	return clearOSClipboard()
}

func (g *ClipboardGuard) detectApp() string {
	if g.detectAppFn != nil {
		return g.detectAppFn()
	}
	return detectForegroundApp()
}

func (g *ClipboardGuard) resetSeqCacheLocked() {
	g.lastSeqNum = 0
	g.lastCachedClipboard = ""
	g.LastEvaluatedHash = ""
	g.lastSeenHash = ""
}

func (g *ClipboardGuard) clearQuarantineLocked() {
	g.quarantinedText = ""
	g.quarantinedHash = ""
	g.quarantinedVerdict = nil
	g.quarantinedApp = ""
	g.quarantinedTarget = ""
	g.quarantinedNotified = false
}

// EvaluateClipboardOnce inspects the given clipboard text in the context of activeApp
// as an explicit paste action (clearing the clipboard and notifying on BLOCK).
// Returns (allowed, verdict, error).
func (g *ClipboardGuard) EvaluateClipboardOnce(ctx context.Context, activeApp string, clipboardText string) (bool, *webprotect.ScanVerdict, error) {
	return g.evaluateClipboardInternal(ctx, activeApp, clipboardText, true)
}

// PrewarmClipboardOnce silently evaluates the clipboard text in the context of activeApp
// WITHOUT popping up a block dialog on window switch. If blocked, it silently quarantines
// the clipboard text in memory and clears the OS clipboard so neither Ctrl+V nor mouse
// Right-Click -> Paste can leak the secret, while deferring the popup dialog until the
// user actually attempts to paste (Ctrl+V / Shift+Insert).
func (g *ClipboardGuard) PrewarmClipboardOnce(ctx context.Context, activeApp string, clipboardText string) (bool, *webprotect.ScanVerdict, error) {
	return g.evaluateClipboardInternal(ctx, activeApp, clipboardText, false)
}

func (g *ClipboardGuard) evaluateClipboardInternal(ctx context.Context, activeApp string, clipboardText string, notifyImmediately bool) (bool, *webprotect.ScanVerdict, error) {
	targetURL, bypass := ResolveAppURL(activeApp)

	g.mu.Lock()
	if bypass {
		// Only restore un-notified quarantined text when the user explicitly switches back to a
		// standalone web browser (never on transient "local-app" focus transitions or agent dialogs).
		if isBrowserApp(activeApp) && g.quarantinedText != "" && !g.quarantinedNotified {
			restoreText := g.quarantinedText
			g.clearQuarantineLocked()
			g.mu.Unlock()
			_ = g.writeClip(restoreText)
			return true, nil, nil
		}
		if debugEnabled() && len(strings.TrimSpace(clipboardText)) > 0 {
			hashHex := hashClipboardContent(clipboardText)
			if hashHex != g.lastBypassLogHash {
				g.lastBypassLogHash = hashHex
				log.Printf("[oshook] clipboard change (%d bytes) in bypassed app=%q -> skipped",
					len(clipboardText), activeApp)
			}
		}
		g.mu.Unlock()
		return true, nil, nil
	}

	trimmed := strings.TrimSpace(clipboardText)
	if len(trimmed) == 0 {
		// If clipboard is empty because we quarantined it, keep the quarantine active for Ctrl+V interception.
		if g.quarantinedVerdict == nil {
			g.LastEvaluatedHash = ""
			g.lastSeenHash = ""
			g.lastSourceApp = ""
		}
		g.mu.Unlock()
		return true, nil, nil
	}
	if len(trimmed) < g.MinChars {
		g.mu.Unlock()
		return true, nil, nil
	}

	hashHex := hashClipboardContent(clipboardText)
	// New clipboard content arrived: clear any stale quarantine from a previous clipboard string.
	if g.quarantinedHash != "" && g.quarantinedHash != hashHex {
		g.clearQuarantineLocked()
	}

	if hashHex != g.lastSeenHash {
		g.lastSeenHash = hashHex
		g.lastSourceApp = activeApp
	}

	now := time.Now()
	cacheKey := hashHex + "\x00" + targetURL
	destLabel := fmt.Sprintf("%s (%s)", activeApp, targetURL)

	// 1. Check local Blocked-Hash Cache for this (clipboard, app) pair
	if entry, ok := g.blockedVerdicts[cacheKey]; ok && now.Before(entry.expiry) {
		verdict := entry.verdict
		g.quarantinedText = clipboardText
		g.quarantinedHash = hashHex
		g.quarantinedVerdict = verdict
		g.quarantinedApp = activeApp
		g.quarantinedTarget = destLabel
		g.quarantinedNotified = notifyImmediately
		g.resetSeqCacheLocked()
		g.mu.Unlock()

		_ = g.clearClip()
		if notifyImmediately && g.Notifier != nil {
			g.Notifier.NotifyBlock(destLabel, verdict.RuleName, verdict.CustomMessage)
		}
		return false, verdict, nil
	}

	// 2. Check local Allowed-Hash Cache
	if exp, ok := g.allowedVerdicts[hashHex]; ok && now.Before(exp) {
		g.LastEvaluatedHash = hashHex
		g.mu.Unlock()
		return true, nil, nil
	}
	if hashHex == g.LastEvaluatedHash {
		g.mu.Unlock()
		return true, nil, nil
	}

	sourceLabel := g.lastSourceApp
	if sourceLabel == "" {
		sourceLabel = "OS_CLIPBOARD"
	}
	g.mu.Unlock()

	if g.TokenInfo != nil {
		g.TokenInfo.RefreshIfNeeded()
	}

	var dmToken, profileDMToken, userEmail, clientID, deviceName, osPlatform, osVersion, machineUser string
	if g.TokenInfo != nil {
		dmToken, profileDMToken, userEmail, clientID = g.TokenInfo.Credentials()
		deviceName = g.TokenInfo.DeviceName
		osPlatform = g.TokenInfo.OSPlatform
		osVersion = g.TokenInfo.OSVersion
		machineUser = g.TokenInfo.MachineUser
	}

	verdict, err := g.WebProtect.Scan(ctx, webprotect.ScanInput{
		DMToken:        dmToken,
		ProfileDMToken: profileDMToken,
		UserEmail:      userEmail,
		ClientID:       clientID,
		URL:            targetURL,
		TabURL:         targetURL,
		Filename:       "Clipboard text",
		Source:         sourceLabel,
		Destination:    destLabel,
		ContentType:    "text/plain",
		Connector:      webprotect.BulkDataEntry,
		Reason:         webprotect.ReasonClipboardPaste,
		Payload:        []byte(clipboardText),
		DeviceName:     deviceName,
		OSPlatform:     osPlatform,
		OSVersion:      osVersion,
		MachineUser:    machineUser,
	})
	if err != nil {
		log.Printf("[oshook] WebProtect clipboard scan error for app=%s (%s): %v (failing open)", activeApp, targetURL, err)
		return true, nil, err
	}

	log.Printf("[oshook] CEP DLP Clipboard Verdict for app=%s url=%s (%d bytes): %s (rule=%q, %dms)",
		activeApp, targetURL, len(clipboardText), verdict.ActionName, verdict.RuleName, verdict.LatencyMs)

	if !verdict.Allowed {
		_ = g.clearClip()
		g.mu.Lock()
		if len(g.blockedVerdicts) > 512 {
			g.blockedVerdicts = make(map[string]cachedVerdictEntry)
		}
		exp := time.Now().Add(blockedVerdictTTL)
		g.blockedVerdicts[cacheKey] = cachedVerdictEntry{
			verdict: verdict,
			expiry:  exp,
		}
		g.lastBlockedHash = hashHex
		g.lastBlockedVerdict = verdict
		g.lastBlockedExpiry = exp
		g.quarantinedText = clipboardText
		g.quarantinedHash = hashHex
		g.quarantinedVerdict = verdict
		g.quarantinedApp = activeApp
		g.quarantinedTarget = destLabel
		g.quarantinedNotified = notifyImmediately
		g.resetSeqCacheLocked()
		g.mu.Unlock()

		if notifyImmediately {
			log.Printf("[oshook] BLOCKED clipboard paste in app=%q (%s) rule=%q -> clipboard cleared", activeApp, targetURL, verdict.RuleName)
			if g.Notifier != nil {
				g.Notifier.NotifyBlock(destLabel, verdict.RuleName, verdict.CustomMessage)
			}
		} else {
			log.Printf("[oshook] Quarantined sensitive clipboard in app=%q (%s) rule=%q (awaiting paste attempt before alerting)", activeApp, targetURL, verdict.RuleName)
		}
		return false, verdict, nil
	}

	if verdict.Action == webprotect.ActionWarn && g.Notifier != nil {
		if notifyImmediately {
			if !g.Notifier.PromptWarn(destLabel, verdict.RuleName, verdict.CustomMessage) {
				_ = g.clearClip()
				g.mu.Lock()
				g.resetSeqCacheLocked()
				g.mu.Unlock()
				log.Printf("[oshook] WARN declined by user in app=%q (%s) rule=%q -> clipboard cleared", activeApp, targetURL, verdict.RuleName)
				return false, verdict, nil
			}
		} else {
			// Do not prompt on window switch; wait for actual Ctrl+V paste attempt.
			return true, verdict, nil
		}
	}

	g.mu.Lock()
	if len(g.allowedVerdicts) > 1024 {
		g.allowedVerdicts = make(map[string]time.Time)
	}
	g.allowedVerdicts[hashHex] = time.Now().Add(allowedVerdictTTL)
	g.LastEvaluatedHash = hashHex
	g.clearQuarantineLocked()
	g.mu.Unlock()
	return true, verdict, nil
}

// HandlePasteAttempt is invoked synchronously by the OS low-level keyboard hook (WH_KEYBOARD_LL)
// when the user presses Ctrl+V, Ctrl+Shift+V, or Shift+Insert.
// Returns true if the paste keystroke should be allowed through to the target application,
// or false if the keystroke must be dropped at the OS boundary.
func (g *ClipboardGuard) HandlePasteAttempt(ctx context.Context) bool {
	activeApp := g.detectApp()
	if isAgentProcess(activeApp) {
		// User pressed Ctrl+V while the block alert dialog itself is focused.
		if g.Notifier != nil {
			g.mu.Lock()
			target := g.quarantinedTarget
			verdict := g.quarantinedVerdict
			g.mu.Unlock()
			if verdict != nil {
				g.Notifier.NotifyBlock(target, verdict.RuleName, verdict.CustomMessage)
			}
		}
		return false
	}

	targetURL, bypass := ResolveAppURL(activeApp)
	if bypass {
		if isBrowserApp(activeApp) {
			g.mu.Lock()
			if g.quarantinedText != "" && !g.quarantinedNotified {
				restoreText := g.quarantinedText
				g.clearQuarantineLocked()
				g.mu.Unlock()
				_ = g.writeClip(restoreText)
				return true
			}
			g.mu.Unlock()
		}
		return true
	}

	liveClip := g.readClip()
	trimmedLive := strings.TrimSpace(liveClip)

	g.mu.Lock()
	// Case 1: The OS clipboard is currently empty because prewarm (or an earlier Ctrl+V press)
	// already quarantined a blocked string for the user's current clipboard session.
	// Every subsequent Ctrl+V press (1st, 2nd, 3rd, Nth — whether the dialog is open or closed)
	// MUST be dropped and MUST trigger NotifyBlock!
	if trimmedLive == "" && g.quarantinedVerdict != nil {
		verdict := g.quarantinedVerdict
		destLabel := fmt.Sprintf("%s (%s)", activeApp, targetURL)
		g.quarantinedTarget = destLabel
		g.quarantinedNotified = true
		g.mu.Unlock()

		log.Printf("[oshook] BLOCKED paste shortcut (Ctrl+V) in app=%q (%s) rule=%q", activeApp, targetURL, verdict.RuleName)
		if g.Notifier != nil {
			g.Notifier.NotifyBlock(destLabel, verdict.RuleName, verdict.CustomMessage)
		}
		return false
	}

	if len(trimmedLive) < g.MinChars {
		g.mu.Unlock()
		return true
	}

	hashHex := hashClipboardContent(liveClip)
	cacheKey := hashHex + "\x00" + targetURL
	destLabel := fmt.Sprintf("%s (%s)", activeApp, targetURL)
	now := time.Now()

	// Case 2: Already known to be ALLOWED in cache -> pass through in <5 microseconds!
	if exp, ok := g.allowedVerdicts[hashHex]; ok && now.Before(exp) {
		g.mu.Unlock()
		return true
	}

	// Case 3: Already known to be BLOCKED in cache (either for this app or any local-app.internal app) ->
	// drop keystroke in <5 microseconds, clear clipboard, and trigger block dialog!
	var cachedBlocked *webprotect.ScanVerdict
	if entry, ok := g.blockedVerdicts[cacheKey]; ok && now.Before(entry.expiry) {
		cachedBlocked = entry.verdict
	} else if hashHex == g.lastBlockedHash && g.lastBlockedVerdict != nil && now.Before(g.lastBlockedExpiry) {
		cachedBlocked = g.lastBlockedVerdict
	}
	if cachedBlocked != nil {
		g.quarantinedText = liveClip
		g.quarantinedHash = hashHex
		g.quarantinedVerdict = cachedBlocked
		g.quarantinedApp = activeApp
		g.quarantinedTarget = destLabel
		g.quarantinedNotified = true
		g.resetSeqCacheLocked()
		g.mu.Unlock()

		_ = g.clearClip()
		log.Printf("[oshook] BLOCKED paste shortcut (Ctrl+V) in app=%q (%s) rule=%q -> keystroke dropped & clipboard cleared",
			activeApp, targetURL, cachedBlocked.RuleName)
		if g.Notifier != nil {
			g.Notifier.NotifyBlock(destLabel, cachedBlocked.RuleName, cachedBlocked.CustomMessage)
		}
		return false
	}
	g.mu.Unlock()

	// Case 4: Uncached clipboard text (user pressed Ctrl+C and Ctrl+V within <25ms before background prewarm finished).
	// Evaluate synchronously within syncPasteWaitMax (250ms). If scan takes longer than 250ms, drop the
	// unverified keystroke so sensitive data can never leak before WebProtect responds.
	type scanOutcome struct {
		allowed bool
	}
	resCh := make(chan scanOutcome, 1)
	go func() {
		scanCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		allowed, _, _ := g.evaluateClipboardInternal(scanCtx, activeApp, liveClip, true)
		resCh <- scanOutcome{allowed: allowed}
	}()

	select {
	case out := <-resCh:
		return out.allowed
	case <-time.After(syncPasteWaitMax):
		log.Printf("[oshook] Paste scan for app=%q still in flight after %v -> dropping premature Ctrl+V keystroke for safety",
			activeApp, syncPasteWaitMax)
		return false
	}
}

// Run starts the synchronous OS paste keystroke interceptor (WH_KEYBOARD_LL on Windows)
// and the silent background clipboard pre-warm loop.
func (g *ClipboardGuard) Run(ctx context.Context) error {
	if g.PollInterval <= 0 {
		g.PollInterval = defaultPollInterval()
	}
	go startPasteKeystrokeHook(ctx, g)

	ticker := time.NewTicker(g.PollInterval)
	defer ticker.Stop()

	log.Printf("[oshook] Layer-1 OS Clipboard & Active App Guard started (min_chars=%d, poll=%v)", g.MinChars, g.PollInterval)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			activeApp := g.detectApp()
			clipText := g.currentClipboardText()
			_, _, _ = g.PrewarmClipboardOnce(ctx, activeApp, clipText)
		}
	}
}

// currentClipboardText returns the current OS clipboard text, using the Win32 sequence number
// on Windows to avoid calling OpenClipboard when the clipboard has not changed since the last tick.
func (g *ClipboardGuard) currentClipboardText() string {
	if seq := clipboardSequenceNumber(); seq != 0 {
		g.mu.Lock()
		if seq == g.lastSeqNum {
			cached := g.lastCachedClipboard
			g.mu.Unlock()
			return cached
		}
		g.mu.Unlock()

		text := g.readClip()
		g.mu.Lock()
		g.lastSeqNum = seq
		g.lastCachedClipboard = text
		g.mu.Unlock()
		return text
	}
	return g.readClip()
}

func debugEnabled() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("CEP_AGENT_DEBUG")))
	return v == "1" || v == "true" || v == "yes"
}
