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
          var attempts = 0;
          var interval = setInterval(function() {
            attempts += 1;
            var nav = document.querySelector(".primary-nav");
            if (!nav) {
              if (attempts > 60) clearInterval(interval);
              return;
            }
            clearInterval(interval);
            if (INITIAL_VIEW && INITIAL_VIEW !== "guide") {
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
            }
            // In live Google Sheets (google.script.run present), auto-trigger Customer ID & OU detection
            // on Easy PoC open because Apps Script has already completed OAuth consent.
            if (EDITION === "easy-poc" && INITIAL_VIEW === "cepDeployer" && ((typeof google !== "undefined" && google.script && google.script.run) || typeof window.__sgsGasMock === "function")) {
              setTimeout(function() {
                var detectBtn = document.querySelector(".cep-auto-detect-btn") || document.querySelector("#btn-auto-detect-customer-id");
                if (detectBtn && !detectBtn.disabled) detectBtn.click();
              }, 220);
            }
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

function createSharedProxyAndQuotaHelpersGs(defaultSpreadsheetId) {
  return `
var DEFAULT_SPREADSHEET_ID = ${JSON.stringify(defaultSpreadsheetId)};

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
  var urlMatch = String(url || "").match(/\\/projects\\/([a-z][a-z0-9-]{4,29})(?:\\/|$|\\?)/i) ||
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
  if (!/^https:\\/\\/([a-z0-9-]+\\.)*googleapis\\.com\\//i.test(url)) {
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
  var hostMatch = url.match(/^https:\\/\\/([a-z0-9-]+\\.googleapis\\.com)\\//i);
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
`;
}

function createEasyPocCodeGs() {
  return `/**
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
${createSharedProxyAndQuotaHelpersGs("19xMGUHJFjF8SSiXV0kO-e8p49YqT1-xTEeo4raZMCv8")}

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
  SpreadsheetApp.getUi().showModalDialog(output, title);
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
`;
}

function createSgwDeployerCodeGs() {
  return `/**
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
${createSharedProxyAndQuotaHelpersGs("1V0ZIXaL-DIUuSogmX2MlyyWnDl9LQ06ayfCmcPYuyCQ")}

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
  SpreadsheetApp.getUi().showModalDialog(output, title);
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
`;
}

function createEasyPocAppsscriptJson() {
  return JSON.stringify(
    {
      timeZone: "Asia/Tokyo",
      dependencies: {
        enabledAdvancedServices: [
          {
            userSymbol: "AdminDirectory",
            serviceId: "admin",
            version: "directory_v1",
          },
          {
            userSymbol: "AdminReports",
            serviceId: "admin",
            version: "reports_v1",
          },
          {
            userSymbol: "AdminLicenseManager",
            serviceId: "licensing",
            version: "v1",
          },
          {
            userSymbol: "CloudIdentityGroups",
            serviceId: "cloudidentity",
            version: "v1",
          },
          {
            userSymbol: "Drive",
            serviceId: "drive",
            version: "v3",
          },
          {
            userSymbol: "Sheets",
            serviceId: "sheets",
            version: "v4",
          },
          {
            userSymbol: "Slides",
            serviceId: "slides",
            version: "v1",
          },
          {
            userSymbol: "Docs",
            serviceId: "docs",
            version: "v1",
          },
        ],
      },
      webapp: {
        executeAs: "USER_ACCESSING",
        access: "DOMAIN",
      },
      exceptionLogging: "STACKDRIVER",
      runtimeVersion: "V8",
      oauthScopes: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/presentations",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/script.external_request",
        "https://www.googleapis.com/auth/script.scriptapp",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
        "https://www.googleapis.com/auth/admin.directory.group.readonly",
        "https://www.googleapis.com/auth/admin.directory.customer.readonly",
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/admin.directory.rolemanagement",
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
      dependencies: {
        enabledAdvancedServices: [
          {
            userSymbol: "AdminDirectory",
            serviceId: "admin",
            version: "directory_v1",
          },
          {
            userSymbol: "CloudIdentityGroups",
            serviceId: "cloudidentity",
            version: "v1",
          },
          {
            userSymbol: "Drive",
            serviceId: "drive",
            version: "v3",
          },
          {
            userSymbol: "Sheets",
            serviceId: "sheets",
            version: "v4",
          },
        ],
      },
      webapp: {
        executeAs: "USER_ACCESSING",
        access: "DOMAIN",
      },
      exceptionLogging: "STACKDRIVER",
      runtimeVersion: "V8",
      oauthScopes: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/script.external_request",
        "https://www.googleapis.com/auth/script.scriptapp",
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

CERA 2.0 と同じ **Google スプレッドシート + Apps Script (GAS)** 構成で、Chrome 拡張機能のインストールや GCP プロジェクト番号の手動設定を行わずに、スプレッドシートの上部メニューまたは Web App から **CEP Easy PoC** と **CERA** をそのまま実行できるパッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| \`appsscript.json\` | Apps Script マニフェスト（Default Cloud Project 用 \`enabledAdvancedServices\`・OAuth スコープ定義） |
| \`Code.gs\` | スプレッドシート上部メニュー \`🛡️ CEP Easy PoC\`、\`doGet\` Web App、自動 Quota Project 検出・Service Usage 自動有効化付き \`UrlFetchApp\` プロキシ、シート自動記録処理 |
| \`Index.html\` | モーダル UI 本体（Easy PoC・DLP マトリクス・ライセンス管理・CERA・ガイド） |

## 使い方（CERA 2.0 方式・GCP プロジェクト番号の手動設定不要）

1. 配布用テンプレート（\`go/cep-easy-poc\` または \`https://docs.google.com/spreadsheets/d/19xMGUHJFjF8SSiXV0kO-e8p49YqT1-xTEeo4raZMCv8/copy\`）を開き、**［コピーを作成］** をクリックします。
2. 上部メニュー **\`🛡️ CEP Easy PoC\` ＞ \`🚀 Easy PoC デプロイヤーを開く\`**（または事前構築済み Apps Script プロジェクト \`1flNM6SM-lSGUSssW4OYJg7KYIu00vJbAuDXGivcV9bEM4qCjMI2zrf8L\` の \`installOnTargetSpreadsheet()\`）を実行します。
3. 初回実行時に Google アカウントの OAuth 承認画面が表示されたら許可します（Apps Script の Default Cloud Project 上で Admin SDK / Cloud Identity / License Manager 等が動作し、Chrome Policy API 等で Quota Project が必要な場合はアクセス可能な GCP プロジェクトを自動検出して有効化します）。
`;
  }
  return `# 🌐 Secure Gateway Deployer — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **Google スプレッドシート + Apps Script (GAS)** 構成で、スプレッドシートの上部メニューまたは Web App から **Chrome Enterprise Premium Secure Gateway Deployer**（4ステップ構成ウィザード・強制上書きモード・サンプルVM作成・デプロイ管理・削除）を実行できる単独パッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| \`appsscript.json\` | Apps Script マニフェスト（Default Cloud Project 用 \`enabledAdvancedServices\`・Google Cloud / Chrome Policy OAuth スコープ定義） |
| \`Code.gs\` | スプレッドシート上部メニュー \`🌐 Secure Gateway\`、\`doGet\` Web App、自動 Quota Project 検出付き \`UrlFetchApp\` プロキシ、構成・監査シート自動出力 |
| \`Index.html\` | モーダル UI 本体（新規セットアップ・デプロイ管理・受入証跡・ガイド） |

## 特徴（Apps Script 6分制限とローカルPoC証明書への対応）

- **GCP プロジェクト番号の手動紐付け不要**: Apps Script の Default Cloud Project でそのまま OAuth 認可が通り、デプロイ対象の GCP プロジェクト ID を \`X-Goog-User-Project\` として自動付与・API 自動有効化します。
- **6分実行制限の回避**: デプロイのステップ制御ループはモーダル側で動作し、1リクエストごとに \`google.script.run.sgsProxyFetch\`（約0.5〜2秒）を呼び出すため、VM 起動やゲートウェイ作成が数分かかっても Apps Script の6分制限に抵触しません。
- **ブラウザ内 WebCrypto による証明書生成**: ローカル PoC 用の ECDSA P-256 ルート CA 証明書・サーバー TLS 証明書はモーダル内の WebCrypto (\`crypto.subtle\`) で生成します。
- **シートへの自動記録**: プリフライトや適用を実行すると、スプレッドシート内の \`🌐 SGW 構成・リソース一覧\` および \`📜 SGW 実行・監査ログ\` シートにリソース計画と実行結果が自動出力されます。

## 使い方（CERA 2.0 方式）

1. 配布用テンプレート（\`go/sgw-deployer\` または \`https://docs.google.com/spreadsheets/d/1V0ZIXaL-DIUuSogmX2MlyyWnDl9LQ06ayfCmcPYuyCQ/copy\`）を開き、**［コピーを作成］** をクリックします。
2. 上部メニュー **\`🌐 Secure Gateway\` ＞ \`🚀 Secure Gateway 新規セットアップを開く\`**（または事前構築済み Apps Script プロジェクト \`1y4RFjFCVAS68x4CcZe5KZ9YnO9WN5jF6WzpZ_bjPUtbdQ_zBOeG0rHKt\` の \`installOnTargetSpreadsheet()\`）を実行します。
`;
}

async function main() {
  const { fakeIdbMin, swMin, appMin, cssMin } = await buildBundlePieces();

  await rm(gasRoot, { recursive: true, force: true });
  const easyPocDir = join(gasRoot, "easy-poc");
  const sgwDir = join(gasRoot, "sgw-deployer");
  await mkdir(easyPocDir, { recursive: true });
  await mkdir(sgwDir, { recursive: true });

  // Edition 1: Easy PoC (+ CERA) — hides Secure Gateway Deployer nav dropdown group & SGW Guide tab
  const easyPocExtraCss = `
    aside.sidebar .primary-nav .nav-dropdown-group,
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
