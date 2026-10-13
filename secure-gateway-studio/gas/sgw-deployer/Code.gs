/**
 * Secure Gateway Deployer — Google Sheets + Apps Script Edition
 *
 * Container-bound Apps Script modeled after CERA 2.0:
 * - Adds the "🌐 Secure Gateway" menu to the Google Sheets toolbar on open.
 * - Launches the 4-Step Secure Gateway Deployer & Operations Manager inside a Google Sheets modal.
 * - Proxies all Google Cloud / BeyondCorp / Compute / DNS / Secret Manager / Chrome Policy REST calls
 *   through Apps Script UrlFetchApp (< 2s per call, zero 6-minute execution limit issues).
 * - Automatically writes planned & applied resources and audit events into formatted Google Sheets tabs.
 */

var SGW_SUMMARY_SHEET = "🌐 SGW 構成・リソース一覧";
var SGW_LOG_SHEET = "📜 SGW 実行・監査ログ";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🌐 Secure Gateway")
    .addItem("🚀 Secure Gateway 新規セットアップを開く", "openSgwSetupDialog")
    .addItem("📦 デプロイ管理・削除を開く", "openSgwDeploymentsDialog")
    .addItem("📄 受入証跡を開く", "openSgwEvidenceDialog")
    .addItem("📖 アーキテクチャ & ガイドを開く", "openSgwGuideDialog")
    .addSeparator()
    .addItem("📋 シートに構成・監査タブを初期化", "initializeSgwWorkbookSheets")
    .addToUi();
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
  SpreadsheetApp.getUi().showModalDialog(output, title);
}

function sgsGetAuthToken() {
  var token = ScriptApp.getOAuthToken();
  var email = "";
  try {
    email = Session.getActiveUser().getEmail() || "";
  } catch (e) {}
  return { token: token, email: email };
}

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

function initializeSgwWorkbookSheets() {
  ensureSgwSheetsQuietly_();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "「" + SGW_SUMMARY_SHEET + "」と「" + SGW_LOG_SHEET + "」シートを準備しました。",
    "🌐 Secure Gateway Deployer",
    5
  );
}

function ensureSgwSheetsQuietly_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var summary = ss.getSheetByName(SGW_SUMMARY_SHEET);
  if (!summary) {
    summary = ss.insertSheet(SGW_SUMMARY_SHEET, 0);
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
    logSheet = ss.insertSheet(SGW_LOG_SHEET, 1);
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

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { ok: true };
  ensureSgwSheetsQuietly_();

  var summary = ss.getSheetByName(SGW_SUMMARY_SHEET);
  var logSheet = ss.getSheetByName(SGW_LOG_SHEET);

  if (path === "/api/v1/plans" && res && res.plan_id) {
    var spec = (req && req.specification) || {};
    summary.getRange("B3").setValue(ts);
    summary.getRange("B5").setValue(spec.project_id || "-");
    summary.getRange("B6").setValue((spec.deployment_name || "-") + " / " + (spec.region || "-"));
    summary.getRange("B7").setValue((spec.private_hostname || "-") + " (" + (spec.backend_kind || "-") + ")");
    summary.getRange("B8").setValue((spec.target_ou_id || "-") + (spec.force_overwrite ? " [強制上書きON]" : ""));
    summary.getRange("B9").setValue(res.ready_to_approve ? "✅ プリフライト完了 (承認可能)" : "⚠️ プリフライト要確認");

    var changes = Array.isArray(res.resource_changes) ? res.resource_changes : [];
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
      logSheet.appendRow([ts, "POST /api/v1/plans", res.ready_to_approve ? "READY" : "BLOCKED", res.plan_id, "Changes: " + changes.length]);
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
