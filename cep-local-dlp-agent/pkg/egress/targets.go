// Package egress implements Layer-3 Multi-Protocol & Storage Egress DLP Guard,
// hooking file transfers to SMB/CIFS/NFS network shares, removable USB/external drives,
// Cloud Storage sync folders (OneDrive, Dropbox, Box, iCloud Drive), and CLI transfer tools
// (scp, sftp, rsync, rclone, ftp, smbclient, robocopy), evaluating all payloads against
// Chrome Enterprise Premium (CEP) WebProtect.
package egress

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// TargetKind classifies the storage or protocol channel for a watched egress directory.
type TargetKind string

const (
	KindSMB       TargetKind = "smb"
	KindUSB       TargetKind = "usb"
	KindCloudSync TargetKind = "cloud-sync"
	KindCustomDir TargetKind = "custom"
)

// EgressTarget represents a mounted SMB network share, removable USB drive,
// Cloud Sync folder, or explicit directory watched for file exfiltration.
type EgressTarget struct {
	Path      string     `json:"path"`
	Kind      TargetKind `json:"kind"`
	Label     string     `json:"label"`
	TargetURL string     `json:"target_url"`
}

// BuildProtocolURL returns a canonical synthetic HTTPS URL for CEP WebProtect rule evaluation
// so administrators can target specific protocols or shares in Google Admin Console DLP URL rules.
// Examples:
//   - SMB:        https://local-protocol.internal/smb/fileserver/finance
//   - USB:        https://local-protocol.internal/usb/volume-e
//   - Cloud Sync: https://local-protocol.internal/cloud-sync/onedrive
//   - SMTP/FTP:   https://local-protocol.internal/smtp/mail.example.com
func BuildProtocolURL(protocol string, parts ...string) string {
	proto := sanitizeSegment(protocol)
	if proto == "" {
		proto = "unknown"
	}
	var cleaned []string
	for _, p := range parts {
		for _, sub := range strings.FieldsFunc(p, func(r rune) bool {
			return r == '\\' || r == '/' || r == ':'
		}) {
			s := sanitizeSegment(sub)
			if s != "" {
				cleaned = append(cleaned, s)
			}
		}
	}
	if len(cleaned) == 0 {
		return fmt.Sprintf("https://local-protocol.internal/%s", proto)
	}
	return fmt.Sprintf("https://local-protocol.internal/%s/%s", proto, strings.Join(cleaned, "/"))
}

func sanitizeSegment(raw string) string {
	lower := strings.ToLower(strings.TrimSpace(raw))
	if lower == "" {
		return ""
	}
	mapped := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
			return r
		}
		return '-'
	}, lower)
	return strings.Trim(mapped, "-")
}

// DiscoverTargets enumerates all currently mounted SMB/CIFS/NFS network shares,
// removable USB/external drives, known Cloud Sync folders (OneDrive, Dropbox, Box, iCloud),
// and any user-specified watch directories (including Windows UNC paths \\server\share).
func DiscoverTargets(extraDirs []string) []EgressTarget {
	seen := make(map[string]bool)
	var out []EgressTarget

	add := func(t EgressTarget) {
		clean := filepath.Clean(strings.TrimSpace(t.Path))
		if clean == "" || clean == "." {
			return
		}
		key := strings.ToLower(clean)
		if seen[key] {
			return
		}
		seen[key] = true
		t.Path = clean
		out = append(out, t)
	}

	// 1. OS-specific mounted SMB network shares & removable USB drives
	for _, t := range discoverOSTargets() {
		add(t)
	}

	// 2. Local Cloud Storage Sync folders in user home directory
	for _, t := range discoverCloudSyncFolders() {
		add(t)
	}

	// 3. Explicit --watch-dirs (including UNC paths \\server\share on Windows)
	for _, dir := range extraDirs {
		trimmed := strings.TrimSpace(dir)
		if trimmed == "" {
			continue
		}
		if strings.HasPrefix(trimmed, `\\`) || strings.HasPrefix(trimmed, "//") {
			add(EgressTarget{
				Path:      trimmed,
				Kind:      KindSMB,
				Label:     fmt.Sprintf("SMB (%s)", trimmed),
				TargetURL: BuildProtocolURL("smb", trimmed),
			})
			continue
		}
		add(EgressTarget{
			Path:      trimmed,
			Kind:      KindCustomDir,
			Label:     fmt.Sprintf("Watched Folder (%s)", filepath.Base(trimmed)),
			TargetURL: BuildProtocolURL("folder", filepath.Base(trimmed)),
		})
	}

	return out
}

func discoverCloudSyncFolders() []EgressTarget {
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return nil
	}
	var targets []EgressTarget

	entries, err := os.ReadDir(home)
	if err == nil {
		for _, e := range entries {
			if !e.IsDir() {
				continue
			}
			name := e.Name()
			lower := strings.ToLower(name)
			fullPath := filepath.Join(home, name)
			switch {
			case strings.HasPrefix(lower, "onedrive"):
				targets = append(targets, EgressTarget{
					Path:      fullPath,
					Kind:      KindCloudSync,
					Label:     fmt.Sprintf("OneDrive (%s)", name),
					TargetURL: BuildProtocolURL("cloud-sync", "onedrive", name),
				})
			case strings.HasPrefix(lower, "dropbox"):
				targets = append(targets, EgressTarget{
					Path:      fullPath,
					Kind:      KindCloudSync,
					Label:     fmt.Sprintf("Dropbox (%s)", name),
					TargetURL: BuildProtocolURL("cloud-sync", "dropbox", name),
				})
			case lower == "box" || strings.HasPrefix(lower, "box sync"):
				targets = append(targets, EgressTarget{
					Path:      fullPath,
					Kind:      KindCloudSync,
					Label:     fmt.Sprintf("Box (%s)", name),
					TargetURL: BuildProtocolURL("cloud-sync", "box", name),
				})
			}
		}
	}

	// macOS iCloud Drive folder
	icloudPath := filepath.Join(home, "Library", "Mobile Documents", "com~apple~CloudDocs")
	if st, err := os.Stat(icloudPath); err == nil && st.IsDir() {
		targets = append(targets, EgressTarget{
			Path:      icloudPath,
			Kind:      KindCloudSync,
			Label:     "iCloud Drive",
			TargetURL: BuildProtocolURL("cloud-sync", "icloud-drive"),
		})
	}

	return targets
}
