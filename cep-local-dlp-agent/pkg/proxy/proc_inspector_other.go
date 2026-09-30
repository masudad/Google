//go:build !windows

package proxy

import (
	"os/exec"
	"strings"
	"time"
)

// macOS / Linux implementation: `lsof -nP -iTCP:<port> -F c` returns the command name of the
// process owning the client socket. lsof is bounded by a short deadline so a slow lookup can
// only cost a few hundred ms per CONNECT and never blocks the tunnel.
func identifyProcessNative(clientPort string) string {
	cmd := exec.Command("lsof", "-nP", "-iTCP:"+clientPort, "-F", "c")
	done := make(chan string, 1)
	go func() {
		out, err := cmd.Output()
		if err != nil {
			done <- ""
			return
		}
		for _, line := range strings.Split(string(out), "\n") {
			if strings.HasPrefix(line, "c") && len(line) > 1 {
				proc := strings.TrimSpace(line[1:])
				if !strings.Contains(strings.ToLower(proc), "cep-dlp-agent") {
					done <- proc
					return
				}
			}
		}
		done <- ""
	}()

	select {
	case res := <-done:
		return res
	case <-time.After(300 * time.Millisecond):
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
		return ""
	}
}
