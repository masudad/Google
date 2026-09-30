//go:build !windows

package sysconfig

import "os/exec"

func configureBackgroundCommand(_ *exec.Cmd) {}
