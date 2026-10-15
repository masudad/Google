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
      getDisplayValues() {
        return sheet.displayValues || [];
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
      displayValues: [],
      getName() {
        return sheet.name;
      },
      setName(newName) {
        sheets.delete(sheet.name);
        sheet.name = newName;
        sheets.set(newName, sheet);
      },
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
        return sheet.displayValues.length > 0
          ? sheet.displayValues.length
          : 10 + sheet.lastRows.length;
      },
      getLastColumn() {
        return sheet.displayValues[0]?.length || 6;
      },
      appendRow(row) {
        sheet.appendedRows.push(row);
      },
    };
    return sheet;
  }

  const ss = {
    getId: () => "mock-spreadsheet-id",
    getName: () => "CERA 2.0 Analytical Workbook",
    getUrl: () => "https://docs.google.com/spreadsheets/d/mock-spreadsheet-id/edit",
    getSheets() {
      return Array.from(sheets.values());
    },
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
  let simulateDefaultProject403Count = 0;

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
        deleteProperty: (k) => userProps.delete(k),
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
        if (url === "https://cloudresourcemanager.googleapis.com/v1/projects/unenabled-proj-999") {
          return {
            getResponseCode: () => 403,
            getContentText: () =>
              JSON.stringify({
                error: {
                  code: 403,
                  message: "Cloud Resource Manager API has not been used in project 523129175171 before or it is disabled.",
                  status: "PERMISSION_DENIED",
                  details: [{ reason: "SERVICE_DISABLED" }],
                },
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url === "https://serviceusage.googleapis.com/v1/projects/unenabled-proj-999/services/serviceusage.googleapis.com") {
          return {
            getResponseCode: () => 200,
            getContentText: () =>
              JSON.stringify({
                name: "projects/436802999888/services/serviceusage.googleapis.com",
                state: "ENABLED",
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url === "https://cloudresourcemanager.googleapis.com/v1/projects/no-access-proj-403") {
          return {
            getResponseCode: () => 403,
            getContentText: () =>
              JSON.stringify({
                error: {
                  code: 403,
                  message: "Cloud Resource Manager API has not been used in project 523129175171 before or it is disabled.",
                  status: "PERMISSION_DENIED",
                  details: [{ reason: "SERVICE_DISABLED" }],
                },
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url === "https://serviceusage.googleapis.com/v1/projects/no-access-proj-403/services/serviceusage.googleapis.com") {
          return {
            getResponseCode: () => 403,
            getContentText: () =>
              JSON.stringify({
                error: {
                  code: 403,
                  message: "The caller does not have permission",
                  status: "PERMISSION_DENIED",
                },
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url === "https://cloudresourcemanager.googleapis.com/v1/projects/no-access-proj-403:testIamPermissions") {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({}),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (/^https:\/\/cloudresourcemanager\.googleapis\.com\/v1\/projects\/([^/?#:]+)$/i.test(url)) {
          const pid = url.split("/").pop();
          return {
            getResponseCode: () => 200,
            getContentText: () =>
              JSON.stringify({
                projectId: pid,
                projectNumber: "987654321098",
                lifecycleState: "ACTIVE",
                parent: { type: "organization", id: "111222333444" },
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
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
        if ((url.includes(":enable") || url.includes(":batchEnable")) && url.startsWith("https://serviceusage.googleapis.com/")) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({ done: true }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (simulateDefaultProject403Count > 0 && url.startsWith("https://chromepolicy.googleapis.com/")) {
          simulateDefaultProject403Count -= 1;
          return {
            getResponseCode: () => 403,
            getContentText: () =>
              JSON.stringify({
                error: {
                  code: 403,
                  message: "Chrome Policy API has not been used in project 523129175171 before or it is disabled.",
                  status: "PERMISSION_DENIED",
                  details: [{ reason: "SERVICE_DISABLED" }],
                },
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url.includes("/orgunits")) {
          return {
            getResponseCode: () => 200,
            getContentText: () =>
              JSON.stringify({
                organizationUnits: [
                  {
                    orgUnitId: "id:poc123",
                    name: "CEP-PoC",
                    orgUnitPath: "/CEP-PoC",
                    parentOrgUnitId: "id:root",
                    parentOrgUnitPath: "/",
                  },
                ],
              }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url.includes("/admin/directory/v1/customers/")) {
          return {
            getResponseCode: () => 200,
            getContentText: () =>
              JSON.stringify({ id: "C01234567", customerDomain: "example.com" }),
            getAllHeaders: () => ({ "content-type": "application/json" }),
          };
        }
        if (url.includes("/admin/directory/v1/groups")) {
          return {
            getResponseCode: () => 200,
            getContentText: () =>
              JSON.stringify({
                groups: [{ id: "g1", email: "cep-pilot@example.com", name: "CEP Pilot Group" }],
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
    enableDefaultProject403(count = 2) {
      simulateDefaultProject403Count = count;
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
    // Google Sheets clamps dialogs to 80% of the editor viewport; a large
    // initial request is what lets the console take all of it on any monitor.
    assert.ok(
      codeGs.includes(".setWidth(1920)") && codeGs.includes(".setHeight(1200)"),
      `${edition}: showModalDialog HtmlOutput must request 1920x1200 so Sheets can clamp it to its 80% viewport maximum`,
    );
    const env = createMockSpreadsheetEnv();
    vm.createContext(env.sandbox);
    vm.runInContext(codeGs, env.sandbox);

    // 1. Verify onOpen() menu registration
    env.sandbox.onOpen();
    assert.equal(env.menuItems.length, 1, `${edition}: onOpen should register 1 toolbar menu`);

    // 2. Verify doGet() Web App handler & sgsBuildBootstrapState_()
    const webOut = env.sandbox.doGet({ parameter: {} });
    assert.ok(webOut.html.includes("window.__SGS_INITIAL_VIEW"), `${edition}: doGet should inject initial view`);
    assert.ok(webOut.html.includes("window.__SGS_BOOTSTRAP"), `${edition}: doGet should inject server-side OAuth bootstrap state`);
    const bootState = env.sandbox.sgsBuildBootstrapState_();
    assert.equal(bootState.customerId, "C01234567", `${edition}: sgsBuildBootstrapState_ should resolve canonical customerId`);
    assert.equal(bootState.defaultProjectId, "cep-poc-auto-project", `${edition}: sgsBuildBootstrapState_ should resolve defaultProjectId`);
    assert.equal(bootState.orgUnits.length, 1, `${edition}: sgsBuildBootstrapState_ should pre-fetch non-root orgUnits (omitting /)`);
    assert.equal(bootState.orgUnits[0].value, "poc123", `${edition}: sgsBuildBootstrapState_ must normalize orgUnitId to bare ID without 'id:' prefix`);
    assert.equal(bootState.orgUnits[0].label, "/CEP-PoC", `${edition}: sgsBuildBootstrapState_ should preserve orgUnitPath in label`);

    // 3. Verify installOnTargetSpreadsheet()
    const installed = env.sandbox.installOnTargetSpreadsheet();
    assert.equal(installed.spreadsheetId, "mock-spreadsheet-id");
    assert.equal(env.triggers.length, 1);

    // 4. Verify sgsProxyFetch Default Cloud Project 403 SERVICE_DISABLED -> Auto Quota Project + Service Usage multi-retry
    env.enableDefaultProject403(2);
    const res = env.sandbox.sgsProxyFetch({
      url: "https://chromepolicy.googleapis.com/v1/customers/C01234567/policySchemas",
      method: "GET",
      headers: {},
    });
    assert.equal(res.status, 200, `${edition}: sgsProxyFetch should auto-recover across multiple 403 SERVICE_DISABLED propagation delays`);
    assert.equal(
      env.userProps.get("SGS_QUOTA_PROJECT"),
      "cep-poc-auto-project",
      `${edition}: sgsProxyFetch should discover and cache active quota project`,
    );
    assert.ok(
      env.fetchCalls.some((c) => c.url.includes("serviceusage.googleapis.com/v1/projects/cep-poc-auto-project/services/chromepolicy.googleapis.com:enable")),
      `${edition}: sgsProxyFetch should auto-enable chromepolicy.googleapis.com via Service Usage API`,
    );

    // 4b. Verify sgsProxyFetch rewrites CRM v3 /v3/projects/<id> to CRM v1 /v1/projects/<id>, attaches X-Goog-User-Project, and normalizes payload
    const crmRes = env.sandbox.sgsProxyFetch({
      url: "https://cloudresourcemanager.googleapis.com/v3/projects/montreal-436802",
      method: "GET",
      headers: {},
    });
    assert.equal(crmRes.status, 200, `${edition}: sgsProxyFetch should succeed for CRM project lookup via v1`);
    const crmBody = JSON.parse(crmRes.bodyText);
    assert.equal(crmBody.projectId, "montreal-436802");
    assert.equal(crmBody.name, "projects/987654321098");
    assert.equal(crmBody.parent, "organizations/111222333444");
    const crmCall = env.fetchCalls.find((c) => c.url === "https://cloudresourcemanager.googleapis.com/v1/projects/montreal-436802");
    assert.ok(crmCall, `${edition}: sgsProxyFetch must call CRM v1 /v1/projects/montreal-436802`);
    assert.equal(
      crmCall.params?.headers?.["X-Goog-User-Project"],
      "montreal-436802",
      `${edition}: sgsProxyFetch must attach X-Goog-User-Project: montreal-436802 on CRM v1 project lookup`,
    );
    assert.ok(
      !env.fetchCalls.some((c) => c.url.includes("cloudresourcemanager.googleapis.com/v3/projects/")),
      `${edition}: sgsProxyFetch must never hit CRM v3 /v3/projects/ (which fails on Default Cloud Project 523129175171)`,
    );

    // 4c. Verify sgsProxyFetch resolves project via Service Usage (without X-Goog-User-Project) when CRM v1 returns 403 SERVICE_DISABLED on 523129175171
    const suFallbackRes = env.sandbox.sgsProxyFetch({
      url: "https://cloudresourcemanager.googleapis.com/v1/projects/unenabled-proj-999",
      method: "GET",
      headers: {},
    });
    assert.equal(suFallbackRes.status, 200, `${edition}: sgsProxyFetch should resolve authorized project via Service Usage when CRM v1 is disabled on 523129175171`);
    const suFallbackBody = JSON.parse(suFallbackRes.bodyText);
    assert.equal(suFallbackBody.projectId, "unenabled-proj-999");
    assert.equal(suFallbackBody.projectNumber, "436802999888");
    assert.equal(suFallbackBody.name, "projects/436802999888");

    // 4d. Verify sgsProxyFetch returns a clean 403 (never fake 200 and never 523129175171) when caller lacks IAM permissions
    const deniedRes = env.sandbox.sgsProxyFetch({
      url: "https://cloudresourcemanager.googleapis.com/v1/projects/no-access-proj-403",
      method: "GET",
      headers: {},
    });
    assert.equal(deniedRes.status, 403, `${edition}: sgsProxyFetch must return 403 when caller lacks IAM access`);
    assert.ok(
      !deniedRes.bodyText.includes("523129175171"),
      `${edition}: sgsProxyFetch 403 error must never mention Default Cloud Project 523129175171`,
    );
    assert.ok(
      deniedRes.bodyText.includes("no-access-proj-403") && deniedRes.bodyText.includes("admin@example.com"),
      `${edition}: sgsProxyFetch 403 error must name the target project and signed-in account`,
    );
    assert.notEqual(
      env.userProps.get("SGS_QUOTA_PROJECT"),
      "no-access-proj-403",
      `${edition}: sgsProxyFetch must not persist an unauthorized project to SGS_QUOTA_PROJECT`,
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
      const summary = env.sheets.get("📊 CEP Summary");
      const trace = env.sheets.get("📜 CEP Audit Trace");
      assert.ok(summary, "Easy PoC summary sheet created");
      assert.ok(trace, "Easy PoC trace sheet created");
      assert.equal(summary.cells.get("B5"), "C01234567");
      assert.equal(summary.cells.get("B6"), "example.com");
      assert.equal(summary.cells.get("B7"), "/CEP-PoC");
      assert.equal(trace.appendedRows.length, 1);

      // Verify CERA menu item replaced standalone CERA dialog with CERA Export Import
      const easyMenuFns = env.menuItems[0].items.map((i) => i.fn);
      assert.ok(
        easyMenuFns.includes("openCeraImportDialog"),
        "Easy PoC menu must include openCeraImportDialog",
      );
      assert.ok(
        !easyMenuFns.includes("openCeraDialog"),
        "Easy PoC menu must not include standalone openCeraDialog",
      );

      // Verify sgsImportCeraSpreadsheet reads Executive Overview from CERA 2.0 sheet
      const overviewSheet = env.sandbox.SpreadsheetApp.getActiveSpreadsheet().insertSheet("Executive Overview");
      overviewSheet.displayValues = [
        ["Vector", "Actions", "Sensitive", "Top Destinations", "Top OU"],
        ["Shadow AI", "215", "42", "chatgpt.com (120), claude.ai (95)", "/CEP-PoC"],
        ["Personal Accounts", "140", "19", "drive.google.com (90), mail.google.com (50)", "/CEP-PoC"],
      ];
      const importedSheet = env.sandbox.sgsImportCeraSpreadsheet({
        spreadsheetIdOrUrl: "https://docs.google.com/spreadsheets/d/mock-spreadsheet-id/edit",
      });
      assert.equal(importedSheet.ok, true);
      assert.equal(importedSheet.kind, "cera2_sheets");
      assert.equal(importedSheet.overviewRows.length, 3);
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
      const summary = env.sheets.get("🌐 SGW Resource Inventory");
      const logSheet = env.sheets.get("📜 SGW Audit Log");
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
    window.__SGS_BOOTSTRAP = {
      token: "mock-gas-oauth-token",
      email: "admin@example.com",
      sub: "1234567890abcdef1234567890abcdef",
      customerId: "C01234567",
      primaryDomain: "example.com",
      orgUnits: [
        { value: "id:root", label: "/", description: "Root organizational unit" },
        { value: "id:poc123", label: "/CEP-PoC", description: "/CEP-PoC" }
      ],
      groups: [
        { value: "cep-pilot@example.com", label: "CEP Pilot Group (cep-pilot@example.com)", description: "cep-pilot@example.com" }
      ],
      projects: [
        { projectId: "cep-poc-auto-project", name: "CEP PoC Auto Project" }
      ],
      defaultProjectId: "cep-poc-auto-project"
    };
    window.__sgsAudits = [];
    window.__sgsFetches = [];
    window.__sgsGasMock = async function(fnName, payload) {
      if (fnName === "sgsGetAuthToken") {
        // Simulate multi-account iframe callback rejection to verify BOOT.token fallback
        throw new Error("その操作を実行するには承認が必要です。");
      }
      if (fnName === "sgsRecordSheetAudit") {
        window.__sgsAudits.push(payload);
        return { ok: true };
      }
      if (fnName === "sgsImportCeraSpreadsheet") {
        return {
          ok: true,
          kind: "cera2_sheets",
          title: "CERA 2.0 Analytical Workbook (Live Sheet)",
          spreadsheetId: "mock-cera-sheet-id",
          overviewRows: [
            ["CORPORATE DOMAINS", "example.com, corp-subsidiary.jp"],
            ["Exfiltration Vector", "Total Volume", "Sensitive Actions", "Top Destinations", "Primary Impacted OU"],
            ["Shadow AI", "312", "48", "chatgpt.com (190), claude.ai (122)", "/CEP-PoC (190)"],
            ["Personal Accounts", "164", "22", "drive.google.com (110), mail.google.com (54)", "/CEP-PoC (110)"],
            ["Unmanaged Apps", "88", "15", "wetransfer.com (58), mega.nz (30)", "/CEP-PoC (58)"],
            ["Web Messaging", "45", "9", "web.whatsapp.com (30), discord.com (15)", "/CEP-PoC (30)"]
          ],
          outcomesRows: [
            ["Print Job Audit", "34", "Sensitive Print Jobs", "11"],
            ["Inbound File Downloads", "76", "Malware Blocked", "4"]
          ],
          radarRows: [
            ["Password Reuse Signals", "8"],
            ["Unsafe Site Visits", "14"],
            ["Extension Installs", "19"]
          ]
        };
      }
      if (fnName === "sgsProxyFetch") {
        window.__sgsFetches.push(payload);
        var u = String(payload && payload.url || "");
        if (u.indexOf("openidconnect.googleapis.com/v1/userinfo") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({ sub: "1234567890abcdef1234567890abcdef", email: "admin@example.com", email_verified: true })
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
        if (u.indexOf("cloudresourcemanager.googleapis.com/v3/projects/") !== -1) {
          return {
            status: 403,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              error: {
                code: 403,
                message: "Cloud Resource Manager API has not been used in project 523129175171 before or it is disabled.",
                status: "PERMISSION_DENIED",
                details: [{ reason: "SERVICE_DISABLED" }]
              }
            })
          };
        }
        if (u.indexOf("cloudresourcemanager.googleapis.com/v1/projects/unenabled-proj-999") !== -1) {
          return {
            status: 403,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              error: {
                code: 403,
                message: "Cloud Resource Manager API has not been used in project 523129175171 before or it is disabled.",
                status: "PERMISSION_DENIED",
                details: [{ reason: "SERVICE_DISABLED" }]
              }
            })
          };
        }
        if (u.indexOf("serviceusage.googleapis.com/v1/projects/unenabled-proj-999/services/serviceusage.googleapis.com") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              name: "projects/436802999888/services/serviceusage.googleapis.com",
              state: "ENABLED"
            })
          };
        }
        if (u.indexOf("cloudresourcemanager.googleapis.com/v1/projects/montreal-436802") !== -1 && window.__sgsMontrealMode === "unauthorized") {
          return {
            status: 403,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              error: {
                code: 403,
                message: "Access denied to Google Cloud project 'montreal-436802' for signed-in account admin@example.com. Verify the project ID 'montreal-436802' exists and grant at least 'Viewer' (roles/viewer) + 'Service Usage Consumer' (roles/serviceusage.serviceUsageConsumer) on 'montreal-436802' at https://console.cloud.google.com/iam-admin/iam?project=montreal-436802",
                status: "PERMISSION_DENIED",
                details: [{ reason: "PROJECT_ACCESS_DENIED", domain: "cloudresourcemanager.googleapis.com", metadata: { project: "montreal-436802", account: "admin@example.com" } }]
              }
            })
          };
        }
        if (u.indexOf("serviceusage.googleapis.com/v1/projects/montreal-436802/services/serviceusage.googleapis.com") !== -1) {
          if (window.__sgsMontrealMode === "unauthorized") {
            return {
              status: 403,
              headers: { "content-type": "application/json" },
              bodyText: JSON.stringify({
                error: { code: 403, message: "The caller does not have permission", status: "PERMISSION_DENIED" }
              })
            };
          }
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              name: "projects/436802112233/services/serviceusage.googleapis.com",
              state: "ENABLED"
            })
          };
        }
        if (u.indexOf("cloudresourcemanager.googleapis.com/v1/projects/montreal-436802") !== -1 && window.__sgsMontrealMode === "crm_disabled_but_su_ok") {
          return {
            status: 403,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              error: {
                code: 403,
                message: "Cloud Resource Manager API has not been used in project 523129175171 before or it is disabled.",
                status: "PERMISSION_DENIED",
                details: [{ reason: "SERVICE_DISABLED" }]
              }
            })
          };
        }
        if (u.indexOf("cloudresourcemanager.googleapis.com/v1/projects/") !== -1) {
          var pid = u.split("/").pop().split("?")[0];
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              projectId: pid,
              projectNumber: "987654321098",
              lifecycleState: "ACTIVE",
              parent: { type: "organization", id: "111222333444" }
            })
          };
        }
        if (u.indexOf("accesscontextmanager.googleapis.com/v1/accessPolicies") !== -1 && window.__sgsMontrealMode === "crm_disabled_but_su_ok") {
          // Simulate a project-level user who lacks Org-level ACM permissions
          return {
            status: 403,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              error: { code: 403, message: "The caller does not have permission on organization", status: "PERMISSION_DENIED" }
            })
          };
        }
        if (u.indexOf("accesscontextmanager.googleapis.com/v1/accessPolicies/999888777") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              name: "accessPolicies/999888777",
              parent: "organizations/111222333444",
              title: "Default Policy"
            })
          };
        }
        if (u.indexOf("accesscontextmanager.googleapis.com/v1/accessPolicies") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              accessPolicies: [{ name: "accessPolicies/999888777", parent: "organizations/111222333444", title: "Default Policy" }]
            })
          };
        }
        if (u.indexOf("chromepolicy.googleapis.com/v1/customers/") !== -1 && u.indexOf("/policySchemas") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              policySchemas: [
                {
                  schemaName: "chrome.users.apps.InstallType",
                  definition: {
                    messageType: [
                      {
                        name: "InstallType",
                        field: [{ name: "appInstallType", type: "TYPE_ENUM", typeName: ".AppInstallType" }]
                      }
                    ],
                    enumType: [
                      {
                        name: "AppInstallType",
                        value: [{ name: "FORCED" }, { name: "ALLOWED" }]
                      }
                    ]
                  }
                }
              ]
            })
          };
        }
        if (u.indexOf("chromepolicy.googleapis.com/v1/customers/") !== -1 && u.indexOf(":batchModify") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({})
          };
        }
        if (u.indexOf("chromepolicy.googleapis.com/v1/customers/") !== -1 && u.indexOf(":resolve") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({ resolvedPolicies: [] })
          };
        }
        if (u.indexOf("cloudidentity.googleapis.com/v1beta1/policies") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({ policies: [] })
          };
        }
        if (u.indexOf("/admin/directory/v1/users") !== -1) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              users: [{ primaryEmail: "pilot1@example.com", orgUnitPath: "/CEP-PoC" }]
            })
          };
        }
        if (u.indexOf("licensing.googleapis.com/apps/licensing/v1/product/") !== -1) {
          if (String(payload && payload.method || "GET").toUpperCase() === "GET") {
            return {
              status: 404,
              headers: { "content-type": "application/json" },
              bodyText: JSON.stringify({ error: { code: 404, message: "Not Found" } })
            };
          }
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            bodyText: JSON.stringify({
              userId: "pilot1@example.com",
              skuId: "1010400001",
              productId: "101040"
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
      const userHtml = easyHtml.replace("<head>", "<head>" + gasMockScript);
      const safeJson = JSON.stringify(userHtml).replace(/<\/script/gi, "<\\/script");
      res.end(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><iframe id="userHtmlFrame" style="width:100vw;height:100vh;border:0" src="about:blank"></iframe><script>
        var f = document.getElementById("userHtmlFrame");
        var w = f.contentWindow;
        w.document.open();
        w.document.write(${safeJson});
        w.document.close();
      </script></body></html>`);
      return;
    }
    if (req.url?.startsWith("/sgw-deployer")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      const userHtml = sgwHtml.replace("<head>", "<head>" + gasMockScript);
      const safeJson = JSON.stringify(userHtml).replace(/<\/script/gi, "<\\/script");
      res.end(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><iframe id="userHtmlFrame" style="width:100vw;height:100vh;border:0" src="about:blank"></iframe><script>
        var f = document.getElementById("userHtmlFrame");
        var w = f.contentWindow;
        w.document.open();
        w.document.write(${safeJson});
        w.document.close();
      </script></body></html>`);
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
            const f = document.getElementById("userHtmlFrame");
            const doc = f?.contentDocument || document;
            const win = f?.contentWindow || window;
            win.__initialLangLabel = doc.querySelector(".language-trigger")?.textContent?.trim() || "";
            win.__initialHasDeployAllBtn = Boolean(doc.querySelector(".cep-deploy-all-btn"));
            const langTrigger = doc.querySelector(".language-trigger");
            if (langTrigger) langTrigger.click();
            setTimeout(() => {
              const jaOption = Array.from(doc.querySelectorAll(".language-option")).find(b => (b.textContent || "").includes("日本語"));
              if (jaOption) jaOption.click();
              setTimeout(() => {
                win.__switchedToJaLabel = doc.querySelector(".language-trigger")?.textContent?.trim() || "";
                const trig2 = doc.querySelector(".language-trigger");
                if (trig2) trig2.click();
                setTimeout(() => {
                  const enOption = Array.from(doc.querySelectorAll(".language-option")).find(b => (b.textContent || "").includes("English"));
                  if (enOption) enOption.click();
                  setTimeout(() => {
                    win.__switchedBackToEnLabel = doc.querySelector(".language-trigger")?.textContent?.trim() || "";
                  }, 80);
                }, 80);
              }, 80);
            }, 80);
            const refreshBtn = doc.querySelector(".cep-ou-header-actions button:last-child");
            if (refreshBtn && !refreshBtn.disabled) refreshBtn.click();
            win.__gcpValPromise = win.chrome.runtime.sendMessage({
              kind: "api",
              method: "POST",
              path: "/api/v1/connections/google-cloud/validate",
              body: { project_id: "montreal-436802" }
            }).then(r => { win.__gcpValResult = r; });
            win.__gcpUnenabledPromise = win.chrome.runtime.sendMessage({
              kind: "api",
              method: "POST",
              path: "/api/v1/connections/google-cloud/validate",
              body: { project_id: "unenabled-proj-999" }
            }).then(r => { win.__gcpUnenabledResult = r; });
            win.__gcpValPromise.then(async () => {
              win.__sgsMontrealMode = "crm_disabled_but_su_ok";
              win.__gcpMontrealSuFallbackResult = await win.chrome.runtime.sendMessage({
                kind: "api",
                method: "POST",
                path: "/api/v1/connections/google-cloud/validate",
                body: { project_id: "montreal-436802" }
              });
              win.__sgsMontrealMode = "unauthorized";
              win.__gcpMontrealDeniedResult = await win.chrome.runtime.sendMessage({
                kind: "api",
                method: "POST",
                path: "/api/v1/connections/google-cloud/validate",
                body: { project_id: "montreal-436802" }
              });
              win.__sgsMontrealMode = "";
              // Verify CEP provision, rollback, and assign-licenses mutations succeed with bare or id:-prefixed target_ou_id
              win.__cepProvisionResult = await win.chrome.runtime.sendMessage({
                kind: "api",
                method: "POST",
                path: "/api/v1/cep/provision",
                body: {
                  customer_id: "C01234567",
                  target_type: "ou",
                  target_ou_id: "id:poc123",
                  target_ou_path: "/CEP-PoC",
                  target_ou_confirmation: "/CEP-PoC",
                  core_policies: false,
                  force_extensions: true,
                  connectors: false,
                  access_level: "NONE",
                  dlp_detectors: false,
                  dlp_rules: false,
                  data_boundary_mode: "none",
                  create_sub_ous: false
                }
              });
              win.__cepRollbackResult = await win.chrome.runtime.sendMessage({
                kind: "api",
                method: "POST",
                path: "/api/v1/cep/rollback",
                body: {
                  customer_id: "C01234567",
                  target_type: "ou",
                  target_ou_id: "poc123",
                  target_ou_path: "/CEP-PoC",
                  target_ou_confirmation: "/CEP-PoC",
                  rollback_modules: ["extensions"],
                  delete_dlp_rules: false
                }
              });
              win.__cepLicenseResult = await win.chrome.runtime.sendMessage({
                kind: "api",
                method: "POST",
                path: "/api/v1/cep/assign-licenses",
                body: {
                  customer_id: "C01234567",
                  target_ou_id: "id:poc123",
                  target_ou_path: "/CEP-PoC",
                  target_ou_confirmation: "/CEP-PoC"
                }
              });
            });
            // Open CERA Export Import Modal after refresh settles, import from CERA 2.0 Google Sheet, and apply settings to Easy PoC
            setTimeout(() => {
              const openCeraImportBtn = doc.querySelector("#btn-open-cera-import");
              if (openCeraImportBtn) {
                openCeraImportBtn.click();
                setTimeout(() => {
                  const importSheetBtn = doc.querySelector("#btn-cera-import-sheet");
                  if (importSheetBtn) importSheetBtn.click();
                  setTimeout(() => {
                    win.__ceraImportedSourceName = doc.querySelector("#cera-detected-source-name")?.textContent?.trim() || "";
                    win.__ceraImportedShadowAiCount = doc.querySelector("#cera-metric-shadow-ai")?.textContent?.trim() || "";
                    const applyCeraBtn = doc.querySelector("#btn-apply-cera-config");
                    if (applyCeraBtn) applyCeraBtn.click();
                  }, 250);
                }, 120);
              }
            }, 350);
            return Boolean(refreshBtn);
          })()`,
        },
        { action: "sleep", duration: "2000ms" },
        {
          action: "eval",
          file: easyEvalOutPath,
          expression: `(() => {
            const f = document.getElementById("userHtmlFrame");
            const doc = f?.contentDocument || document;
            const win = f?.contentWindow || window;
            const bodyText = doc.body.innerText || "";
            const fetchUrls = (win.__sgsFetches || []).map(x => x.url);
            const crmMontFetch = (win.__sgsFetches || []).find(x => String(x.url || "").includes("cloudresourcemanager.googleapis.com/v1/projects/montreal-436802"));
            const deniedMsg = String(win.__gcpMontrealDeniedResult?.message || win.__gcpMontrealDeniedResult?.value?.message || win.__gcpMontrealDeniedResult?.error?.message || "");
            const ceraNavBtn = doc.querySelector("aside.sidebar .primary-nav > button.nav-item:nth-of-type(3)");
            // Context-Aware Access levels are a checkbox list (several levels per run).
            const accessLevelBoxes = doc.querySelectorAll("input[data-access-level]");
            const corpBox = doc.querySelector('input[data-access-level="AUTO_CREATE_CORP_OWNED"]');
            const byodBox = doc.querySelector('input[data-access-level="AUTO_CREATE_BYOD"]');
            if (corpBox && !corpBox.checked) corpBox.click();
            if (byodBox && !byodBox.checked) byodBox.click();
            const accessLevelSummary = doc.querySelector(".cep-access-level-summary")?.textContent?.trim() || "";
            const primaryBadges = Array.from(doc.querySelectorAll(".cep-access-level-list .cep-badge")).length;
            // Cloud popover: the connected-account label and value must stack, not run together.
            // The harness connects GCP through the worker API rather than the top-bar UI, so
            // the popover may not carry a status block; measure the real popover when it is
            // there and otherwise a probe rendered with the exact same markup and styles.
            const cloudBtn = doc.querySelector(".header-actions .identity-menu button.identity-control");
            let popoverStatusDisplay = "";
            let popoverLabelAboveValue = false;
            let popoverStatusText = "";
            let popoverStatusSource = "";
            const measureStatus = (status) => {
              popoverStatusDisplay = win.getComputedStyle(status).display;
              popoverStatusText = status.textContent || "";
              const label = status.querySelector("small");
              const value = status.querySelector("code, strong");
              if (label && value) {
                popoverLabelAboveValue = value.getBoundingClientRect().top >= label.getBoundingClientRect().bottom - 1;
              }
            };
            if (cloudBtn) {
              cloudBtn.click();
              const status = doc.querySelector(".identity-popover-status");
              if (status) {
                popoverStatusSource = "popover";
                measureStatus(status);
              }
            }
            if (!popoverStatusSource) {
              const probe = doc.createElement("div");
              probe.className = "identity-popover";
              probe.innerHTML = '<div class="identity-popover-status"><svg width="15" height="15"></svg><div><small>Active Credential</small><code>admin@example.com</code></div></div>';
              doc.body.appendChild(probe);
              popoverStatusSource = "probe";
              measureStatus(probe.querySelector(".identity-popover-status"));
              probe.remove();
            }
            return JSON.stringify({
              title: doc.title,
              accessLevelCheckboxCount: accessLevelBoxes.length,
              accessLevelSelectGone: !doc.querySelector("#cep-access-level"),
              accessLevelSummaryAfterTwo: accessLevelSummary,
              accessLevelPrimaryBadges: primaryBadges,
              popoverStatusDisplay,
              popoverLabelAboveValue,
              popoverStatusText,
              popoverStatusSource,
              dialogFitScriptPresent: /google\.script\.host|script\.host/.test(doc.documentElement.outerHTML),
              initialLangLabel: win.__initialLangLabel || "",
              switchedToJaLabel: win.__switchedToJaLabel || "",
              switchedBackToEnLabel: win.__switchedBackToEnLabel || "",
              ouSelectPresent: Boolean(doc.querySelector("#cep-target-ou")),
              ouOptionsCount: doc.querySelectorAll("#cep-target-ou option").length,
              ouLabels: Array.from(doc.querySelectorAll("#cep-target-ou option")).map(o => o.textContent),
              ouValues: Array.from(doc.querySelectorAll("#cep-target-ou option")).map(o => o.value).filter(Boolean),
              selectedOuAfterCeraApply: doc.querySelector("#cep-target-ou")?.value || "",
              ceraImportedSourceName: win.__ceraImportedSourceName || "",
              ceraImportedShadowAiCount: win.__ceraImportedShadowAiCount || "",
              ceraAppliedBannerShown: bodyText.includes("CERA 2.0 Analytical Workbook (Live Sheet)"),
              cepProvisionOk: Boolean(win.__cepProvisionResult && win.__cepProvisionResult.ok && win.__cepProvisionResult.value?.success === true),
              cepProvisionMessage: String(win.__cepProvisionResult?.value?.message || win.__cepProvisionResult?.message || ""),
              cepRollbackOk: Boolean(win.__cepRollbackResult && win.__cepRollbackResult.ok && Array.isArray(win.__cepRollbackResult.value?.debug_trace)),
              cepLicenseOk: Boolean(win.__cepLicenseResult && win.__cepLicenseResult.ok && win.__cepLicenseResult.value?.total_users === 1),
              projectIdValue: doc.querySelector("#cep-project-id-input")?.value || "",
              projectIdListAttr: doc.querySelector("#cep-project-id-input")?.getAttribute("list") || "",
              projectsDatalistCount: doc.querySelectorAll("#sgs-gcp-projects-list option").length,
              gcpValidateOk: Boolean(win.__gcpValResult && win.__gcpValResult.ok && win.__gcpValResult.value?.status === "connected"),
              gcpAccessPolicyId: win.__gcpValResult?.value?.access_policy_id || "",
              crmQuotaHeader: crmMontFetch?.headers?.["X-Goog-User-Project"] || "",
              gcpUnenabledValidateOk: Boolean(win.__gcpUnenabledResult && win.__gcpUnenabledResult.ok && win.__gcpUnenabledResult.value?.status === "connected"),
              gcpMontrealSuFallbackOk: Boolean(win.__gcpMontrealSuFallbackResult && win.__gcpMontrealSuFallbackResult.ok && win.__gcpMontrealSuFallbackResult.value?.status === "connected"),
              gcpMontrealDeniedIsError: Boolean(win.__gcpMontrealDeniedResult && (!win.__gcpMontrealDeniedResult.ok || win.__gcpMontrealDeniedResult.value?.status === "error")),
              gcpMontrealDeniedCleanMsg: deniedMsg.includes("montreal-436802") && deniedMsg.includes("admin@example.com") && !deniedMsg.includes("523129175171"),
              gcpMontrealDeniedMessage: deniedMsg,
              noCrmV3Fetch: !fetchUrls.some(u => u.includes("cloudresourcemanager.googleapis.com/v3/projects/")),
              usedCrmV1Fetch: fetchUrls.some(u => u.includes("cloudresourcemanager.googleapis.com/v1/projects/montreal-436802")),
              noAuthError: !bodyText.includes("Google authorization is unavailable") && !bodyText.includes("その操作を実行するには承認が必要です"),
              auditsCount: (win.__sgsAudits || []).length,
              auditPaths: (win.__sgsAudits || []).map(a => a.path),
              fetchesCount: (win.__sgsFetches || []).length,
              sgwGroupHidden: win.getComputedStyle(doc.querySelector("aside.sidebar .primary-nav .nav-dropdown-group")).display === "none",
              hasDeployAllBtn: Boolean(win.__initialHasDeployAllBtn || doc.querySelector(".cep-deploy-all-btn")),
              ceraBtnHidden: !ceraNavBtn || win.getComputedStyle(ceraNavBtn).display === "none"
            });
          })()`,
        },
      ]),
    );

    await execFileAsync(GBROWSER_BIN, ["batch", easyBatchPath]);
    const easyRaw = (await readFile(easyEvalOutPath, "utf8")).trim();
    const easyState = JSON.parse(easyRaw.startsWith('"') ? JSON.parse(easyRaw) : easyRaw);
    assert.equal(easyState.initialLangLabel, "English", "Default UI language must be English");
    assert.equal(easyState.switchedToJaLabel, "日本語", "Language dropdown must switch UI to Japanese");
    assert.equal(easyState.switchedBackToEnLabel, "English", "Language dropdown must switch UI back to English");
    assert.equal(easyState.sgwGroupHidden, true, "Easy PoC edition must hide SGW sidebar group");
    assert.equal(easyState.ceraBtnHidden, true, "Easy PoC edition must hide standalone CERA sidebar button");
    assert.equal(easyState.ouSelectPresent, true, "Easy PoC edition must render #cep-target-ou immediately via server bootstrap");
    assert.ok(easyState.ouOptionsCount >= 2, `Easy PoC edition should populate OUs via server bootstrap/GAS proxy (got ${easyState.ouOptionsCount})`);
    assert.deepEqual(easyState.ouValues, ["poc123"], "Easy PoC #cep-target-ou must contain bare OU IDs without 'id:' prefix and omit root '/'");
    assert.equal(easyState.ceraImportedSourceName, "CERA 2.0 Analytical Workbook (Live Sheet)", "Easy PoC CERA Import Modal must parse CERA 2.0 Google Sheet");
    assert.equal(easyState.ceraImportedShadowAiCount, "312", "Easy PoC CERA Import Modal must extract Shadow AI count from CERA 2.0 Google Sheet");
    assert.equal(
      easyState.selectedOuAfterCeraApply,
      "poc123",
      `Easy PoC CERA Import must auto-select matching bare target OU ID (/CEP-PoC -> poc123, got ${easyState.selectedOuAfterCeraApply})`,
    );
    assert.equal(easyState.ceraAppliedBannerShown, true, "Easy PoC must show applied confirmation banner after importing CERA settings");
    assert.equal(easyState.cepProvisionOk, true, `Easy PoC POST /api/v1/cep/provision must succeed end-to-end without target_ou_id error (msg: ${easyState.cepProvisionMessage})`);
    assert.equal(easyState.cepRollbackOk, true, "Easy PoC POST /api/v1/cep/rollback must succeed end-to-end");
    assert.equal(easyState.cepLicenseOk, true, "Easy PoC POST /api/v1/cep/assign-licenses must succeed end-to-end");
    assert.equal(easyState.projectIdValue, "cep-poc-auto-project", "Easy PoC edition should auto-populate default GCP project ID from bootstrap");
    assert.equal(easyState.projectIdListAttr, "sgs-gcp-projects-list", "Easy PoC edition should attach <datalist> to #cep-project-id-input");
    assert.ok(easyState.projectsDatalistCount >= 1, "Easy PoC edition should populate <datalist id='sgs-gcp-projects-list'>");
    assert.equal(easyState.gcpValidateOk, true, "Easy PoC edition must validate montreal-436802 cleanly via CRM v1");
    assert.equal(easyState.gcpAccessPolicyId, "999888777", "Easy PoC edition must resolve ACM accessPolicyId for montreal-436802");
    assert.equal(easyState.crmQuotaHeader, "montreal-436802", "Easy PoC edition must send X-Goog-User-Project: montreal-436802 on CRM v1 lookup");
    assert.equal(easyState.gcpUnenabledValidateOk, true, "Easy PoC edition must succeed via Service Usage fallback even if CRM v1 returns 403 SERVICE_DISABLED on 523129175171");
    assert.equal(easyState.gcpMontrealSuFallbackOk, true, "Easy PoC edition must connect montreal-436802 even when CRM v1 is disabled on 523129175171 and Org-level ACM returns 403");
    assert.equal(easyState.gcpMontrealDeniedIsError, true, "Easy PoC edition must return status=error when caller lacks IAM access to montreal-436802");
    assert.equal(easyState.gcpMontrealDeniedCleanMsg, true, `Easy PoC edition must show clean error message for unauthorized montreal-436802 (got: ${easyState.gcpMontrealDeniedMessage})`);
    assert.equal(easyState.noCrmV3Fetch, true, "Easy PoC edition must never call CRM v3 /v3/projects/");
    assert.equal(easyState.usedCrmV1Fetch, true, "Easy PoC edition must call CRM v1 /v1/projects/montreal-436802");
    assert.equal(easyState.noAuthError, true, "Easy PoC edition must never show 'Google authorization is unavailable or was revoked'");
    assert.ok(easyState.auditsCount >= 1, "Easy PoC edition should record sheet audit on Workspace validate");
    assert.equal(easyState.hasDeployAllBtn, true, "Easy PoC edition must render 1-click Apply All button");
    assert.ok(easyState.accessLevelCheckboxCount >= 7, `Easy PoC must render one checkbox per Context-Aware Access level (got ${easyState.accessLevelCheckboxCount})`);
    assert.equal(easyState.accessLevelSelectGone, true, "Easy PoC must no longer render the single-select #cep-access-level dropdown");
    assert.ok(/2 access levels selected|2 件のアクセスレベルを選択中/.test(easyState.accessLevelSummaryAfterTwo), `Ticking two access levels must update the selection summary (got: ${easyState.accessLevelSummaryAfterTwo})`);
    assert.equal(easyState.accessLevelPrimaryBadges, 1, "Only the first ticked access level carries the DLP-condition badge");
    assert.equal(easyState.popoverStatusDisplay, "flex", "Cloud popover connected-account block must be a flex row");
    assert.equal(easyState.popoverLabelAboveValue, true, `Cloud popover must stack 'Active Credential' above the account instead of running them together (text: ${easyState.popoverStatusText})`);
    assert.equal(easyState.dialogFitScriptPresent, true, "Index.html must request the maximum Sheets dialog size via google.script.host");
    console.log("✓ Verified gas/easy-poc/Index.html in headless Chrome:", easyState);

    // 2. Test SGW Deployer Edition in Headless Chrome (including interactive UI typing of montreal-436802 + screenshots)
    const sgwBatchPath = "/tmp/verify_gas_sgw_batch.json";
    const sgwEvalOutPath = "/tmp/verify_gas_sgw_out.json";
    const connectedShotPath = "/usr/local/google/home/masudad/.gemini/jetski/brain/8d801ec1-df65-4b41-9089-b0a02af32d3e/montreal-connected-gbrowser.png";
    const errorShotPath = "/usr/local/google/home/masudad/.gemini/jetski/brain/8d801ec1-df65-4b41-9089-b0a02af32d3e/montreal-error-gbrowser.png";
    await writeFile(
      sgwBatchPath,
      JSON.stringify([
        { action: "navigate", url: `http://127.0.0.1:${port}/sgw-deployer` },
        { action: "sleep", duration: "1600ms" },
        {
          action: "eval",
          expression: `(() => {
            const f = document.getElementById("userHtmlFrame");
            const doc = f?.contentDocument || document;
            const win = f?.contentWindow || window;
            // Enter montreal-436802 into the Step 1 Google Cloud deployer input and click Connect in Authorized (Service Usage fallback) mode
            win.__sgsMontrealMode = "crm_disabled_but_su_ok";
            const cardInput = doc.querySelector(".connection-card input");
            if (cardInput) {
              const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value")?.set;
              if (setter) setter.call(cardInput, "montreal-436802");
              else cardInput.value = "montreal-436802";
              cardInput.dispatchEvent(new win.Event("input", { bubbles: true }));
              cardInput.dispatchEvent(new win.Event("change", { bubbles: true }));
            }
            setTimeout(() => {
              const connectBtn = doc.querySelector(".connection-card button");
              if (connectBtn) connectBtn.click();
            }, 80);
            return true;
          })()`,
        },
        { action: "sleep", duration: "1300ms" },
        { action: "screenshot", file: connectedShotPath },
        {
          action: "eval",
          expression: `(() => {
            const f = document.getElementById("userHtmlFrame");
            const doc = f?.contentDocument || document;
            const win = f?.contentWindow || window;
            win.__sgwConnectedText = doc.body.innerText || "";
            // Now test Unauthorized mode on montreal-436802 via Step 1 Connect button
            win.__sgsMontrealMode = "unauthorized";
            const connectBtn = doc.querySelector(".connection-card button");
            if (connectBtn) connectBtn.click();
            return true;
          })()`,
        },
        { action: "sleep", duration: "1300ms" },
        { action: "screenshot", file: errorShotPath },
        {
          action: "eval",
          file: sgwEvalOutPath,
          expression: `(() => {
            const f = document.getElementById("userHtmlFrame");
            const doc = f?.contentDocument || document;
            const win = f?.contentWindow || window;
            const bodyText = doc.body.innerText || "";
            const deployerCard = doc.querySelector(".review-deployer-card");
            return JSON.stringify({
              title: doc.title,
              initialLang: doc.querySelector(".language-trigger")?.textContent?.trim() || "",
              hasForceOverwrite: bodyText.includes("強制上書き") || bodyText.includes("Force overwrite"),
              noAuthError: !bodyText.includes("Google authorization is unavailable") && !bodyText.includes("その操作を実行するには承認が必要です"),
              connectedStateHadMontreal: (win.__sgwConnectedText || "").includes("montreal-436802"),
              unauthorizedBannerShown: bodyText.includes("Access denied to Google Cloud project 'montreal-436802'") && bodyText.includes("admin@example.com") && !bodyText.includes("523129175171"),
              deployerCardHidden: !deployerCard || win.getComputedStyle(deployerCard).display === "none",
              easyPocBtnHidden: win.getComputedStyle(doc.querySelector("aside.sidebar .primary-nav > button.nav-item:nth-of-type(2)")).display === "none",
              ceraBtnHidden: win.getComputedStyle(doc.querySelector("aside.sidebar .primary-nav > button.nav-item:nth-of-type(3)")).display === "none"
            });
          })()`,
        },
      ]),
    );

    await execFileAsync(GBROWSER_BIN, ["batch", sgwBatchPath]);
    const sgwRaw = (await readFile(sgwEvalOutPath, "utf8")).trim();
    const sgwState = JSON.parse(sgwRaw.startsWith('"') ? JSON.parse(sgwRaw) : sgwRaw);
    assert.equal(sgwState.initialLang, "English", "SGW Deployer edition default language must be English");
    assert.equal(sgwState.easyPocBtnHidden, true, "SGW Deployer edition must hide Easy PoC sidebar item");
    assert.equal(sgwState.ceraBtnHidden, true, "SGW Deployer edition must hide CERA sidebar item");
    assert.equal(sgwState.hasForceOverwrite, true, "SGW Deployer edition must render Force Overwrite option in Step 1");
    assert.equal(sgwState.noAuthError, true, "SGW Deployer edition must never show 'Google authorization is unavailable or was revoked'");
    assert.equal(sgwState.connectedStateHadMontreal, true, "SGW Deployer edition must connect montreal-436802 when authorized");
    assert.equal(sgwState.unauthorizedBannerShown, true, "SGW Deployer edition must display clean actionable error banner when unauthorized on montreal-436802");
    assert.equal(sgwState.deployerCardHidden, true, "SGW Deployer edition must hide Service Account bootstrap card in Apps Script");
    console.log("✓ Verified gas/sgw-deployer/Index.html in headless Chrome:", sgwState);
  } finally {
    server.close();
  }
}

await verifyCodeGsAndManifests();
await verifyBrowserBundles();
console.log("ALL GAS E2E VERIFICATIONS PASSED!");
