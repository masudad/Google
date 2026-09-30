//go:build windows

package notifier

import (
	"strings"
	"syscall"
	"unsafe"
)

// Windows native modal dialogs via user32.dll!MessageBoxW, plus focus restoration
// (FindWindowW + ShowWindow + SetForegroundWindow + MessageBeep) when the user leaves
// a block dialog open in the background and tries to paste again.

var (
	modUser32               = syscall.NewLazyDLL("user32.dll")
	procMessageBoxW         = modUser32.NewProc("MessageBoxW")
	procFindWindowW         = modUser32.NewProc("FindWindowW")
	procShowWindow          = modUser32.NewProc("ShowWindow")
	procSetForegroundWindow = modUser32.NewProc("SetForegroundWindow")
	procMessageBeep         = modUser32.NewProc("MessageBeep")
)

const (
	blockDialogTitle = "Chrome Enterprise Premium DLP"

	mbOK            = 0x00000000
	mbYesNo         = 0x00000004
	mbIconError     = 0x00000010
	mbIconWarning   = 0x00000030
	mbDefButton2    = 0x00000100
	mbSetForeground = 0x00010000
	mbTopMost       = 0x00040000
	idYes           = 6
	swRestore       = 9
)

func showNativeBlockDialog(msg string) {
	winMsg := strings.ReplaceAll(msg, "\n", "\r\n")
	textPtr, err := syscall.UTF16PtrFromString(winMsg)
	if err != nil {
		return
	}
	titlePtr, err := syscall.UTF16PtrFromString(blockDialogTitle)
	if err != nil {
		return
	}
	flags := uintptr(mbOK | mbIconError | mbSetForeground | mbTopMost)
	_, _, _ = procMessageBoxW.Call(
		0,
		uintptr(unsafe.Pointer(textPtr)),
		uintptr(unsafe.Pointer(titlePtr)),
		flags,
	)
}

func focusExistingBlockDialog() {
	procMessageBeep.Call(mbIconError)
	titlePtr, err := syscall.UTF16PtrFromString(blockDialogTitle)
	if err != nil {
		return
	}
	hwnd, _, _ := procFindWindowW.Call(0, uintptr(unsafe.Pointer(titlePtr)))
	if hwnd != 0 {
		procShowWindow.Call(hwnd, swRestore)
		procSetForegroundWindow.Call(hwnd)
	}
}

func showNativeWarnDialog(msg string) bool {
	winMsg := strings.ReplaceAll(msg+"\n\n送信を続行しますか？ (はい = 続行 / いいえ = 遮断)", "\n", "\r\n")
	textPtr, err := syscall.UTF16PtrFromString(winMsg)
	if err != nil {
		return false
	}
	titlePtr, err := syscall.UTF16PtrFromString("Chrome Enterprise Premium DLP Warning")
	if err != nil {
		return false
	}
	flags := uintptr(mbYesNo | mbIconWarning | mbDefButton2 | mbSetForeground | mbTopMost)
	ret, _, _ := procMessageBoxW.Call(
		0,
		uintptr(unsafe.Pointer(textPtr)),
		uintptr(unsafe.Pointer(titlePtr)),
		flags,
	)
	return ret == idYes
}
