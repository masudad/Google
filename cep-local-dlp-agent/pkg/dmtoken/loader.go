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
	"sort"
	"strings"
	"sync"
	"time"
)

// TokenInfo holds the discovered DM Token(s) and host metadata used in ContentAnalysisRequest.
type TokenInfo struct {
	mu              sync.RWMutex
	lastConfigCheck time.Time
	lastConfigMtime time.Time
	lastBYODMtime   time.Time

	DMToken        string `json:"dm_token"`
	TokenSource    string `json:"token_source"`
	ProfileDMToken string `json:"profile_dm_token,omitempty"`
	UserEmail      string `json:"user_email,omitempty"`
	ClientID       string `json:"client_id,omitempty"`
	DeviceName     string `json:"device_name"`
	OSPlatform     string `json:"os_platform"`
	OSVersion      string `json:"os_version"`
	MachineUser    string `json:"machine_user"`

	// AvailableProfiles lists every managed Chrome profile found on disk (token redacted),
	// with Selected=true on the one whose Profile DM Token is in use.
	AvailableProfiles []ProfileCandidate `json:"available_profiles,omitempty"`
}

// Credentials returns a thread-safe snapshot of the active DM token, profile DM token,
// user email, and client ID.
func (t *TokenInfo) Credentials() (dmToken, profileDMToken, userEmail, clientID string) {
	if t == nil {
		return "", "", "", ""
	}
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.DMToken, t.ProfileDMToken, t.UserEmail, t.ClientID
}

// Snapshot returns a thread-safe copy of the current token status fields for /healthz.
func (t *TokenInfo) Snapshot() (dmToken, tokenSource, userEmail string) {
	if t == nil {
		return "", "", ""
	}
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.DMToken, t.TokenSource, t.UserEmail
}

// UpdateFromBootstrap updates the active credentials in-memory (thread-safe) when pushed
// via POST /__cep_agent/v1/bootstrap-token.
func (t *TokenInfo) UpdateFromBootstrap(dmToken, profileDMToken, userEmail string) {
	if t == nil {
		return
	}
	t.mu.Lock()
	defer t.mu.Unlock()

	if strings.TrimSpace(dmToken) != "" {
		t.DMToken = strings.TrimSpace(dmToken)
		t.TokenSource = "companion_extension"
	}
	if strings.TrimSpace(profileDMToken) != "" {
		t.ProfileDMToken = strings.TrimSpace(profileDMToken)
	}
	if strings.TrimSpace(userEmail) != "" {
		t.UserEmail = strings.TrimSpace(userEmail)
		_ = SavePreferredProfileEmail(t.UserEmail)
		if strings.TrimSpace(dmToken) == "" {
			if cand, ok := FindProfileTokenByEmail(t.UserEmail); ok {
				t.DMToken = cand.DMToken
				t.ProfileDMToken = cand.DMToken
				if cand.ClientID != "" {
					t.ClientID = cand.ClientID
				}
				t.TokenSource = "chrome_profile:" + filepath.Base(cand.ProfileDir)
			}
		}
	}
	_ = SaveBYODBootstrapToken(t.DMToken, t.UserEmail)
	t.recordConfigMtimesLocked()
}

// RefreshIfNeeded checks (at most once every 2 seconds) whether ~/.cep-local-dlp-agent/config.json
// or byod_token.json was updated on disk (for example via `cep-dlp-agent token --profile-email ...`),
// or whether the daemon is still awaiting its initial DM Token, and hot-reloads the active Chrome
// profile DM Token without requiring a daemon restart.
func (t *TokenInfo) RefreshIfNeeded() {
	if t == nil {
		return
	}
	now := time.Now()
	t.mu.RLock()
	if !t.lastConfigCheck.IsZero() && now.Sub(t.lastConfigCheck) < 2*time.Second {
		t.mu.RUnlock()
		return
	}
	prevCfgMtime := t.lastConfigMtime
	prevBYODMtime := t.lastBYODMtime
	missingToken := strings.TrimSpace(t.DMToken) == ""
	t.mu.RUnlock()

	cfgMtime, byodMtime := currentConfigMtimes()
	if !missingToken && cfgMtime.Equal(prevCfgMtime) && byodMtime.Equal(prevBYODMtime) {
		t.mu.Lock()
		t.lastConfigCheck = now
		t.mu.Unlock()
		return
	}

	fresh, err := Discover("")
	t.mu.Lock()
	defer t.mu.Unlock()
	t.lastConfigCheck = now
	t.lastConfigMtime = cfgMtime
	t.lastBYODMtime = byodMtime
	if err == nil && fresh != nil && fresh.DMToken != "" {
		t.DMToken = fresh.DMToken
		t.TokenSource = fresh.TokenSource
		t.ProfileDMToken = fresh.ProfileDMToken
		t.UserEmail = fresh.UserEmail
		if fresh.ClientID != "" {
			t.ClientID = fresh.ClientID
		}
		t.AvailableProfiles = fresh.AvailableProfiles
	}
}

func (t *TokenInfo) recordConfigMtimesLocked() {
	t.lastConfigCheck = time.Now()
	t.lastConfigMtime, t.lastBYODMtime = currentConfigMtimes()
}

func currentConfigMtimes() (cfgMtime, byodMtime time.Time) {
	home, err := os.UserHomeDir()
	if err != nil {
		return time.Time{}, time.Time{}
	}
	dir := filepath.Join(home, ".cep-local-dlp-agent")
	if st, err := os.Stat(filepath.Join(dir, "config.json")); err == nil {
		cfgMtime = st.ModTime()
	}
	if st, err := os.Stat(filepath.Join(dir, "byod_token.json")); err == nil {
		byodMtime = st.ModTime()
	}
	return cfgMtime, byodMtime
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
		ClientID:    hostname,
		OSPlatform:  platformDisplayName(runtime.GOOS),
		OSVersion:   runtime.GOARCH,
		MachineUser: username,
	}
	info.recordConfigMtimesLocked()

	// Discover signed-in user email, profile DM token, and profile client_id from Chrome Policy cache if available.
	var profileClientID string
	info.UserEmail, info.ProfileDMToken, profileClientID, info.AvailableProfiles = discoverChromeProfileMetadata()
	if profileClientID != "" {
		info.ClientID = profileClientID
	}

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

	// If the user/extension pinned a specific Chrome profile account (exact email or "@domain") and
	// it resolved, that profile token ALWAYS wins over machine-level CBCM registry tokens so a
	// multi-tenant BYOD machine never reports to the wrong tenant.
	if pref := preferredProfileEmail(); pref != "" && info.ProfileDMToken != "" &&
		matchesPreferredEmail(info.UserEmail, pref) {
		info.DMToken = info.ProfileDMToken
		info.TokenSource = "chrome_profile:pinned"
		for _, c := range info.AvailableProfiles {
			if c.Selected {
				info.TokenSource = "chrome_profile:pinned:" + filepath.Base(c.ProfileDir)
			}
		}
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

func matchesPreferredEmail(email, preferred string) bool {
	em := strings.ToLower(strings.TrimSpace(email))
	pref := strings.ToLower(strings.TrimSpace(preferred))
	if em == "" || pref == "" {
		return false
	}
	return em == pref || (strings.HasPrefix(pref, "@") && strings.HasSuffix(em, pref))
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
	if string(trimmed) == "INVALID" || len(trimmed) < 8 {
		return ""
	}
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
	ClientID    string    `json:"client_id,omitempty"`
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

// readChromeActiveProfiles returns the profile directory names Chrome recorded as most
// recently active (`profile.last_used` and `profile.last_active_profiles` in `<User Data>/Local State`).
func readChromeActiveProfiles(userDataDir string) map[string]bool {
	active := make(map[string]bool)
	b, err := os.ReadFile(filepath.Join(userDataDir, "Local State"))
	if err != nil {
		return active
	}
	var state struct {
		Profile struct {
			LastUsed           string   `json:"last_used"`
			LastActiveProfiles []string `json:"last_active_profiles"`
		} `json:"profile"`
	}
	if json.Unmarshal(b, &state) != nil {
		return active
	}
	if state.Profile.LastUsed != "" {
		active[state.Profile.LastUsed] = true
	}
	for _, p := range state.Profile.LastActiveProfiles {
		if p != "" {
			active[p] = true
		}
	}
	return active
}

// ListChromeProfileCandidates scans every Chrome profile (Default, Profile 1, ...) and returns
// all managed profiles that carry a cached Profile DM Token, sorted deterministically.
func ListChromeProfileCandidates() []ProfileCandidate {
	policyCacheFilenames := []string{"User Policy", "Profile Cloud Policy"}
	var out []ProfileCandidate

	for _, base := range chromeUserDataDirs() {
		entries, err := os.ReadDir(base)
		if err != nil {
			continue
		}
		activeSet := readChromeActiveProfiles(base)

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
				tok, user, clientID := ExtractMetadataFromPolicyFetchResponse(raw)
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
					ClientID:    clientID,
					DMToken:     tok,
					CacheFile:   cacheName,
					LastUpdated: mtime,
					IsLastUsed:  activeSet[name],
				})
				break
			}
		}
	}

	sort.Slice(out, func(i, j int) bool {
		if !out[i].LastUpdated.Equal(out[j].LastUpdated) {
			return out[i].LastUpdated.After(out[j].LastUpdated)
		}
		return out[i].ProfileDir < out[j].ProfileDir
	})
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

// SavePreferredProfileEmail pins the Chrome profile (by signed-in email or "@domain") whose Profile DM Token
// the agent must use, so multi-tenant BYOD machines select a deterministic profile.
// Also removes any stale byod_token.json belonging to a different account/tenant.
func SavePreferredProfileEmail(email string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(home, ".cep-local-dlp-agent")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	trimmed := strings.TrimSpace(email)
	if _, byodEmail, byodPath := discoverBYODBootstrapToken(); byodPath != "" && !matchesPreferredEmail(byodEmail, trimmed) {
		_ = os.Remove(byodPath)
	}
	payload, _ := json.MarshalIndent(map[string]string{"preferred_email": trimmed}, "", "  ")
	return os.WriteFile(filepath.Join(dir, "config.json"), payload, 0600)
}

// SelectProfileCandidate picks one managed profile deterministically:
//  1. exact match on preferredEmail (or its @domain when preferredEmail starts with "@")
//  2. the profile Chrome recorded as last used (`Local State` -> profile.last_used / last_active_profiles),
//     breaking ties by most recent policy cache timestamp
//  3. the profile whose policy cache was refreshed most recently
func SelectProfileCandidate(cands []ProfileCandidate, preferredEmail string) (ProfileCandidate, bool) {
	if len(cands) == 0 {
		return ProfileCandidate{}, false
	}
	pref := strings.ToLower(strings.TrimSpace(preferredEmail))
	if pref != "" {
		for _, c := range cands {
			if matchesPreferredEmail(c.UserEmail, pref) {
				return c, true
			}
		}
	}
	var bestLastUsed *ProfileCandidate
	for i := range cands {
		if cands[i].IsLastUsed {
			if bestLastUsed == nil || cands[i].LastUpdated.After(bestLastUsed.LastUpdated) {
				bestLastUsed = &cands[i]
			}
		}
	}
	if bestLastUsed != nil {
		return *bestLastUsed, true
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
	for _, c := range cands {
		if matchesPreferredEmail(c.UserEmail, email) {
			return c, true
		}
	}
	return ProfileCandidate{}, false
}

func discoverChromeProfileMetadata() (email string, profileToken string, clientID string, candidates []ProfileCandidate) {
	candidates = ListChromeProfileCandidates()
	sel, ok := SelectProfileCandidate(candidates, preferredProfileEmail())
	if !ok {
		return "", "", "", candidates
	}
	for i := range candidates {
		candidates[i].Selected = candidates[i].ProfileDir == sel.ProfileDir
	}
	return sel.UserEmail, sel.DMToken, sel.ClientID, candidates
}

// ExtractDMTokenFromPolicyFetchResponse parses a raw serialized Chromium
// enterprise_management.PolicyFetchResponse protobuf and extracts the Managed Profile DM Token
// and signed-in Workspace user email.
func ExtractDMTokenFromPolicyFetchResponse(buf []byte) (requestToken string, username string) {
	tok, user, _ := ExtractMetadataFromPolicyFetchResponse(buf)
	return tok, user
}

// ExtractMetadataFromPolicyFetchResponse parses a raw serialized Chromium
// enterprise_management.PolicyFetchResponse protobuf (stored in `<Profile>/Policy/User Policy`
// or `Profile Cloud Policy`) and extracts:
//   - PolicyData.request_token (field 3) -> the Managed Profile DM Token
//   - PolicyData.username      (field 7) -> the signed-in Workspace user email
//   - PolicyData.device_id     (field 8) -> the profile/device client_id registered with DMServer
func ExtractMetadataFromPolicyFetchResponse(buf []byte) (requestToken string, username string, deviceID string) {
	policyDataBytes := extractProtoLengthDelimitedField(buf, 3)
	if len(policyDataBytes) == 0 {
		return "", "", ""
	}
	reqTokBytes := extractProtoLengthDelimitedField(policyDataBytes, 3)
	userBytes := extractProtoLengthDelimitedField(policyDataBytes, 7)
	devIDBytes := extractProtoLengthDelimitedField(policyDataBytes, 8)
	return strings.TrimSpace(string(reqTokBytes)), strings.TrimSpace(string(userBytes)), strings.TrimSpace(string(devIDBytes))
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
