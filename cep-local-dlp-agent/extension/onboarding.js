/**
 * CEP Local DLP Companion — Onboarding & Gatekeeper Script
 *
 * Automatically detects the user's OS, displays the corresponding 1-liner
 * user-space installer command, polls the background service worker / local
 * agent health endpoint every 2 seconds, and redirects back to the original
 * URL (`?target=...`) as soon as `cep-dlp-agent` comes online.
 */

const params = new URLSearchParams(window.location.search);
const rawDomain = params.get("domain") || "";
const targetUrl =
  params.get("target") || (rawDomain ? `https://${rawDomain}` : "");


const statusPill = document.getElementById("status-pill");
const targetBanner = document.getElementById("target-banner");
const targetUrlDisplay = document.getElementById("target-url-display");
const detectedOsLabel = document.getElementById("detected-os-label");
const downloadFilename = document.getElementById("download-filename");
const btnDownloadBinary = document.getElementById("btn-download-binary");
const installCmdBox = document.getElementById("install-cmd-box");
const btnCopyCmd = document.getElementById("btn-copy-cmd");
const btnRecheck = document.getElementById("btn-recheck");
const lastCheckedLabel = document.getElementById("last-checked-label");

if (targetUrl) {
  targetBanner.hidden = false;
  targetUrlDisplay.textContent = targetUrl;
}

function detectOSInfo() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    return {
      label: "Windows (x64 / ARM64)",
      filename: "cep-dlp-agent-windows-amd64.exe",
      cmd: `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '$HOME\\Downloads\\cep-dlp-agent-windows-amd64.exe' install"`,
    };
  }
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
    return {
      label: "macOS (Apple Silicon / Intel)",
      filename: "cep-dlp-agent-darwin-arm64",
      cmd: `chmod +x ~/Downloads/cep-dlp-agent-darwin-* && ~/Downloads/cep-dlp-agent-darwin-arm64 install`,
    };
  }
  return {
    label: "Linux (x86_64)",
    filename: "cep-dlp-agent-linux-amd64",
    cmd: `chmod +x ~/Downloads/cep-dlp-agent-linux-amd64 && ~/Downloads/cep-dlp-agent-linux-amd64 install`,
  };
}

const osInfo = detectOSInfo();
detectedOsLabel.textContent = osInfo.label;
downloadFilename.textContent = osInfo.filename;
installCmdBox.textContent = osInfo.cmd;

chrome.runtime.sendMessage({ type: "GET_AGENT_STATE" }, (resp) => {
  const baseUrl =
    resp?.config?.downloadBaseUrl ||
    "https://storage.googleapis.com/cep-local-dlp-agent-releases/latest";
  btnDownloadBinary.href = `${baseUrl.replace(/\/$/, "")}/${osInfo.filename}`;
});

btnCopyCmd.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(osInfo.cmd);
    const prev = btnCopyCmd.textContent;
    btnCopyCmd.textContent = "コピーしました!";
    setTimeout(() => {
      btnCopyCmd.textContent = prev;
    }, 1800);
  } catch (_) {
    // ignore clipboard error
  }
});

function checkNow() {
  lastCheckedLabel.textContent = `最終確認: ${new Date().toLocaleTimeString()}`;
  chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
    if (state && state.online) {
      onAgentOnline();
    }
  });
}

function onAgentOnline() {
  statusPill.textContent = "エージェント稼働中 (保護有効)";
  statusPill.classList.remove("status-offline");
  statusPill.classList.add("status-online");

  if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
    setTimeout(() => {
      window.location.replace(targetUrl);
    }, 500);
  }
}

btnRecheck.addEventListener("click", checkNow);

// Poll every 2 seconds so the moment the user clicks `cep-dlp://start` or finishes
// running `cep-dlp-agent install`, the Gatekeeper unblocks and redirects automatically.
setInterval(checkNow, 2000);
checkNow();
