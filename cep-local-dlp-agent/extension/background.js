const AGENT_BASE_URL = "http://127.0.0.1:8843";
const DEFAULT_PROTECTED_DOMAINS = [
  "chatgpt.com",
  "claude.ai",
  "gemini.google.com",
  " vertexaisearch.cloud.google.com",
  "console.cloud.google.com",
  "drive.google.com",
  "mail.google.com",
  "slack.com"
];

let lastAgentState = {
  healthy: false,
  status: "unreachable",
  dmTokenPresent: false,
  userEmail: "",
  deviceName: "",
  osPlatform: "",
  lastChecked: null
};

async function getConfiguration() {
  let managed = {};
  try {
    managed = await chrome.storage.managed.get([
      "dmToken",
      "enforceGate",
      "protectedDomains",
      "downloadBaseUrl"
    ]);
  } catch (_) {
    // Unmanaged or local dev environment
  }
  const local = await chrome.storage.local.get([
    "dmToken",
    "enforceGate",
    "protectedDomains",
    "downloadBaseUrl"
  ]);

  return {
    dmToken: managed.dmToken || local.dmToken || "",
    enforceGate:
      managed.enforceGate !== undefined
        ? Boolean(managed.enforceGate)
        : local.enforceGate !== undefined
          ? Boolean(local.enforceGate)
          : true,
    protectedDomains:
      managed.protectedDomains ||
      local.protectedDomains ||
      DEFAULT_PROTECTED_DOMAINS.map((d) => d.trim()),
    downloadBaseUrl:
      managed.downloadBaseUrl ||
      local.downloadBaseUrl ||
      "https://storage.googleapis.com/cep-local-dlp-agent-dist"
  };
}

async function getProfileEmail() {
  return new Promise((resolve) => {
    if (!chrome.identity || !chrome.identity.getProfileUserInfo) {
      resolve("");
      return;
    }
    chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (info) => {
      resolve((info && info.email) || "");
    });
  });
}

async function checkAgentHealth() {
  const cfg = await getConfiguration();
  const profileEmail = await getProfileEmail();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const resp = await fetch(`${AGENT_BASE_URL}/healthz`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timer);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();

    // If BYOD agent needs a DM token or user email and we have one from managed policy / profile, push it automatically!
    if (
      (!data.dm_token_present && cfg.dmToken) ||
      (!data.user_email && profileEmail)
    ) {
      const bootResp = await fetch(
        `${AGENT_BASE_URL}/__cep_agent/v1/bootstrap-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dm_token: cfg.dmToken,
            user_email: profileEmail
          })
        }
      );
      if (bootResp.ok) {
        const bootData = await bootResp.json();
        data.dm_token_present = bootData.dm_token_present;
        data.user_email = bootData.user_email;
      }
    }

    lastAgentState = {
      healthy: true,
      status: data.status || "ok",
      version: data.version || "1.1.0",
      dmTokenPresent: Boolean(data.dm_token_present),
      tokenSource: data.token_source || "",
      userEmail: data.user_email || profileEmail,
      deviceName: data.device_name || "",
      osPlatform: data.os_platform || "",
      lastChecked: new Date().toISOString()
    };
  } catch (err) {
    lastAgentState = {
      healthy: false,
      status: "offline",
      dmTokenPresent: false,
      userEmail: profileEmail,
      deviceName: "",
      osPlatform: "",
      lastChecked: new Date().toISOString()
    };
  }

  await chrome.storage.local.set({ agentState: lastAgentState });
  await syncGatekeeperRules(lastAgentState.healthy, cfg);
  await updateActionBadge(lastAgentState.healthy);
  return lastAgentState;
}

async function updateActionBadge(healthy) {
  if (healthy) {
    await chrome.action.setBadgeText({ text: "ON" });
    await chrome.action.setBadgeBackgroundColor({ color: "#188038" });
  } else {
    await chrome.action.setBadgeText({ text: "OFF" });
    await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  }
}

async function syncGatekeeperRules(agentHealthy, cfg) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  if (agentHealthy || !cfg.enforceGate) {
    if (removeRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds
      });
    }
    return;
  }

  const onboardingUrl = chrome.runtime.getURL("onboarding.html");
  const addRules = cfg.protectedDomains
    .map((domain, idx) => {
      const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!clean) return null;
      return {
        id: 1000 + idx,
        priority: 100,
        action: {
          type: "redirect",
          redirect: {
            extensionPath: `/onboarding.html?domain=${encodeURIComponent(clean)}`
          }
        },
        condition: {
          urlFilter: `||${clean}^`,
          resourceTypes: ["main_frame"]
        }
      };
    })
    .filter(Boolean);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("cep_agent_health_poll", { periodInMinutes: 0.25 });
  checkAgentHealth();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("cep_agent_health_poll", { periodInMinutes: 0.25 });
  checkAgentHealth();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cep_agent_health_poll") {
    checkAgentHealth();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    checkAgentHealth();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && (msg.type === "CHECK_HEALTH_NOW" || msg.type === "FORCE_HEALTH_CHECK")) {
    checkAgentHealth().then((state) =>
      sendResponse({
        ...state,
        online: state.healthy,
        agentInfo: {
          has_token: state.dmTokenPresent,
          token_source: state.tokenSource,
          version: state.version,
          pid: state.deviceName
        },
        state
      })
    );
    return true;
  }
  if (msg && (msg.type === "GET_CONFIG_AND_STATE" || msg.type === "GET_AGENT_STATE")) {
    Promise.all([getConfiguration(), checkAgentHealth()]).then(
      ([config, state]) =>
        sendResponse({
          config,
          state,
          online: state.healthy
        })
    );
    return true;
  }
  return false;
});

