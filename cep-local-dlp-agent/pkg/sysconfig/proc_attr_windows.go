//go:build windows

package sysconfig

import (
	"os/exec"
	"syscall"
)

const createNoWindow = 0x08000000

func configureBackgroundCommand(cmd *exec.Cmd) {
	if cmd == nil {
		return
	}
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: createNoWindow,
	}
}
