package sysconfig

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

const (
	macLaunchAgentLabel = "com.google.cep.local-dlp-agent"
	winRunValueName     = "CEPLocalDLPAgent"
)

// InstallUserSpaceAgent stops any running background agent instance, installs the current
// binary into ~/.cep-local-dlp-agent/bin/, installs the local Root CA into the user trust store,
// registers OS login auto-start (macOS LaunchAgents / Windows HKCU Run / Linux systemd user),
// and starts the new background daemon.
func InstallUserSpaceAgent(certPath string, listenAddr string, dmToken string) (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("resolve user home dir: %w", err)
	}
	baseDir := filepath.Join(home, ".cep-local-dlp-agent")
	binDir := filepath.Join(baseDir, "bin")
	if err := os.MkdirAll(binDir, 0o755); err != nil {
		return "", fmt.Errorf("create agent bin dir: %w", err)
	}

	exeName := "cep-dlp-agent"
	if runtime.GOOS == "windows" {
		exeName = "cep-dlp-agent.exe"
	}
	targetBin := filepath.Join(binDir, exeName)

	// Terminate any already-running installed daemon before overwriting targetBin and binding port 8843.
	stopInstalledDaemon(exeName)

	selfPath, err := os.Executable()
	if err == nil && selfPath != targetBin {
		if err := copyExecutable(selfPath, targetBin); err != nil {
			log.Printf("[installer] Warning: could not copy binary to %s: %v (using %s)", targetBin, err, selfPath)
			targetBin = selfPath
		}
	}

	// Persist explicit DM Token if provided during bootstrap
	if dmToken != "" {
		_ = SaveBootstrapToken(baseDir, dmToken, "")
	}

	// Best-effort Root CA installation in user trust store
	if certPath != "" {
		if err := InstallRootCA(certPath); err != nil {
			log.Printf("[installer] Note: Root CA trust store registration returned: %v", err)
		}
	}

	switch runtime.GOOS {
	case "darwin":
		if err := installMacOSLaunchAgentAndApp(home, targetBin, listenAddr); err != nil {
			return targetBin, err
		}
	case "windows":
		if err := installWindowsAutoStartAndProtocol(targetBin, listenAddr); err != nil {
			return targetBin, err
		}
	default:
		if err := installLinuxUserServiceAndProtocol(home, targetBin, listenAddr); err != nil {
			return targetBin, err
		}
	}

	// Ensure the background daemon is running right now so the user / Chrome extension
	// sees http://127.0.0.1:8843/healthz online immediately after `install`.
	ensureDaemonRunningNow(targetBin, listenAddr)

	return targetBin, nil
}

func stopInstalledDaemon(exeName string) {
	myPid := os.Getpid()
	switch runtime.GOOS {
	case "windows":
		filter := fmt.Sprintf("PID ne %d", myPid)
		_ = exec.Command("taskkill", "/F", "/FI", filter, "/IM", exeName).Run()
		_ = exec.Command("taskkill", "/F", "/FI", filter, "/IM", "cep-dlp-agent-windows-amd64.exe").Run()
		_ = exec.Command("taskkill", "/F", "/FI", filter, "/IM", "cep-dlp-agent-windows-arm64.exe").Run()
		time.Sleep(250 * time.Millisecond)
	}
}

// UninstallUserSpaceAgent removes the user-space auto-start registration and restores system proxy state.
func UninstallUserSpaceAgent() error {
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "darwin":
		plistPath := filepath.Join(home, "Library/LaunchAgents", macLaunchAgentLabel+".plist")
		_ = exec.Command("launchctl", "unload", "-w", plistPath).Run()
		_ = os.Remove(plistPath)
		_ = os.RemoveAll(filepath.Join(home, "Applications", "CEP Local DLP Agent.app"))
	case "windows":
		stopInstalledDaemon("cep-dlp-agent.exe")
		_ = exec.Command("reg", "delete", `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, "/v", winRunValueName, "/f").Run()
		_ = exec.Command("reg", "delete", `HKCU\Software\Classes\cep-dlp`, "/f").Run()
		_ = exec.Command("reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f").Run()
	default:
		unitPath := filepath.Join(home, ".config/systemd/user/cep-local-dlp-agent.service")
		_ = exec.Command("systemctl", "--user", "disable", "--now", "cep-local-dlp-agent.service").Run()
		_ = os.Remove(unitPath)
	}
	return nil
}

func installMacOSLaunchAgentAndApp(home, binPath, listenAddr string) error {
	launchAgentsDir := filepath.Join(home, "Library/LaunchAgents")
	if err := os.MkdirAll(launchAgentsDir, 0o755); err != nil {
		return fmt.Errorf("create LaunchAgents dir: %w", err)
	}
	logPath := filepath.Join(home, ".cep-local-dlp-agent", "agent.log")
	plistPath := filepath.Join(launchAgentsDir, macLaunchAgentLabel+".plist")

	plist := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>%s</string>
    <key>ProgramArguments</key>
    <array>
        <string>%s</string>
        <string>daemon</string>
        <string>--listen</string>
        <string>%s</string>
        <string>--system-proxy</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>%s</string>
    <key>StandardErrorPath</key>
    <string>%s</string>
</dict>
</plist>
`, macLaunchAgentLabel, binPath, listenAddr, logPath, logPath)

	if err := os.WriteFile(plistPath, []byte(plist), 0o644); err != nil {
		return fmt.Errorf("write LaunchAgent plist: %w", err)
	}

	// Also create a minimal macOS .app bundle in ~/Applications so `cep-dlp://start`
	// URL scheme clicks in Chrome are handled natively by macOS LaunchServices.
	appDir := filepath.Join(home, "Applications", "CEP Local DLP Agent.app", "Contents")
	macOSBinDir := filepath.Join(appDir, "MacOS")
	if err := os.MkdirAll(macOSBinDir, 0o755); err == nil {
		appInfoPlist := `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>cep-dlp-launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.google.cep.local-dlp-agent.launcher</string>
    <key>CFBundleName</key>
    <string>CEP Local DLP Agent</string>
    <key>CFBundleVersion</key>
    <string>1.2.1</string>
    <key>LSUIElement</key>
    <true/>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>CEP Local DLP Agent Protocol</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>cep-dlp</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
`
		_ = os.WriteFile(filepath.Join(appDir, "Info.plist"), []byte(appInfoPlist), 0o644)
		launcherScript := fmt.Sprintf("#!/bin/sh\n\"%s\" \"cep-dlp://start\" >/dev/null 2>&1 &\n", binPath)
		launcherPath := filepath.Join(macOSBinDir, "cep-dlp-launcher")
		_ = os.WriteFile(launcherPath, []byte(launcherScript), 0o755)
		lsregister := "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
		_ = exec.Command(lsregister, "-f", filepath.Join(home, "Applications", "CEP Local DLP Agent.app")).Run()
	}

	_ = exec.Command("launchctl", "unload", plistPath).Run()
	if err := exec.Command("launchctl", "load", "-w", plistPath).Run(); err != nil {
		log.Printf("[installer] launchctl load note: %v", err)
	}
	return nil
}

func installWindowsAutoStartAndProtocol(binPath, listenAddr string) error {
	daemonCmd := fmt.Sprintf(`"%s" daemon --listen %s --system-proxy`, binPath, listenAddr)
	urlSchemeCmd := fmt.Sprintf(`"%s" "%%1"`, binPath)

	// 1. Register user login auto-start under HKCU\Software\Microsoft\Windows\CurrentVersion\Run (no admin required)
	if err := exec.Command("reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`,
		"/v", winRunValueName, "/t", "REG_SZ", "/d", daemonCmd, "/f").Run(); err != nil {
		return fmt.Errorf("register Windows HKCU Run auto-start: %w", err)
	}

	// 2. Register cep-dlp:// custom URL scheme under HKCU\Software\Classes\cep-dlp so Chrome extension can launch it
	_ = exec.Command("reg", "add", `HKCU\Software\Classes\cep-dlp`, "/ve", "/t", "REG_SZ", "/d", "URL:CEP Local DLP Agent Protocol", "/f").Run()
	_ = exec.Command("reg", "add", `HKCU\Software\Classes\cep-dlp`, "/v", "URL Protocol", "/t", "REG_SZ", "/d", "", "/f").Run()
	_ = exec.Command("reg", "add", `HKCU\Software\Classes\cep-dlp\shell\open\command`, "/ve", "/t", "REG_SZ", "/d", urlSchemeCmd, "/f").Run()
	return nil
}

func installLinuxUserServiceAndProtocol(home, binPath, listenAddr string) error {
	systemdDir := filepath.Join(home, ".config/systemd/user")
	if err := os.MkdirAll(systemdDir, 0o755); err != nil {
		return err
	}
	unitPath := filepath.Join(systemdDir, "cep-local-dlp-agent.service")
	unit := fmt.Sprintf(`[Unit]
Description=Chrome Enterprise Premium Local DLP Agent
After=network.target

[Service]
ExecStart=%s daemon --listen %s
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
`, binPath, listenAddr)
	if err := os.WriteFile(unitPath, []byte(unit), 0o644); err != nil {
		return err
	}
	_ = exec.Command("systemctl", "--user", "daemon-reload").Run()
	_ = exec.Command("systemctl", "--user", "enable", "--now", "cep-local-dlp-agent.service").Run()

	appsDir := filepath.Join(home, ".local/share/applications")
	_ = os.MkdirAll(appsDir, 0o755)
	desktopPath := filepath.Join(appsDir, "cep-dlp-handler.desktop")
	desktop := fmt.Sprintf(`[Desktop Entry]
Name=CEP Local DLP Agent
Exec=%s %%u
Type=Application
NoDisplay=true
MimeType=x-scheme-handler/cep-dlp;
`, binPath)
	_ = os.WriteFile(desktopPath, []byte(desktop), 0o644)
	_ = exec.Command("xdg-mime", "default", "cep-dlp-handler.desktop", "x-scheme-handler/cep-dlp").Run()
	return nil
}

func ensureDaemonRunningNow(binPath, listenAddr string) {
	home, _ := os.UserHomeDir()
	logPath := filepath.Join(home, ".cep-local-dlp-agent", "agent.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	args := []string{"daemon", "--listen", listenAddr}
	if runtime.GOOS == "darwin" || runtime.GOOS == "windows" {
		args = append(args, "--system-proxy")
	}
	cmd := exec.Command(binPath, args...)
	if err == nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	}
	_ = cmd.Start()
}

// SaveBootstrapToken persists a BYOD DM Token and user email pushed by the Chrome Extension
// or `install --dm-token` into ~/.cep-local-dlp-agent/byod_token.json.
func SaveBootstrapToken(baseDir, dmToken, userEmail string) error {
	if baseDir == "" {
		home, _ := os.UserHomeDir()
		baseDir = filepath.Join(home, ".cep-local-dlp-agent")
	}
	if err := os.MkdirAll(baseDir, 0o700); err != nil {
		return err
	}
	path := filepath.Join(baseDir, "byod_token.json")
	payload := fmt.Sprintf("{\n  \"dm_token\": %q,\n  \"user_email\": %q\n}\n", dmToken, userEmail)
	return os.WriteFile(path, []byte(payload), 0o600)
}

func copyExecutable(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
