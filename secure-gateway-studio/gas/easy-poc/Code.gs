/**
 * Chrome Enterprise Premium (CEP) Easy PoC & CERA — Google Sheets + Apps Script Edition
 *
 * Container-bound Apps Script modeled after CERA 2.0:
 * - Adds the "🛡️ CEP Easy PoC" menu to the Google Sheets toolbar on open.
 * - Launches the self-contained CEP Easy PoC & CERA console inside a Google Sheets modal.
 * - Executes all Google Workspace / Chrome Policy / Cloud Identity DLP / Reports API calls
 *   directly from the user's own Google Workspace session via UrlFetchApp + ScriptApp.getOAuthToken().
 * - Automatically logs applied policies, DLP rules, license assignments, and rollbacks into
 *   formatted Google Sheets tabs ("📊 CEP 適用サマリー", "📜 CEP 実行トレース").
 */

var SUMMARY_SHEET_NAME = "📊 CEP 適用サマリー";
var TRACE_SHEET_NAME = "📜 CEP 実行トレース";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🛡️ CEP Easy PoC")
    .addItem("🚀 CEP Easy PoC コンソールを開く", "openCepEasyPocDialog")
    .addItem("📊 CERA ログ分析を開く (Chrome 監査ログ)", "openCeraDialog")
    .addItem("📖 セットアップガイドを開く", "openGuideDialog")
    .addSeparator()
    .addItem("📋 シートに監査・サマリータブを初期化", "initializeCepWorkbookSheets")
    .addToUi();
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
  SpreadsheetApp.getUi().showModalDialog(output, title);
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
 * Proxies Google API requests from the modal UI through Apps Script UrlFetchApp.
 * Each request completes in ~0.2-2s, avoiding any 6-minute execution limit issues.
 */
function sgsProxyFetch(req) {
  var url = String((req && req.url) || "");
  if (!/^https:\/\/([a-z0-9-]+\.)*googleapis\.com\//i.test(url)) {
    throw new Error("Blocked non-googleapis URL: " + url);
  }
  var headers = Object.assign({}, (req && req.headers) || {});
  if (!headers["Authorization"] && !headers["authorization"]) {
    headers["Authorization"] = "Bearer " + ScriptApp.getOAuthToken();
  }
  var method = String((req && req.method) || "GET").toUpperCase();
  var params = {
    method: method.toLowerCase(),
    headers: headers,
    muteHttpExceptions: true
  };
  if (req && req.body !== undefined && req.body !== null && method !== "GET" && method !== "HEAD") {
    params.payload = String(req.body);
    params.contentType = headers["Content-Type"] || headers["content-type"] || "application/json";
  }

  var resp = UrlFetchApp.fetch(url, params);
  var status = resp.getResponseCode();
  var bodyText = resp.getContentText();

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

/**
 * Initializes the summary and audit trace tabs in the active Google Spreadsheet.
 */
function initializeCepWorkbookSheets() {
  ensureWorkbookSheetsQuietly_();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "「" + SUMMARY_SHEET_NAME + "」と「" + TRACE_SHEET_NAME + "」シートを準備しました。",
    "🛡️ CEP Easy PoC",
    5
  );
}

function ensureWorkbookSheetsQuietly_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!summary) {
    summary = ss.insertSheet(SUMMARY_SHEET_NAME, 0);
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
    trace = ss.insertSheet(TRACE_SHEET_NAME, 1);
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

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { ok: true };
  ensureWorkbookSheetsQuietly_();

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME);
  var trace = ss.getSheetByName(TRACE_SHEET_NAME);

  if (path === "/api/v1/connections/workspace/validate" && res.customer_id) {
    summary.getRange("B3").setValue(ts);
    summary.getRange("B5").setValue(res.customer_id || "-");
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
