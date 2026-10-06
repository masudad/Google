//go:build !windows

package egress

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func discoverOSTargets() []EgressTarget {
	var targets []EgressTarget

	if runtime.GOOS == "darwin" {
		// Inspect macOS `mount` output to distinguish SMB/NFS/WebDAV network shares from external USB volumes
		out, err := exec.Command("mount").Output()
		mountTypes := make(map[string]string)
		mountRemote := make(map[string]string)
		if err == nil {
			for _, line := range strings.Split(string(out), "\n") {
				// Format: //user@server/share on /Volumes/share (smbfs, nodev, nosuid, mounted by user)
				onIdx := strings.Index(line, " on /Volumes/")
				if onIdx < 0 {
					continue
				}
				src := strings.TrimSpace(line[:onIdx])
				rest := line[onIdx+4:]
				parenIdx := strings.Index(rest, " (")
				if parenIdx < 0 {
					continue
				}
				mntPoint := strings.TrimSpace(rest[:parenIdx])
				opts := strings.ToLower(rest[parenIdx+2:])
				mountTypes[mntPoint] = opts
				mountRemote[mntPoint] = src
			}
		}

		entries, err := os.ReadDir("/Volumes")
		if err == nil {
			for _, e := range entries {
				name := e.Name()
				if name == "Macintosh HD" || name == "Macintosh HD - Data" || name == "Preboot" || name == "Recovery" || name == "VM" {
					continue
				}
				fullPath := filepath.Join("/Volumes", name)
				// Skip symlinks pointing to "/" (default boot volume link)
				if linkDest, lerr := os.Readlink(fullPath); lerr == nil && linkDest == "/" {
					continue
				}
				opts := mountTypes[fullPath]
				remoteSrc := mountRemote[fullPath]
				if strings.Contains(opts, "smbfs") || strings.Contains(opts, "cifs") || strings.Contains(opts, "nfs") || strings.Contains(opts, "webdav") || strings.HasPrefix(remoteSrc, "//") {
					targetURL := BuildProtocolURL("smb", name)
					if remoteSrc != "" {
						targetURL = BuildProtocolURL("smb", remoteSrc)
					}
					targets = append(targets, EgressTarget{
						Path:      fullPath,
						Kind:      KindSMB,
						Label:     fmt.Sprintf("SMB Share (%s)", name),
						TargetURL: targetURL,
					})
				} else {
					targets = append(targets, EgressTarget{
						Path:      fullPath,
						Kind:      KindUSB,
						Label:     fmt.Sprintf("External Volume (%s)", name),
						TargetURL: BuildProtocolURL("usb", name),
					})
				}
			}
		}
		return targets
	}

	// Linux: parse /proc/mounts for cifs/smb3/nfs/sshfs and removable /media or /run/media mounts
	data, err := os.ReadFile("/proc/mounts")
	if err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			fields := strings.Fields(line)
			if len(fields) < 3 {
				continue
			}
			src, mnt, fstype := fields[0], fields[1], strings.ToLower(fields[2])
			switch {
			case fstype == "cifs" || fstype == "smb3" || fstype == "smbfs" || fstype == "nfs" || fstype == "nfs4" || fstype == "fuse.sshfs":
				targets = append(targets, EgressTarget{
					Path:      mnt,
					Kind:      KindSMB,
					Label:     fmt.Sprintf("Network Share (%s on %s)", src, mnt),
					TargetURL: BuildProtocolURL("smb", src),
				})
			case (strings.HasPrefix(mnt, "/media/") || strings.HasPrefix(mnt, "/run/media/")) &&
				(fstype == "vfat" || fstype == "exfat" || fstype == "ntfs" || fstype == "ext4"):
				targets = append(targets, EgressTarget{
					Path:      mnt,
					Kind:      KindUSB,
					Label:     fmt.Sprintf("Removable Media (%s)", filepath.Base(mnt)),
					TargetURL: BuildProtocolURL("usb", filepath.Base(mnt)),
				})
			}
		}
	}
	return targets
}
