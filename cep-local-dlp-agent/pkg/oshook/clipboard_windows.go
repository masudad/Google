//go:build windows

package oshook

import (
	"fmt"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

// Windows implementation of clipboard and foreground-window access using in-process Win32 APIs
// (user32.dll + kernel32.dll). Zero PowerShell or child process launches.
//
// Previous implementation spawned `powershell.exe Get-Clipboard` and `powershell.exe Add-Type ...`
// every 500ms, causing continuous CPU spikes and 300-1500ms latency on Windows.

var (
	modUser32                      = syscall.NewLazyDLL("user32.dll")
	procGetClipboardSequenceNumber = modUser32.NewProc("GetClipboardSequenceNumber")
	procIsClipboardFormatAvailable = modUser32.NewProc("IsClipboardFormatAvailable")
	procOpenClipboard              = modUser32.NewProc("OpenClipboard")
	procCloseClipboard             = modUser32.NewProc("CloseClipboard")
	procGetClipboardData           = modUser32.NewProc("GetClipboardData")
	procEmptyClipboard             = modUser32.NewProc("EmptyClipboard")
	procGetForegroundWindow        = modUser32.NewProc("GetForegroundWindow")
	procGetWindowThreadProcessId   = modUser32.NewProc("GetWindowThreadProcessId")

	modKernel32                    = syscall.NewLazyDLL("kernel32.dll")
	procGlobalLock                 = modKernel32.NewProc("GlobalLock")
	procGlobalUnlock               = modKernel32.NewProc("GlobalUnlock")
	procGlobalSize                 = modKernel32.NewProc("GlobalSize")
	procRtlMoveMemory              = modKernel32.NewProc("RtlMoveMemory")
	procOpenProcess                = modKernel32.NewProc("OpenProcess")
	procQueryFullProcessImageNameW = modKernel32.NewProc("QueryFullProcessImageNameW")
	procCloseHandle                = modKernel32.NewProc("CloseHandle")
)

const (
	cfUnicodeText                  = 13
	processQueryLimitedInformation = 0x1000
	maxClipboardUTF16Units         = 1024 * 1024 // cap at 1M UTF-16 code units (~2 MB)
)

// clipboardSequenceNumber returns the Win32 clipboard sequence counter, which increments only
// when the clipboard contents change. Reading it is a lock-free user32 call (<1 microsecond).
func clipboardSequenceNumber() uint32 {
	seq, _, _ := procGetClipboardSequenceNumber.Call()
	return uint32(seq)
}

func openClipboardWithRetry() bool {
	for i := 0; i < 5; i++ {
		r, _, _ := procOpenClipboard.Call(0)
		if r != 0 {
			return true
		}
		time.Sleep(5 * time.Millisecond)
	}
	return false
}

func readOSClipboard() string {
	avail, _, _ := procIsClipboardFormatAvailable.Call(cfUnicodeText)
	if avail == 0 {
		return ""
	}
	if !openClipboardWithRetry() {
		return ""
	}
	defer procCloseClipboard.Call()

	hMem, _, _ := procGetClipboardData.Call(cfUnicodeText)
	if hMem == 0 {
		return ""
	}
	byteSize, _, _ := procGlobalSize.Call(hMem)
	if byteSize < 2 {
		return ""
	}
	ptr, _, _ := procGlobalLock.Call(hMem)
	if ptr == 0 {
		return ""
	}
	defer procGlobalUnlock.Call(hMem)

	units := int(byteSize / 2)
	if units > maxClipboardUTF16Units {
		units = maxClipboardUTF16Units
	}
	buf := make([]uint16, units)
	procRtlMoveMemory.Call(
		uintptr(unsafe.Pointer(&buf[0])),
		ptr,
		uintptr(units*2),
	)
	return syscall.UTF16ToString(buf)
}

func clearOSClipboard() error {
	if !openClipboardWithRetry() {
		return fmt.Errorf("OpenClipboard failed")
	}
	defer procCloseClipboard.Call()
	r, _, err := procEmptyClipboard.Call()
	if r == 0 {
		return fmt.Errorf("EmptyClipboard failed: %v", err)
	}
	return nil
}

func detectForegroundApp() string {
	hwnd, _, _ := procGetForegroundWindow.Call()
	if hwnd == 0 {
		return "local-app"
	}
	var pid uint32
	procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))
	if pid == 0 {
		return "local-app"
	}
	hProc, _, _ := procOpenProcess.Call(processQueryLimitedInformation, 0, uintptr(pid))
	if hProc == 0 {
		return "local-app"
	}
	defer procCloseHandle.Call(hProc)

	buf := make([]uint16, 1024)
	size := uint32(len(buf))
	ret, _, _ := procQueryFullProcessImageNameW.Call(
		hProc,
		0,
		uintptr(unsafe.Pointer(&buf[0])),
		uintptr(unsafe.Pointer(&size)),
	)
	if ret == 0 || size == 0 {
		return "local-app"
	}
	base := filepath.Base(syscall.UTF16ToString(buf[:size]))
	if base == "" {
		return "local-app"
	}
	return strings.TrimSuffix(base, filepath.Ext(base))
}
