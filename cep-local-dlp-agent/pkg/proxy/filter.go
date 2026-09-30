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
	// BLOCK and WARN verdicts are never stored here so retried sensitive requests are always blocked.
	dedupeTTL = 30 * time.Second
)

// SmartFilter implements the 3-tier local pre-filter:
//  1. Host / Process Bypass (never intercept WebProtect itself, Chrome native traffic, or OS update hosts)
//  2. HTTP Method & Payload Size Pre-filter (only inspect POST/PUT/PATCH >= MinPayloadBytes),
//     plus a telemetry/analytics deny-list (hosts & paths that never carry user data)
//  3. Auto-Bypass Cache for TLS Certificate Pinning hosts + Token Bucket Rate Limiter for Quota protection
//     + short-lived dedupe cache of already-allowed payloads.
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

	dedupeMu sync.Mutex
	recent   map[string]time.Time
}

// chromeInfraSuffixes are Chrome-browser / Google-infrastructure hosts that only ever carry
// browser telemetry, policy, sync, update, or auth traffic. Chrome's own CEP engine already
// governs anything a user types in Chrome, so these are tunnelled untouched (no TLS MITM).
// This is defence-in-depth for the case where process attribution (chrome.exe) fails.
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
	".launchdarkly.com",
	".intercom.io",
	".hotjar.com",
	".appsflyer.com",
	".braze.com",
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

// telemetryPathPatterns are per-host path prefixes/substrings that are pure telemetry or
// metadata even though the host itself also serves real user-content APIs.
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
	{"ab.chatgpt.com", "/v1/initialize"},
	{"ab.chatgpt.com", "/v1/rgstr"},
	{"chatgpt.com", "/ces/"},
	{"chatgpt.com", "/backend-api/lat/r"},
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

// ShouldInspectRequest evaluates whether an HTTP request carries outbound user/application data
// that warrants a CEP WebProtect DLP scan.
func (f *SmartFilter) ShouldInspectRequest(r *http.Request, body []byte) bool {
	// 1. Only inspect data-mutating / outbound upload methods
	switch r.Method {
	case http.MethodPost, http.MethodPut, http.MethodPatch:
	default:
		return false
	}

	// 2. Skip requests originating from Chrome browser itself (already protected by native CEP)
	if r.Header.Get("X-CEP-Browser-Native") == "1" {
		return false
	}

	// 3. Enforce minimum payload size threshold to drop heartbeats/telemetry
	if len(body) < f.MinPayloadBytes {
		return false
	}

	// 4. Skip analytics / crash-report / RUM / feature-flag traffic (never user-authored content)
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
// and ALLOWED within dedupeTTL. Blocked or warned payloads are never recorded in this cache,
// ensuring retried sensitive requests are always re-evaluated and blocked.
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

// MarkRecentlyScanned checks WasRecentlyAllowed and, if not present, records the payload.
// Prefer WasRecentlyAllowed + RecordAllowedScan in request inspection paths so blocked payloads
// are never cached as allowed.
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
