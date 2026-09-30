package proxy

import (
	"crypto/sha256"
	"encoding/hex"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"cep-local-dlp-agent/pkg/webprotect"
)

const (
	// DefaultMinPayloadBytes matches Chrome's OnBulkDataEntry default threshold (100 bytes),
	// filtering out tiny ACKs, heartbeats, and telemetry pings before calling WebProtect.
	DefaultMinPayloadBytes = 100

	// DefaultDeviceQPS caps per-device DLP scan requests to prevent rate limiting.
	DefaultDeviceQPS = 40.0
	// DefaultDeviceBurst allows short bursts of concurrent file/text scans on a single device.
	DefaultDeviceBurst = 80.0

	// dedupeTTL is how long an identical ALLOWED (URL, payload) pair is remembered so that retries,
	// duplicate token-count calls, and reconnect replays don't consume WebProtect quota twice.
	dedupeTTL = 30 * time.Second

	// blockedDedupeTTL is how long an identical BLOCKED (URL, payload) pair is remembered so that
	// rapid client retries of a blocked HTTP POST are rejected deterministically in 0ms.
	blockedDedupeTTL = 60 * time.Second
)

type cachedBlockedVerdict struct {
	verdict *webprotect.ScanVerdict
	expiry  time.Time
}

// SmartFilter implements the 3-tier local pre-filter:
//  1. Host / Process / Browser Bypass (never intercept WebProtect itself, web browsers, or OS update hosts)
//  2. HTTP Method & Payload Size Pre-filter (only inspect POST/PUT/PATCH >= MinPayloadBytes),
//     plus a telemetry/analytics/control-plane deny-list (hosts & paths that never carry user data)
//  3. Auto-Bypass Cache for TLS Certificate Pinning hosts + Token Bucket Rate Limiter for Quota protection
//     + short-lived dedupe caches of already-allowed and already-blocked payloads.
type SmartFilter struct {
	MinPayloadBytes int

	mu             sync.RWMutex
	pinnedHosts    map[string]time.Time
	bypassSuffixes []string

	rateMu     sync.Mutex
	tokens     float64
	maxTokens  float64
	refillRate float64 // tokens per second
	lastRefill time.Time

	dedupeMu      sync.Mutex
	recent        map[string]time.Time
	recentBlocked map[string]cachedBlockedVerdict
}

// chromeInfraSuffixes are Chrome-browser / Google-infrastructure hosts that only ever carry
// browser telemetry, policy, sync, update, or auth traffic. Chrome's own CEP engine already
// governs anything a user types in Chrome, so these are tunnelled untouched (no TLS MITM).
var chromeInfraSuffixes = []string{
	// CEP WebProtect itself (prevent recursion)
	"safebrowsing.google.com",
	".webprotect-us.goog",
	".webprotect-eu.goog",
	"ohttp-relay-safebrowsing-chrome.google.fastly-edge.com",
	// Chrome sync / policy / update / omaha / component updater
	"clients1.google.com",
	"clients2.google.com",
	"clients3.google.com",
	"clients4.google.com",
	"clients5.google.com",
	".clients6.google.com",
	"update.googleapis.com",
	"chromepolicy.googleapis.com",
	"chromereporting-pa.googleapis.com",
	"chromeenterprise.googleapis.com",
	"optimizationguide-pa.googleapis.com",
	"chromesyncpasswords-pa.googleapis.com",
	"passwordsleakcheck-pa.googleapis.com",
	"chromewebstore.google.com",
	"chrome.google.com",
	"m.google.com",
	"dl.google.com",
	"tools.google.com",
	"redirector.gvt1.com",
	".gvt1.com",
	".gvt2.com",
	"edgedl.me.gvt1.com",
	// Google account / OAuth (login flows, token refresh — never user documents)
	"accounts.google.com",
	"accounts.youtube.com",
	"oauthaccountmanager.googleapis.com",
	"oauth2.googleapis.com",
	"www.googleapis.com/oauth2", // matched by host only; kept for documentation
	// OS & system certificate/update endpoints
	"windowsupdate.microsoft.com",
	".windowsupdate.com",
	".update.microsoft.com",
	"swscan.apple.com",
	"mesu.apple.com",
	"gdmf.apple.com",
	"ocsp.apple.com",
	"ocsp.digicert.com",
	"ocsp.pki.goog",
	"crl.pki.goog",
	"o.pki.goog",
	"c.pki.goog",
}

// telemetryHostSuffixes are analytics / crash-reporting / RUM / feature-flag SaaS endpoints.
// They are still MITM'd (so TLS pinning detection works uniformly) but requests to them are never
// forwarded to WebProtect: they carry no user-authored content and would only burn quota.
var telemetryHostSuffixes = []string{
	// Google client-side telemetry (Clearcut, Firebase, Analytics, CSP reports)
	"play.google.com", // /log = Clearcut batched telemetry from Google web/desktop apps
	"csp.withgoogle.com",
	"firebaselogging-pa.googleapis.com",
	"firebaseinstallations.googleapis.com",
	"firebaseremoteconfig.googleapis.com",
	".app-measurement.com",
	".google-analytics.com",
	".analytics.google.com",
	"stats.g.doubleclick.net",
	".crashlytics.com",
	// Datadog / Sentry / NewRelic / Bugsnag / Segment / Amplitude / Mixpanel / PostHog / Statsig / LaunchDarkly
	"datadoghq.com",
	"datadoghq.eu",
	".datadoghq.com",
	".datadoghq.eu",
	"browser-intake-datadoghq.com",
	"browser-intake-datadoghq.eu",
	"logs.browser-intake-datadoghq.com",
	".sentry.io",
	".ingest.sentry.io",
	"bam.nr-data.net",
	".newrelic.com",
	".bugsnag.com",
	"api.segment.io",
	".segment.io",
	".amplitude.com",
	".mixpanel.com",
	".posthog.com",
	".statsig.com",
	"statsig.anthropic.com",
	"a-api.anthropic.com",
	".launchdarkly.com",
	".intercom.io",
	".hotjar.com",
	".appsflyer.com",
	".braze.com",
	".honeycomb.io",
	// Cloudflare NEL / browser reporting
	"a.nel.cloudflare.com",
	"report-uri.com",
	// Microsoft / VS Code telemetry & experimentation
	".events.data.microsoft.com",
	".vortex.data.microsoft.com",
	"dc.services.visualstudio.com",
	"mobile.events.data.microsoft.com",
	"default.exp-tas.com",
	".exp-tas.com",
	// Slack / Discord / GitHub client telemetry
	"slack-telemetry.com",
	".slack-telemetry.com",
	"sentry.discord.com",
	"collector.github.com",
	"api.github.com/_private/browser", // path-style entries are ignored by host match; see paths
}

// telemetryPathPatterns are per-host path prefixes/substrings that are pure telemetry,
// pubsub/MCP status polling, or metadata even though the host itself also serves user-content APIs.
var telemetryPathPatterns = []struct {
	hostSuffix string
	pathPrefix string
}{
	{"discord.com", "/api/v9/science"},
	{"discordapp.com", "/api/v9/science"},
	{"discord.com", "/api/v9/metrics"},
	{"api.anthropic.com", "/api/event_logging"},
	{"api.anthropic.com", "/api/eval"},
	{"api.anthropic.com", "/v1/messages/count_tokens"}, // duplicate of /v1/messages payload
	{"claude.ai", "/api/v2/rum"},
	{"claude.ai", "/api/event_logging"},
	{"claude.ai", "/api/eval"},
	{"claude.ai", "/api/bootstrap"},
	{"claude.ai", "/api/auth"},
	{"claude.ai", "/api/account"},
	{"claude.ai", "/api/settings"},
	{"claude.ai", "/api/telemetry"},
	{"claude.ai", "/api/flags"},
	{"claude.ai", "/api/experiments"},
	{"ab.chatgpt.com", "/v1/initialize"},
	{"ab.chatgpt.com", "/v1/rgstr"},
	{"chatgpt.com", "/ces/"},
	{"chatgpt.com", "/backend-api/lat/"},
	{"chatgpt.com", "/backend-api/ps/"}, // ChatGPT / Codex pubsub & MCP status polling (/backend-api/ps/mcp)
	{"chatgpt.com", "/backend-api/sentinel/"},
	{"chatgpt.com", "/backend-api/accounts/"},
	{"chatgpt.com", "/backend-api/settings/"},
	{"chatgpt.com", "/backend-api/me"},
	{"chatgpt.com", "/backend-api/models"},
	{"chatgpt.com", "/backend-api/aip/"},
	{"chatgpt.com", "/backend-api/gizmos/"},
	{"chatgpt.com", "/backend-api/conversations"},
	{"api.openai.com", "/v1/rgstr"},
	{"cursor.sh", "/telemetry"},
	{"api2.cursor.sh", "/aiserver.v1.AiService/ReportEvent"},
	{"github.com", "/_private/browser/stats"},
	{"github.com", "/_private/browser/errors"},
	{"api.github.com", "/graphql"}, // desktop clients poll notifications/PR status via GraphQL
	{"slack.com", "/api/client.counts"},
	{"slack.com", "/api/rtm.connect"},
	{"slack.com", "/api/experiments."},
	{"slack.com", "/api/client.boot"},
	{"slack.com", "/api/api.telemetry"},
	{"", "/cdn-cgi/"}, // Cloudflare RUM, Turnstile, challenge-platform fingerprints on window focus
	{"", "/jserror"},
	{"", "/punctual/"}, // Google punctual (real-time signaller) channels
	{"", "/_/scs/"},
	{"", "/gen_204"},
	{"", "/log?"},
}

// NewSmartFilter creates a SmartFilter configured to protect WebProtect quotas and avoid TLS pinning breakage.
func NewSmartFilter(minBytes int, qps float64) *SmartFilter {
	if minBytes <= 0 {
		minBytes = DefaultMinPayloadBytes
	}
	if qps <= 0 {
		qps = DefaultDeviceQPS
	}
	suffixes := make([]string, 0, len(chromeInfraSuffixes))
	for _, s := range chromeInfraSuffixes {
		if strings.Contains(s, "/") {
			continue
		}
		suffixes = append(suffixes, s)
	}
	return &SmartFilter{
		MinPayloadBytes: minBytes,
		pinnedHosts:     make(map[string]time.Time),
		bypassSuffixes:  suffixes,
		tokens:          DefaultDeviceBurst,
		maxTokens:       DefaultDeviceBurst,
		refillRate:      qps,
		lastRefill:      time.Now(),
		recent:          make(map[string]time.Time),
		recentBlocked:   make(map[string]cachedBlockedVerdict),
	}
}

// ShouldBypassTLS returns true if the target host is on the static bypass list or has been
// dynamically learned as a Certificate Pinning host.
func (f *SmartFilter) ShouldBypassTLS(hostPort string) bool {
	host := normalizeHost(hostPort)
	if host == "" {
		return true
	}

	if hostMatchesSuffix(host, f.bypassSuffixes) {
		return true
	}

	f.mu.RLock()
	expiry, pinned := f.pinnedHosts[host]
	f.mu.RUnlock()
	if pinned {
		if time.Now().Before(expiry) {
			return true
		}
		f.mu.Lock()
		delete(f.pinnedHosts, host)
		f.mu.Unlock()
	}
	return false
}

// RecordTLSPinningFailure marks a host as using TLS Certificate Pinning so future connections
// automatically tunnel via TCP passthrough without breaking the client application.
func (f *SmartFilter) RecordTLSPinningFailure(hostPort string) {
	host := normalizeHost(hostPort)
	if host == "" {
		return
	}
	f.mu.Lock()
	f.pinnedHosts[host] = time.Now().Add(6 * time.Hour)
	f.mu.Unlock()
}

// IsPinnedHost checks whether a host is currently in the auto-bypass pinning cache.
func (f *SmartFilter) IsPinnedHost(hostPort string) bool {
	host := normalizeHost(hostPort)
	f.mu.RLock()
	defer f.mu.RUnlock()
	exp, ok := f.pinnedHosts[host]
	return ok && time.Now().Before(exp)
}

// IsBrowserRequest returns true if the HTTP request (either outer CONNECT or inner HTTPS request)
// originates from a standalone web browser (Google Chrome, Microsoft Edge, Brave, Firefox, Safari).
func IsBrowserRequest(r *http.Request) bool {
	if r == nil {
		return false
	}
	if r.Header.Get("X-CEP-Browser-Native") == "1" {
		return true
	}

	secUA := strings.ToLower(r.Header.Get("Sec-Ch-Ua"))
	if strings.Contains(secUA, `"google chrome"`) ||
		strings.Contains(secUA, `"microsoft edge"`) ||
		strings.Contains(secUA, `"brave"`) ||
		strings.Contains(secUA, `"opera"`) ||
		strings.Contains(secUA, `"vivaldi"`) {
		return true
	}

	ua := strings.ToLower(r.Header.Get("User-Agent"))
	if ua == "" {
		return false
	}
	// Native desktop apps (Electron / IDE / CLI) must NOT be treated as standalone web browsers.
	for _, nativeMarker := range []string{
		"electron/",
		"cursor/",
		"claude",
		"slack",
		"vscode",
		"code/",
		"windsurf",
		"cep-local-dlp-agent",
	} {
		if strings.Contains(ua, nativeMarker) {
			return false
		}
	}
	if strings.HasPrefix(ua, "mozilla/5.0") &&
		(strings.Contains(ua, "chrome/") || strings.Contains(ua, "firefox/") || strings.Contains(ua, "edg/") || strings.Contains(ua, "safari/")) {
		return true
	}
	return false
}

// ShouldInspectRequest evaluates whether an HTTP request carries outbound user/application data
// that warrants a CEP WebProtect DLP scan.
func (f *SmartFilter) ShouldInspectRequest(r *http.Request, body []byte) bool {
	// 1. Only inspect data-mutating / outbound upload methods
	switch r.Method {
	case http.MethodPost, http.MethodPut, http.MethodPatch:
	default:
		return false
	}

	// 2. Never inspect requests originating from standalone web browsers (Managed Chrome has
	// native CEP; Personal Chrome / personal browsers are personal space on BYOD).
	if IsBrowserRequest(r) {
		return false
	}

	// 3. Enforce minimum payload size threshold to drop heartbeats/telemetry
	if len(body) < f.MinPayloadBytes {
		return false
	}

	// 4. Skip analytics / crash-report / RUM / feature-flag / background status polling traffic
	host := ""
	path := ""
	if r.URL != nil {
		host = normalizeHost(r.URL.Host)
		path = r.URL.Path
		if r.URL.RawQuery != "" {
			path += "?" + r.URL.RawQuery
		}
	}
	if host == "" {
		host = normalizeHost(r.Host)
	}
	if IsTelemetryRequest(host, path) {
		return false
	}

	// 5. Skip binary RPC/protobuf framing that CEP text detectors cannot parse anyway
	ct := strings.ToLower(r.Header.Get("Content-Type"))
	if strings.Contains(ct, "protobuf") || strings.Contains(ct, "grpc") || strings.Contains(ct, "x-gwt-rpc") {
		return false
	}

	return true
}

// IsTelemetryRequest reports whether host/path is a known telemetry, analytics, crash-report,
// or metadata endpoint that should never be sent to WebProtect.
func IsTelemetryRequest(host, path string) bool {
	host = normalizeHost(host)
	if hostMatchesSuffix(host, telemetryHostSuffixes) {
		return true
	}
	for _, p := range telemetryPathPatterns {
		if p.hostSuffix != "" && !hostMatchesSuffix(host, []string{p.hostSuffix}) {
			continue
		}
		if p.pathPrefix != "" && strings.HasPrefix(path, p.pathPrefix) {
			return true
		}
	}
	return false
}

// AllowQuota consumes 1 token from the local Token Bucket rate limiter.
// Returns false if the device is exceeding the safe QPS threshold.
func (f *SmartFilter) AllowQuota() bool {
	f.rateMu.Lock()
	defer f.rateMu.Unlock()

	now := time.Now()
	elapsed := now.Sub(f.lastRefill).Seconds()
	if elapsed > 0 {
		f.tokens += elapsed * f.refillRate
		if f.tokens > f.maxTokens {
			f.tokens = f.maxTokens
		}
		f.lastRefill = now
	}

	if f.tokens < 1.0 {
		return false
	}
	f.tokens -= 1.0
	return true
}

func dedupeKey(targetURL string, payload []byte) string {
	h := sha256.New()
	h.Write([]byte(stripQuery(targetURL)))
	h.Write([]byte{0})
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

// WasRecentlyAllowed reports whether the identical (URL, payload) pair was already scanned
// and ALLOWED within dedupeTTL.
func (f *SmartFilter) WasRecentlyAllowed(targetURL string, payload []byte) bool {
	key := dedupeKey(targetURL, payload)
	now := time.Now()
	f.dedupeMu.Lock()
	defer f.dedupeMu.Unlock()
	exp, ok := f.recent[key]
	return ok && now.Before(exp)
}

// RecordAllowedScan records that (targetURL, payload) was evaluated by WebProtect and ALLOWED
// without warnings, so identical retries within dedupeTTL can skip redundant scans.
func (f *SmartFilter) RecordAllowedScan(targetURL string, payload []byte) {
	key := dedupeKey(targetURL, payload)
	now := time.Now()
	f.dedupeMu.Lock()
	defer f.dedupeMu.Unlock()
	if len(f.recent) > 2048 {
		for k, exp := range f.recent {
			if now.After(exp) {
				delete(f.recent, k)
			}
		}
		if len(f.recent) > 2048 {
			f.recent = make(map[string]time.Time)
		}
	}
	f.recent[key] = now.Add(dedupeTTL)
}

// WasRecentlyBlocked reports whether the identical (URL, payload) pair was already scanned
// and BLOCKED within blockedDedupeTTL, returning the cached ScanVerdict so rapid retries
// are blocked deterministically even if a retry hits a rate limit or transient network blip.
func (f *SmartFilter) WasRecentlyBlocked(targetURL string, payload []byte) (*webprotect.ScanVerdict, bool) {
	key := dedupeKey(targetURL, payload)
	now := time.Now()
	f.dedupeMu.Lock()
	defer f.dedupeMu.Unlock()
	entry, ok := f.recentBlocked[key]
	if ok && now.Before(entry.expiry) && entry.verdict != nil {
		return entry.verdict, true
	}
	return nil, false
}

// RecordBlockedScan caches a BLOCK verdict for (targetURL, payload) for blockedDedupeTTL.
func (f *SmartFilter) RecordBlockedScan(targetURL string, payload []byte, verdict *webprotect.ScanVerdict) {
	if verdict == nil {
		return
	}
	key := dedupeKey(targetURL, payload)
	now := time.Now()
	f.dedupeMu.Lock()
	defer f.dedupeMu.Unlock()
	if len(f.recentBlocked) > 1024 {
		for k, entry := range f.recentBlocked {
			if now.After(entry.expiry) {
				delete(f.recentBlocked, k)
			}
		}
		if len(f.recentBlocked) > 1024 {
			f.recentBlocked = make(map[string]cachedBlockedVerdict)
		}
	}
	f.recentBlocked[key] = cachedBlockedVerdict{
		verdict: verdict,
		expiry:  now.Add(blockedDedupeTTL),
	}
}

// MarkRecentlyScanned checks WasRecentlyAllowed and, if not present, records the payload.
func (f *SmartFilter) MarkRecentlyScanned(targetURL string, payload []byte) bool {
	if f.WasRecentlyAllowed(targetURL, payload) {
		return true
	}
	f.RecordAllowedScan(targetURL, payload)
	return false
}

// RedactURL removes query-string values (OAuth SAPISIDHASH, API keys, session IDs) before a URL
// is written to the local agent log. Path is preserved so operators can still see the endpoint.
func RedactURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		if i := strings.IndexByte(raw, '?'); i >= 0 {
			return raw[:i] + "?<redacted>"
		}
		return raw
	}
	if u.RawQuery == "" && u.Fragment == "" {
		return raw
	}
	q := u.Query()
	keys := make([]string, 0, len(q))
	for k := range q {
		keys = append(keys, k)
	}
	u.RawQuery = ""
	u.Fragment = ""
	if len(keys) == 0 {
		return u.String()
	}
	return u.String() + "?<" + strings.Join(sortStrings(keys), ",") + "=redacted>"
}

func stripQuery(raw string) string {
	if i := strings.IndexByte(raw, '?'); i >= 0 {
		return raw[:i]
	}
	return raw
}

func sortStrings(s []string) []string {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1] > s[j]; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
	return s
}

func hostMatchesSuffix(host string, suffixes []string) bool {
	for _, suffix := range suffixes {
		if suffix == "" || strings.Contains(suffix, "/") {
			continue
		}
		if strings.HasPrefix(suffix, ".") {
			if strings.HasSuffix(host, suffix) || host == strings.TrimPrefix(suffix, ".") {
				return true
			}
			continue
		}
		if host == suffix || strings.HasSuffix(host, "."+suffix) {
			return true
		}
	}
	return false
}

func normalizeHost(hostPort string) string {
	host := strings.ToLower(strings.TrimSpace(hostPort))
	if h, _, err := net.SplitHostPort(host); err == nil && h != "" {
		return h
	}
	return host
}
