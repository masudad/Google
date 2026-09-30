//go:build windows

package proxy

import (
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

// Windows implementation: resolve the owning PID of the loopback client socket via
// iphlpapi!GetExtendedTcpTable (TCP_TABLE_OWNER_PID_ALL) and the process image name via
// kernel32!QueryFullProcessImageNameW. Both are in-process Win32 calls (no PowerShell spawn),
// which finish in well under 1 ms even with thousands of sockets.

var (
	modIphlpapi                 = syscall.NewLazyDLL("iphlpapi.dll")
	procGetExtendedTcpTable     = modIphlpapi.NewProc("GetExtendedTcpTable")
	modKernel32                 = syscall.NewLazyDLL("kernel32.dll")
	procOpenProcess             = modKernel32.NewProc("OpenProcess")
	procQueryFullProcessImageNW = modKernel32.NewProc("QueryFullProcessImageNameW")
	procCloseHandle             = modKernel32.NewProc("CloseHandle")
)

const (
	tcpTableOwnerPidAll            = 5
	afInet                         = 2
	afInet6                        = 23
	errorInsufficientBuffer        = 122
	processQueryLimitedInformation = 0x1000
)

type mibTCPRowOwnerPid struct {
	State      uint32
	LocalAddr  uint32
	LocalPort  uint32
	RemoteAddr uint32
	RemotePort uint32
	OwningPid  uint32
}

type mibTCP6RowOwnerPid struct {
	LocalAddr     [16]byte
	LocalScopeID  uint32
	LocalPort     uint32
	RemoteAddr    [16]byte
	RemoteScopeID uint32
	RemotePort    uint32
	State         uint32
	OwningPid     uint32
}

var (
	pidNameMu    sync.Mutex
	pidNameCache = map[uint32]pidNameEntry{}
)

type pidNameEntry struct {
	name   string
	expiry time.Time
}

func identifyProcessNative(clientPort string) string {
	portNum, err := strconv.Atoi(clientPort)
	if err != nil || portNum <= 0 || portNum > 65535 {
		return ""
	}
	pid := findOwningPid(uint16(portNum), afInet)
	if pid == 0 {
		pid = findOwningPid(uint16(portNum), afInet6)
	}
	if pid == 0 {
		return ""
	}
	return processNameByPid(pid)
}

// netPort converts the DWORD port field (network byte order in the low 16 bits) to host order.
func netPort(v uint32) uint16 {
	p := uint16(v & 0xffff)
	return p>>8 | p<<8
}

func findOwningPid(localPort uint16, family uint32) uint32 {
	var size uint32
	procGetExtendedTcpTable.Call(0, uintptr(unsafe.Pointer(&size)), 0, uintptr(family), tcpTableOwnerPidAll, 0)
	if size == 0 {
		size = 64 * 1024
	}

	var buf []byte
	for attempt := 0; attempt < 3; attempt++ {
		buf = make([]byte, size+4096)
		size = uint32(len(buf))
		ret, _, _ := procGetExtendedTcpTable.Call(
			uintptr(unsafe.Pointer(&buf[0])),
			uintptr(unsafe.Pointer(&size)),
			0,
			uintptr(family),
			tcpTableOwnerPidAll,
			0,
		)
		if ret == 0 {
			break
		}
		if ret != errorInsufficientBuffer {
			return 0
		}
	}
	if len(buf) < 4 {
		return 0
	}
	numEntries := *(*uint32)(unsafe.Pointer(&buf[0]))

	switch family {
	case afInet:
		rowSize := unsafe.Sizeof(mibTCPRowOwnerPid{})
		for i := uintptr(0); i < uintptr(numEntries); i++ {
			off := 4 + i*rowSize
			if off+rowSize > uintptr(len(buf)) {
				break
			}
			row := (*mibTCPRowOwnerPid)(unsafe.Pointer(&buf[off]))
			if netPort(row.LocalPort) == localPort && row.OwningPid != 0 {
				return row.OwningPid
			}
		}
	case afInet6:
		rowSize := unsafe.Sizeof(mibTCP6RowOwnerPid{})
		for i := uintptr(0); i < uintptr(numEntries); i++ {
			off := 4 + i*rowSize
			if off+rowSize > uintptr(len(buf)) {
				break
			}
			row := (*mibTCP6RowOwnerPid)(unsafe.Pointer(&buf[off]))
			if netPort(row.LocalPort) == localPort && row.OwningPid != 0 {
				return row.OwningPid
			}
		}
	}
	return 0
}

func processNameByPid(pid uint32) string {
	now := time.Now()
	pidNameMu.Lock()
	if e, ok := pidNameCache[pid]; ok && now.Before(e.expiry) {
		pidNameMu.Unlock()
		return e.name
	}
	pidNameMu.Unlock()

	name := queryProcessImageName(pid)
	if name == "" {
		return ""
	}

	pidNameMu.Lock()
	if len(pidNameCache) > 4096 {
		pidNameCache = map[uint32]pidNameEntry{}
	}
	pidNameCache[pid] = pidNameEntry{name: name, expiry: now.Add(30 * time.Second)}
	pidNameMu.Unlock()
	return name
}

func queryProcessImageName(pid uint32) string {
	h, _, _ := procOpenProcess.Call(processQueryLimitedInformation, 0, uintptr(pid))
	if h == 0 {
		return ""
	}
	defer procCloseHandle.Call(h)

	buf := make([]uint16, 1024)
	size := uint32(len(buf))
	ret, _, _ := procQueryFullProcessImageNW.Call(h, 0, uintptr(unsafe.Pointer(&buf[0])), uintptr(unsafe.Pointer(&size)))
	if ret == 0 {
		return ""
	}
	full := syscall.UTF16ToString(buf[:size])
	return strings.ToLower(filepath.Base(full))
}
