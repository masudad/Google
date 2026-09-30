// Package notifier provides OS-native alert dialogs and notifications for BLOCK and WARN
// DLP verdicts across macOS, Windows, and Linux.
package notifier

import (
	"log"
	"strings"
)

// Notifier displays DLP block alerts and interactive warning prompts to the local user.
type Notifier interface {
	NotifyBlock(targetURL, ruleName, customMessage string)
	PromptWarn(targetURL, ruleName, customMessage string) bool
}

// OSNotifier uses native OS dialogs (Win32 MessageBoxW on Windows, osascript on macOS,
// notify-send/zenity on Linux) with safe non-blocking fallback to stderr logging.
type OSNotifier struct {
	Headless bool
}

// NewOSNotifier creates a new OSNotifier.
func NewOSNotifier(headless bool) *OSNotifier {
	return &OSNotifier{Headless: headless}
}

// NotifyBlock alerts the user that an outbound request or paste was blocked by CEP DLP.
func (n *OSNotifier) NotifyBlock(targetURL, ruleName, customMessage string) {
	msg := formatAlertBody("ブロックされました (Blocked by CEP DLP)", targetURL, ruleName, customMessage)
	log.Printf("[CEP-DLP BLOCK] %s", strings.ReplaceAll(msg, "\n", " | "))
	if n.Headless {
		return
	}
	go showNativeBlockDialog(msg)
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
