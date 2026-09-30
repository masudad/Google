package proxy

import (
	"net"
	"net/http"
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
)

// SmartFilter implements the 3-tier local pre-filter:
//  1. Host / Process Bypass (never intercept WebProtect itself, Chrome native traffic, or OS update hosts)
//  2. HTTP Method & Payload Size Pre-filter (only inspect POST/PUT/PATCH >= MinPayloadBytes)
//  3. Auto-Bypass Cache for TLS Certificate Pinning hosts + Token Bucket Rate Limiter for Quota protection.
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
}

// NewSmartFilter creates a SmartFilter configured to protect WebProtect quotas and avoid TLS pinning breakage.
func NewSmartFilter(minBytes int, qps float64) *SmartFilter {
	if minBytes <= 0 {
		minBytes = DefaultMinPayloadBytes
	}
	if qps <= 0 {
		qps = DefaultDeviceQPS
	}
	return &SmartFilter{
		MinPayloadBytes: minBytes,
		pinnedHosts:     make(map[string]time.Time),
		bypassSuffixes: []string{
			// Never intercept CEP WebProtect itself (prevent recursion)
			"safebrowsing.google.com",
			".webprotect-us.goog",
			".webprotect-eu.goog",
			// OS & system certificate/update endpoints
			"windowsupdate.microsoft.com",
			".windowsupdate.com",
			"swscan.apple.com",
			"mesu.apple.com",
			"gdmf.apple.com",
			"ocsp.apple.com",
			"ocsp.digicert.com",
			"ocsp.pki.goog",
			"crl.pki.goog",
		},
		tokens:     DefaultDeviceBurst,
		maxTokens:  DefaultDeviceBurst,
		refillRate: qps,
		lastRefill: time.Now(),
	}
}

// ShouldBypassTLS returns true if the target host is on the static bypass list or has been
// dynamically learned as a Certificate Pinning host.
func (f *SmartFilter) ShouldBypassTLS(hostPort string) bool {
	host := normalizeHost(hostPort)
	if host == "" {
		return true
	}

	for _, suffix := range f.bypassSuffixes {
		if strings.HasSuffix(host, suffix) || host == strings.TrimPrefix(suffix, ".") {
			return true
		}
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

	return true
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

func normalizeHost(hostPort string) string {
	host := strings.ToLower(strings.TrimSpace(hostPort))
	if h, _, err := net.SplitHostPort(host); err == nil && h != "" {
		return h
	}
	return host
}
