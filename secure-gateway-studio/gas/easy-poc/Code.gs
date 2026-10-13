/**
 * Chrome Enterprise Premium (CEP) Easy PoC & CERA — Google Sheets + Apps Script Edition
 *
 * Modeled after CERA 2.0 (Zero-Config Default Cloud Project):
 * - Adds the "🛡️ CEP Easy PoC" menu to the Google Sheets toolbar on open (and supports direct Web App execution via doGet).
 * - Launches the self-contained CEP Easy PoC & CERA console inside a Google Sheets modal.
 * - Executes all Google Workspace / Chrome Policy / Cloud Identity DLP / Reports API calls
 *   directly from the user's own Google Workspace session via UrlFetchApp + ScriptApp.getOAuthToken().
 * - Automatically logs applied policies, DLP rules, license assignments, and rollbacks into
 *   formatted Google Sheets tabs ("📊 CEP 適用サマリー", "📜 CEP 実行トレース").
 */

var SUMMARY_SHEET_NAME = "📊 CEP 適用サマリー";
var TRACE_SHEET_NAME = "📜 CEP 実行トレース";

var DEFAULT_SPREADSHEET_ID = "19xMGUHJFjF8SSiXV0kO-e8p49YqT1-xTEeo4raZMCv8";

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
      .createMenu("🛡️ CEP Easy PoC")
      .addItem("🚀 CEP Easy PoC コンソールを開く", "openCepEasyPocDialog")
      .addItem("📊 CERA ログ分析を開く (Chrome 監査ログ)", "openCeraDialog")
      .addItem("📖 セットアップガイドを開く", "openGuideDialog")
      .addSeparator()
      .addItem("📋 シートに監査・サマリータブを初期化", "initializeCepWorkbookSheets")
      .addToUi();
  } catch (e) {}
}

function doGet(e) {
  ensureWorkbookSheetsQuietly_();
  var view = (e && e.parameter && e.parameter.view) ? String(e.parameter.view) : "cepDeployer";
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(view) + ";</script>"
  );
  return HtmlService.createHtmlOutput(injected)
    .setTitle("🛡️ Chrome Enterprise Premium — Easy PoC & CERA")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * One-click helper to install an onOpen trigger onto the template Google Sheet
 * and initialize its summary & audit tabs.
 */
function installOnTargetSpreadsheet() {
  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) throw new Error("Target spreadsheet not found.");
  ensureWorkbookSheetsQuietly_();
  var triggers = ScriptApp.getProjectTriggers();
  var exists = triggers.some(function(t) {
    return t.getHandlerFunction() === "onOpen" && t.getTriggerSourceId() === ss.getId();
  });
  if (!exists) {
    ScriptApp.newTrigger("onOpen").forSpreadsheet(ss).onOpen().create();
  }
  return { spreadsheetId: ss.getId(), url: ss.getUrl() };
}

function openCepEasyPocDialog() {
  showStudioDialog_("cepDeployer", "🛡️ Chrome Enterprise Premium — Easy PoC デプロイコンソール");
}

function openCeraDialog() {
  showStudioDialog_("cera", "📊 CERA — Chrome Egress Risk Analysis");
}

function openGuideDialog() {
  showStudioDialog_("guide", "📖 CEP Easy PoC & CERA ガイド");
}

function showStudioDialog_(initialView, title) {
  ensureWorkbookSheetsQuietly_();
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
    throw new Error("スプレッドシートへのメニュー登録（onOpen トリガー）が完了しました。Google スプレッドシートの画面を再読み込みし、上部メニュー「🛡️ CEP Easy PoC」から起動してください。");
  }
  ui.showModalDialog(output, title);
}

/**
 * Initializes the summary and audit trace tabs in the target Google Spreadsheet.
 */
function initializeCepWorkbookSheets() {
  ensureWorkbookSheetsQuietly_();
  var ss = sgsGetTargetSpreadsheet_();
  if (ss) {
    try {
      ss.toast(
        "「" + SUMMARY_SHEET_NAME + "」と「" + TRACE_SHEET_NAME + "」シートを準備しました。",
        "🛡️ CEP Easy PoC",
        5
      );
    } catch (e) {}
  }
}

function ensureWorkbookSheetsQuietly_() {
  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) return;

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!summary) {
    summary = ss.insertSheet(SUMMARY_SHEET_NAME, 1);
    summary.getRange("A1:E1").merge().setValue("🛡️ Chrome Enterprise Premium (CEP) Easy PoC — 適用状況サマリー")
      .setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold").setFontSize(13);
    summary.getRange("A3:B8").setValues([
      ["最終更新日時", "未実行"],
      ["実行管理者アカウント", Session.getActiveUser().getEmail() || "-"],
      ["Workspace 顧客 ID", "-"],
      ["プライマリドメイン", "-"],
      ["最終対象 OU / グループ", "-"],
      ["最終ステータス", "待機中 (メニュー「🛡️ CEP Easy PoC」から起動してください)"]
    ]);
    summary.getRange("A3:A8").setBackground("#f1f3f4").setFontWeight("bold");
    summary.getRange("A10:E10").setValues([["種別", "項目 / ポリシー・DLP ルール", "対象スコープ", "結果", "記録日時"]])
      .setBackground("#e8f0fe").setFontWeight("bold");
    summary.setColumnWidth(1, 160);
    summary.setColumnWidth(2, 420);
    summary.setColumnWidth(3, 220);
    summary.setColumnWidth(4, 140);
    summary.setColumnWidth(5, 180);
    summary.setFrozenRows(10);
  }

  var trace = ss.getSheetByName(TRACE_SHEET_NAME);
  if (!trace) {
    trace = ss.insertSheet(TRACE_SHEET_NAME, 2);
    trace.getRange("A1:F1").setValues([["日時 (ISO)", "操作種別", "対象スコープ", "結果", "適用件数", "詳細トレース"]])
      .setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold");
    trace.setColumnWidth(1, 180);
    trace.setColumnWidth(2, 180);
    trace.setColumnWidth(3, 220);
    trace.setColumnWidth(4, 120);
    trace.setColumnWidth(5, 100);
    trace.setColumnWidth(6, 520);
    trace.setFrozenRows(1);
  }
}

/**
 * Automatically records CEP Easy PoC operations into the Google Spreadsheet tabs.
 */
function sgsRecordSheetAudit(event) {
  if (!event || !event.path) return { ok: true };
  var path = String(event.path);
  var req = event.request || {};
  var res = event.response || {};
  var ts = event.timestamp || new Date().toISOString();

  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) return { ok: true };
  ensureWorkbookSheetsQuietly_();

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME);
  var trace = ss.getSheetByName(TRACE_SHEET_NAME);

  if (path === "/api/v1/connections/workspace/validate" && (res.resource_id || res.customer_id)) {
    summary.getRange("B3").setValue(ts);
    summary.getRange("B5").setValue(res.resource_id || res.customer_id || "-");
    summary.getRange("B6").setValue(res.primary_domain || "-");
    return { ok: true };
  }

  if (
    path === "/api/v1/cep/provision" ||
    path === "/api/v1/cep/rollback" ||
    path === "/api/v1/cep/assign-licenses" ||
    path === "/api/v1/cep/roles" ||
    path === "/api/v1/cep/provision-gemini"
  ) {
    var targetLabel = req.target_group_email || req.target_ou_path || req.target_ou || req.project_id || "-";
    var applied = Array.isArray(res.applied_items) ? res.applied_items : [];
    var skipped = Array.isArray(res.skipped_items) ? res.skipped_items : [];
    var logs = Array.isArray(res.logs) ? res.logs : [];
    var statusText = res.success ? "✅ 成功" : "⚠️ 一部スキップ / 確認";

    summary.getRange("B3").setValue(ts);
    summary.getRange("B5").setValue(req.customer_id || summary.getRange("B5").getValue());
    summary.getRange("B7").setValue(targetLabel);
    summary.getRange("B8").setValue(statusText + " (" + path.replace("/api/v1/cep/", "") + ")");

    var rows = [];
    applied.forEach(function(item) {
      rows.push(["適用済み", String(item), targetLabel, "✅ 適用", ts]);
    });
    skipped.forEach(function(item) {
      rows.push(["スキップ / 注意", String(item), targetLabel, "ℹ️ スキップ", ts]);
    });
    if (rows.length > 0) {
      var lastRow = Math.max(10, summary.getLastRow());
      if (lastRow > 10) {
        summary.getRange(11, 1, lastRow - 10, 5).clearContent();
      }
      summary.getRange(11, 1, rows.length, 5).setValues(rows);
    }

    if (trace) {
      trace.appendRow([
        ts,
        path.replace("/api/v1/cep/", ""),
        targetLabel,
        statusText,
        applied.length,
        logs.join(" | ").slice(0, 45000)
      ]);
    }
  }
  return { ok: true };
}
