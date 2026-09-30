//go:build !windows

package oshook

import (
	"context"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

func defaultPollInterval() time.Duration {
	return 200 * time.Millisecond
}

func startPasteKeystrokeHook(_ context.Context, _ *ClipboardGuard) {
	// On macOS/Linux, silent clipboard quarantine in PrewarmClipboardOnce empties the OS
	// clipboard when a blocked native app is active and restores it when returning to a browser.
}

// clipboardSequenceNumber returns 0 on non-Windows platforms so currentClipboardText()
// falls back to reading the clipboard and hashing its text content.
func clipboardSequenceNumber() uint32 {
	return 0
}

func readOSClipboard() string {
	switch runtime.GOOS {
	case "darwin":
		out, err := exec.Command("pbpaste").Output()
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

func readOSClipboardFiles() []string {
	return nil
}

func writeOSClipboard(text string) error {
	switch runtime.GOOS {
	case "darwin":
		cmd := exec.Command("pbcopy")
		cmd.Stdin = strings.NewReader(text)
		return cmd.Run()
	default:
		cmd := exec.Command("xclip", "-i", "-selection", "clipboard")
		cmd.Stdin = strings.NewReader(text)
		return cmd.Run()
	}
}

func clearOSClipboard() error {
	return writeOSClipboard("")
}

func detectForegroundApp() string {
	switch runtime.GOOS {
	case "darwin":
		out, err := exec.Command("osascript", "-e", `tell application "System Events" to get name of first application process whose frontmost is true`).Output()
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
