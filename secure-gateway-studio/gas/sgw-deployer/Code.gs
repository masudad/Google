/**
 * Secure Gateway Deployer — Google Sheets + Apps Script Edition
 *
 * Modeled after CERA 2.0 (Zero-Config Default Cloud Project):
 * - Adds the "🌐 Secure Gateway" menu to the Google Sheets toolbar on open (and supports direct Web App execution via doGet).
 * - Launches the 4-Step Secure Gateway Deployer & Operations Manager inside a Google Sheets modal.
 * - Proxies all Google Cloud / BeyondCorp / Compute / DNS / Secret Manager / Chrome Policy REST calls
 *   through Apps Script UrlFetchApp (< 2s per call, zero 6-minute execution limit issues).
 * - Automatically writes planned & applied resources and audit events into formatted Google Sheets tabs.
 */

var SGW_SUMMARY_SHEET = "🌐 SGW 構成・リソース一覧";
var SGW_LOG_SHEET = "📜 SGW 実行・監査ログ";

var DEFAULT_SPREADSHEET_ID = "1V0ZIXaL-DIUuSogmX2MlyyWnDl9LQ06ayfCmcPYuyCQ";

function sgsGetTargetSpreadsheet_() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  var propId = "";
  try {
    propId = PropertiesService.getScriptProperties().getProperty("SGS_SPREADSHEET_ID") || "";
  } catch (e) {}
  var targetId = propId || DEFAULT_SPREADSHEET_ID;
  if (targetId) {
    try {
      return SpreadsheetApp.openById(targetId);
    } catch (e) {}
  }
  return null;
}

/**
 * Returns the active operator's OAuth token and email for the in-modal worker.
 */
function sgsGetAuthToken() {
  var token = ScriptApp.getOAuthToken();
  var email = "";
  try {
    email = Session.getActiveUser().getEmail() || "";
  } catch (e) {}
  return { token: token, email: email };
}

/**
 * Extracts and remembers a Google Cloud project_id if present in the URL or JSON body,
 * and auto-discovers an active GCP project via Cloud Resource Manager if Apps Script's
 * Default Cloud Project needs a quota/billing project for Chrome Policy or ACM APIs.
 */
function sgsRememberOrDiscoverQuotaProject_(token, url, bodyStr, forceDiscover) {
  var userProps = null;
  try {
    userProps = PropertiesService.getUserProperties();
  } catch (e) {}

  var candidate = "";
  var urlMatch = String(url || "").match(/\/projects\/([a-z][a-z0-9-]{4,29})(?:\/|$|\?)/i) ||
                 String(url || "").match(/[?&]project(?:_id)?=([a-z][a-z0-9-]{4,29})(?:&|$)/i);
  if (urlMatch && urlMatch[1] && urlMatch[1].indexOf("sys-") !== 0) {
    candidate = urlMatch[1];
  }
  if (!candidate && bodyStr) {
    try {
      var parsedBody = JSON.parse(bodyStr);
      if (parsedBody && typeof parsedBody.project_id === "string" && /^[a-z][a-z0-9-]{4,29}$/i.test(parsedBody.project_id)) {
        candidate = parsedBody.project_id;
      }
    } catch (e) {}
  }
  if (candidate && userProps) {
    try { userProps.setProperty("SGS_QUOTA_PROJECT", candidate); } catch (e) {}
    return candidate;
  }
  if (userProps) {
    try {
      var saved = userProps.getProperty("SGS_QUOTA_PROJECT") || "";
      if (saved) return saved;
    } catch (e) {}
  }
  if (!forceDiscover) return "";

  try {
    var crmResp = UrlFetchApp.fetch(
      "https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState%3AACTIVE&pageSize=15",
      {
        method: "get",
        headers: { Authorization: "Bearer " + token },
        muteHttpExceptions: true
      }
    );
    if (crmResp.getResponseCode() >= 200 && crmResp.getResponseCode() < 300) {
      var crmData = JSON.parse(crmResp.getContentText() || "{}");
      var projects = Array.isArray(crmData.projects) ? crmData.projects : [];
      var chosen = "";
      for (var i = 0; i < projects.length; i++) {
        var pid = String((projects[i] && projects[i].projectId) || "");
        if (pid && pid.indexOf("sys-") !== 0 && pid.indexOf("gam-") !== 0) {
          chosen = pid;
          break;
        }
      }
      if (!chosen && projects.length > 0) {
        chosen = String(projects[0].projectId || "");
      }
      if (chosen && userProps) {
        try { userProps.setProperty("SGS_QUOTA_PROJECT", chosen); } catch (e) {}
      }
      return chosen;
    }
  } catch (e) {}
  return "";
}

/**
 * Proxies Google API requests from the modal UI through Apps Script UrlFetchApp.
 * Works out-of-the-box on Apps Script's Default Cloud Project by combining
 * enabledAdvancedServices with automatic X-Goog-User-Project + Service Usage fallback.
 */
function sgsProxyFetch(req) {
  var url = String((req && req.url) || "");
  if (!/^https:\/\/([a-z0-9-]+\.)*googleapis\.com\//i.test(url)) {
    throw new Error("Blocked non-googleapis URL: " + url);
  }
  var token = ScriptApp.getOAuthToken();
  var headers = Object.assign({}, (req && req.headers) || {});
  if (!headers["Authorization"] && !headers["authorization"]) {
    headers["Authorization"] = "Bearer " + token;
  }
  var method = String((req && req.method) || "GET").toUpperCase();
  var bodyStr = (req && req.body !== undefined && req.body !== null && method !== "GET" && method !== "HEAD")
    ? String(req.body)
    : null;

  var quotaProject = sgsRememberOrDiscoverQuotaProject_(token, url, bodyStr, false);
  var hostMatch = url.match(/^https:\/\/([a-z0-9-]+\.googleapis\.com)\//i);
  var serviceHost = hostMatch ? hostMatch[1].toLowerCase() : "";
  if (
    quotaProject &&
    !headers["X-Goog-User-Project"] &&
    !headers["x-goog-user-project"] &&
    (serviceHost === "chromepolicy.googleapis.com" ||
     serviceHost === "chromemanagement.googleapis.com" ||
     serviceHost === "accesscontextmanager.googleapis.com")
  ) {
    headers["X-Goog-User-Project"] = quotaProject;
  }

  function buildParams_(hdrs) {
    var p = {
      method: method.toLowerCase(),
      headers: hdrs,
      muteHttpExceptions: true
    };
    if (bodyStr !== null) {
      p.payload = bodyStr;
      p.contentType = hdrs["Content-Type"] || hdrs["content-type"] || "application/json";
    }
    return p;
  }

  var resp = UrlFetchApp.fetch(url, buildParams_(headers));
  var status = resp.getResponseCode();
  var bodyText = resp.getContentText();

  // If Default Cloud Project returns 403 SERVICE_DISABLED / accessNotConfigured,
  // auto-discover an active GCP project, enable the target API via Service Usage, and retry!
  if (
    status === 403 &&
    serviceHost &&
    (bodyText.indexOf("SERVICE_DISABLED") !== -1 ||
     bodyText.indexOf("accessNotConfigured") !== -1 ||
     bodyText.indexOf("has not been used in project") !== -1 ||
     bodyText.indexOf("USER_PROJECT_DENIED") !== -1)
  ) {
    var fallbackProject = quotaProject || sgsRememberOrDiscoverQuotaProject_(token, url, bodyStr, true);
    if (fallbackProject) {
      try {
        UrlFetchApp.fetch(
          "https://serviceusage.googleapis.com/v1/projects/" +
            encodeURIComponent(fallbackProject) +
            "/services/" +
            encodeURIComponent(serviceHost) +
            ":enable",
          {
            method: "post",
            contentType: "application/json",
            payload: "{}",
            headers: {
              Authorization: "Bearer " + token,
              "X-Goog-User-Project": fallbackProject
            },
            muteHttpExceptions: true
          }
        );
        Utilities.sleep(1200);
      } catch (e) {}
      var retryHeaders = Object.assign({}, headers, { "X-Goog-User-Project": fallbackProject });
      var retryResp = UrlFetchApp.fetch(url, buildParams_(retryHeaders));
      if (retryResp.getResponseCode() < 400 || retryResp.getResponseCode() !== 403) {
        resp = retryResp;
        status = retryResp.getResponseCode();
        bodyText = retryResp.getContentText();
      }
    }
  }

  // Enrich openidconnect userinfo if Workspace restricts sub claim
  if (url.indexOf("https://openidconnect.googleapis.com/v1/userinfo") === 0 && status >= 200 && status < 300) {
    try {
      var parsed = JSON.parse(bodyText || "{}");
      var activeEmail = "";
      try { activeEmail = Session.getActiveUser().getEmail() || ""; } catch (e) {}
      if (!parsed.email && activeEmail) parsed.email = activeEmail;
      if (parsed.email && parsed.email_verified === undefined) parsed.email_verified = true;
      if (!parsed.sub && parsed.email) {
        var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, parsed.email.toLowerCase());
        parsed.sub = digest.map(function(b) { return ("0" + (b & 0xff).toString(16)).slice(-2); }).join("").slice(0, 32);
      }
      bodyText = JSON.stringify(parsed);
    } catch (e) {}
  }

  var rawHeaders = resp.getAllHeaders() || {};
  var cleanHeaders = {};
  Object.keys(rawHeaders).forEach(function(k) {
    var v = rawHeaders[k];
    cleanHeaders[k] = Array.isArray(v) ? v.join(", ") : String(v);
  });
  if (!cleanHeaders["content-type"] && !cleanHeaders["Content-Type"]) {
    cleanHeaders["content-type"] = "application/json";
  }

  return {
    status: status,
    headers: cleanHeaders,
    bodyText: bodyText
  };
}


function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🌐 Secure Gateway")
      .addItem("🚀 Secure Gateway 新規セットアップを開く", "openSgwSetupDialog")
      .addItem("📦 デプロイ管理・削除を開く", "openSgwDeploymentsDialog")
      .addItem("📄 受入証跡を開く", "openSgwEvidenceDialog")
      .addItem("📖 アーキテクチャ & ガイドを開く", "openSgwGuideDialog")
      .addSeparator()
      .addItem("📋 シートに構成・監査タブを初期化", "initializeSgwWorkbookSheets")
      .addToUi();
  } catch (e) {}
}

function doGet(e) {
  ensureSgwSheetsQuietly_();
  var view = (e && e.parameter && e.parameter.view) ? String(e.parameter.view) : "setup";
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(view) + ";</script>"
  );
  return HtmlService.createHtmlOutput(injected)
    .setTitle("🌐 Chrome Enterprise Premium — Secure Gateway Deployer")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function installOnTargetSpreadsheet() {
  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) throw new Error("Target spreadsheet not found.");
  ensureSgwSheetsQuietly_();
  var triggers = ScriptApp.getProjectTriggers();
  var exists = triggers.some(function(t) {
    return t.getHandlerFunction() === "onOpen" && t.getTriggerSourceId() === ss.getId();
  });
  if (!exists) {
    ScriptApp.newTrigger("onOpen").forSpreadsheet(ss).onOpen().create();
  }
  return { spreadsheetId: ss.getId(), url: ss.getUrl() };
}

function openSgwSetupDialog() {
  showSgwDialog_("setup", "🌐 Secure Gateway Deployer — 新規セットアップ");
}

function openSgwDeploymentsDialog() {
  showSgwDialog_("deployments", "📦 Secure Gateway Deployer — デプロイ管理・削除");
}

function openSgwEvidenceDialog() {
  showSgwDialog_("evidence", "📄 Secure Gateway Deployer — 受入証跡");
}

function openSgwGuideDialog() {
  showSgwDialog_("guide", "📖 Secure Gateway Deployer — ガイド");
}

function showSgwDialog_(initialView, title) {
  ensureSgwSheetsQuietly_();
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(initialView) + ";</script>"
  );
  var output = HtmlService.createHtmlOutput(injected)
    .setTitle(title)
    .setWidth(1380)
    .setHeight(860)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  var ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    installOnTargetSpreadsheet();
    throw new Error("スプレッドシートへのメニュー登録（onOpen トリガー）が完了しました。Google スプレッドシートの画面を再読み込みし、上部メニュー「🌐 Secure Gateway」から起動してください。");
  }
  ui.showModalDialog(output, title);
}

function initializeSgwWorkbookSheets() {
  ensureSgwSheetsQuietly_();
  var ss = sgsGetTargetSpreadsheet_();
  if (ss) {
    try {
      ss.toast(
        "「" + SGW_SUMMARY_SHEET + "」と「" + SGW_LOG_SHEET + "」シートを準備しました。",
        "🌐 Secure Gateway Deployer",
        5
      );
    } catch (e) {}
  }
}

function ensureSgwSheetsQuietly_() {
  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) return;

  var summary = ss.getSheetByName(SGW_SUMMARY_SHEET);
  if (!summary) {
    summary = ss.insertSheet(SGW_SUMMARY_SHEET, 1);
    summary.getRange("A1:F1").merge().setValue("🌐 Chrome Enterprise Premium — Secure Gateway 構成・リソース一覧")
      .setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold").setFontSize(13);
    summary.getRange("A3:B9").setValues([
      ["最終更新日時", "未実行"],
      ["実行管理者", Session.getActiveUser().getEmail() || "-"],
      ["Google Cloud プロジェクト ID", "-"],
      ["デプロイ名 / リージョン", "-"],
      ["プライベートホスト名 / 接続方式", "-"],
      ["対象 OU / 強制上書きモード", "-"],
      ["最新ステータス", "待機中 (メニュー「🌐 Secure Gateway」から起動してください)"]
    ]);
    summary.getRange("A3:A9").setBackground("#f1f3f4").setFontWeight("bold");
    summary.getRange("A11:F11").setValues([["プロバイダ", "リソース種別", "リソース名", "計画アクション", "ステータス", "更新日時"]])
      .setBackground("#e8f0fe").setFontWeight("bold");
    summary.setColumnWidth(1, 140);
    summary.setColumnWidth(2, 220);
    summary.setColumnWidth(3, 320);
    summary.setColumnWidth(4, 140);
    summary.setColumnWidth(5, 140);
    summary.setColumnWidth(6, 180);
    summary.setFrozenRows(11);
  }

  var logSheet = ss.getSheetByName(SGW_LOG_SHEET);
  if (!logSheet) {
    logSheet = ss.insertSheet(SGW_LOG_SHEET, 2);
    logSheet.getRange("A1:E1").setValues([["日時 (ISO)", "エンドポイント", "ステータス", "構成ハッシュ / ID", "詳細"]])
      .setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold");
    logSheet.setColumnWidth(1, 180);
    logSheet.setColumnWidth(2, 240);
    logSheet.setColumnWidth(3, 140);
    logSheet.setColumnWidth(4, 240);
    logSheet.setColumnWidth(5, 500);
    logSheet.setFrozenRows(1);
  }
}

function sgsRecordSheetAudit(event) {
  if (!event || !event.path) return { ok: true };
  var path = String(event.path);
  var req = event.request || {};
  var res = event.response || {};
  var ts = event.timestamp || new Date().toISOString();

  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) return { ok: true };
  ensureSgwSheetsQuietly_();

  var summary = ss.getSheetByName(SGW_SUMMARY_SHEET);
  var logSheet = ss.getSheetByName(SGW_LOG_SHEET);

  if (path === "/api/v1/plans" && res && res.plan_id) {
    var spec = (req && req.specification) || res.specification || {};
    var planBlock = res.plan || {};
    var ready = Boolean(res.ready_to_approve || planBlock.can_apply);
    var changes = Array.isArray(res.resource_changes)
      ? res.resource_changes
      : (Array.isArray(planBlock.changes) ? planBlock.changes : []);

    summary.getRange("B3").setValue(ts);
    summary.getRange("B5").setValue(spec.project_id || "-");
    summary.getRange("B6").setValue((spec.deployment_name || spec.name || "-") + " / " + (spec.region || "-"));
    summary.getRange("B7").setValue((spec.private_hostname || "-") + " (" + (spec.backend_kind || "-") + ")");
    summary.getRange("B8").setValue((spec.target_ou_id || "-") + (spec.force_overwrite ? " [強制上書きON]" : ""));
    summary.getRange("B9").setValue(ready ? "✅ プリフライト完了 (承認可能)" : "⚠️ プリフライト要確認");

    if (changes.length > 0) {
      var lastRow = Math.max(11, summary.getLastRow());
      if (lastRow > 11) {
        summary.getRange(12, 1, lastRow - 11, 6).clearContent();
      }
      var rows = changes.map(function(c) {
        return [
          String(c.provider || ""),
          String(c.resource_type || ""),
          String(c.resource_name || ""),
          String(c.action || ""),
          "計画済み",
          ts
        ];
      });
      summary.getRange(12, 1, rows.length, 6).setValues(rows);
    }

    if (logSheet) {
      logSheet.appendRow([ts, "POST /api/v1/plans", ready ? "READY" : "BLOCKED", res.plan_id, "Changes: " + changes.length]);
    }
    return { ok: true };
  }

  if (path.indexOf("/api/v1/runs") === 0 && res && res.run_id) {
    var status = String(res.status || "");
    summary.getRange("B3").setValue(ts);
    summary.getRange("B9").setValue("Run " + res.run_id + ": " + status);
    var ops = Array.isArray(res.operations) ? res.operations : [];
    if (ops.length > 0) {
      var lastRow2 = Math.max(11, summary.getLastRow());
      if (lastRow2 > 11) {
        summary.getRange(12, 1, lastRow2 - 11, 6).clearContent();
      }
      var opRows = ops.map(function(op) {
        var parts = String(op.resource_key || "::").split(":");
        return [
          parts[0] || "",
          parts[1] || "",
          parts.slice(2).join(":") || "",
          String(op.action || ""),
          String(op.status || "") + (op.error_code ? " (" + op.error_code + ")" : ""),
          ts
        ];
      });
      summary.getRange(12, 1, opRows.length, 6).setValues(opRows);
    }
    if (logSheet && (event.method === "POST" || status === "succeeded" || status === "failed" || status === "rolled_back")) {
      logSheet.appendRow([ts, event.method + " " + path, status, res.run_id, "Operations: " + ops.length]);
    }
  }
  return { ok: true };
}
