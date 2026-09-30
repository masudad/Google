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

// IsBypassedProcess returns true if the identified local process is a standalone web browser
// (Google Chrome is already protected by its built-in CEP engine, and Personal Browser profiles
// are personal space that must not be intercepted) or an OS system updater/service.
func IsBypassedProcess(procName string) bool {
	p := strings.ToLower(strings.TrimSpace(procName))
	if p == "" {
		return false
	}
	switch p {
	case "google chrome", "google chrome helper", "chrome", "chrome.exe",
		"google chrome beta", "google chrome dev", "google chrome canary",
		"msedge", "msedge.exe", "microsoft edge",
		"brave", "brave.exe", "brave browser",
		"firefox", "firefox.exe",
		"vivaldi", "vivaldi.exe",
		"opera", "opera.exe",
		"arc", "arc.exe",
		"safari",
		"googleupdate", "googleupdate.exe", "googleupdater", "googleupdater.exe",
		"softwareupdated", "trustd", "nsurlsessiond", "svchost.exe":
		return true
	}
	return strings.HasPrefix(p, "google chrome") || strings.HasPrefix(p, "microsoft edge")
}
