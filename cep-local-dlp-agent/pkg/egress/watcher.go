package egress

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/webprotect"
)

type fileState struct {
	modTime time.Time
	size    int64
}

// Guard monitors SMB network shares, removable USB drives, Cloud Sync directories,
// and CLI file transfer tools, enforcing CEP WebProtect DLP rules across non-HTTP channels.
type Guard struct {
	WebProtect    *webprotect.Client
	TokenInfo     *dmtoken.TokenInfo
	Notifier      notifier.Notifier
	ExtraDirs     []string
	PollInterval  time.Duration
	MaxWalkDepth  int
	QuarantineDir string

	mu              sync.Mutex
	knownTargets    map[string]EgressTarget
	baselineFiles   map[string]fileState
	allowedHashes   map[string]time.Time
	blockedHashes   map[string]*webprotect.ScanVerdict
}

// NewGuard creates a new Layer-3 Storage & Multi-Protocol Egress Guard.
func NewGuard(wp *webprotect.Client, token *dmtoken.TokenInfo, notif notifier.Notifier, extraDirs []string) *Guard {
	home, _ := os.UserHomeDir()
	qDir := filepath.Join(home, ".cep-local-dlp-agent", "quarantine")
	return &Guard{
		WebProtect:    wp,
		TokenInfo:     token,
		Notifier:      notif,
		ExtraDirs:     extraDirs,
		PollInterval:  1500 * time.Millisecond,
		MaxWalkDepth:  3,
		QuarantineDir: qDir,
		knownTargets:  make(map[string]EgressTarget),
		baselineFiles: make(map[string]fileState),
		allowedHashes: make(map[string]time.Time),
		blockedHashes: make(map[string]*webprotect.ScanVerdict),
	}
}

// AddTarget registers an explicit EgressTarget and seeds its initial file baseline.
func (g *Guard) AddTarget(target EgressTarget) {
	clean := filepath.Clean(target.Path)
	target.Path = clean
	g.mu.Lock()
	_, exists := g.knownTargets[clean]
	g.knownTargets[clean] = target
	g.mu.Unlock()

	if !exists {
		g.seedBaseline(target)
		log.Printf("[egress] Watching %s (%s -> %s)", target.Label, target.Path, target.TargetURL)
	}
}

func (g *Guard) seedBaseline(target EgressTarget) {
	files := g.walkTargetFiles(target.Path)
	g.mu.Lock()
	defer g.mu.Unlock()
	for path, st := range files {
		g.baselineFiles[path] = st
	}
}

// ScanOnce discovers any newly mounted SMB/USB/CloudSync targets and inspects newly created or modified files.
func (g *Guard) ScanOnce(ctx context.Context) int {
	discovered := DiscoverTargets(g.ExtraDirs)
	for _, t := range discovered {
		g.AddTarget(t)
	}

	g.mu.Lock()
	targets := make([]EgressTarget, 0, len(g.knownTargets))
	for _, t := range g.knownTargets {
		targets = append(targets, t)
	}
	g.mu.Unlock()

	blockedCount := 0
	for _, target := range targets {
		files := g.walkTargetFiles(target.Path)
		for path, st := range files {
			g.mu.Lock()
			prev, seen := g.baselineFiles[path]
			if seen && prev.size == st.size && prev.modTime.Equal(st.modTime) {
				g.mu.Unlock()
				continue
			}
			g.baselineFiles[path] = st
			g.mu.Unlock()

			allowed, _, err := g.InspectFileTransfer(ctx, target, path)
			if err == nil && !allowed {
				blockedCount++
			}
		}
	}
	return blockedCount
}

// InspectFileTransfer evaluates a single file written to an SMB share, USB volume, or Cloud Sync folder.
// If CEP WebProtect returns BLOCK, the file is immediately removed from the destination share/volume
// (backed up locally in QuarantineDir) and the native OS block dialog is displayed.
func (g *Guard) InspectFileTransfer(ctx context.Context, target EgressTarget, filePath string) (bool, *webprotect.ScanVerdict, error) {
	data, err := os.ReadFile(filePath)
	if err != nil || len(data) == 0 || int64(len(data)) > webprotect.MaxPayloadBytes {
		return true, nil, err
	}

	sum := sha256.Sum256(data)
	hashKey := hex.EncodeToString(sum[:]) + "\x00" + target.TargetURL

	g.mu.Lock()
	if verdict, blocked := g.blockedHashes[hashKey]; blocked {
		g.mu.Unlock()
		g.quarantineAndRemove(filePath, data)
		destLabel := fmt.Sprintf("%s (%s)", target.Label, filepath.Base(filePath))
		log.Printf("[egress] BLOCKED cached file transfer to %s: %s (rule=%q)", target.TargetURL, filePath, verdict.RuleName)
		if g.Notifier != nil {
			g.Notifier.NotifyBlock(destLabel, verdict.RuleName, verdict.CustomMessage)
		}
		return false, verdict, nil
	}
	if exp, ok := g.allowedHashes[hashKey]; ok && time.Now().Before(exp) {
		g.mu.Unlock()
		return true, nil, nil
	}
	g.mu.Unlock()

	if g.TokenInfo != nil {
		g.TokenInfo.RefreshIfNeeded()
	}
	var dmToken, profileDMToken, userEmail, clientID, deviceName, osPlatform, osVersion, machineUser string
	if g.TokenInfo != nil {
		dmToken, profileDMToken, userEmail, clientID = g.TokenInfo.Credentials()
		deviceName = g.TokenInfo.DeviceName
		osPlatform = g.TokenInfo.OSPlatform
		osVersion = g.TokenInfo.OSVersion
		machineUser = g.TokenInfo.MachineUser
	}

	verdict, err := g.WebProtect.Scan(ctx, webprotect.ScanInput{
		DMToken:        dmToken,
		ProfileDMToken: profileDMToken,
		UserEmail:      userEmail,
		ClientID:       clientID,
		URL:            target.TargetURL,
		TabURL:         target.TargetURL,
		Filename:       filepath.Base(filePath),
		Source:         "LOCAL_FILESYSTEM",
		Destination:    fmt.Sprintf("%s (%s)", target.Label, target.Path),
		ContentType:    http.DetectContentType(data),
		Connector:      webprotect.FileAttached,
		Reason:         webprotect.ReasonDragAndDrop,
		Payload:        data,
		DeviceName:     deviceName,
		OSPlatform:     osPlatform,
		OSVersion:      osVersion,
		MachineUser:    machineUser,
	})
	if err != nil {
		log.Printf("[egress] WebProtect scan error for %s (%s): %v (failing open)", filePath, target.TargetURL, err)
		return true, nil, err
	}

	log.Printf("[egress] CEP DLP Verdict for %s [%s] (%d bytes): %s (rule=%q, %dms)",
		target.TargetURL, filepath.Base(filePath), len(data), verdict.ActionName, verdict.RuleName, verdict.LatencyMs)

	destLabel := fmt.Sprintf("%s (%s)", target.Label, filepath.Base(filePath))
	if !verdict.Allowed {
		g.mu.Lock()
		g.blockedHashes[hashKey] = verdict
		g.mu.Unlock()

		qPath := g.quarantineAndRemove(filePath, data)
		log.Printf("[egress] BLOCKED file transfer to %s: removed %s (local quarantine backup: %s, rule=%q)",
			target.Label, filePath, qPath, verdict.RuleName)
		if g.Notifier != nil {
			g.Notifier.NotifyBlock(destLabel, verdict.RuleName, verdict.CustomMessage)
		}
		return false, verdict, nil
	}

	if verdict.Action == webprotect.ActionWarn && g.Notifier != nil {
		// Hold the file off the remote share while awaiting user confirmation
		_ = os.Remove(filePath)
		if !g.Notifier.PromptWarn(destLabel, verdict.RuleName, verdict.CustomMessage) {
			qPath := g.quarantineAndRemove(filePath, data)
			log.Printf("[egress] WARN declined for %s: removed %s (quarantine: %s)", target.Label, filePath, qPath)
			return false, verdict, nil
		}
		// User confirmed WARN -> restore file to destination
		_ = os.WriteFile(filePath, data, 0600)
	}

	g.mu.Lock()
	g.allowedHashes[hashKey] = time.Now().Add(5 * time.Minute)
	g.mu.Unlock()
	return true, verdict, nil
}

func (g *Guard) quarantineAndRemove(destFilePath string, data []byte) string {
	_ = os.Remove(destFilePath)
	g.mu.Lock()
	delete(g.baselineFiles, destFilePath)
	g.mu.Unlock()

	if g.QuarantineDir == "" || len(data) == 0 {
		return ""
	}
	_ = os.MkdirAll(g.QuarantineDir, 0700)
	qFile := filepath.Join(g.QuarantineDir, fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(destFilePath)))
	_ = os.WriteFile(qFile, data, 0600)
	return qFile
}

func (g *Guard) walkTargetFiles(root string) map[string]fileState {
	out := make(map[string]fileState)
	rootClean := filepath.Clean(root)
	rootDepth := strings.Count(rootClean, string(os.PathSeparator))

	_ = filepath.WalkDir(rootClean, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return fs.SkipDir
		}
		name := d.Name()
		lower := strings.ToLower(name)
		if d.IsDir() {
			if path != rootClean {
				if strings.HasPrefix(name, ".") || lower == "node_modules" || lower == "$recycle.bin" || lower == "system volume information" {
					return fs.SkipDir
				}
				depth := strings.Count(filepath.Clean(path), string(os.PathSeparator)) - rootDepth
				if depth > g.MaxWalkDepth {
					return fs.SkipDir
				}
			}
			return nil
		}
		// Skip temporary office lock files, browser partial downloads, and hidden dot files
		if strings.HasPrefix(name, ".") || strings.HasPrefix(name, "~$") ||
			strings.HasSuffix(lower, ".tmp") || strings.HasSuffix(lower, ".crdownload") || strings.HasSuffix(lower, ".part") {
			return nil
		}
		info, infoErr := d.Info()
		if infoErr != nil || !info.Mode().IsRegular() || info.Size() <= 0 || info.Size() > webprotect.MaxPayloadBytes {
			return nil
		}
		out[path] = fileState{
			modTime: info.ModTime(),
			size:    info.Size(),
		}
		return nil
	})
	return out
}

// Run starts the background SMB / USB / Cloud Sync watcher and CLI protocol process guard.
func (g *Guard) Run(ctx context.Context) error {
	if g.PollInterval <= 0 {
		g.PollInterval = 1500 * time.Millisecond
	}
	for _, t := range DiscoverTargets(g.ExtraDirs) {
		g.AddTarget(t)
	}
	log.Printf("[egress] Layer-3 Multi-Protocol & Storage Egress Guard started (SMB / USB / Cloud Sync / CLI transfer)")

	ticker := time.NewTicker(g.PollInterval)
	defer ticker.Stop()

	cliGuard := NewCLIGuard(g)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			g.ScanOnce(ctx)
			cliGuard.InspectRunningCLITransfers(ctx)
		}
	}
}
