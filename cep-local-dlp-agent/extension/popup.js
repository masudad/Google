const statusBadge = document.getElementById("status-badge");
const tokenStatus = document.getElementById("token-status");
const pidStatus = document.getElementById("pid-status");
const popupToast = document.getElementById("popup-toast");
const btnRecheck = document.getElementById("btn-recheck");
const btnStart = document.getElementById("btn-start");
const btnSetup = document.getElementById("btn-setup");

function showToast(msg, level = "info") {
  popupToast.hidden = false;
  popupToast.className = `toast toast-${level}`;
  popupToast.textContent = msg;
}

function render(state, isManualRecheck = false) {
  if (state && state.online) {
    const info = state.agentInfo || {};
    const hasTok = Boolean(info.has_token);
    if (hasTok) {
      statusBadge.textContent = "保護有効 (ON)";
      statusBadge.className = "badge online";
      tokenStatus.textContent = `連携済 (${info.token_source || "OK"})`;
      if (isManualRecheck) {
        showToast("✅ ローカルエージェント (127.0.0.1:8843) は正常に稼働しています。", "success");
      }
    } else {
      statusBadge.textContent = "トークン待機 (WAIT)";
      statusBadge.className = "badge offline";
      tokenStatus.textContent = "未設定 (セットアップ画面で設定してください)";
      if (isManualRecheck) {
        showToast(
          "⚠️ エージェントは稼働中ですが DM トークンが未設定です。下の「初回セットアップ・設定画面を開く」から DM トークンを連携してください。",
          "warn"
        );
      }
    }
    pidStatus.textContent = `${info.pid || "-"} / v${info.version || "1.4.0"}`;
  } else {
    statusBadge.textContent = "停止中 (BLOCK)";
    statusBadge.className = "badge offline";
    tokenStatus.textContent = "-";
    pidStatus.textContent = "-";
    if (isManualRecheck) {
      showToast(
        "⚠️ 127.0.0.1:8843 に応答がありません。まだ初回インストールを行っていない場合は下の「初回セットアップ・設定画面を開く」を押してください。",
        "warn"
      );
    }
  }
}

chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
  render(state, false);
});

btnRecheck.addEventListener("click", () => {
  btnRecheck.disabled = true;
  btnRecheck.textContent = "確認中...";
  showToast("ローカルエージェント (127.0.0.1:8843) を確認しています...", "info");
  chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
    setTimeout(() => {
      btnRecheck.disabled = false;
      btnRecheck.textContent = "🔄 再確認";
      render(state, true);
    }, 250);
  });
});

btnStart.addEventListener("click", () => {
  showToast("🚀 OS へ起動リクエスト (cep-dlp://start) を送信中...", "info");
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = "cep-dlp://start";
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 1800);

  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
      render(state, false);
      if (!state || !state.online) {
        showToast(
          "⚠️ 起動できませんでした。初回は下の「初回セットアップ・設定画面を開く」からインストールコマンドを1回実行してください。",
          "warn"
        );
      } else {
        showToast("✅ エージェントが起動しました！", "success");
      }
    });
  }, 2000);
});

btnSetup.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
});
