// Package notifier provides OS-native alert dialogs and notifications for BLOCK and WARN
// DLP verdicts across macOS, Windows, and Linux.
package notifier

import (
	"log"
	"strings"
	"sync/atomic"
	"time"
)

// Notifier displays DLP block alerts and interactive warning prompts to the local user.
type Notifier interface {
	NotifyBlock(targetURL, ruleName, customMessage string)
	PromptWarn(targetURL, ruleName, customMessage string) bool
}

// OSNotifier uses native OS dialogs (Win32 MessageBoxW on Windows, osascript on macOS,
// notify-send/zenity on Linux) with single-instance focus management:
//   - If a modal block dialog is already open on screen, NotifyBlock brings that existing
//     dialog back to the foreground and beeps instead of stacking duplicate dialogs.
//   - Once the user closes the modal dialog, any subsequent blocked action (such as a 2nd
//     Ctrl+V press) immediately opens a new block dialog without a multi-second blind spot.
type OSNotifier struct {
	Headless   bool
	dialogOpen atomic.Bool
}

// NewOSNotifier creates a new OSNotifier.
func NewOSNotifier(headless bool) *OSNotifier {
	return &OSNotifier{
		Headless: headless,
	}
}

// NotifyBlock alerts the user that an outbound request or paste was blocked by CEP DLP.
func (n *OSNotifier) NotifyBlock(targetURL, ruleName, customMessage string) {
	msg := formatAlertBody("ブロックされました (Blocked by CEP DLP)", targetURL, ruleName, customMessage)
	log.Printf("[CEP-DLP BLOCK] %s", strings.ReplaceAll(msg, "\n", " | "))
	if n.Headless {
		return
	}

	if !n.dialogOpen.CompareAndSwap(false, true) {
		// A modal block dialog is already open on screen: bring it back to the foreground
		// and play an alert sound so the user cannot ignore it in the background, without
		// stacking duplicate windows.
		focusExistingBlockDialog()
		return
	}

	go func() {
		defer func() {
			// Short 150ms post-close debounce to avoid key-up bounce when dismissing with Enter/Space,
			// while ensuring a 2nd Ctrl+V press immediately shows the block dialog again.
			time.Sleep(150 * time.Millisecond)
			n.dialogOpen.Store(false)
		}()
		showNativeBlockDialog(msg)
	}()
}

// PromptWarn asks the user whether to proceed when a WARN rule is triggered.
// Returns true if the user explicitly chooses to proceed, or false to cancel.
func (n *OSNotifier) PromptWarn(targetURL, ruleName, customMessage string) bool {
	msg := formatAlertBody("警告: 機密データが含まれている可能性があります (CEP DLP Warning)", targetURL, ruleName, customMessage)
	log.Printf("[CEP-DLP WARN] %s", strings.ReplaceAll(msg, "\n", " | "))
	if n.Headless {
		// In headless/non-interactive mode, allow WARN verdicts after logging.
		return true
	}
	return showNativeWarnDialog(msg)
}

func formatAlertBody(headline, targetURL, ruleName, customMessage string) string {
	var sb strings.Builder
	sb.WriteString(headline)
	sb.WriteString("\nTarget: ")
	sb.WriteString(targetURL)
	if ruleName != "" {
		sb.WriteString("\nRule: ")
		sb.WriteString(ruleName)
	}
	if customMessage != "" {
		sb.WriteString("\nMessage: ")
		sb.WriteString(customMessage)
	}
	return sb.String()
}
