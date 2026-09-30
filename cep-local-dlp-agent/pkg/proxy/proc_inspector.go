package proxy

import (
	"net"
	"strings"
)

// IdentifyLocalProcess resolves the process name that owns the client side of a loopback TCP connection
// (e.g., "Cursor", "Claude", "Slack", "OUTLOOK.EXE", or "Google Chrome" / "chrome.exe").
//
// Windows uses the native iphlpapi GetExtendedTcpTable API (sub-millisecond, no process spawn).
// macOS / Linux use `lsof` with a short timeout.
func IdentifyLocalProcess(remoteAddr string) string {
	host, port, err := net.SplitHostPort(remoteAddr)
	if err != nil || port == "" {
		return ""
	}
	ip := net.ParseIP(host)
	if ip != nil && !ip.IsLoopback() {
		return ""
	}
	return identifyProcessNative(port)
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
		"google chrome beta", "google chrome dev", "google chrome canary",
		"googleupdate", "googleupdate.exe", "googleupdater", "googleupdater.exe",
		"softwareupdated", "trustd", "nsurlsessiond", "svchost.exe":
		return true
	}
	return strings.HasPrefix(p, "google chrome")
}
