package proxy

import (
	"fmt"
	"net"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// IdentifyLocalProcess resolves the process name that owns the client side of a loopback TCP connection
// (e.g., "Cursor", "Claude", "Slack", "OUTLOOK.EXE", or "Google Chrome" / "chrome.exe") on macOS, Windows, and Linux.
func IdentifyLocalProcess(remoteAddr string) string {
	host, port, err := net.SplitHostPort(remoteAddr)
	if err != nil || port == "" {
		return ""
	}
	ip := net.ParseIP(host)
	if ip != nil && !ip.IsLoopback() {
		return ""
	}

	switch runtime.GOOS {
	case "darwin", "linux":
		return identifyProcessLsof(port)
	case "windows":
		return identifyProcessWindows(port)
	default:
		return ""
	}
}

func identifyProcessLsof(clientPort string) string {
	cmd := exec.Command("lsof", "-nP", "-iTCP:"+clientPort, "-F", "c")
	done := make(chan string, 1)
	go func() {
		out, err := cmd.Output()
		if err != nil {
			done <- ""
			return
		}
		for _, line := range strings.Split(string(out), "\n") {
			if strings.HasPrefix(line, "c") && len(line) > 1 {
				proc := strings.TrimSpace(line[1:])
				if !strings.Contains(strings.ToLower(proc), "cep-dlp-agent") {
					done <- proc
					return
				}
			}
		}
		done <- ""
	}()

	select {
	case res := <-done:
		return res
	case <-time.After(150 * time.Millisecond):
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
		return ""
	}
}

func identifyProcessWindows(clientPort string) string {
	ps := fmt.Sprintf(`$c = Get-NetTCPConnection -LocalPort %s -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { (Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue).ProcessName }`, clientPort)
	cmd := exec.Command("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", ps)
	done := make(chan string, 1)
	go func() {
		out, err := cmd.Output()
		if err != nil {
			done <- ""
			return
		}
		done <- strings.TrimSpace(string(out))
	}()

	select {
	case res := <-done:
		return res
	case <-time.After(250 * time.Millisecond):
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
		return ""
	}
}

// IsBypassedProcess returns true if the identified local process is Google Chrome itself
// (already protected by Chrome's built-in CEP engine) or an OS system updater/service.
func IsBypassedProcess(procName string) bool {
	p := strings.ToLower(strings.TrimSpace(procName))
	if p == "" {
		return false
	}
	switch p {
	case "google chrome", "google chrome helper", "chrome", "chrome.exe",
		"googleupdate", "googleupdate.exe", "softwareupdated", "trustd", "nsurlsessiond":
		return true
	}
	return strings.HasPrefix(p, "google chrome")
}
