/**
 * Builds two self-contained Google Sheets + Google Apps Script (GAS) packages
 * modeled after CERA 2.0 (container-bound Apps Script with custom Sheets menu,
 * HtmlService modal console, UrlFetchApp OAuth proxy, and automatic Sheets
 * audit/summary tab generation):
 *
 *   1. gas/easy-poc/     — Standalone CEP Easy PoC (+ CERA) for Google Sheets
 *   2. gas/sgw-deployer/ — Standalone Secure Gateway Deployer for Google Sheets
 */

import { build, transform } from "../extension/node_modules/esbuild/lib/main.js";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(scriptsDir, "..");
const extDir = join(studioRoot, "extension");
const distDir = join(extDir, "dist");
const gasRoot = join(studioRoot, "gas");

async function buildBundlePieces() {
  const swSource = await readFile(join(distDir, "src/background/service-worker.js"), "utf8");
  const appSource = await readFile(join(distDir, "src/ui/app.js"), "utf8");
  const cssSource = await readFile(join(distDir, "src/ui/app.css"), "utf8");

  // Bundle fake-indexeddb so if an enterprise browser blocks cross-origin iframe
  // IndexedDB inside Google Sheets HtmlService, the modal falls back seamlessly.
  const idbResult = await build({
    stdin: {
      contents: `import { IDBFactory, IDBKeyRange } from "fake-indexeddb"; window.__SGS_FakeIDB = { IDBFactory, IDBKeyRange };`,
      resolveDir: extDir,
      loader: "js",
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome142",
    minify: true,
    write: false,
  });
  const fakeIdbMin = idbResult.outputFiles[0].text;

  const swMin = (
    await transform(swSource, {
      loader: "js",
      format: "iife",
      target: "chrome142",
      minify: true,
    })
  ).code;

  const appMin = (
    await transform(appSource, {
      loader: "js",
      format: "iife",
      target: "chrome142",
      minify: true,
    })
  ).code;

  const cssMin = (
    await transform(cssSource, {
      loader: "css",
      minify: true,
    })
  ).code;

  return { fakeIdbMin, swMin, appMin, cssMin };
}

function escapeInlineScript(code) {
  // Prevent accidental </script> termination inside HTML <script> tags.
  return code.replace(/<\/script/gi, "<\\/script");
}

function createIndexHtml({ edition, title, extraCss, fakeIdbMin, swMin, appMin, cssMin }) {
  const defaultView = edition === "easy-poc" ? "cepDeployer" : "setup";
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>${cssMin}
${extraCss}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>${escapeInlineScript(fakeIdbMin)}</script>
    <script>
      (function() {
        var EDITION = ${JSON.stringify(edition)};
        var DEFAULT_VIEW = ${JSON.stringify(defaultView)};
        var INITIAL_VIEW = (typeof window.__SGS_INITIAL_VIEW === "string" && window.__SGS_INITIAL_VIEW)
          ? window.__SGS_INITIAL_VIEW
          : DEFAULT_VIEW;

        // 1. Always install in-memory IndexedDB inside Google Sheets HtmlService iframe
        // so cross-origin sandboxed iframes and waitForActiveTransaction work deterministically.
        function installFakeIndexedDb() {
          if (!window.__SGS_FakeIDB) return;
          try {
            Object.defineProperty(window, "indexedDB", {
              value: new window.__SGS_FakeIDB.IDBFactory(),
              configurable: true,
              writable: true
            });
            Object.defineProperty(window, "IDBKeyRange", {
              value: window.__SGS_FakeIDB.IDBKeyRange,
              configurable: true,
              writable: true
            });
          } catch (e) {}
        }
        installFakeIndexedDb();

        // 2. Helper to call Apps Script server functions via google.script.run.
        function callGas(fnName, payload) {
          return new Promise(function(resolve, reject) {
            if (typeof google !== "undefined" && google.script && google.script.run) {
              google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(function(err) {
                  reject(err instanceof Error ? err : new Error(String(err && err.message || err)));
                })[fnName](payload);
            } else if (typeof window.__sgsGasMock === "function") {
              Promise.resolve(window.__sgsGasMock(fnName, payload)).then(resolve, reject);
            } else {
              reject(new Error("Google Apps Script runtime (google.script.run) is not available."));
            }
          });
        }

        // 3. Intercept fetch() for *.googleapis.com and proxy through Apps Script UrlFetchApp.
        var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
        function normalizeHeaders(headersInit) {
          var out = {};
          if (!headersInit) return out;
          if (typeof Headers !== "undefined" && headersInit instanceof Headers) {
            headersInit.forEach(function(v, k) { out[k] = v; });
          } else if (Array.isArray(headersInit)) {
            headersInit.forEach(function(pair) {
              if (pair && pair.length >= 2) out[String(pair[0])] = String(pair[1]);
            });
          } else if (typeof headersInit === "object") {
            Object.keys(headersInit).forEach(function(k) {
              if (headersInit[k] !== undefined) out[k] = String(headersInit[k]);
            });
          }
          return out;
        }

        window.fetch = async function(input, init) {
          var url = typeof input === "string"
            ? input
            : (input && typeof input.url === "string" ? input.url : String(input));
          if (/^https:\\/\\/([a-z0-9-]+\\.)*googleapis\\.com\\//i.test(url)) {
            var method = (init && init.method) || (input && input.method) || "GET";
            var headers = normalizeHeaders((init && init.headers) || (input && input.headers));
            var body = init && typeof init.body === "string" ? init.body : undefined;
            var res = await callGas("sgsProxyFetch", {
              url: url,
              method: method,
              headers: headers,
              body: body
            });
            var status = Number(res && res.status) || 200;
            var bodyArg = (status === 204 || status === 205 || status === 304)
              ? null
              : String(res && res.bodyText !== undefined ? res.bodyText : "");
            return new Response(bodyArg, {
              status: status,
              headers: (res && res.headers) || { "content-type": "application/json" }
            });
          }
          if (nativeFetch) return nativeFetch(input, init);
          throw new Error("Unsupported fetch URL: " + url);
        };

        // 4. Shim chrome.* APIs in-process so service-worker.js and app.js share the window.
        var messageListeners = [];
        var alarmListeners = [];
        var alarmTimers = new Map();
        var localStore = {};
        var sessionStore = {};
        var cachedToken = null;

        function makeEvent(bucket) {
          return {
            addListener: function(fn) { if (typeof fn === "function") bucket.push(fn); },
            removeListener: function(fn) {
              var idx = bucket.indexOf(fn);
              if (idx >= 0) bucket.splice(idx, 1);
            }
          };
        }

        function makeStorageArea(backing) {
          return {
            get: function(keys, cb) {
              var out = {};
              if (!keys) {
                Object.assign(out, backing);
              } else if (typeof keys === "string") {
                if (keys in backing) out[keys] = backing[keys];
              } else if (Array.isArray(keys)) {
                keys.forEach(function(k) { if (k in backing) out[k] = backing[k]; });
              } else if (typeof keys === "object") {
                Object.keys(keys).forEach(function(k) {
                  out[k] = (k in backing) ? backing[k] : keys[k];
                });
              }
              if (typeof cb === "function") setTimeout(function() { cb(out); }, 0);
              return Promise.resolve(out);
            },
            set: function(items, cb) {
              if (items && typeof items === "object") Object.assign(backing, items);
              if (typeof cb === "function") setTimeout(function() { cb(); }, 0);
              return Promise.resolve();
            },
            remove: function(keys, cb) {
              var list = Array.isArray(keys) ? keys : [keys];
              list.forEach(function(k) { delete backing[k]; });
              if (typeof cb === "function") setTimeout(function() { cb(); }, 0);
              return Promise.resolve();
            },
            clear: function(cb) {
              Object.keys(backing).forEach(function(k) { delete backing[k]; });
              if (typeof cb === "function") setTimeout(function() { cb(); }, 0);
              return Promise.resolve();
            }
          };
        }

        var bootConsentPromise = null;
        function ensureBootConsent() {
          if (bootConsentPromise) return bootConsentPromise;
          bootConsentPromise = new Promise(function(resolve) {
            if (messageListeners.length === 0) {
              resolve();
              return;
            }
            messageListeners[0](
              { kind: "api", method: "POST", path: "/api/v1/privacy/consent/prepare", body: {} },
              {},
              function() {
                messageListeners[0](
                  { kind: "api", method: "POST", path: "/api/v1/privacy/consent/finalize", body: {} },
                  {},
                  function() { resolve(); }
                );
              }
            );
          });
          return bootConsentPromise;
        }

        window.chrome = {
          runtime: {
            id: "gas-" + EDITION,
            lastError: undefined,
            getManifest: function() {
              return {
                version: "0.2.81",
                name: EDITION === "easy-poc"
                  ? "Chrome Enterprise Premium Easy PoC (Sheets Edition)"
                  : "Secure Gateway Deployer (Sheets Edition)"
              };
            },
            getURL: function(path) { return String(path || ""); },
            onMessage: makeEvent(messageListeners),
            onInstalled: makeEvent([]),
            onStartup: makeEvent([]),
            sendMessage: function(msg) {
              return ensureBootConsent().then(function() {
                return new Promise(function(resolve) {
                  if (messageListeners.length === 0) {
                    resolve({ ok: false, status: 500, code: "worker-unavailable", message: "Worker not initialized" });
                    return;
                  }
                  var settled = false;
                  function finish(reply) {
                    if (settled) return;
                    settled = true;
                    if (msg && msg.kind === "api" && reply && reply.ok) {
                      callGas("sgsRecordSheetAudit", {
                        edition: EDITION,
                        method: msg.method,
                        path: msg.path,
                        request: msg.body || null,
                        response: reply.value || null,
                        timestamp: new Date().toISOString()
                      }).catch(function() {});
                    }
                    resolve(reply);
                  }
                  try {
                    messageListeners[0](msg, {}, finish);
                  } catch (err) {
                    finish({
                      ok: false,
                      status: 500,
                      code: "worker-error",
                      message: err instanceof Error ? err.message : String(err)
                    });
                  }
                });
              });
            }
          },
          identity: {
            getAuthToken: function(details, cb) {
              callGas("sgsGetAuthToken", { interactive: Boolean(details && details.interactive) })
                .then(function(res) {
                  cachedToken = res && res.token ? String(res.token) : "";
                  window.chrome.runtime.lastError = cachedToken ? undefined : { message: "No OAuth token returned by Apps Script." };
                  if (typeof cb === "function") cb(cachedToken);
                })
                .catch(function(err) {
                  window.chrome.runtime.lastError = { message: err instanceof Error ? err.message : String(err) };
                  if (typeof cb === "function") cb(undefined);
                });
            },
            removeCachedAuthToken: function(_details, cb) {
              cachedToken = null;
              window.chrome.runtime.lastError = undefined;
              if (typeof cb === "function") setTimeout(cb, 0);
            },
            clearAllCachedAuthTokens: function(cb) {
              cachedToken = null;
              window.chrome.runtime.lastError = undefined;
              if (typeof cb === "function") setTimeout(cb, 0);
            }
          },
          storage: {
            local: makeStorageArea(localStore),
            session: makeStorageArea(sessionStore)
          },
          alarms: {
            create: function(name, info) {
              if (alarmTimers.has(name)) clearTimeout(alarmTimers.get(name));
              var delayMs = Math.max(1500, Math.min(10000, ((info && info.delayInMinutes) || 0.05) * 60000));
              var timer = setTimeout(function() {
                alarmTimers.delete(name);
                alarmListeners.forEach(function(fn) {
                  try { fn({ name: name, scheduledTime: Date.now() }); } catch (e) {}
                });
              }, delayMs);
              alarmTimers.set(name, timer);
              return Promise.resolve();
            },
            clear: function(name) {
              if (alarmTimers.has(name)) {
                clearTimeout(alarmTimers.get(name));
                alarmTimers.delete(name);
              }
              return Promise.resolve(true);
            },
            onAlarm: makeEvent(alarmListeners)
          },
          action: {
            onClicked: makeEvent([])
          },
          tabs: {
            create: function(opts) {
              if (opts && opts.url) window.open(opts.url, "_blank", "noopener,noreferrer");
              return Promise.resolve({});
            }
          }
        };

        try {
          if (!localStorage.getItem("sgs.locale.v1")) {
            localStorage.setItem("sgs.locale.v1", "ja");
          }
        } catch (e) {}

        // 5. Automatically switch to the target initial view once the React sidebar mounts.
        function activateInitialView() {
          if (!INITIAL_VIEW || INITIAL_VIEW === "guide") return;
          var attempts = 0;
          var interval = setInterval(function() {
            attempts += 1;
            var nav = document.querySelector(".primary-nav");
            if (!nav) {
              if (attempts > 60) clearInterval(interval);
              return;
            }
            clearInterval(interval);
            var buttons = Array.from(nav.querySelectorAll("button"));
            var targetBtn = null;
            if (INITIAL_VIEW === "cepDeployer") {
              targetBtn = buttons.find(function(b) { return /Easy PoC/i.test(b.textContent || ""); });
            } else if (INITIAL_VIEW === "cera") {
              targetBtn = buttons.find(function(b) { return /\\bCERA\\b/i.test(b.textContent || ""); });
            } else if (INITIAL_VIEW === "setup") {
              targetBtn = buttons.find(function(b) { return /新規セットアップ|New Setup|Secure Gateway/i.test(b.textContent || ""); });
            } else if (INITIAL_VIEW === "deployments") {
              targetBtn = buttons.find(function(b) { return /デプロイ管理|Deployments/i.test(b.textContent || ""); });
            } else if (INITIAL_VIEW === "evidence") {
              targetBtn = buttons.find(function(b) { return /受入証跡|Evidence/i.test(b.textContent || ""); });
            }
            if (targetBtn) targetBtn.click();
          }, 80);
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", activateInitialView);
        } else {
          activateInitialView();
        }
      })();
    </script>
    <script>${escapeInlineScript(swMin)}</script>
    <script>${escapeInlineScript(appMin)}</script>
  </body>
</html>
`;
}

function createEasyPocCodeGs() {
  return `/**
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
  if (!/^https:\\/\\/([a-z0-9-]+\\.)*googleapis\\.com\\//i.test(url)) {
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
`;
}

function createSgwDeployerCodeGs() {
  return `/**
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
  if (!/^https:\\/\\/([a-z0-9-]+\\.)*googleapis\\.com\\//i.test(url)) {
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
`;
}

function createEasyPocAppsscriptJson() {
  return JSON.stringify(
    {
      timeZone: "Asia/Tokyo",
      dependencies: {},
      exceptionLogging: "STACKDRIVER",
      runtimeVersion: "V8",
      oauthScopes: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/spreadsheets.currentonly",
        "https://www.googleapis.com/auth/script.external_request",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
        "https://www.googleapis.com/auth/admin.directory.group.readonly",
        "https://www.googleapis.com/auth/admin.directory.customer.readonly",
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/cloud-identity.policies",
        "https://www.googleapis.com/auth/chrome.management.policy",
        "https://www.googleapis.com/auth/chrome.management.profiles.readonly",
        "https://www.googleapis.com/auth/apps.licensing",
        "https://www.googleapis.com/auth/admin.reports.audit.readonly",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
    },
    null,
    2,
  ) + "\n";
}

function createSgwDeployerAppsscriptJson() {
  return JSON.stringify(
    {
      timeZone: "Asia/Tokyo",
      dependencies: {},
      exceptionLogging: "STACKDRIVER",
      runtimeVersion: "V8",
      oauthScopes: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/spreadsheets.currentonly",
        "https://www.googleapis.com/auth/script.external_request",
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
        "https://www.googleapis.com/auth/admin.directory.group.readonly",
        "https://www.googleapis.com/auth/admin.directory.customer.readonly",
        "https://www.googleapis.com/auth/chrome.management.policy",
      ],
    },
    null,
    2,
  ) + "\n";
}

function createReadme(edition) {
  if (edition === "easy-poc") {
    return `# 🛡️ CEP Easy PoC & CERA — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **コンテナバインド型 Google スプレッドシート + Apps Script (GAS)** 構成で、Chrome 拡張機能のインストールや Chrome Web Store の審査を待たずに、スプレッドシートのカスタムメニューから **CEP Easy PoC** と **CERA** をフル機能で実行できるパッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| \`appsscript.json\` | Apps Script マニフェスト（OAuth スコープ定義） |
| \`Code.gs\` | スプレッドシート上部メニュー \`🛡️ CEP Easy PoC\`、\`UrlFetchApp\` プロキシ、シート自動記録処理 |
| \`Index.html\` | モーダル UI 本体（Easy PoC・DLP マトリクス・ライセンス管理・CERA・ガイド） |

## セットアップ手順（3分）

1. **Google スプレッドシートを新規作成**し、上部メニューの **［拡張機能］＞［Apps Script］** を開きます。
2. Apps Script エディタ左側の **［⚙ プロジェクトの設定］** を開き、以下を設定します：
   - **「「appsscript.json」マニフェスト ファイルをエディタで表示する」** にチェックを入れます。
   - **「Google Cloud Platform (GCP) プロジェクト」** で **［プロジェクトを変更］** を押し、以下の API を有効化した GCP プロジェクト番号を入力します（OAuth 同意画面は「内部」で構いません）：
     - Admin SDK API (\`admin.googleapis.com\`)
     - Chrome Policy API (\`chromepolicy.googleapis.com\`)
     - Cloud Identity API (\`cloudidentity.googleapis.com\`)
     - Enterprise License Manager API (\`licensing.googleapis.com\`)
3. エディタに戻り、以下の3ファイルを貼り付けて保存します：
   - \`appsscript.json\`
   - \`Code.gs\`（既存の \`コード.gs\` を置き換え）
   - **［＋］＞［HTML］** からファイル名 \`Index\`（\`.html\` は自動付与）を作成し、\`Index.html\` の中身を貼り付け
4. スプレッドシートを再読み込みすると、上部メニューに **\`🛡️ CEP Easy PoC\`** が表示されます。
5. 一度設定したスプレッドシートは、CERA と同じく URL 末尾を \`/copy\` に変えて配布することで、コピー先でもそのまま利用できます。
`;
  }
  return `# 🌐 Secure Gateway Deployer — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **コンテナバインド型 Google スプレッドシート + Apps Script (GAS)** 構成で、スプレッドシートのカスタムメニューから **Chrome Enterprise Premium Secure Gateway Deployer**（4ステップ構成ウィザード・強制上書きモード・サンプルVM作成・デプロイ管理・削除）を実行できる単独パッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| \`appsscript.json\` | Apps Script マニフェスト（Google Cloud / Chrome Policy OAuth スコープ定義） |
| \`Code.gs\` | スプレッドシート上部メニュー \`🌐 Secure Gateway\`、\`UrlFetchApp\` プロキシ、構成・監査シート自動出力 |
| \`Index.html\` | モーダル UI 本体（新規セットアップ・デプロイ管理・受入証跡・ガイド） |

## 特徴（Apps Script 6分制限とローカルPoC証明書への対応）

- **6分実行制限の回避**: デプロイのステップ制御ループはモーダル側で動作し、1リクエストごとに \`google.script.run.sgsProxyFetch\`（約0.5〜2秒）を呼び出すため、VM 起動やゲートウェイ作成が数分かかっても Apps Script の6分制限に抵触しません。
- **ブラウザ内 WebCrypto による証明書生成**: ローカル PoC 用の ECDSA P-256 ルート CA 証明書・サーバー TLS 証明書はモーダル内の WebCrypto (\`crypto.subtle\`) で生成します。
- **シートへの自動記録**: プリフライトや適用を実行すると、スプレッドシート内の \`🌐 SGW 構成・リソース一覧\` および \`📜 SGW 実行・監査ログ\` シートにリソース計画と実行結果が自動出力されます。

## セットアップ手順（3分）

1. **Google スプレッドシートを新規作成**し、**［拡張機能］＞［Apps Script］** を開きます。
2. **［⚙ プロジェクトの設定］** で **「「appsscript.json」マニフェスト ファイルをエディタで表示する」** にチェックを入れ、対象の **GCP プロジェクト番号** を設定します。
3. \`appsscript.json\`、\`Code.gs\`、および HTML ファイル \`Index\`（\`Index.html\` の内容）を貼り付けて保存します。
4. スプレッドシートを再読み込みし、上部メニュー **\`🌐 Secure Gateway\` ＞ \`🚀 Secure Gateway 新規セットアップを開く\`** から起動します。
`;
}

async function main() {
  const { fakeIdbMin, swMin, appMin, cssMin } = await buildBundlePieces();

  await rm(gasRoot, { recursive: true, force: true });
  const easyPocDir = join(gasRoot, "easy-poc");
  const sgwDir = join(gasRoot, "sgw-deployer");
  await mkdir(easyPocDir, { recursive: true });
  await mkdir(sgwDir, { recursive: true });

  // Edition 1: Easy PoC (+ CERA) — hides Secure Gateway Deployer nav group & SGW Guide tab
  const easyPocExtraCss = `
    aside.sidebar .primary-nav .nav-group { display: none !important; }
    #guide-tab-sgw { display: none !important; }
  `;
  const easyPocHtml = createIndexHtml({
    edition: "easy-poc",
    title: "CEP Easy PoC & CERA (Google Sheets Edition)",
    extraCss: easyPocExtraCss,
    fakeIdbMin,
    swMin,
    appMin,
    cssMin,
  });

  await writeFile(join(easyPocDir, "appsscript.json"), createEasyPocAppsscriptJson(), "utf8");
  await writeFile(join(easyPocDir, "Code.gs"), createEasyPocCodeGs(), "utf8");
  await writeFile(join(easyPocDir, "Index.html"), easyPocHtml, "utf8");
  await writeFile(join(easyPocDir, "README.md"), createReadme("easy-poc"), "utf8");

  // Edition 2: Secure Gateway Deployer — hides Easy PoC & CERA nav buttons and their Guide tabs
  const sgwExtraCss = `
    aside.sidebar .primary-nav > button.nav-item:nth-of-type(2),
    aside.sidebar .primary-nav > button.nav-item:nth-of-type(3) { display: none !important; }
    #guide-tab-easy-poc, #guide-tab-cera { display: none !important; }
  `;
  const sgwHtml = createIndexHtml({
    edition: "sgw-deployer",
    title: "Secure Gateway Deployer (Google Sheets Edition)",
    extraCss: sgwExtraCss,
    fakeIdbMin,
    swMin,
    appMin,
    cssMin,
  });

  await writeFile(join(sgwDir, "appsscript.json"), createSgwDeployerAppsscriptJson(), "utf8");
  await writeFile(join(sgwDir, "Code.gs"), createSgwDeployerCodeGs(), "utf8");
  await writeFile(join(sgwDir, "Index.html"), sgwHtml, "utf8");
  await writeFile(join(sgwDir, "README.md"), createReadme("sgw-deployer"), "utf8");

  console.log("Built Google Sheets + Apps Script editions:");
  console.log("  1. gas/easy-poc/     (appsscript.json, Code.gs, Index.html, README.md)");
  console.log("  2. gas/sgw-deployer/ (appsscript.json, Code.gs, Index.html, README.md)");
}

await main();
