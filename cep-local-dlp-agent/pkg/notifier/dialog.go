// Package notifier provides OS-native alert dialogs and notifications for BLOCK and WARN
// DLP verdicts across macOS, Windows, and Linux.
package notifier

import (
	"fmt"
	"log"
	"os/exec"
	"runtime"
	"strings"
)

// Notifier displays DLP block alerts and interactive warning prompts to the local user.
type Notifier interface {
	NotifyBlock(targetURL, ruleName, customMessage string)
	PromptWarn(targetURL, ruleName, customMessage string) bool
}

// OSNotifier uses native OS utilities (osascript on macOS, PowerShell MessageBox on Windows,
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

	go func() {
		switch runtime.GOOS {
		case "darwin":
			script := fmt.Sprintf(`display alert "Chrome Enterprise Premium DLP" message %q as critical buttons {"OK"} default button "OK"`, msg)
			_ = exec.Command("osascript", "-e", script).Run()
		case "windows":
			ps := fmt.Sprintf(`Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(%q, 'Chrome Enterprise Premium DLP', 'OK', 'Error')`, msg)
			_ = exec.Command("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", ps).Run()
		default:
			_ = exec.Command("notify-send", "-u", "critical", "Chrome Enterprise Premium DLP", msg).Run()
		}
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

	switch runtime.GOOS {
	case "darwin":
		script := fmt.Sprintf(` button returned of (display alert "Chrome Enterprise Premium DLP" message %q as warning buttons {"キャンセル (Block)", "送信を続行 (Proceed)"} default button "キャンセル (Block)")`, msg)
		out, err := exec.Command("osascript", "-e", script).Output()
		if err != nil {
			return false
		}
		return strings.Contains(string(out), "Proceed")
	case "windows":
		ps := fmt.Sprintf(`Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(%q, 'Chrome Enterprise Premium DLP Warning', 'YesNo', 'Warning')`, msg+"\n\n送信を続行しますか？ (Yes = 続行 / No = 遮断)")
		out, err := exec.Command("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", ps).Output()
		if err != nil {
			return false
		}
		return strings.TrimSpace(string(out)) == "Yes"
	default:
		err := exec.Command("zenity", "--question", "--title=Chrome Enterprise Premium DLP", "--text="+msg).Run()
		return err == nil
	}
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
