// Package dmtoken discovers Device (CBCM) and User Profile DM Tokens from the local OS
// across Windows, macOS, and Linux, matching Chromium's BrowserDMTokenStorage.
package dmtoken

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strings"
)

// TokenInfo holds the discovered DM Token(s) and host metadata used in ContentAnalysisRequest.
type TokenInfo struct {
	DMToken        string `json:"dm_token"`
	TokenSource    string `json:"token_source"`
	ProfileDMToken string `json:"profile_dm_token,omitempty"`
	UserEmail      string `json:"user_email,omitempty"`
	DeviceName     string `json:"device_name"`
	OSPlatform     string `json:"os_platform"`
	OSVersion      string `json:"os_version"`
	MachineUser    string `json:"machine_user"`
}

// Discover automatically locates the Chrome Enterprise DM Token and profile metadata
// from environment variables or OS-native storage locations.
func Discover(explicitToken string) (*TokenInfo, error) {
	hostname, _ := os.Hostname()
	var username string
	if u, err := user.Current(); err == nil {
		username = u.Username
	}

	info := &TokenInfo{
		DeviceName:  hostname,
		OSPlatform:  platformDisplayName(runtime.GOOS),
		OSVersion:   runtime.GOARCH,
		MachineUser: username,
	}

	// Discover signed-in user email and profile info from Chrome Preferences if available.
	info.UserEmail, info.ProfileDMToken = discoverChromeProfileMetadata()

	if explicitToken != "" {
		info.DMToken = strings.TrimSpace(explicitToken)
		info.TokenSource = "flag/explicit"
		return info, nil
	}

	if envToken := strings.TrimSpace(os.Getenv("CEP_DM_TOKEN")); envToken != "" {
		info.DMToken = envToken
		info.TokenSource = "env:CEP_DM_TOKEN"
		return info, nil
	}

	var token, source string
	switch runtime.GOOS {
	case "darwin":
		token, source = discoverMacOSDMToken()
	case "windows":
		token, source = discoverWindowsDMToken()
	default:
		token, source = discoverLinuxDMToken()
	}

	if token != "" {
		info.DMToken = token
		info.TokenSource = source
		return info, nil
	}

	if info.ProfileDMToken != "" {
		info.DMToken = info.ProfileDMToken
		info.TokenSource = "chrome_profile"
		return info, nil
	}

	// Check ~/.cep-local-dlp-agent/byod_token.json provisioned by the Companion Chrome Extension
	if byodTok, byodEmail, byodPath := discoverBYODBootstrapToken(); byodTok != "" {
		info.DMToken = byodTok
		info.TokenSource = "byod_extension:" + byodPath
		if info.UserEmail == "" && byodEmail != "" {
			info.UserEmail = byodEmail
		}
		return info, nil
	}

	return info, fmt.Errorf("no Chrome Enterprise DM Token found on %s (enroll Chrome via CBCM, push via Companion Extension, or set CEP_DM_TOKEN)", runtime.GOOS)
}

func discoverBYODBootstrapToken() (token, email, path string) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", "", ""
	}
	p := filepath.Join(home, ".cep-local-dlp-agent", "byod_token.json")
	b, err := os.ReadFile(p)
	if err != nil {
		return "", "", ""
	}
	var data struct {
		DMToken   string `json:"dm_token"`
		UserEmail string `json:"user_email"`
	}
	if json.Unmarshal(b, &data) == nil && strings.TrimSpace(data.DMToken) != "" {
		return strings.TrimSpace(data.DMToken), strings.TrimSpace(data.UserEmail), p
	}
	return "", "", ""
}

// SaveBYODBootstrapToken persists the DM token and user email pushed by the
// Companion Chrome Extension into ~/.cep-local-dlp-agent/byod_token.json (mode 0600).
func SaveBYODBootstrapToken(dmToken, userEmail string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(home, ".cep-local-dlp-agent")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	payload, err := json.MarshalIndent(map[string]string{
		"dm_token":   strings.TrimSpace(dmToken),
		"user_email": strings.TrimSpace(userEmail),
	}, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "byod_token.json"), payload, 0600)
}


func platformDisplayName(goos string) string {
	switch goos {
	case "darwin":
		return "Mac OS X"
	case "windows":
		return "Windows"
	case "linux":
		return "Linux"
	default:
		return goos
	}
}

// discoverMacOSDMToken reads the CBCM DM Token from:
// - /Library/Application Support/Google/Chrome Cloud Enrollment/<SerialNumber>
// - ~/Library/Application Support/Google/Chrome Cloud Enrollment/<SerialNumber>
func discoverMacOSDMToken() (string, string) {
	home, _ := os.UserHomeDir()
	dirs := []string{
		"/Library/Application Support/Google/Chrome Cloud Enrollment",
	}
	if home != "" {
		dirs = append(dirs, filepath.Join(home, "Library/Application Support/Google/Chrome Cloud Enrollment"))
	}

	for _, dir := range dirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if e.IsDir() || strings.HasPrefix(e.Name(), ".") {
				continue
			}
			fullPath := filepath.Join(dir, e.Name())
			if tok := readCleanTokenFile(fullPath); tok != "" {
				return tok, fullPath
			}
		}
	}
	return "", ""
}

// discoverLinuxDMToken reads the CBCM DM Token from:
// - ~/.config/google-chrome/Policy/Enrollment/*
// - /etc/opt/chrome/policies/enrollment/*
func discoverLinuxDMToken() (string, string) {
	home, _ := os.UserHomeDir()
	var dirs []string
	if home != "" {
		dirs = append(dirs,
			filepath.Join(home, ".config/google-chrome/Policy/Enrollment"),
			filepath.Join(home, ".config/chromium/Policy/Enrollment"),
		)
	}
	dirs = append(dirs, "/etc/opt/chrome/policies/enrollment")

	for _, dir := range dirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if e.IsDir() || strings.HasPrefix(e.Name(), ".") {
				continue
			}
			fullPath := filepath.Join(dir, e.Name())
			if tok := readCleanTokenFile(fullPath); tok != "" {
				return tok, fullPath
			}
		}
	}
	return "", ""
}

// discoverWindowsDMToken queries Windows Registry keys used by BrowserDMTokenStorageWin:
// 1. HKLM\SOFTWARE\Google\Chrome\Enrollment -> dmtoken (REG_BINARY or REG_SZ)
// 2. HKLM\SOFTWARE\WOW6432Node\Google\Update\ClientState\{430FD4D0-B729-4F61-AA34-91526481799D} -> CloudManagementDMToken
func discoverWindowsDMToken() (string, string) {
	queries := []struct {
		key   string
		value string
	}{
		{`HKLM\SOFTWARE\Google\Chrome\Enrollment`, "dmtoken"},
		{`HKLM\SOFTWARE\WOW6432Node\Google\Chrome\Enrollment`, "dmtoken"},
		{`HKLM\SOFTWARE\WOW6432Node\Google\Update\ClientState\{430FD4D0-B729-4F61-AA34-91526481799D}`, "CloudManagementDMToken"},
		{`HKLM\SOFTWARE\Google\Update\ClientState\{430FD4D0-B729-4F61-AA34-91526481799D}`, "CloudManagementDMToken"},
	}

	for _, q := range queries {
		cmd := exec.Command("reg", "query", q.key, "/v", q.value)
		out, err := cmd.Output()
		if err != nil {
			continue
		}
		if tok := parseRegQueryOutput(string(out), q.value); tok != "" {
			return tok, fmt.Sprintf("registry:%s\\%s", q.key, q.value)
		}
	}
	return "", ""
}

func parseRegQueryOutput(output, valueName string) string {
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if !strings.Contains(line, valueName) {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) >= 3 {
			rawVal := fields[len(fields)-1]
			if strings.Contains(line, "REG_BINARY") {
				// Decode hex string into raw bytes and base64-encode if binary
				if decoded, err := decodeHexBytes(rawVal); err == nil && len(decoded) > 0 {
					return base64.StdEncoding.EncodeToString(decoded)
				}
			}
			return rawVal
		}
	}
	return ""
}

func decodeHexBytes(s string) ([]byte, error) {
	if len(s)%2 != 0 {
		return nil, fmt.Errorf("odd hex length")
	}
	out := make([]byte, len(s)/2)
	for i := 0; i < len(s); i += 2 {
		var b byte
		_, err := fmt.Sscanf(s[i:i+2], "%02x", &b)
		if err != nil {
			return nil, err
		}
		out[i/2] = b
	}
	return out, nil
}

func readCleanTokenFile(path string) string {
	b, err := os.ReadFile(path)
	if err != nil || len(b) == 0 {
		return ""
	}
	trimmed := bytes.TrimSpace(b)
	// Ignore invalidated tokens
	if string(trimmed) == "INVALID" || len(trimmed) < 8 {
		return ""
	}
	// If it's already printable ASCII (Base64/WebSafeBase64), return directly; otherwise base64-encode.
	isASCII := true
	for _, c := range trimmed {
		if c < 0x20 || c > 0x7e {
			isASCII = false
			break
		}
	}
	if isASCII {
		return string(trimmed)
	}
	return base64.StdEncoding.EncodeToString(b)
}

func discoverChromeProfileMetadata() (email string, profileToken string) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", ""
	}
	var userDataDirs []string
	switch runtime.GOOS {
	case "darwin":
		userDataDirs = []string{filepath.Join(home, "Library/Application Support/Google/Chrome")}
	case "windows":
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData != "" {
			userDataDirs = []string{filepath.Join(localAppData, `Google\Chrome\User Data`)}
		}
	default:
		userDataDirs = []string{filepath.Join(home, ".config/google-chrome")}
	}

	for _, base := range userDataDirs {
		prefsPath := filepath.Join(base, "Default", "Preferences")
		b, err := os.ReadFile(prefsPath)
		if err != nil {
			continue
		}
		var prefs struct {
			AccountInfo []struct {
				Email string `json:"email"`
			} `json:"account_info"`
		}
		if json.Unmarshal(b, &prefs) == nil && len(prefs.AccountInfo) > 0 {
			email = prefs.AccountInfo[0].Email
			break
		}
	}
	return email, profileToken
}
