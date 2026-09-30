//go:build !windows

package oshook

import (
	"os/exec"
	"runtime"
	"strings"
)

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

func clearOSClipboard() error {
	switch runtime.GOOS {
	case "darwin":
		cmd := exec.Command("pbcopy")
		cmd.Stdin = strings.NewReader("")
		return cmd.Run()
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
	default:
		out, err := exec.Command("xdotool", "getwindowfocus", "getwindowname").Output()
		if err == nil {
			return strings.TrimSpace(string(out))
		}
	}
	return "local-app"
}
