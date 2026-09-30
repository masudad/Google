const statusBadge = document.getElementById("status-badge");
const tokenStatus = document.getElementById("token-status");
const pidStatus = document.getElementById("pid-status");
const btnSetup = document.getElementById("btn-setup");

function render(state) {
  if (state && state.online) {
    statusBadge.textContent = "保護有効 (ON)";
    statusBadge.className = "badge online";
    const info = state.agentInfo || {};
    tokenStatus.textContent = info.has_token ? `連携済 (${info.token_source || "OK"})` : "未設定";
    pidStatus.textContent = `${info.pid || "-"} / v${info.version || "1.1.0"}`;
  } else {
    statusBadge.textContent = "停止中 (BLOCK)";
    statusBadge.className = "badge offline";
    tokenStatus.textContent = "-";
    pidStatus.textContent = "-";
  }
}

chrome.runtime.sendMessage({ type: "FORCE_HEALTH_CHECK" }, (state) => {
  render(state);
});

btnSetup.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
});
