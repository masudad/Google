//go:build !windows

package proxy

import (
	"context"
	"os/exec"
	"strings"
	"time"
)

// macOS / Linux implementation: `lsof -nP -iTCP:<port> -F c` returns the command name of the
// process owning the client socket. Note that lsof escapes spaces as `\x20` (e.g.
// `cGoogle\x20Chrome\x20Helper`), so we unescape `\x20` before matching against browser names.
func identifyProcessNative(clientPort string) string {
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
	defer cancel()

	cmd := exec.CommandContext(ctx, "lsof", "-nP", "-iTCP:"+clientPort, "-F", "c")
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(out), "\n") {
		if strings.HasPrefix(line, "c") && len(line) > 1 {
			proc := strings.ReplaceAll(strings.TrimSpace(line[1:]), `\x20`, " ")
			if !strings.Contains(strings.ToLower(proc), "cep-dlp-agent") {
				return proc
			}
		}
	}
	return ""
}
