/**
 * CEP Local DLP Companion — Onboarding & Gatekeeper Script
 */

const GITHUB_DIST_BASE_URL =
  "https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/dist";

const params = new URLSearchParams(window.location.search);
const rawDomain = params.get("domain") || "";
const targetUrl =
  params.get("target") || (rawDomain ? `https://${rawDomain}` : "");

const statusPill = document.getElementById("status-pill");
const targetBanner = document.getElementById("target-banner");
const targetUrlDisplay = document.getElementById("target-url-display");
const feedbackBox = document.getElementById("feedback-box");
const detectedOsLabel = document.getElementById("detected-os-label");
const downloadFilename = document.getElementById("download-filename");
const btnDownloadBinary = document.getElementById("btn-download-binary");
const installCmdBox = document.getElementById("install-cmd-box");
const localInstallCmdBox = document.getElementById("local-install-cmd-box");
const btnCopyCmd = document.getElementById("btn-copy-cmd");
const btnCopyLocalCmd = document.getElementById("btn-copy-local-cmd");
const btnRecheck = document.getElementById("btn-recheck");
const btnLaunchScheme = document.getElementById("btn-launch-scheme");
const inputDmToken = document.getElementById("input-dm-token");
const btnSaveToken = document.getElementById("btn-save-token");
const chkEnforceGate = document.getElementById("chk-enforce-gate");
const lastCheckedLabel = document.getElementById("last-checked-label");

if (targetUrl) {
  targetBanner.hidden = false;
  targetUrlDisplay.textContent = targetUrl;
}

function showFeedback(message, level = "info") {
  feedbackBox.hidden = false;
  feedbackBox.className = `feedback-box feedback-${level}`;
  feedbackBox.textContent = message;
}

function detectOSInfo() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    return {
      label: "Windows (PowerShell)",
      filename: "cep-dlp-agent-windows-amd64.exe",
      oneLiner: `irm https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/install.ps1 | iex`,
      localCmd: `.\\dist\\cep-dlp-agent-windows-amd64.exe install`
    };
  }
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
    return {
      label: "macOS (Apple Silicon / Intel 自動判別)",
      filename: "cep-dlp-agent-darwin-arm64",
      oneLiner: `curl -fsSL https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/install.sh | sh`,
      localCmd: `sh ./install.sh`
    };
  }
  return {
    label: "Linux (x86_64)",
    filename: "cep-dlp-agent-linux-amd64",
    oneLiner: `curl -fsSL https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/install.sh | sh`,
    localCmd: `sh ./install.sh`
  };
}

const osInfo = detectOSInfo();
detectedOsLabel.textContent = osInfo.label;
downloadFilename.textContent = osInfo.filename;
installCmdBox.textContent = osInfo.oneLiner;
localInstallCmdBox.textContent = osInfo.localCmd;
btnDownloadBinary.href = `${GITHUB_DIST_BASE_URL}/${osInfo.filename}`;

chrome.runtime.sendMessage({ type: "GET_CONFIG_AND_STATE" }, (resp) => {
  if (resp && resp.config) {
    const baseUrl = resp.config.downloadBaseUrl || GITHUB_DIST_BASE_URL;
    btnDownloadBinary.href = `${baseUrl.replace(/\/$/, "")}/${osInfo.filename}`;
    if (resp.config.dmToken) {
      inputDmToken.value = resp.config.dmToken;
    }
    chkEnforceGate.checked = resp.config.enforceGate !== false;
  }
  if (resp && resp.online) {
    onAgentOnline(resp.state);
  }
});

async function copyTextWithButton(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const prev = btn.textContent;
    btn.textContent = "✅ コピーしました！";
    showFeedback(
      "📋 コマンドをコピーしました。ターミナル（Windows は PowerShell）を開いて貼り付け、Enter を押してください。",
      "info"
    );
    setTimeout(() => {
      btn.textContent = prev;
    }, 2000);
  } catch (_) {
    showFeedback("コマンドを手動で選択してコピーしてください。", "warn");
  }
}

btnCopyCmd.addEventListener("click", () =>
  copyTextWithButton(osInfo.oneLiner, btnCopyCmd)
);
btnCopyLocalCmd.addEventListener("click", () =>
  copyTextWithButton(osInfo.localCmd, btnCopyLocalCmd)
);

function checkNow(isManualClick = false) {
  if (isManualClick) {
    btnRecheck.disabled = true;
    btnRecheck.textContent = "🔄 確認中...";
    showFeedback("ローカルエージェント (http://127.0.0.1:8843/healthz) の応答を確認しています...", "info");
  }

  lastCheckedLabel.textContent = `最終確認: ${new Date().toLocaleTimeString()}`;

  chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
    if (isManualClick) {
      setTimeout(() => {
        btnRecheck.disabled = false;
        btnRecheck.textContent = "🔄 今すぐ再確認 (127.0.0.1:8843)";
      }, 300);
    }

    if (state && state.online) {
      onAgentOnline(state);
    } else if (isManualClick) {
      showFeedback(
        "⚠️ ローカルエージェント (127.0.0.1:8843) がまだ起動していません。初回の方は上の「ステップ 1」のコマンドをターミナルで1回実行してください。",
        "warn"
      );
    }
  });
}

function onAgentOnline(state) {
  const tokLabel =
    state && state.dmTokenPresent ? "DMトークン連携済" : "DMトークン未設定";
  statusPill.textContent = `エージェント稼働中 (${tokLabel})`;
  statusPill.classList.remove("status-offline");
  statusPill.classList.add("status-online");

  showFeedback(
    `✅ CEP Local DLP Agent の稼働を確認しました！（${tokLabel}）`,
    "success"
  );

  if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
    setTimeout(() => {
      window.location.replace(targetUrl);
    }, 600);
  }
}

btnRecheck.addEventListener("click", () => checkNow(true));

btnLaunchScheme.addEventListener("click", () => {
  showFeedback(
    "🚀 OS へ起動リクエスト (cep-dlp://start) を送信しました。2秒後に起動状態を確認します...",
    "info"
  );

  // Trigger custom URL protocol handler via hidden iframe / location
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = "cep-dlp://start";
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 2000);

  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
      if (state && state.online) {
        onAgentOnline(state);
      } else {
        showFeedback(
          "⚠️ エージェントが起動しませんでした。まだこの PC で「ステップ 1（初回セットアップ）」を実行していない場合、OS に cep-dlp:// スキームが未登録のためボタンからは起動できません。先にステップ 1 のコマンドを1回実行してください。",
          "warn"
        );
      }
    });
  }, 2200);
});

btnSaveToken.addEventListener("click", () => {
  btnSaveToken.disabled = true;
  btnSaveToken.textContent = "保存中...";
  chrome.runtime.sendMessage(
    {
      type: "SAVE_LOCAL_CONFIG",
      dmToken: inputDmToken.value.trim(),
      enforceGate: chkEnforceGate.checked
    },
    (resp) => {
      btnSaveToken.disabled = false;
      btnSaveToken.textContent = "トークンを保存・連携";
      if (resp && resp.online) {
        onAgentOnline(resp.state);
        showFeedback(
          "✅ DM トークンを保存し、稼働中のローカルエージェントへ即時反映しました！",
          "success"
        );
      } else {
        showFeedback(
          "✅ 設定を保存しました。ローカルエージェントが起動すると自動的にこの DM トークンが連携されます。",
          "info"
        );
      }
    }
  );
});

chkEnforceGate.addEventListener("change", () => {
  chrome.runtime.sendMessage(
    {
      type: "SAVE_LOCAL_CONFIG",
      enforceGate: chkEnforceGate.checked
    },
    () => {
      showFeedback(
        chkEnforceGate.checked
          ? "🔒 Gatekeeper（未起動時の対象サイトブロック）を有効にしました。"
          : "🔓 Gatekeeper（未起動時の対象サイトブロック）を一時解除しました。",
        "info"
      );
    }
  );
});

// Background poll every 2.5 seconds
setInterval(() => checkNow(false), 2500);
checkNow(false);
