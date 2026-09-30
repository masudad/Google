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
	"time"
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

	// AvailableProfiles lists every managed Chrome profile found on disk (token redacted),
	// with Selected=true on the one whose Profile DM Token is in use.
	AvailableProfiles []ProfileCandidate `json:"available_profiles,omitempty"`
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
	info.UserEmail, info.ProfileDMToken, info.AvailableProfiles = discoverChromeProfileMetadata()

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

	// If the user/extension pinned a specific Chrome profile account and it resolved, that
	// profile token wins over a machine-level CBCM token (multi-tenant BYOD determinism).
	if pref := preferredProfileEmail(); pref != "" && info.ProfileDMToken != "" &&
		strings.EqualFold(info.UserEmail, pref) {
		info.DMToken = info.ProfileDMToken
		info.TokenSource = "chrome_profile:pinned"
		return info, nil
	}

	if token != "" {
		info.DMToken = token
		info.TokenSource = source
		return info, nil
	}

	if info.ProfileDMToken != "" {
		info.DMToken = info.ProfileDMToken
		info.TokenSource = "chrome_profile"
		for _, c := range info.AvailableProfiles {
			if c.Selected {
				info.TokenSource = "chrome_profile:" + filepath.Base(c.ProfileDir)
			}
		}
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

// ProfileCandidate describes one managed Chrome profile discovered on disk.
type ProfileCandidate struct {
	ProfileDir  string    `json:"profile_dir"`
	UserEmail   string    `json:"user_email"`
	DMToken     string    `json:"-"`
	CacheFile   string    `json:"cache_file"`
	LastUpdated time.Time `json:"last_updated"`
	IsLastUsed  bool      `json:"is_last_used"`
	Selected    bool      `json:"selected"`
}

func chromeUserDataDirs() []string {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil
	}
	switch runtime.GOOS {
	case "darwin":
		return []string{
			filepath.Join(home, "Library/Application Support/Google/Chrome"),
			filepath.Join(home, "Library/Application Support/Google/Chrome Beta"),
			filepath.Join(home, "Library/Application Support/Google/Chrome Canary"),
		}
	case "windows":
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData == "" {
			return nil
		}
		return []string{
			filepath.Join(localAppData, `Google\Chrome\User Data`),
			filepath.Join(localAppData, `Google\Chrome Beta\User Data`),
		}
	default:
		return []string{
			filepath.Join(home, ".config/google-chrome"),
			filepath.Join(home, ".config/google-chrome-beta"),
		}
	}
}

// readChromeLastUsedProfile returns the profile directory name Chrome recorded as most
// recently active (`profile.last_used` in `<User Data>/Local State`).
func readChromeLastUsedProfile(userDataDir string) string {
	b, err := os.ReadFile(filepath.Join(userDataDir, "Local State"))
	if err != nil {
		return ""
	}
	var state struct {
		Profile struct {
			LastUsed string `json:"last_used"`
		} `json:"profile"`
	}
	if json.Unmarshal(b, &state) != nil {
		return ""
	}
	return state.Profile.LastUsed
}

// ListChromeProfileCandidates scans every Chrome profile (Default, Profile 1, ...) and returns
// all managed profiles that carry a cached Profile DM Token, in no particular order.
func ListChromeProfileCandidates() []ProfileCandidate {
	policyCacheFilenames := []string{"User Policy", "Profile Cloud Policy"}
	var out []ProfileCandidate

	for _, base := range chromeUserDataDirs() {
		entries, err := os.ReadDir(base)
		if err != nil {
			continue
		}
		lastUsed := readChromeLastUsedProfile(base)

		for _, e := range entries {
			if !e.IsDir() {
				continue
			}
			name := e.Name()
			if name != "Default" && !strings.HasPrefix(name, "Profile ") {
				continue
			}
			profDir := filepath.Join(base, name)
			for _, cacheName := range policyCacheFilenames {
				cachePath := filepath.Join(profDir, "Policy", cacheName)
				raw, err := os.ReadFile(cachePath)
				if err != nil || len(raw) == 0 {
					continue
				}
				tok, user := ExtractDMTokenFromPolicyFetchResponse(raw)
				if tok == "" {
					continue
				}
				if user == "" {
					user = readPreferencesEmail(profDir)
				}
				var mtime time.Time
				if st, err := os.Stat(cachePath); err == nil {
					mtime = st.ModTime()
				}
				out = append(out, ProfileCandidate{
					ProfileDir:  profDir,
					UserEmail:   user,
					DMToken:     tok,
					CacheFile:   cacheName,
					LastUpdated: mtime,
					IsLastUsed:  name == lastUsed,
				})
				break
			}
		}
	}
	return out
}

func readPreferencesEmail(profDir string) string {
	b, err := os.ReadFile(filepath.Join(profDir, "Preferences"))
	if err != nil {
		return ""
	}
	var prefs struct {
		AccountInfo []struct {
			Email string `json:"email"`
		} `json:"account_info"`
	}
	if json.Unmarshal(b, &prefs) == nil && len(prefs.AccountInfo) > 0 {
		return prefs.AccountInfo[0].Email
	}
	return ""
}

// preferredProfileEmail returns the user-pinned account for profile selection, from
// CEP_PROFILE_EMAIL, then ~/.cep-local-dlp-agent/config.json ("preferred_email"), then the
// user_email pushed by the Companion Chrome Extension (byod_token.json).
func preferredProfileEmail() string {
	if v := strings.TrimSpace(os.Getenv("CEP_PROFILE_EMAIL")); v != "" {
		return v
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	if b, err := os.ReadFile(filepath.Join(home, ".cep-local-dlp-agent", "config.json")); err == nil {
		var cfg struct {
			PreferredEmail string `json:"preferred_email"`
		}
		if json.Unmarshal(b, &cfg) == nil && strings.TrimSpace(cfg.PreferredEmail) != "" {
			return strings.TrimSpace(cfg.PreferredEmail)
		}
	}
	if _, byodEmail, _ := discoverBYODBootstrapToken(); byodEmail != "" {
		return byodEmail
	}
	return ""
}

// SavePreferredProfileEmail pins the Chrome profile (by signed-in email) whose Profile DM Token
// the agent must use, so multi-tenant BYOD machines select a deterministic profile.
func SavePreferredProfileEmail(email string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(home, ".cep-local-dlp-agent")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	payload, _ := json.MarshalIndent(map[string]string{"preferred_email": strings.TrimSpace(email)}, "", "  ")
	return os.WriteFile(filepath.Join(dir, "config.json"), payload, 0600)
}

// SelectProfileCandidate picks one managed profile deterministically:
//  1. exact match on preferredEmail (or its @domain when preferredEmail starts with "@")
//  2. the profile Chrome recorded as last used (`Local State` -> profile.last_used)
//  3. the profile whose policy cache was refreshed most recently
func SelectProfileCandidate(cands []ProfileCandidate, preferredEmail string) (ProfileCandidate, bool) {
	if len(cands) == 0 {
		return ProfileCandidate{}, false
	}
	pref := strings.ToLower(strings.TrimSpace(preferredEmail))
	if pref != "" {
		for _, c := range cands {
			em := strings.ToLower(c.UserEmail)
			if em == pref || (strings.HasPrefix(pref, "@") && strings.HasSuffix(em, pref)) {
				return c, true
			}
		}
	}
	for _, c := range cands {
		if c.IsLastUsed {
			return c, true
		}
	}
	best := cands[0]
	for _, c := range cands[1:] {
		if c.LastUpdated.After(best.LastUpdated) {
			best = c
		}
	}
	return best, true
}

// FindProfileTokenByEmail returns the Profile DM Token for the Chrome profile signed in as email.
func FindProfileTokenByEmail(email string) (ProfileCandidate, bool) {
	cands := ListChromeProfileCandidates()
	e := strings.ToLower(strings.TrimSpace(email))
	for _, c := range cands {
		if strings.ToLower(c.UserEmail) == e {
			return c, true
		}
	}
	return ProfileCandidate{}, false
}

func discoverChromeProfileMetadata() (email string, profileToken string, candidates []ProfileCandidate) {
	candidates = ListChromeProfileCandidates()
	sel, ok := SelectProfileCandidate(candidates, preferredProfileEmail())
	if !ok {
		return "", "", candidates
	}
	for i := range candidates {
		candidates[i].Selected = candidates[i].ProfileDir == sel.ProfileDir
	}
	return sel.UserEmail, sel.DMToken, candidates
}

// ExtractDMTokenFromPolicyFetchResponse parses a raw serialized Chromium
// enterprise_management.PolicyFetchResponse protobuf (stored in `<Profile>/Policy/User Policy`
// or `Profile Cloud Policy`) and extracts:
//   - PolicyData.request_token (field 3) -> the Managed Profile DM Token
//   - PolicyData.username      (field 7) -> the signed-in Workspace user email
func ExtractDMTokenFromPolicyFetchResponse(buf []byte) (requestToken string, username string) {
	// PolicyFetchResponse field 3 (wire type 2) is `bytes policy_data`
	policyDataBytes := extractProtoLengthDelimitedField(buf, 3)
	if len(policyDataBytes) == 0 {
		return "", ""
	}
	// PolicyData field 3 is `string request_token`, field 7 is `string username`
	reqTokBytes := extractProtoLengthDelimitedField(policyDataBytes, 3)
	userBytes := extractProtoLengthDelimitedField(policyDataBytes, 7)
	return strings.TrimSpace(string(reqTokBytes)), strings.TrimSpace(string(userBytes))
}

func extractProtoLengthDelimitedField(buf []byte, targetFieldNum uint64) []byte {
	i := 0
	n := len(buf)
	for i < n {
		tag, nextI, ok := readProtoVarint(buf, i)
		if !ok {
			return nil
		}
		i = nextI
		fieldNum := tag >> 3
		wireType := tag & 0x7

		switch wireType {
		case 0: // varint
			_, nextI, ok = readProtoVarint(buf, i)
			if !ok {
				return nil
			}
			i = nextI
		case 1: // fixed64
			if i+8 > n {
				return nil
			}
			i += 8
		case 2: // length-delimited
			length, nextLenI, ok := readProtoVarint(buf, i)
			if !ok || int(length) < 0 || nextLenI+int(length) > n {
				return nil
			}
			val := buf[nextLenI : nextLenI+int(length)]
			i = nextLenI + int(length)
			if fieldNum == targetFieldNum {
				return val
			}
		case 5: // fixed32
			if i+4 > n {
				return nil
			}
			i += 4
		default:
			return nil
		}
	}
	return nil
}

func readProtoVarint(buf []byte, i int) (uint64, int, bool) {
	var result uint64
	var shift uint
	for {
		if i >= len(buf) || shift >= 64 {
			return 0, i, false
		}
		b := buf[i]
		i++
		result |= uint64(b&0x7F) << shift
		if b&0x80 == 0 {
			return result, i, true
		}
		shift += 7
	}
}
