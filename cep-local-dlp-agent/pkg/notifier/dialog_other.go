//go:build !windows

package notifier

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

func showNativeBlockDialog(msg string) {
	switch runtime.GOOS {
	case "darwin":
		script := fmt.Sprintf(`display alert "Chrome Enterprise Premium DLP" message %q as critical buttons {"OK"} default button "OK"`, msg)
		_ = exec.Command("osascript", "-e", script).Run()
	default:
		_ = exec.Command("notify-send", "-u", "critical", "Chrome Enterprise Premium DLP", msg).Run()
	}
}

func showNativeWarnDialog(msg string) bool {
	switch runtime.GOOS {
	case "darwin":
		script := fmt.Sprintf(` button returned of (display alert "Chrome Enterprise Premium DLP" message %q as warning buttons {"キャンセル (Block)", "送信を続行 (Proceed)"} default button "キャンセル (Block)")`, msg)
		out, err := exec.Command("osascript", "-e", script).Output()
		if err != nil {
			return false
		}
		return strings.Contains(string(out), "Proceed")
	default:
		err := exec.Command("zenity", "--question", "--title=Chrome Enterprise Premium DLP", "--text="+msg).Run()
		return err == nil
	}
}
