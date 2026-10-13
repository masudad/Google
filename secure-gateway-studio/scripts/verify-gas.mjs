/**
 * End-to-End Verification for Google Sheets + Apps Script (GAS) Editions:
 *   1. gas/easy-poc/     (appsscript.json, Code.gs, Index.html)
 *   2. gas/sgw-deployer/ (appsscript.json, Code.gs, Index.html)
 *
 * Verifies:
 *   - appsscript.json manifest structure, Default Cloud Project enabledAdvancedServices, and OAuth scopes
 *   - Code.gs server functions (onOpen, doGet, installOnTargetSpreadsheet, sgsGetAuthToken,
 *     sgsProxyFetch with Default Cloud Project 403 SERVICE_DISABLED -> Auto Quota Project + Service Usage
 *     auto-enablement fallback, and sgsRecordSheetAudit writing to Google Sheets tabs)
 *   - Headless Chrome (gbrowser) rendering & interactive execution of Index.html for both editions
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import vm from "node:vm";

const execFileAsync = promisify(execFile);

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(scriptsDir, "..");
const gasRoot = join(studioRoot, "gas");
const GBROWSER_BIN = "/google/bin/releases/gemini-agents-gbrowser/gbrowser";

function createMockSpreadsheetEnv() {
  const sheets = new Map();
  const menuItems = [];
  const triggers = [];

  function makeRange(sheet, a1) {
    return {
      a1,
      merge() {
        return this;
      },
      setValue(val) {
        sheet.cells.set(a1, val);
        return this;
      },
      getValue() {
        return sheet.cells.get(a1) ?? "";
      },
      setValues(rows) {
        sheet.lastRows = rows;
        return this;
      },
      setBackground() {
        return this;
      },
      setFontColor() {
        return this;
      },
      setFontWeight() {
        return this;
      },
      setFontSize() {
        return this;
      },
      clearContent() {
        return this;
      },
    };
  }

  function makeSheet(name) {
    const sheet = {
      name,
      cells: new Map(),
      appendedRows: [],
      lastRows: [],
      getRange(a1OrRow, col, numRows, numCols) {
        const key =
          typeof a1OrRow === "string"
            ? a1OrRow
            : `R${a1OrRow}C${col}:${numRows || 1}x${numCols || 1}`;
        return makeRange(sheet, key);
      },
      setColumnWidth() {},
      setFrozenRows() {},
      getLastRow() {
        return 10 + sheet.lastRows.length;
      },
      appendRow(row) {
        sheet.appendedRows.push(row);
      },
    };
    return sheet;
  }

  const ss = {
    getId: () => "mock-spreadsheet-id",
    getUrl: () => "https://docs.google.com/spreadsheets/d/mock-spreadsheet-id/edit",
    getSheetByName(name) {
      return sheets.get(name) || null;
    },
    insertSheet(name) {
      const s = makeSheet(name);
      sheets.set(name, s);
      return s;
    },
    toast() {},
  };

  const userProps = new Map();
  const scriptProps = new Map();
  const fetchCalls = [];
  let simulateDefaultProject403Once = false;

  const sandbox = {
    SpreadsheetApp: {
      getUi() {
        return {
          createMenu(title) {
            const menu = {
              title,
              items: [],
              addItem(label, fn) {
                this.items.push({ label, fn });
                return this;
              },
              addSeparator() {
                return this;
              },
              addToUi() {
                menuItems.push(this);
              },
            };
            return menu;
          },
          showModalDialog() {},
        };
      },
      getActiveSpreadsheet: () => ss,
      openById: () => ss,
    },
    HtmlService: {
      SandboxMode: { IFRAME: "IFRAME" },
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
      createHtmlOutputFromFile() {
        return {
          getContent: () => "<!doctype html><html><head></head><body></body></html>",
        };
      },
      createHtmlOutput(html) {
        return {
          html,
          setTitle() {
            return this;
          },
          setWidth() {
            return this;
          },
          setHeight() {
            return this;
          },
          setSandboxMode() {
            return this;
          },
          setXFrameOptionsMode() {
            return this;
          },
        };
      },
    },
    ScriptApp: {
      getOAuthToken: () => "mock-gas-oauth-token",
      getProjectTriggers: () => triggers,
      newTrigger(fnName) {
        return {
          forSpreadsheet() {
            return {
              onOpen() {
                return {
                  create() {
                    triggers.push({
                      getHandlerFunction: () => fnName,
                      getTriggerSourceId: () => ss.getId(),
                    });
                  },
                };
              },
            };
          },
        };
      },
    },
    Session: {
      getActiveUser: () => ({
        getEmail: () => "admin@example.com",
      }),
    },
    PropertiesService: {
      getUserProperties: () => ({
        getProperty: (k) => userProps.get(k) || null,
        setProperty: (k, v) => userProps.set(k, String(v)),
      }),
      getScriptProperties: () => ({
        getProperty: (k) => scriptProps.get(k) || null,
        setProperty: (k, v) => scriptProps.set(k, String(v)),
      }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      computeDigest: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      sleep: () => {},
    },
    UrlFetchApp: {
      fetch(url, params) {
        fetchCalls.push({ url, params });
        if (url.startsWith("https://cloudresourcemanager.googleapis.com/v1/projects")) {
          return {
            getResponseCode: () => 200,
            getContentText: () =>
              JSON.stringify({
                projects: [{ projectId: "cep-poc-auto-project", lifecycleState: "ACTIVE" }],
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url.includes(":enable") && url.startsWith("https://serviceusage.googleapis.com/")) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({ done: true }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (simulateDefaultProject403Once && url.startsWith("https://chromepolicy.googleapis.com/")) {
          simulateDefaultProject403Once = false;
          return {
            getResponseCode: () => 403,
            getContentText: () =>
              JSON.stringify({
                error: {
                  code: 403,
                  message: "Chrome Policy API has not been used in project 123456 before or it is disabled.",
                  status: "PERMISSION_DENIED",
                  details: [{ reason: "SERVICE_DISABLED" }],
                },
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ ok: true, email: "admin@example.com" }),
          getAllHeaders: () => ({ "content-type": "application/json" }),
        };
      },
    },
  };

  return {
    sandbox,
    sheets,
    menuItems,
    triggers,
    fetchCalls,
    userProps,
    enableDefaultProject403Once() {
      simulateDefaultProject403Once = true;
    },
  };
}

async function verifyCodeGsAndManifests() {
  for (const edition of ["easy-poc", "sgw-deployer"]) {
    const dir = join(gasRoot, edition);
    const manifest = JSON.parse(await readFile(join(dir, "appsscript.json"), "utf8"));
    assert.equal(manifest.runtimeVersion, "V8");
    assert.ok(
      Array.isArray(manifest.dependencies?.enabledAdvancedServices) &&
        manifest.dependencies.enabledAdvancedServices.length >= 4,
      `${edition}: enabledAdvancedServices must be configured for Default Cloud Project`,
    );
    assert.ok(
      manifest.oauthScopes.includes("https://www.googleapis.com/auth/cloud-platform"),
      `${edition}: cloud-platform scope must be present`,
    );
    assert.ok(
      manifest.oauthScopes.includes("https://www.googleapis.com/auth/script.container.ui"),
      `${edition}: script.container.ui scope must be present for Ui.showModalDialog`,
    );
    assert.ok(
      manifest.oauthScopes.includes("https://www.googleapis.com/auth/script.external_request"),
      `${edition}: script.external_request scope must be present for UrlFetchApp`,
    );
    assert.ok(
      manifest.oauthScopes.includes("https://www.googleapis.com/auth/script.scriptapp"),
      `${edition}: script.scriptapp scope must be present for ScriptApp`,
    );

    const codeGs = await readFile(join(dir, "Code.gs"), "utf8");
    const env = createMockSpreadsheetEnv();
    vm.createContext(env.sandbox);
    vm.runInContext(codeGs, env.sandbox);

    // 1. Verify onOpen() menu registration
    env.sandbox.onOpen();
    assert.equal(env.menuItems.length, 1, `${edition}: onOpen should register 1 toolbar menu`);

    // 2. Verify doGet() Web App handler
    const webOut = env.sandbox.doGet({ parameter: {} });
    assert.ok(webOut.html.includes("window.__SGS_INITIAL_VIEW"), `${edition}: doGet should inject initial view`);

    // 3. Verify installOnTargetSpreadsheet()
    const installed = env.sandbox.installOnTargetSpreadsheet();
    assert.equal(installed.spreadsheetId, "mock-spreadsheet-id");
    assert.equal(env.triggers.length, 1);

    // 4. Verify sgsProxyFetch Default Cloud Project 403 SERVICE_DISABLED -> Auto Quota Project + Service Usage retry
    env.enableDefaultProject403Once();
    const res = env.sandbox.sgsProxyFetch({
      url: "https://chromepolicy.googleapis.com/v1/customers/C01234567/policySchemas",
      method: "GET",
      headers: {},
    });
    assert.equal(res.status, 200, `${edition}: sgsProxyFetch should auto-recover from Default Cloud Project 403 SERVICE_DISABLED`);
    assert.equal(
      env.userProps.get("SGS_QUOTA_PROJECT"),
      "cep-poc-auto-project",
      `${edition}: sgsProxyFetch should discover and cache active quota project`,
    );
    assert.ok(
      env.fetchCalls.some((c) => c.url.includes("serviceusage.googleapis.com/v1/projects/cep-poc-auto-project/services/chromepolicy.googleapis.com:enable")),
      `${edition}: sgsProxyFetch should auto-enable chromepolicy.googleapis.com via Service Usage API`,
    );

    // 5. Verify sgsRecordSheetAudit writes to Google Sheets tabs
    if (edition === "easy-poc") {
      env.sandbox.sgsRecordSheetAudit({
        edition: "easy-poc",
        method: "POST",
        path: "/api/v1/connections/workspace/validate",
        request: { customer_id: "my_customer" },
        response: { resource_id: "C01234567", primary_domain: "example.com" },
        timestamp: "2026-10-13T10:00:00Z",
      });
      env.sandbox.sgsRecordSheetAudit({
        edition: "easy-poc",
        method: "POST",
        path: "/api/v1/cep/provision",
        request: { customer_id: "C01234567", target_ou: "/CEP-PoC" },
        response: {
          success: true,
          applied_items: ["SafeBrowsingProtectionLevel", "CEP PoC - Universal Upload"],
          skipped_items: [],
          logs: ["Applied baseline policies and DLP rules"],
        },
        timestamp: "2026-10-13T10:01:00Z",
      });
      const summary = env.sheets.get("📊 CEP 適用サマリー");
      const trace = env.sheets.get("📜 CEP 実行トレース");
      assert.ok(summary, "Easy PoC summary sheet created");
      assert.ok(trace, "Easy PoC trace sheet created");
      assert.equal(summary.cells.get("B5"), "C01234567");
      assert.equal(summary.cells.get("B6"), "example.com");
      assert.equal(summary.cells.get("B7"), "/CEP-PoC");
      assert.equal(trace.appendedRows.length, 1);
    } else {
      env.sandbox.sgsRecordSheetAudit({
        edition: "sgw-deployer",
        method: "POST",
        path: "/api/v1/plans",
        request: {
          specification: {
            project_id: "demo-gcp-proj",
            name: "sgw-demo",
            region: "asia-northeast1",
            private_hostname: "app.internal",
            backend_kind: "managed_sample",
            target_ou_id: "03ph8a2z1example",
            force_overwrite: true,
          },
        },
        response: {
          plan_id: "plan-123",
          plan: {
            can_apply: true,
            changes: [
              {
                provider: "google_cloud",
                resource_type: "beyondcorp:security_gateway",
                resource_name: "default",
                action: "reuse",
              },
            ],
          },
        },
        timestamp: "2026-10-13T10:02:00Z",
      });
      const summary = env.sheets.get("🌐 SGW 構成・リソース一覧");
      const logSheet = env.sheets.get("📜 SGW 実行・監査ログ");
      assert.ok(summary, "SGW summary sheet created");
      assert.ok(logSheet, "SGW log sheet created");
      assert.equal(summary.cells.get("B5"), "demo-gcp-proj");
      assert.equal(logSheet.appendedRows.length, 1);
    }
  }
  console.log("✓ Verified appsscript.json and Code.gs (onOpen, doGet, Auto Quota Project, Sheet Audit) for both editions");
}

async function verifyBrowserBundles() {
  const easyHtml = await readFile(join(gasRoot, "easy-poc", "Index.html"), "utf8");
  const sgwHtml = await readFile(join(gasRoot, "sgw-deployer", "Index.html"), "utf8");

  const gasMockScript = `<script>
    window.__sgsAudits = [];
    window.__sgsFetches = [];
    window.__sgsGasMock = async function(fnName, payload) {
      if (fnName === "sgsGetAuthToken") {
        return { token: "mock-gas-oauth-token", email: "admin@example.com" };
      }
      if (fnName === "sgsRecordSheetAudit") {
        window.__sgsAudits.push(payload);
        return { ok: true };
      }
      if (fnName === "sgsProxyFetch") {
        window.__sgsFetches.push(payload);
        var u = String(payload && payload.url || "");
        if (u.indexOf("openidconnect.googleapis.com/v1/userinfo") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({ sub: "1234567890", email: "admin@example.com", email_verified: true })
          };
        }
        if (u.indexOf("/admin/directory/v1/customers/") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({ id: "C01234567", customerDomain: "example.com" })
          };
        }
        if (u.indexOf("/orgunits") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              organizationUnits: [
                { orgUnitId: "id:root", name: "Root", orgUnitPath: "/" },
                { orgUnitId: "id:poc123", name: "CEP-PoC", orgUnitPath: "/CEP-PoC", parentOrgUnitPath: "/" }
              ]
            })
          };
        }
        if (u.indexOf("/admin/directory/v1/groups") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              groups: [{ id: "g1", email: "cep-pilot@example.com", name: "CEP Pilot Group" }]
            })
          };
        }
        return {
          status: 200,
          headers: { "content-type": "application/json" },
          bodyText: JSON.stringify({})
        };
      }
      return {};
    };
  </script>`;

  const server = createServer((req, res) => {
    if (req.url?.startsWith("/easy-poc")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(easyHtml.replace("<head>", "<head>" + gasMockScript));
      return;
    }
    if (req.url?.startsWith("/sgw-deployer")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(sgwHtml.replace("<head>", "<head>" + gasMockScript));
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  try {
    // 1. Test Easy PoC + CERA Edition in Headless Chrome
    const easyBatchPath = "/tmp/verify_gas_easy_batch.json";
    const easyEvalOutPath = "/tmp/verify_gas_easy_out.json";
    await writeFile(
      easyBatchPath,
      JSON.stringify([
        { action: "navigate", url: `http://127.0.0.1:${port}/easy-poc` },
        { action: "sleep", duration: "1600ms" },
        {
          action: "eval",
          expression: `(() => {
            const btn = document.querySelector(".cep-auto-detect-btn");
            if (btn && !btn.disabled) btn.click();
            return Boolean(btn);
          })()`,
        },
        { action: "sleep", duration: "1600ms" },
        {
          action: "eval",
          file: easyEvalOutPath,
          expression: `JSON.stringify({
            title: document.title,
            ouSelectPresent: Boolean(document.querySelector("#cep-target-ou")),
            ouOptionsCount: document.querySelectorAll("#cep-target-ou option").length,
            ouLabels: Array.from(document.querySelectorAll("#cep-target-ou option")).map(o => o.textContent),
            auditsCount: (window.__sgsAudits || []).length,
            auditPaths: (window.__sgsAudits || []).map(a => a.path),
            fetchesCount: (window.__sgsFetches || []).length,
            sgwGroupHidden: getComputedStyle(document.querySelector("aside.sidebar .primary-nav .nav-dropdown-group")).display === "none",
            hasDeployAllBtn: Boolean(document.querySelector(".cep-deploy-all-btn")),
            hasCeraNavBtn: Array.from(document.querySelectorAll("aside.sidebar .primary-nav > button.nav-item")).some(b => /\\bCERA\\b/i.test(b.textContent || ""))
          })`,
        },
      ]),
    );

    await execFileAsync(GBROWSER_BIN, ["batch", easyBatchPath]);
    const easyRaw = (await readFile(easyEvalOutPath, "utf8")).trim();
    const easyState = JSON.parse(easyRaw.startsWith('"') ? JSON.parse(easyRaw) : easyRaw);
    assert.equal(easyState.sgwGroupHidden, true, "Easy PoC edition must hide SGW sidebar group");
    assert.equal(easyState.ouSelectPresent, true, "Easy PoC edition must render #cep-target-ou after auto-detect");
    assert.ok(easyState.ouOptionsCount >= 2, `Easy PoC edition should populate OUs via GAS proxy (got ${easyState.ouOptionsCount})`);
    assert.ok(easyState.auditsCount >= 1, "Easy PoC edition should record sheet audit on Workspace validate");
    assert.equal(easyState.hasDeployAllBtn, true, "Easy PoC edition must render 1-click Apply All button");
    assert.equal(easyState.hasCeraNavBtn, true, "Easy PoC edition must include CERA tab");
    console.log("✓ Verified gas/easy-poc/Index.html in headless Chrome:", easyState);

    // 2. Test SGW Deployer Edition in Headless Chrome
    const sgwBatchPath = "/tmp/verify_gas_sgw_batch.json";
    const sgwEvalOutPath = "/tmp/verify_gas_sgw_out.json";
    await writeFile(
      sgwBatchPath,
      JSON.stringify([
        { action: "navigate", url: `http://127.0.0.1:${port}/sgw-deployer` },
        { action: "sleep", duration: "1600ms" },
        {
          action: "eval",
          file: sgwEvalOutPath,
          expression: `JSON.stringify({
            title: document.title,
            hasForceOverwrite: document.body.innerText.includes("強制上書き") || document.body.innerText.includes("Force overwrite"),
            easyPocBtnHidden: getComputedStyle(document.querySelector("aside.sidebar .primary-nav > button.nav-item:nth-of-type(2)")).display === "none",
            ceraBtnHidden: getComputedStyle(document.querySelector("aside.sidebar .primary-nav > button.nav-item:nth-of-type(3)")).display === "none"
          })`,
        },
      ]),
    );

    await execFileAsync(GBROWSER_BIN, ["batch", sgwBatchPath]);
    const sgwRaw = (await readFile(sgwEvalOutPath, "utf8")).trim();
    const sgwState = JSON.parse(sgwRaw.startsWith('"') ? JSON.parse(sgwRaw) : sgwRaw);
    assert.equal(sgwState.easyPocBtnHidden, true, "SGW Deployer edition must hide Easy PoC sidebar item");
    assert.equal(sgwState.ceraBtnHidden, true, "SGW Deployer edition must hide CERA sidebar item");
    assert.equal(sgwState.hasForceOverwrite, true, "SGW Deployer edition must render Force Overwrite option in Step 1");
    console.log("✓ Verified gas/sgw-deployer/Index.html in headless Chrome:", sgwState);
  } finally {
    server.close();
  }
}

await verifyCodeGsAndManifests();
await verifyBrowserBundles();
console.log("ALL GAS E2E VERIFICATIONS PASSED!");
