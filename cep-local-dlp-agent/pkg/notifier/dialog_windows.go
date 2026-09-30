//go:build windows

package notifier

import (
	"strings"
	"syscall"
	"unsafe"
)

// Windows native modal dialogs via user32.dll!MessageBoxW.
// Calling MessageBoxW directly avoids spawning powershell.exe + .NET PresentationFramework,
// renders CRLF (\r\n) line breaks properly (preventing literal "¥n" from Go's %q formatting),
// and forces the dialog to the foreground (MB_TOPMOST | MB_SETFOREGROUND).

var (
	modUser32       = syscall.NewLazyDLL("user32.dll")
	procMessageBoxW = modUser32.NewProc("MessageBoxW")
)

const (
	mbOK            = 0x00000000
	mbYesNo         = 0x00000004
	mbIconError     = 0x00000010
	mbIconWarning   = 0x00000030
	mbDefButton2    = 0x00000100
	mbSetForeground = 0x00010000
	mbTopMost       = 0x00040000
	idYes           = 6
)

func showNativeBlockDialog(msg string) {
	winMsg := strings.ReplaceAll(msg, "\n", "\r\n")
	textPtr, err := syscall.UTF16PtrFromString(winMsg)
	if err != nil {
		return
	}
	titlePtr, err := syscall.UTF16PtrFromString("Chrome Enterprise Premium DLP")
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
