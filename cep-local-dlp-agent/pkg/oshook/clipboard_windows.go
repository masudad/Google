//go:build windows

package oshook

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

// Windows implementation of:
//  1. Synchronous Low-Level Keyboard Hook (WH_KEYBOARD_LL via user32.dll!SetWindowsHookExW)
//     that intercepts Ctrl+V, Ctrl+Shift+V, and Shift+Insert BEFORE the target application
//     receives the keystroke, returning 1 to drop the paste keystroke when CEP DLP blocks it.
//  2. Thread-locked Win32 clipboard access (readOSClipboard, clearOSClipboard, writeOSClipboard)
//     with runtime.LockOSThread() so OpenClipboard and CloseClipboard always run on the same OS thread.
//  3. Fast foreground application resolution via GetForegroundWindow + QueryFullProcessImageNameW.

var (
	modUser32                      = syscall.NewLazyDLL("user32.dll")
	procGetClipboardSequenceNumber = modUser32.NewProc("GetClipboardSequenceNumber")
	procIsClipboardFormatAvailable = modUser32.NewProc("IsClipboardFormatAvailable")
	procOpenClipboard              = modUser32.NewProc("OpenClipboard")
	procCloseClipboard             = modUser32.NewProc("CloseClipboard")
	procGetClipboardData           = modUser32.NewProc("GetClipboardData")
	procSetClipboardData           = modUser32.NewProc("SetClipboardData")
	procEmptyClipboard             = modUser32.NewProc("EmptyClipboard")
	procGetForegroundWindow        = modUser32.NewProc("GetForegroundWindow")
	procGetDesktopWindow           = modUser32.NewProc("GetDesktopWindow")
	procGetWindowThreadProcessId   = modUser32.NewProc("GetWindowThreadProcessId")
	procSetWindowsHookExW          = modUser32.NewProc("SetWindowsHookExW")
	procCallNextHookEx             = modUser32.NewProc("CallNextHookEx")
	procUnhookWindowsHookEx        = modUser32.NewProc("UnhookWindowsHookEx")
	procGetAsyncKeyState           = modUser32.NewProc("GetAsyncKeyState")
	procGetMessageW                = modUser32.NewProc("GetMessageW")
	procTranslateMessage           = modUser32.NewProc("TranslateMessage")
	procDispatchMessageW           = modUser32.NewProc("DispatchMessageW")
	procPostThreadMessageW         = modUser32.NewProc("PostThreadMessageW")

	modKernel32                    = syscall.NewLazyDLL("kernel32.dll")
	procGlobalAlloc                = modKernel32.NewProc("GlobalAlloc")
	procGlobalFree                 = modKernel32.NewProc("GlobalFree")
	procGlobalLock                 = modKernel32.NewProc("GlobalLock")
	procGlobalUnlock               = modKernel32.NewProc("GlobalUnlock")
	procGlobalSize                 = modKernel32.NewProc("GlobalSize")
	procRtlMoveMemory              = modKernel32.NewProc("RtlMoveMemory")
	procOpenProcess                = modKernel32.NewProc("OpenProcess")
	procQueryFullProcessImageNameW = modKernel32.NewProc("QueryFullProcessImageNameW")
	procCloseHandle                = modKernel32.NewProc("CloseHandle")
	procGetCurrentThreadId         = modKernel32.NewProc("GetCurrentThreadId")
)

const (
	cfUnicodeText                  = 13
	gmemMoveable                   = 0x0002
	gmemZeroInit                   = 0x0040
	processQueryLimitedInformation = 0x1000
	maxClipboardUTF16Units         = 1024 * 1024 // cap at 1M UTF-16 code units (~2 MB)

	whKeyboardLL = 13
	wmKeyDown    = 0x0100
	wmSysKeyDown = 0x0104
	wmQuit       = 0x0012

	vkShift    = 0x10
	vkControl  = 0x11
	vkMenu     = 0x12 // Alt key
	vkInsert   = 0x2D
	vkV        = 0x56
	vkLShift   = 0xA0
	vkRShift   = 0xA1
	vkLControl = 0xA2
	vkRControl = 0xA3
)

type kbdLLHookStruct struct {
	VKCode      uint32
	ScanCode    uint32
	Flags       uint32
	Time        uint32
	DwExtraInfo uintptr
}

type winPoint struct {
	X int32
	Y int32
}

type winMSG struct {
	HWnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      winPoint
}

var (
	fgCacheMu     sync.Mutex
	lastFgHwnd    uintptr
	lastFgAppName string
	lastFgTime    time.Time

	hookMu       sync.Mutex
	activeGuard  *ClipboardGuard
	activeCtx    context.Context
	hookCallback uintptr
	hookOnce     sync.Once
)

func defaultPollInterval() time.Duration {
	return 25 * time.Millisecond
}

func isVirtualKeyDown(vk int) bool {
	ret, _, _ := procGetAsyncKeyState.Call(uintptr(vk))
	return (uint16(ret) & 0x8000) != 0
}

func isCtrlDown() bool {
	return isVirtualKeyDown(vkControl) || isVirtualKeyDown(vkLControl) || isVirtualKeyDown(vkRControl)
}

func isShiftDown() bool {
	return isVirtualKeyDown(vkShift) || isVirtualKeyDown(vkLShift) || isVirtualKeyDown(vkRShift)
}

func lowLevelKeyboardProc(nCode int, wParam uintptr, lParam uintptr) uintptr {
	if nCode >= 0 && (wParam == wmKeyDown || wParam == wmSysKeyDown) && lParam != 0 {
		var kbd kbdLLHookStruct
		procRtlMoveMemory.Call(
			uintptr(unsafe.Pointer(&kbd)),
			lParam,
			unsafe.Sizeof(kbd),
		)
		isPaste := false
		// Match Ctrl+V, Ctrl+Shift+V (Paste as plain text), and Shift+Insert
		if kbd.VKCode == vkV && isCtrlDown() && !isVirtualKeyDown(vkMenu) {
			isPaste = true
		} else if kbd.VKCode == vkInsert && isShiftDown() && !isCtrlDown() {
			isPaste = true
		}

		if isPaste {
			hookMu.Lock()
			guard := activeGuard
			ctx := activeCtx
			hookMu.Unlock()

			if guard != nil && ctx != nil {
				if !guard.HandlePasteAttempt(ctx) {
					// Return non-zero (1) to suppress the paste keystroke so the target
					// application never receives WM_KEYDOWN / WM_PASTE.
					return 1
				}
			}
		}
	}
	ret, _, _ := procCallNextHookEx.Call(0, uintptr(nCode), wParam, lParam)
	return ret
}

func startPasteKeystrokeHook(ctx context.Context, g *ClipboardGuard) {
	hookOnce.Do(func() {
		hookCallback = syscall.NewCallback(lowLevelKeyboardProc)
	})

	hookMu.Lock()
	activeGuard = g
	activeCtx = ctx
	hookMu.Unlock()

	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	threadID, _, _ := procGetCurrentThreadId.Call()
	hHook, _, err := procSetWindowsHookExW.Call(whKeyboardLL, hookCallback, 0, 0)
	if hHook == 0 {
		log.Printf("[oshook] Warning: SetWindowsHookExW(WH_KEYBOARD_LL) failed: %v", err)
		return
	}
	log.Printf("[oshook] Installed Win32 WH_KEYBOARD_LL synchronous paste interceptor (Ctrl+V / Shift+Insert)")
	defer procUnhookWindowsHookEx.Call(hHook)

	go func() {
		<-ctx.Done()
		if threadID != 0 {
			procPostThreadMessageW.Call(threadID, wmQuit, 0, 0)
		}
	}()

	var msg winMSG
	for {
		ret, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&msg)), 0, 0, 0)
		if int32(ret) <= 0 {
			break
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&msg)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&msg)))
	}
}

// clipboardSequenceNumber returns the Win32 clipboard sequence counter, which increments
// whenever the clipboard contents change. Reading it is a lock-free user32 call (<1 microsecond).
func clipboardSequenceNumber() uint32 {
	seq, _, _ := procGetClipboardSequenceNumber.Call()
	return uint32(seq)
}

// openClipboardLocked tries to open the Win32 clipboard on the ALREADY locked OS thread.
// Caller MUST hold runtime.LockOSThread().
func openClipboardLocked(retries int) bool {
	ownerHwnd, _, _ := procGetDesktopWindow.Call()
	for i := 0; i < retries; i++ {
		r, _, _ := procOpenClipboard.Call(ownerHwnd)
		if r != 0 {
			return true
		}
		r, _, _ = procOpenClipboard.Call(0)
		if r != 0 {
			return true
		}
		time.Sleep(4 * time.Millisecond)
	}
	return false
}

func readOSClipboard() string {
	avail, _, _ := procIsClipboardFormatAvailable.Call(cfUnicodeText)
	if avail == 0 {
		return ""
	}

	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	if !openClipboardLocked(10) {
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

// writeOSClipboard writes UTF-16 text back to the Windows clipboard on a locked OS thread
// (used to restore quarantined clipboard content when the user returns to a browser without pasting).
func writeOSClipboard(text string) error {
	utf16Units, err := syscall.UTF16FromString(text)
	if err != nil {
		return err
	}
	byteLen := uintptr(len(utf16Units) * 2)

	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	if !openClipboardLocked(20) {
		return fmt.Errorf("OpenClipboard failed")
	}
	defer procCloseClipboard.Call()

	procEmptyClipboard.Call()

	hMem, _, _ := procGlobalAlloc.Call(gmemMoveable, byteLen)
	if hMem == 0 {
		return fmt.Errorf("GlobalAlloc failed")
	}
	ptr, _, _ := procGlobalLock.Call(hMem)
	if ptr == 0 {
		procGlobalFree.Call(hMem)
		return fmt.Errorf("GlobalLock failed")
	}
	procRtlMoveMemory.Call(ptr, uintptr(unsafe.Pointer(&utf16Units[0])), byteLen)
	procGlobalUnlock.Call(hMem)

	if r, _, _ := procSetClipboardData.Call(cfUnicodeText, hMem); r == 0 {
		procGlobalFree.Call(hMem)
		return fmt.Errorf("SetClipboardData failed")
	}
	return nil
}

// clearOSClipboard forcibly wipes the Windows clipboard on a locked OS thread, waiting up to
// ~200ms if the target application is mid-paste (WM_PASTE) during rapid Ctrl+V spam, overwriting
// CF_UNICODETEXT with an empty NUL string as well as calling EmptyClipboard, and verifying
// that the clipboard no longer contains text.
func clearOSClipboard() error {
	for attempt := 0; attempt < 3; attempt++ {
		if err := clearOSClipboardOnce(); err != nil {
			time.Sleep(10 * time.Millisecond)
			continue
		}
		if strings.TrimSpace(readOSClipboard()) == "" {
			return nil
		}
		time.Sleep(10 * time.Millisecond)
	}
	return fmt.Errorf("clipboard still non-empty after clear retries")
}

func clearOSClipboardOnce() error {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	if !openClipboardLocked(40) {
		return fmt.Errorf("OpenClipboard failed (clipboard locked by another process)")
	}
	defer procCloseClipboard.Call()

	r, _, err := procEmptyClipboard.Call()
	if r == 0 {
		return fmt.Errorf("EmptyClipboard failed: %v", err)
	}

	// Also place an explicit empty UTF-16 string ("") before emptying again so editors/apps
	// that cache the last CF_UNICODETEXT buffer overwrite their internal paste buffer.
	hMem, _, _ := procGlobalAlloc.Call(gmemMoveable|gmemZeroInit, 2)
	if hMem != 0 {
		if ptr, _, _ := procGlobalLock.Call(hMem); ptr != 0 {
			procGlobalUnlock.Call(hMem)
			if setRet, _, _ := procSetClipboardData.Call(cfUnicodeText, hMem); setRet == 0 {
				procGlobalFree.Call(hMem)
			}
		} else {
			procGlobalFree.Call(hMem)
		}
		procEmptyClipboard.Call()
	}
	return nil
}

func detectForegroundApp() string {
	hwnd, _, _ := procGetForegroundWindow.Call()
	if hwnd == 0 {
		return "local-app"
	}

	now := time.Now()
	fgCacheMu.Lock()
	if hwnd == lastFgHwnd && lastFgAppName != "" && now.Sub(lastFgTime) < 100*time.Millisecond {
		name := lastFgAppName
		fgCacheMu.Unlock()
		return name
	}
	fgCacheMu.Unlock()

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
	name := strings.TrimSuffix(base, filepath.Ext(base))

	fgCacheMu.Lock()
	lastFgHwnd = hwnd
	lastFgAppName = name
	lastFgTime = now
	fgCacheMu.Unlock()

	return name
}
