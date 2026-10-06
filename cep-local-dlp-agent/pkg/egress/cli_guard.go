package egress

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
)

// CLITransferCommand describes a parsed command-line file transfer invocation
// (e.g., scp, sftp, rsync, rclone, ftp, smbclient, robocopy, curl -T/-F, aws s3 cp, gsutil cp).
type CLITransferCommand struct {
	PID         int
	Tool        string
	Protocol    string
	Destination string
	LocalFiles  []string
}

var monitoredCLITools = map[string]string{
	"scp":       "scp",
	"sftp":      "sftp",
	"rsync":     "rsync",
	"rclone":    "rclone",
	"ftp":       "ftp",
	"smbclient": "smb",
	"robocopy":  "smb",
	"xcopy":     "smb",
	"curl":      "http-cli",
	"aws":       "s3",
	"gsutil":    "gcs",
	"azcopy":    "azure-blob",
}

// ParseCLITransferArgs analyzes a process command line and extracts local source file paths
// and remote destination if the command is uploading files via SCP, SFTP, Rsync, Rclone, SMB, FTP, or Cloud CLI.
func ParseCLITransferArgs(pid int, args []string) *CLITransferCommand {
	if len(args) < 2 {
		return nil
	}
	base := strings.ToLower(filepath.Base(args[0]))
	base = strings.TrimSuffix(base, ".exe")
	proto, ok := monitoredCLITools[base]
	if !ok {
		return nil
	}

	// For curl, only inspect when uploading a file (-T / --upload-file / -F / --form / --data-binary @file)
	if base == "curl" {
		hasUpload := false
		for _, a := range args[1:] {
			if a == "-T" || a == "--upload-file" || a == "-F" || a == "--form" || strings.HasPrefix(a, "@") {
				hasUpload = true
				break
			}
		}
		if !hasUpload {
			return nil
		}
	}

	var localFiles []string
	var dest string

	for _, rawArg := range args[1:] {
		arg := strings.TrimSpace(rawArg)
		if arg == "" || strings.HasPrefix(arg, "-") {
			continue
		}
		// Handle curl -F file=@/path/to/secret.pdf or --data-binary @/path/to/secret.pdf
		if idx := strings.Index(arg, "@"); idx >= 0 && (base == "curl") {
			candidate := arg[idx+1:]
			if st, err := os.Stat(candidate); err == nil && !st.IsDir() {
				localFiles = append(localFiles, candidate)
				continue
			}
		}
		// Check if argument is an existing local file
		if st, err := os.Stat(arg); err == nil && !st.IsDir() {
			localFiles = append(localFiles, arg)
			continue
		}
		// Check if argument looks like a remote destination (user@host:path, \\server\share, s3://, gs://, https://)
		if strings.Contains(arg, ":") || strings.HasPrefix(arg, `\\`) || strings.HasPrefix(arg, "//") {
			dest = arg
		}
	}

	if len(localFiles) == 0 {
		return nil
	}
	if dest == "" {
		dest = base + "-remote"
	}
	return &CLITransferCommand{
		PID:         pid,
		Tool:        base,
		Protocol:    proto,
		Destination: dest,
		LocalFiles:  localFiles,
	}
}

// CLIGuard inspects active command-line file transfer processes (scp, sftp, rsync, rclone, smbclient, robocopy)
// and terminates any transfer whose local file payload violates CEP DLP policy.
type CLIGuard struct {
	guard       *Guard
	mu          sync.Mutex
	inspectedID map[int]bool
}

// NewCLIGuard creates a new CLI transfer process guard attached to the Layer-3 Egress Guard.
func NewCLIGuard(g *Guard) *CLIGuard {
	return &CLIGuard{
		guard:       g,
		inspectedID: make(map[int]bool),
	}
}

// InspectRunningCLITransfers scans newly spawned CLI transfer processes.
func (c *CLIGuard) InspectRunningCLITransfers(ctx context.Context) {
	procs := listActiveUserCommandLines()
	for pid, args := range procs {
		c.mu.Lock()
		if c.inspectedID[pid] {
			c.mu.Unlock()
			continue
		}
		c.inspectedID[pid] = true
		if len(c.inspectedID) > 4096 {
			c.inspectedID = make(map[int]bool)
		}
		c.mu.Unlock()

		cmd := ParseCLITransferArgs(pid, args)
		if cmd == nil {
			continue
		}

		target := EgressTarget{
			Path:      cmd.Destination,
			Kind:      TargetKind(cmd.Protocol),
			Label:     strings.ToUpper(cmd.Protocol) + " CLI (" + cmd.Tool + " -> " + cmd.Destination + ")",
			TargetURL: BuildProtocolURL(cmd.Protocol, cmd.Destination),
		}
		for _, fpath := range cmd.LocalFiles {
			allowed, _, err := c.guard.InspectFileTransfer(ctx, target, fpath)
			if err == nil && !allowed {
				if p, findErr := os.FindProcess(cmd.PID); findErr == nil {
					_ = p.Kill()
				}
				break
			}
		}
	}
}

func listActiveUserCommandLines() map[int][]string {
	out := make(map[int][]string)
	if runtime.GOOS == "linux" {
		entries, err := os.ReadDir("/proc")
		if err != nil {
			return out
		}
		for _, e := range entries {
			if !e.IsDir() {
				continue
			}
			pid, err := strconv.Atoi(e.Name())
			if err != nil || pid <= 1 {
				continue
			}
			raw, err := os.ReadFile(filepath.Join("/proc", e.Name(), "cmdline"))
			if err != nil || len(raw) == 0 {
				continue
			}
			parts := strings.Split(strings.TrimRight(string(raw), "\x00"), "\x00")
			if len(parts) >= 2 {
				out[pid] = parts
			}
		}
		return out
	}

	if runtime.GOOS == "darwin" {
		raw, err := exec.Command("ps", "-axo", "pid=,command=").Output()
		if err != nil {
			return out
		}
		for _, line := range strings.Split(string(raw), "\n") {
			fields := strings.Fields(line)
			if len(fields) < 2 {
				continue
			}
			pid, err := strconv.Atoi(fields[0])
			if err != nil || pid <= 1 {
				continue
			}
			out[pid] = fields[1:]
		}
	}
	return out
}
