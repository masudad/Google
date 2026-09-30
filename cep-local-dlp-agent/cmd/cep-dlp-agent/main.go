// Command cep-dlp-agent is the unified lightweight endpoint DLP agent that hooks local
// OS clipboard actions (Layer 1) and outbound HTTPS POST/PUT API traffic (Layer 2) across
// both AI IDEs (Cursor, Claude Desktop, VS Code) and general native apps (Slack, Outlook, Teams),
// delegating all DLP evaluation to the Chrome Enterprise Premium (CEP) WebProtect server.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"cep-local-dlp-agent/pkg/dmtoken"
	"cep-local-dlp-agent/pkg/notifier"
	"cep-local-dlp-agent/pkg/oshook"
	"cep-local-dlp-agent/pkg/proxy"
	"cep-local-dlp-agent/pkg/sysconfig"
	"cep-local-dlp-agent/pkg/webprotect"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	subcmd := os.Args[1]
	// Support invocation via cep-dlp:// custom URL protocol on Windows/Linux (e.g. cep-dlp-agent "cep-dlp://start")
	if strings.HasPrefix(subcmd, "cep-dlp://") {
		runProxyCmd([]string{"--system-proxy"}, true)
		return
	}

	switch subcmd {
	case "token":
		runTokenCmd(os.Args[2:])
	case "scan":
		runScanCmd(os.Args[2:])
	case "ca-export":
		runCAExportCmd(os.Args[2:], false)
	case "ca-install":
		runCAExportCmd(os.Args[2:], true)
	case "install":
		runInstallCmd(os.Args[2:])
	case "uninstall":
		runUninstallCmd()
	case "proxy":
		runProxyCmd(os.Args[2:], false)
	case "daemon":
		runProxyCmd(os.Args[2:], true)
	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Fprintf(os.Stderr, `CEP Local DLP Agent - Unified Endpoint & AI App DLP powered by Chrome Enterprise Premium (WebProtect)

Usage:
  cep-dlp-agent <command> [flags]

Commands:
  token       Discover and display local Chrome Enterprise DM Token (CBCM / Profile / BYOD) and host metadata
  scan        Scan a text string or file directly against CEP WebProtect (Phase 1 verification CLI)
  ca-export   Generate and display the local Root CA certificate path
  ca-install  Generate and automatically install the local Root CA into macOS Keychain or Windows Root Store
  install     Zero-Admin BYOD User-Space Installer (registers login auto-start, Root CA, and cep-dlp:// protocol)
  uninstall   Remove user-space login auto-start and cep-dlp:// protocol handler
  proxy       Run Layer-2 Smart Local HTTPS Proxy (with Pre-filter, Quota limiter & Pinning Auto-Bypass)
  daemon      Run Full Hybrid Agent (Layer-1 OS Clipboard Guard + Layer-2 Smart HTTPS Proxy)
`)
}

func runTokenCmd(args []string) {
	fs := flag.NewFlagSet("token", flag.ExitOnError)
	dmTokenFlag := fs.String("dm-token", "", "Explicit DM token override (or set CEP_DM_TOKEN)")
	profileEmail := fs.String("profile-email", "", "Pin the Chrome profile account (e.g. admin@example.com or @example.com) whose Profile DM Token to use; persisted to ~/.cep-local-dlp-agent/config.json")
	_ = fs.Parse(args)

	if *profileEmail != "" {
		if err := dmtoken.SavePreferredProfileEmail(*profileEmail); err != nil {
			log.Fatalf("Failed to save preferred profile: %v", err)
		}
		fmt.Printf("Pinned Chrome profile account: %s\n", *profileEmail)
	}

	info, err := dmtoken.Discover(*dmTokenFlag)
	out, _ := json.MarshalIndent(info, "", "  ")
	fmt.Println(string(out))
	if len(info.AvailableProfiles) > 1 {
		fmt.Fprintf(os.Stderr, "\nNOTE: %d managed Chrome profiles found. Selected the one marked \"selected\": true.\n"+
			"      To pin a different account: cep-dlp-agent token --profile-email you@example.com  (or CEP_PROFILE_EMAIL)\n",
			len(info.AvailableProfiles))
	}
	if err != nil {
		log.Fatalf("DM Token discovery note: %v", err)
	}
}

func runInstallCmd(args []string) {
	fs := flag.NewFlagSet("install", flag.ExitOnError)
	listenAddr := fs.String("listen", "127.0.0.1:8843", "Local HTTP/HTTPS proxy listen address")
	dmTokenFlag := fs.String("dm-token", "", "Optional BYOD DM token to persist during installation")
	configDir := fs.String("config-dir", "", "Directory to store Root CA certificate and key")
	_ = fs.Parse(args)

	ca, err := proxy.LoadOrCreateCA(*configDir)
	if err != nil {
		log.Fatalf("Failed to initialize Root CA: %v", err)
	}
	installedBin, err := sysconfig.InstallUserSpaceAgent(ca.CertPath, *listenAddr, *dmTokenFlag)
	if err != nil {
		log.Fatalf("User-space installation failed: %v", err)
	}
	fmt.Printf("Installed CEP Local DLP Agent in user space:\n")
	fmt.Printf("  Binary:  %s\n", installedBin)
	fmt.Printf("  Root CA: %s\n", ca.CertPath)
	fmt.Printf("  Listen:  http://%s\n", *listenAddr)
}

func runUninstallCmd() {
	if err := sysconfig.UninstallUserSpaceAgent(); err != nil {
		log.Fatalf("Uninstall failed: %v", err)
	}
	fmt.Println("Removed CEP Local DLP Agent user-space auto-start registration.")
}

func runScanCmd(args []string) {
	fs := flag.NewFlagSet("scan", flag.ExitOnError)
	dmTokenFlag := fs.String("dm-token", "", "Explicit DM token override (or set CEP_DM_TOKEN)")
	urlFlag := fs.String("url", "https://chatgpt.com", "Target URL for CEP DLP rule evaluation")
	textFlag := fs.String("text", "", "Text payload to scan (BULK_DATA_ENTRY)")
	fileFlag := fs.String("file", "", "File path to scan (FILE_ATTACHED)")
	mimeFlag := fs.String("content-type", "", "Explicit MIME Content-Type")
	endpointFlag := fs.String("endpoint", webprotect.EndpointProdGlobal, "CEP WebProtect endpoint URL")
	_ = fs.Parse(args)

	info, err := dmtoken.Discover(*dmTokenFlag)
	if err != nil {
		log.Fatalf("Failed to discover DM Token: %v", err)
	}

	var payload []byte
	connector := webprotect.BulkDataEntry
	filename := ""
	contentType := *mimeFlag

	if *fileFlag != "" {
		b, err := os.ReadFile(*fileFlag)
		if err != nil {
			log.Fatalf("Failed to read file %q: %v", *fileFlag, err)
		}
		payload = b
		connector = webprotect.FileAttached
		filename = *fileFlag
		if contentType == "" {
			contentType = http.DetectContentType(b)
		}
	} else if *textFlag != "" {
		payload = []byte(*textFlag)
		if contentType == "" {
			contentType = "text/plain"
		}
	} else {
		log.Fatalf("Either --text or --file must be specified")
	}

	client := webprotect.NewClient(*endpointFlag)
	verdict, err := client.Scan(context.Background(), webprotect.ScanInput{
		DMToken:        info.DMToken,
		ProfileDMToken: info.ProfileDMToken,
		UserEmail:      info.UserEmail,
		ClientID:       info.ClientID,
		URL:            *urlFlag,
		Source:         "cep-dlp-agent-cli",
		Destination:    *urlFlag,
		Filename:       filename,
		ContentType:    contentType,
		Connector:      connector,
		Payload:        payload,
		DeviceName:     info.DeviceName,
		OSPlatform:     info.OSPlatform,
		OSVersion:      info.OSVersion,
		MachineUser:    info.MachineUser,
	})
	if err != nil {
		log.Fatalf("WebProtect scan failed: %v", err)
	}

	out, _ := json.MarshalIndent(verdict, "", "  ")
	fmt.Println(string(out))
	if !verdict.Allowed {
		os.Exit(2)
	}
}

func runCAExportCmd(args []string, install bool) {
	fs := flag.NewFlagSet("ca", flag.ExitOnError)
	configDir := fs.String("config-dir", "", "Directory to store Root CA certificate and private key")
	_ = fs.Parse(args)

	ca, err := proxy.LoadOrCreateCA(*configDir)
	if err != nil {
		log.Fatalf("Failed to initialize Root CA: %v", err)
	}
	fmt.Printf("Root CA Certificate: %s\n", ca.CertPath)
	fmt.Printf("Root CA Private Key: %s\n\n", ca.KeyPath)

	if install {
		if err := sysconfig.InstallRootCA(ca.CertPath); err != nil {
			log.Fatalf("Automatic Root CA install failed: %v", err)
		}
		fmt.Println("Successfully installed Root CA into OS trust store.")
		return
	}

	fmt.Println("To trust this Root CA on your OS (or run `cep-dlp-agent ca-install`):")
	fmt.Printf("  macOS:   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain %q\n", ca.CertPath)
	fmt.Printf("  Windows: certutil -user -addstore -f \"Root\" %q\n", ca.CertPath)
	fmt.Printf("  Linux:   sudo cp %q /usr/local/share/ca-certificates/cep-local-root-ca.crt && sudo update-ca-certificates\n", ca.CertPath)
}

func runProxyCmd(args []string, enableClipboardGuard bool) {
	fs := flag.NewFlagSet("daemon", flag.ExitOnError)
	listenAddr := fs.String("listen", "127.0.0.1:8843", "Local HTTP/HTTPS proxy listen address")
	dmTokenFlag := fs.String("dm-token", "", "Explicit DM token override (or set CEP_DM_TOKEN)")
	endpointFlag := fs.String("endpoint", webprotect.EndpointProdGlobal, "CEP WebProtect endpoint URL")
	minBytesFlag := fs.Int("min-bytes", proxy.DefaultMinPayloadBytes, "Minimum POST/PUT payload bytes to trigger CEP scan")
	qpsFlag := fs.Float64("max-qps", proxy.DefaultDeviceQPS, "Max per-device QPS rate limit to protect enterprise quota")
	configDir := fs.String("config-dir", "", "Directory to store Root CA certificate and key")
	sysProxyFlag := fs.Bool("system-proxy", false, "Automatically enable OS-wide system proxy on macOS/Windows and restore on exit")
	headlessFlag := fs.Bool("headless", false, "Disable native OS GUI modal alerts")
	_ = fs.Parse(args)

	info, err := dmtoken.Discover(*dmTokenFlag)
	if err != nil {
		// On unmanaged BYOD PCs, allow daemon to start in awaiting-bootstrap state so the
		// Companion Chrome Extension can push the BYOD DM token via POST /__cep_agent/v1/bootstrap-token.
		log.Printf("[agent] Starting in BYOD awaiting-token mode (%v) — Companion Chrome Extension can push token to http://%s/__cep_agent/v1/bootstrap-token", err, *listenAddr)
	} else {
		log.Printf("[agent] Using DM Token from %s (device=%s, os=%s, user=%s)",
			info.TokenSource, info.DeviceName, info.OSPlatform, info.UserEmail)
	}

	ca, err := proxy.LoadOrCreateCA(*configDir)
	if err != nil {
		log.Fatalf("Failed to load/create Root CA: %v", err)
	}
	log.Printf("[agent] Root CA ready at %s", ca.CertPath)

	if *sysProxyFlag {
		restore, err := sysconfig.EnableSystemProxy(*listenAddr)
		if err != nil {
			log.Printf("[agent] Warning: failed to enable OS system proxy automatically: %v", err)
		} else {
			defer restore()
		}
	}

	wpClient := webprotect.NewClient(*endpointFlag)
	filter := proxy.NewSmartFilter(*minBytesFlag, *qpsFlag)
	notif := notifier.NewOSNotifier(*headlessFlag)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if enableClipboardGuard {
		clipGuard := oshook.NewClipboardGuard(wpClient, info, notif, 1)
		go func() {
			_ = clipGuard.Run(ctx)
		}()
	}

	proxySrv := proxy.NewServer(ca, filter, wpClient, info, notif)
	httpSrv := &http.Server{
		Addr:    *listenAddr,
		Handler: proxySrv,
	}

	go func() {
		<-ctx.Done()
		_ = httpSrv.Close()
	}()

	log.Printf("[agent] Layer-2 Smart HTTPS Proxy + Control Plane (/healthz) listening on http://%s", *listenAddr)
	if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Proxy server error: %v", err)
	}
}
