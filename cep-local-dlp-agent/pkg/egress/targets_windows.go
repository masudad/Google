//go:build windows

package egress

import (
	"fmt"
	"syscall"
	"unsafe"
)

const (
	driveRemovable = 2 // DRIVE_REMOVABLE (USB flash drive, SD card)
	driveRemote    = 4 // DRIVE_REMOTE (SMB/CIFS/WebDAV mapped network drive)
)

var (
	modkernel32          = syscall.NewLazyDLL("kernel32.dll")
	procGetLogicalDrives = modkernel32.NewProc("GetLogicalDrives")
	procGetDriveTypeW    = modkernel32.NewProc("GetDriveTypeW")

	modmpr                = syscall.NewLazyDLL("mpr.dll")
	procWNetGetConnection = modmpr.NewProc("WNetGetConnectionW")
)

func discoverOSTargets() []EgressTarget {
	mask, _, _ := procGetLogicalDrives.Call()
	if mask == 0 {
		return nil
	}

	var targets []EgressTarget
	for i := 0; i < 26; i++ {
		if (mask & (1 << uint(i))) == 0 {
			continue
		}
		letter := string(rune('A' + i))
		rootPath := letter + `:\`
		rootUTF16, err := syscall.UTF16PtrFromString(rootPath)
		if err != nil {
			continue
		}
		dtype, _, _ := procGetDriveTypeW.Call(uintptr(unsafe.Pointer(rootUTF16)))
		switch dtype {
		case driveRemote:
			unc := queryUNCPath(letter + ":")
			label := fmt.Sprintf("SMB Network Drive (%s:)", letter)
			targetURL := BuildProtocolURL("smb", "drive-"+letter)
			if unc != "" {
				label = fmt.Sprintf("SMB (%s -> %s)", letter+":", unc)
				targetURL = BuildProtocolURL("smb", unc)
			}
			targets = append(targets, EgressTarget{
				Path:      rootPath,
				Kind:      KindSMB,
				Label:     label,
				TargetURL: targetURL,
			})
		case driveRemovable:
			// Skip legacy A:/B: floppy slots unless actually mounted
			if letter == "A" || letter == "B" {
				continue
			}
			targets = append(targets, EgressTarget{
				Path:      rootPath,
				Kind:      KindUSB,
				Label:     fmt.Sprintf("Removable USB Drive (%s:)", letter),
				TargetURL: BuildProtocolURL("usb", "drive-"+letter),
			})
		}
	}
	return targets
}

func queryUNCPath(localDrive string) string {
	localUTF16, err := syscall.UTF16PtrFromString(localDrive)
	if err != nil {
		return ""
	}
	buf := make([]uint16, 512)
	length := uint32(len(buf))
	ret, _, _ := procWNetGetConnection.Call(
		uintptr(unsafe.Pointer(localUTF16)),
		uintptr(unsafe.Pointer(&buf[0])),
		uintptr(unsafe.Pointer(&length)),
	)
	if ret != 0 {
		return ""
	}
	return syscall.UTF16ToString(buf)
}
