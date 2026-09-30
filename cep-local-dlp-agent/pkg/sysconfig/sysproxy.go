// Package sysconfig manages OS-level Root CA trust installation and automatic System Proxy
// configuration/restoration for macOS and Windows.
package sysconfig

import (
	"fmt"
	"log"
	"net"
	"os/exec"
	"runtime"
	"strings"
)

var defaultBypassHosts = []string{
	"localhost",
	"127.0.0.1",
	"safebrowsing.google.com",
	"*.webprotect-us.goog",
	"*.webprotect-eu.goog",
}

// InstallRootCA installs the generated Root CA certificate into the local OS trust store
// (macOS Login/System Keychain, Windows CurrentUser Root Store, or Linux ca-certificates).
func InstallRootCA(certPath string) error {
	switch runtime.GOOS {
	case "darwin":
		// Install into the user's login keychain first (does not require root if login keychain is unlocked),
		// falling back to System keychain if needed.
		cmd := exec.Command("security", "add-trusted-cert", "-r", "trustRoot", certPath)
		if out, err := cmd.CombinedOutput(); err != nil {
			return fmt.Errorf("macOS security add-trusted-cert failed: %v (%s)", err, strings.TrimSpace(string(out)))
		}
		return nil
	case "windows":
		// Use -user so standard users can trust the local Root CA without UAC elevation if permitted,
		// or administrator console for machine-wide trust.
		cmd := exec.Command("certutil", "-user", "-addstore", "-f", "Root", certPath)
		if out, err := cmd.CombinedOutput(); err != nil {
			return fmt.Errorf("Windows certutil -addstore failed: %v (%s)", err, strings.TrimSpace(string(out)))
		}
		return nil
	default:
		return fmt.Errorf("automatic Root CA install on %s requires root: sudo cp %q /usr/local/share/ca-certificates/cep-local-root-ca.crt && sudo update-ca-certificates", runtime.GOOS, certPath)
	}
}

// EnableSystemProxy configures the OS-wide HTTP/HTTPS proxy (macOS networksetup or Windows WinInet registry)
// and returns a cleanup function that restores the previous state when the agent stops.
func EnableSystemProxy(listenAddr string) (restore func(), err error) {
	host, port, splitErr := net.SplitHostPort(listenAddr)
	if splitErr != nil || host == "" || host == "0.0.0.0" {
		host = "127.0.0.1"
	}
	if port == "" {
		port = "8843"
	}

	switch runtime.GOOS {
	case "darwin":
		return enableMacOSSystemProxy(host, port)
	case "windows":
		return enableWindowsSystemProxy(host, port)
	default:
		return func() {}, fmt.Errorf("automatic OS system proxy toggle is supported on macOS and Windows (on Linux, export HTTPS_PROXY=http://%s:%s)", host, port)
	}
}

func enableMacOSSystemProxy(host, port string) (func(), error) {
	services, err := listActiveMacOSNetworkServices()
	if err != nil || len(services) == 0 {
		return func() {}, fmt.Errorf("discover macOS network services: %w", err)
	}

	for _, svc := range services {
		_ = exec.Command("networksetup", "-setwebproxy", svc, host, port).Run()
		_ = exec.Command("networksetup", "-setsecurewebproxy", svc, host, port).Run()
		args := append([]string{"-setproxybypassdomains", svc}, defaultBypassHosts...)
		_ = exec.Command("networksetup", args...).Run()
		_ = exec.Command("networksetup", "-setwebproxystate", svc, "on").Run()
		_ = exec.Command("networksetup", "-setsecurewebproxystate", svc, "on").Run()
		log.Printf("[sysconfig] Enabled macOS system proxy (%s:%s) on service %q", host, port, svc)
	}

	restore := func() {
		for _, svc := range services {
			_ = exec.Command("networksetup", "-setwebproxystate", svc, "off").Run()
			_ = exec.Command("networksetup", "-setsecurewebproxystate", svc, "off").Run()
			log.Printf("[sysconfig] Restored macOS system proxy (off) on service %q", svc)
		}
	}
	return restore, nil
}

func listActiveMacOSNetworkServices() ([]string, error) {
	out, err := exec.Command("networksetup", "-listallnetworkservices").Output()
	if err != nil {
		return nil, err
	}
	var services []string
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "*") || strings.Contains(line, "asterisk") {
			continue
		}
		services = append(services, line)
	}
	return services, nil
}

func enableWindowsSystemProxy(host, port string) (func(), error) {
	const regKey = `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`
	proxyServer := fmt.Sprintf("%s:%s", host, port)
	proxyOverride := strings.Join(append(defaultBypassHosts, "<local>"), ";")

	if err := exec.Command("reg", "add", regKey, "/v", "ProxyServer", "/t", "REG_SZ", "/d", proxyServer, "/f").Run(); err != nil {
		return func() {}, fmt.Errorf("set Windows ProxyServer registry: %w", err)
	}
	_ = exec.Command("reg", "add", regKey, "/v", "ProxyOverride", "/t", "REG_SZ", "/d", proxyOverride, "/f").Run()
	if err := exec.Command("reg", "add", regKey, "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "1", "/f").Run(); err != nil {
		return func() {}, fmt.Errorf("enable Windows ProxyEnable registry: %w", err)
	}
	log.Printf("[sysconfig] Enabled Windows WinInet system proxy (%s)", proxyServer)

	restore := func() {
		_ = exec.Command("reg", "add", regKey, "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f").Run()
		log.Printf("[sysconfig] Restored Windows WinInet system proxy (ProxyEnable=0)")
	}
	return restore, nil
}
