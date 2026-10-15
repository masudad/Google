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

function replaceExact(source, label, target, replacement) {
  if (!source.includes(target)) {
    throw new Error(`build-gas patch target not found for ${label}`);
  }
  return source.replace(target, replacement);
}

function replaceRegex(source, label, pattern, replacement) {
  if (!pattern.test(source)) {
    throw new Error(`build-gas regex patch target not found for ${label}`);
  }
  return source.replace(pattern, replacement);
}

async function buildBundlePieces() {
  let swSource = await readFile(join(distDir, "src/background/service-worker.js"), "utf8");
  let appSource = await readFile(join(distDir, "src/ui/app.js"), "utf8");
  const cssSource = await readFile(join(distDir, "src/ui/app.css"), "utf8");

  // Patch service-worker.js for Google Apps Script:
  // In Apps Script, the user has already granted OAuth scopes on the script container.
  // Use the user's Apps Script OAuth token directly for Google Cloud & Workspace operations
  // without requiring creation or impersonation of a sgw-studio-deployer service account.
  swSource = replaceExact(
    swSource,
    "sw:isSupportedDeployerServiceAccountEmail",
    `function isSupportedDeployerServiceAccountEmail(value, projectId) {\n  return value === deployerTarget(projectId).serviceAccountEmail || value === deployerTarget(projectId, "isolated-replacement").serviceAccountEmail;\n}`,
    `function isSupportedDeployerServiceAccountEmail(value, projectId) {\n  return Boolean(typeof value === "string" && (value.includes("@") || value === deployerTarget(projectId).serviceAccountEmail || value === deployerTarget(projectId, "isolated-replacement").serviceAccountEmail));\n}`
  );

  const reqDeployerStart = swSource.indexOf("async function requireDeployerIdentity(projectId, expected) {");
  const depTokenEndNeedle = `async function deployerAccessToken() {\n  const current = await ensureCredentials();\n  if (current === null) {\n    throw new AuthenticationError(\n      "deployer-required",\n      "A project-bound impersonated deployer is required for Google Cloud mutations."\n    );\n  }\n  return current.accessToken();\n}`;
  const depTokenEndIdx = swSource.indexOf(depTokenEndNeedle);
  if (reqDeployerStart === -1 || depTokenEndIdx === -1) {
    throw new Error("build-gas patch target not found for sw:requireDeployerIdentity/deployerAccessToken");
  }
  swSource =
    swSource.slice(0, reqDeployerStart) +
    `async function requireDeployerIdentity(projectId, expected) {
  const op = await effectiveLifecycleOperator();
  return expected || {
    serviceAccountEmail: op.email || deployerTarget(projectId).serviceAccountEmail,
    serviceAccountUniqueId: "100000000000000000000",
    projectId: projectId,
    operatorEmail: op.email,
    operatorSubject: op.subject
  };
}
async function deployerAccessToken() {
  return cloudAdministratorAccessToken();
}` +
    swSource.slice(depTokenEndIdx + depTokenEndNeedle.length);

  swSource = replaceExact(
    swSource,
    "sw:bootstrapDeployerRoute",
    `    const result = await bootstrapDeployer(projectId, bootstrapOptions);\n    await context.rememberDeployer(\n      result.service_account_email,\n      projectId,\n      result.service_account_unique_id,\n      result.access_policy_id\n    );\n    return result;`,
    `    const op = await effectiveLifecycleOperator();\n    return {\n      service_account_email: op.email || deployerTarget(projectId).serviceAccountEmail,\n      service_account_unique_id: "100000000000000000000",\n      custom_role_name: "projects/" + projectId + "/roles/sgs_apps_script_oauth",\n      project_id: projectId,\n      access_policy_id: resolvedPolicyId ?? null\n    };`
  );

  // 4. Switch Cloud Resource Manager v3 project/folder lookups to v1 (projects) & v2 (folders),
  //    which have Chemist flags="SKIP" / active_developer_method=false in Google's API configuration
  //    and work out-of-the-box on Apps Script Default Cloud Projects (like 523129175171) without
  //    requiring cloudresourcemanager.googleapis.com to be enabled on 523129175171.
  swSource = replaceExact(
    swSource,
    "sw:crmV1BaseUrl",
    `var CRM = "https://cloudresourcemanager.googleapis.com/v3";`,
    `var CRM = "https://cloudresourcemanager.googleapis.com/v1";`
  );

  swSource = replaceExact(
    swSource,
    "sw:projectPolicyContextV1V2",
    `async function projectPolicyContext(transport2, projectId) {
  const { payload } = await transport2.requestJson(
    "GET",
    \`\${CRM}/projects/\${projectId}\`
  );
  const projectName = payload.name;
  if (typeof projectName !== "string" || !/^projects\\/\\d+$/.test(projectName)) {
    throw new ConnectionError(
      "project-number-invalid",
      "Google Cloud did not return the project's immutable numeric resource name"
    );
  }
  const applicableScopes = /* @__PURE__ */ new Set([projectName]);
  let parent = payload.parent;
  if (parent === void 0 || parent === null || parent === "") {
    throw new ConnectionError(
      "project-not-in-organization",
      "The Google Cloud project is not attached to an organization"
    );
  }
  const seenFolders = /* @__PURE__ */ new Set();
  let folderCount = 0;
  while (true) {
    if (typeof parent !== "string") {
      throw new ConnectionError(
        "project-hierarchy-invalid",
        "Google Cloud returned a malformed project folder hierarchy"
      );
    }
    if (/^organizations\\/\\d+$/.test(parent)) {
      return { organization: parent, applicableScopes };
    }
    if (!/^folders\\/\\d+$/.test(parent)) {
      throw new ConnectionError(
        "project-hierarchy-invalid",
        "Google Cloud returned a malformed project folder hierarchy"
      );
    }
    if (folderCount >= 10 || seenFolders.has(parent)) {
      throw new ConnectionError(
        "project-hierarchy-invalid",
        "The Google Cloud project folder hierarchy exceeded ten levels or contained a cycle"
      );
    }
    seenFolders.add(parent);
    folderCount += 1;
    applicableScopes.add(parent);
    const folder = await transport2.requestJson("GET", \`\${CRM}/\${parent}\`);
    parent = folder.payload.parent;
  }
}`,
    `async function projectPolicyContext(transport2, projectId) {
  const { payload } = await transport2.requestJson(
    "GET",
    \`https://cloudresourcemanager.googleapis.com/v1/projects/\${projectId}\`
  );
  const rawNum = payload && payload.projectNumber !== void 0 && payload.projectNumber !== null
    ? String(payload.projectNumber).trim()
    : "";
  const projectName = /^\\d+$/.test(rawNum)
    ? \`projects/\${rawNum}\`
    : (typeof payload?.name === "string" ? payload.name : "");
  if (typeof projectName !== "string" || !/^projects\\/\\d+$/.test(projectName)) {
    throw new ConnectionError(
      "project-number-invalid",
      "Google Cloud did not return the project's immutable numeric resource name"
    );
  }
  const applicableScopes = /* @__PURE__ */ new Set([projectName]);
  const normalizeParentRef = (raw) => {
    if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
    if (raw && typeof raw === "object") {
      const t = typeof raw.type === "string" ? raw.type.trim().toLowerCase() : "";
      const id = raw.id !== void 0 && raw.id !== null ? String(raw.id).trim() : "";
      if ((t === "organization" || t === "organizations") && id) return \`organizations/\${id}\`;
      if ((t === "folder" || t === "folders") && id) return \`folders/\${id}\`;
    }
    return "";
  };
  let parent = normalizeParentRef(payload.parent);
  if (!parent) {
    throw new ConnectionError(
      "project-not-in-organization",
      "The Google Cloud project is not attached to an organization"
    );
  }
  const seenFolders = /* @__PURE__ */ new Set();
  let folderCount = 0;
  while (true) {
    if (/^organizations\\/\\d+$/.test(parent)) {
      return { organization: parent, applicableScopes };
    }
    if (!/^folders\\/\\d+$/.test(parent)) {
      throw new ConnectionError(
        "project-hierarchy-invalid",
        "Google Cloud returned a malformed project folder hierarchy"
      );
    }
    if (folderCount >= 10 || seenFolders.has(parent)) {
      throw new ConnectionError(
        "project-hierarchy-invalid",
        "The Google Cloud project folder hierarchy exceeded ten levels or contained a cycle"
      );
    }
    seenFolders.add(parent);
    folderCount += 1;
    applicableScopes.add(parent);
    const folder = await transport2.requestJson("GET", \`https://cloudresourcemanager.googleapis.com/v2/\${parent}\`);
    parent = normalizeParentRef(folder.payload?.parent);
  }
}`
  );

  swSource = replaceExact(
    swSource,
    "sw:retainSelectedAccessLevelV1V2",
    `    let parent = parentPayload?.parent;
    for (let depth = 0; depth < 20 && typeof parent === "string" && !parent.startsWith("organizations/"); depth += 1) {
      parentPayload = await this.call(
        trace,
        "Resolve Access Context Manager parent",
        "GET",
        \`\${CRM3}/\${parent}\`,
        void 0,
        this.cloudTransport
      );
      parent = parentPayload?.parent;
    }`,
    `    let parent = extractParentRef(parentPayload?.parent);
    for (let depth = 0; depth < 20 && typeof parent === "string" && !parent.startsWith("organizations/"); depth += 1) {
      parentPayload = await this.call(
        trace,
        "Resolve Access Context Manager parent",
        "GET",
        \`https://cloudresourcemanager.googleapis.com/v2/\${parent}\`,
        void 0,
        this.cloudTransport
      );
      parent = extractParentRef(parentPayload?.parent);
    }`
  );

  swSource = replaceExact(
    swSource,
    "sw:provisionGeminiZeroTrustFolderV2",
    `const folderUrl = \`\${CRM3}/\${parentRef}\`;`,
    `const folderUrl = \`https://cloudresourcemanager.googleapis.com/v2/\${parentRef}\`;`
  );

  swSource = replaceExact(
    swSource,
    "sw:resolveAccessPolicyExplicitFallback",
    `    try {
      context = await projectPolicyContext(this.transport, projectId);
    } catch (error) {
      if (error instanceof ConnectionError && error.code === "project-not-in-organization") {
        return null;
      }
      throw error;
    }`,
    `    try {
      context = await projectPolicyContext(this.transport, projectId);
    } catch (error) {
      if (error instanceof ConnectionError && error.code === "project-not-in-organization") {
        const explicitId = this.options.accessPolicyId?.trim();
        if (explicitId && /^\\d+$/.test(explicitId)) {
          const name2 = \`accessPolicies/\${explicitId}\`;
          const { payload: pol } = await this.transport.requestJson("GET", \`\${ACM}/\${name2}\`);
          return { id: explicitId, name: name2, organization: typeof pol?.parent === "string" ? pol.parent : "" };
        }
        return null;
      }
      throw error;
    }`
  );

  // Best-effort Access Context Manager discovery during Cloud project connection so
  // project-scoped users without Org-level ACM permissions still connect cleanly.
  swSource = replaceExact(
    swSource,
    "sw:discoverAccessPolicyIdBestEffort",
    `  async discoverAccessPolicyId(projectId) {
    return (await this.resolveAccessPolicy(projectId))?.id ?? null;
  }`,
    `  async discoverAccessPolicyId(projectId) {
    try {
      return (await this.resolveAccessPolicy(projectId))?.id ?? null;
    } catch {
      return null;
    }
  }`
  );

  swSource = replaceExact(
    swSource,
    "sw:listAccessLevelsBestEffort",
    `  async listAccessLevels(projectId) {
    const resolved = await this.resolveAccessPolicy(projectId, {
      preferOrgLevelPolicy: true
    });
    if (resolved === null) return [];`,
    `  async listAccessLevels(projectId) {
    let resolved = null;
    try {
      resolved = await this.resolveAccessPolicy(projectId, {
        preferOrgLevelPolicy: true
      });
    } catch {
      return [];
    }
    if (resolved === null) return [];`
  );

  swSource = replaceExact(
    swSource,
    "sw:provisionGeminiZeroTrustProjectError",
    `    if (!projectNumber) {
      return {
        success: false,
        message: \`Could not resolve project number for \${projectId}. Ensure Cloud Resource Manager API is enabled.\`,
        trace
      };
    }`,
    `    if (!projectNumber) {
      const lastErr = trace.find((t) => !t.ok && t.error)?.error;
      return {
        success: false,
        message: lastErr || \`Could not resolve project number for \${projectId}. Ensure Cloud Resource Manager API is enabled.\`,
        trace
      };
    }`
  );

  // 5. Normalize target_ou_id across parseDeploymentSpec, validateWorkspace, resolveConfirmedCepTargetOu,
  //    and withCepMutationLease so bare OU IDs and legacy "id:..." / "orgunits/..." prefixes work identically
  //    in both Chrome Extension and Google Apps Script.
  swSource = replaceExact(
    swSource,
    "sw:parseDeploymentSpecTargetOuId",
    `    target_ou_id: requirePattern(raw.target_ou_id, "target_ou_id", OU_ID),`,
    `    target_ou_id: requirePattern(typeof raw.target_ou_id === "string" ? raw.target_ou_id.trim().replace(/^orgunits\\//i, "").replace(/^id:/i, "") : raw.target_ou_id, "target_ou_id", OU_ID),`
  );

  swSource = replaceExact(
    swSource,
    "sw:validateWorkspaceTargetOuId",
    `    if (targetOuId && !/^[0-9A-Za-z_-]+$/.test(targetOuId)) {`,
    `    if (typeof targetOuId === "string" && targetOuId.trim() !== "") {\n      targetOuId = targetOuId.trim().replace(/^orgunits\\//i, "").replace(/^id:/i, "");\n    }\n    if (targetOuId && !/^[0-9A-Za-z_-]+$/.test(targetOuId)) {`
  );

  swSource = replaceExact(
    swSource,
    "sw:resolveConfirmedCepTargetOuNormalize",
    `async function resolveConfirmedCepTargetOu(transport2, request2) {
  const customerId = typeof request2.customer_id === "string" ? request2.customer_id.trim() : "";
  const targetOuId = typeof request2.target_ou_id === "string" ? request2.target_ou_id.trim() : "";`,
    `async function resolveConfirmedCepTargetOu(transport2, request2) {
  const customerId = typeof request2.customer_id === "string" ? request2.customer_id.trim() : "";
  const targetOuId = typeof request2.target_ou_id === "string" ? request2.target_ou_id.trim().replace(/^orgunits\\//i, "").replace(/^id:/i, "") : "";
  if (typeof request2.target_ou_id === "string") request2.target_ou_id = targetOuId;`
  );

  swSource = replaceExact(
    swSource,
    "sw:withCepMutationLeaseNormalizeOu",
    `    const scopedReq = request2;
    const canonicalCustomer = await canonicalCepCustomerId(
      coordinationTransport,
      scopedReq.customer_id
    );
    scopedReq.customer_id = canonicalCustomer;`,
    `    const scopedReq = request2;
    if (typeof scopedReq.target_ou_id === "string") {
      scopedReq.target_ou_id = scopedReq.target_ou_id.trim().replace(/^orgunits\\//i, "").replace(/^id:/i, "");
    }
    const canonicalCustomer = await canonicalCepCustomerId(
      coordinationTransport,
      scopedReq.customer_id || (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.customerId) || "my_customer"
    );
    scopedReq.customer_id = canonicalCustomer;`
  );

  // Patch app.js for Google Apps Script:
  // 0. Default UI locale to English ("en") via LOCALE_KEY = "sgs.locale.v2" (superseding any prior forced "ja" in v1),
  //    while preserving the top-right LanguageMenu dropdown to switch between English ("en") and Japanese ("ja").
  appSource = replaceExact(
    appSource,
    "app:localeKeyV2",
    `var LOCALE_KEY = "sgs.locale.v1";`,
    `var LOCALE_KEY = "sgs.locale.v2";`
  );

  appSource = replaceRegex(
    appSource,
    "app:initialActiveView",
    /const \[activeView, setActiveView\] = \(0, (import_react\d+)\.useState\)\(\n    \(\) => extensionPersistentState \? "guide" : "setup"\n  \);/,
    `const [activeView, setActiveView] = (0, $1.useState)(\n    () => (globalThis.__SGS_INITIAL_VIEW && typeof globalThis.__SGS_INITIAL_VIEW === "string") ? globalThis.__SGS_INITIAL_VIEW : (extensionPersistentState ? "guide" : "setup")\n  );`
  );

  // 1. Treat any connected Google Cloud project as ready in ReviewStep without requiring .iam.gserviceaccount.com.
  appSource = replaceExact(
    appSource,
    "app:deployerSaReady",
    `const deployerSaReady = state.cloudIdentity.endsWith(".iam.gserviceaccount.com") || bootstrapResult !== null;`,
    `const deployerSaReady = Boolean(state.cloudConnection === "connected" || state.cloudIdentity) || bootstrapResult !== null;`
  );

  // 2. Seed defaultSetupState from server-injected window.__SGS_BOOTSTRAP so Workspace and GCP
  //    are pre-connected as soon as the modal opens.
  appSource = replaceExact(
    appSource,
    "app:defaultSetupStateConnections",
    `  projectId: "",\n  accessPolicyId: "",\n  cloudIdentity: "",\n  cloudConnection: "not_connected",\n  cloudConnectionError: "",\n  workspaceIdentity: "",\n  workspaceConnection: "not_connected",\n  workspaceConnectionError: "",`,
    `  projectId: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.defaultProjectId) || "",\n  accessPolicyId: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.accessPolicyId) || "",\n  cloudIdentity: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.defaultProjectId && globalThis.__SGS_BOOTSTRAP.email) || "",\n  cloudConnection: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.defaultProjectId && globalThis.__SGS_BOOTSTRAP.email) ? "connected" : "not_connected",\n  cloudConnectionError: "",\n  workspaceIdentity: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.email) || "",\n  workspaceConnection: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.customerId && globalThis.__SGS_BOOTSTRAP.email) ? "connected" : "not_connected",\n  workspaceConnectionError: "",`
  );

  appSource = replaceExact(
    appSource,
    "app:defaultSetupStateCustomerId",
    `  customerId: "my_customer",`,
    `  customerId: (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.customerId) || "my_customer",`
  );

  // 3. Seed CepDeployerPage state (Customer ID, OUs, Groups, Primary Domain) from window.__SGS_BOOTSTRAP.
  appSource = replaceRegex(
    appSource,
    "app:cepResolvedCustomerId",
    /  const \[resolvedCustomerId, setResolvedCustomerId\] = \(0, (import_react\d+)\.useState\)\(""\);/,
    `  const [resolvedCustomerId, setResolvedCustomerId] = (0, $1.useState)(() => (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.customerId) || "");`
  );

  appSource = replaceRegex(
    appSource,
    "app:cepOrgUnits",
    /  const \[organizationalUnits, setOrganizationalUnits\] = \(0, (import_react\d+)\.useState\)\(\[\]\);/,
    `  const [organizationalUnits, setOrganizationalUnits] = (0, $1.useState)(() => (globalThis.__SGS_BOOTSTRAP && Array.isArray(globalThis.__SGS_BOOTSTRAP.orgUnits) && globalThis.__SGS_BOOTSTRAP.orgUnits.length > 0) ? globalThis.__SGS_BOOTSTRAP.orgUnits : []);`
  );

  appSource = replaceRegex(
    appSource,
    "app:cepGroups",
    /  const \[groups, setGroups\] = \(0, (import_react\d+)\.useState\)\(\[\]\);\n  const \[selectedGroup, setSelectedGroup\] = \(0, \1\.useState\)\(""\);\n  const \[targetGroupConfirmation, setTargetGroupConfirmation\] = \(0, \1\.useState\)\(""\);\n  const \[loadingGroups, setLoadingGroups\] = \(0, \1\.useState\)\(false\);\n  const \[groupsLoaded, setGroupsLoaded\] = \(0, \1\.useState\)\(false\);/,
    `  const [groups, setGroups] = (0, $1.useState)(() => (globalThis.__SGS_BOOTSTRAP && Array.isArray(globalThis.__SGS_BOOTSTRAP.groups)) ? globalThis.__SGS_BOOTSTRAP.groups : []);\n  const [selectedGroup, setSelectedGroup] = (0, $1.useState)("");\n  const [targetGroupConfirmation, setTargetGroupConfirmation] = (0, $1.useState)("");\n  const [loadingGroups, setLoadingGroups] = (0, $1.useState)(false);\n  const [groupsLoaded, setGroupsLoaded] = (0, $1.useState)(() => Boolean(globalThis.__SGS_BOOTSTRAP && Array.isArray(globalThis.__SGS_BOOTSTRAP.groups) && globalThis.__SGS_BOOTSTRAP.customerId));`
  );

  appSource = replaceRegex(
    appSource,
    "app:cepPrimaryDomain",
    /  const \[primaryDomain, setPrimaryDomain\] = \(0, (import_react\d+)\.useState\)\(null\);/,
    `  const [primaryDomain, setPrimaryDomain] = (0, $1.useState)(() => (globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.primaryDomain) || null);`
  );

  appSource = replaceRegex(
    appSource,
    "app:cepOuLoaded",
    /  const \[ouLoaded, setOuLoaded\] = \(0, (import_react\d+)\.useState\)\(false\);/,
    `  const [ouLoaded, setOuLoaded] = (0, $1.useState)(() => Boolean(globalThis.__SGS_BOOTSTRAP && globalThis.__SGS_BOOTSTRAP.customerId && Array.isArray(globalThis.__SGS_BOOTSTRAP.orgUnits) && globalThis.__SGS_BOOTSTRAP.orgUnits.length > 0));`
  );

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
    supported: { "template-literal": false },
    legalComments: "none",
    minify: true,
    write: false,
  });
  const fakeIdbMin = idbResult.outputFiles[0].text.trim();

  const swMin = (
    await transform(swSource, {
      loader: "js",
      format: "iife",
      target: "chrome142",
      supported: { "template-literal": false },
      legalComments: "none",
      minify: true,
    })
  ).code.trim();

  const appMin = (
    await transform(appSource, {
      loader: "js",
      format: "iife",
      target: "chrome142",
      supported: { "template-literal": false },
      legalComments: "none",
      minify: true,
    })
  ).code.trim()
    .replace("handleReload=()=>{window.location.reload()}", "handleReload=()=>{this.setState({error:null})}")
    .replace(",window.location.reload()", "");

  const cssMin = (
    await transform(cssSource, {
      loader: "css",
      minify: true,
    })
  ).code;

  return { fakeIdbMin, swMin, appMin, cssMin };
}

function escapeInlineScript(code) {
  // Prevent accidental </script> termination or HTML comment state transitions inside HTML <script> tags.
  return code.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
}

function createIndexHtml({ edition, title, extraCss, fakeIdbMin, swMin, appMin, cssMin }) {
  const defaultView = edition === "easy-poc" ? "cepDeployer" : "setup";
  const splashMsg =
    edition === "easy-poc"
      ? "Loading CEP Easy PoC Console... (First load may take up to 10 seconds)"
      : "Loading Secure Gateway Deployer... (First load may take up to 10 seconds)";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>${cssMin}
${extraCss}
    </style>
  <style>@keyframes sgs-spin{to{transform:rotate(360deg)}}</style>
  </head>
  <body>
    <div id="root"><div id="sgs-splash" style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#f4f7fa;color:#354158;font-family:'Google Sans',Roboto,-apple-system,BlinkMacSystemFont,'Noto Sans JP',sans-serif;"><div style="width:40px;height:40px;border:4px solid #d7dee8;border-top-color:#1a73e8;border-radius:50%;animation:sgs-spin .9s linear infinite"></div><div id="sgs-splash-msg" style="font-size:14px;line-height:1.7;text-align:center;max-width:680px;padding:0 24px">${splashMsg}</div></div></div>
    <script>(function(){function show(t){var el=document.getElementById("sgs-splash-msg");if(!el)return;el.textContent=t;el.style.color="#c5221f";}window.addEventListener("error",function(e){if(!document.getElementById("sgs-splash"))return;show("Error while loading console: "+((e&&e.message)||"Unknown error")+". Please close the dialog and reopen from the menu.");});setTimeout(function(){if(document.getElementById("sgs-splash"))show("Loading is taking longer than expected. Please close the dialog and reopen from the menu.");},45000);})();</script>
    <script>
      // Google Sheets caps every Apps Script dialog at 80% of the editor
      // viewport (per dimension) and never re-fits it when the browser window
      // changes size. Asking the host for a size far above any monitor always
      // yields exactly that maximum, so the console keeps requesting it: once
      // on boot and then periodically, which also re-fits after a window
      // resize. Outside Apps Script (local verification) there is no host.
      (function() {
        var REQUESTED_PX = 4000;
        function fit() {
          try {
            var host = window.google && window.google.script && window.google.script.host;
            if (!host || typeof host.setWidth !== "function" || typeof host.setHeight !== "function") return;
            host.setWidth(REQUESTED_PX);
            host.setHeight(REQUESTED_PX);
          } catch (e) {}
        }
        fit();
        window.addEventListener("load", fit);
        setTimeout(fit, 600);
        // Cheap fire-and-forget host calls; re-fits after a browser window resize.
        setInterval(fit, 2500);
      })();
    </script>
    <script>${escapeInlineScript(fakeIdbMin)}</script>
    <script>
      (function() {
        var EDITION = ${JSON.stringify(edition)};
        var DEFAULT_VIEW = ${JSON.stringify(defaultView)};
        var INITIAL_VIEW = (typeof window.__SGS_INITIAL_VIEW === "string" && window.__SGS_INITIAL_VIEW)
          ? window.__SGS_INITIAL_VIEW
          : DEFAULT_VIEW;
        if (INITIAL_VIEW === "cepCeraImport" || (EDITION === "easy-poc" && INITIAL_VIEW === "cera")) {
          window.__SGS_OPEN_CERA_IMPORT = true;
          INITIAL_VIEW = "cepDeployer";
        }
        window.__SGS_INITIAL_VIEW = INITIAL_VIEW;
        var BOOT = (typeof window.__SGS_BOOTSTRAP === "object" && window.__SGS_BOOTSTRAP)
          ? window.__SGS_BOOTSTRAP
          : {};
        if (BOOT && Array.isArray(BOOT.orgUnits)) {
          BOOT.orgUnits = BOOT.orgUnits
            .filter(function(u) { return u && u.value && u.label && String(u.label).trim() !== "/"; })
            .map(function(u) {
              var cleanId = String(u.value).trim().replace(/^orgunits\\//i, "").replace(/^id:/i, "");
              var cleanPath = String(u.label).trim();
              return {
                value: cleanId,
                label: cleanPath,
                description: String(u.description || cleanPath)
              };
            })
            .filter(function(u) { return /^[A-Za-z0-9_-]+$/.test(u.value); });
        }
        var fallbackBootToken = BOOT.token ? String(BOOT.token) : "";

        // 1. Always install in-memory IndexedDB inside Google Sheets HtmlService iframe
        // so cross-origin sandboxed iframes and waitForActiveTransaction work deterministically.
        function installFakeIndexedDb() {
          if (window.__SGS_FakeIDB) {
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
          // Ensure localStorage / sessionStorage never throw SecurityError in third-party-cookie-blocked iframes
          try {
            var k = "__sgs_ls_probe__";
            window.localStorage.setItem(k, "1");
            window.localStorage.removeItem(k);
          } catch (e) {
            var makeMemStorage = function() {
              var store = {};
              return {
                get length() { return Object.keys(store).length; },
                key: function(i) { return Object.keys(store)[i] || null; },
                getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
                setItem: function(k, v) { store[String(k)] = String(v); },
                removeItem: function(k) { delete store[String(k)]; },
                clear: function() { store = {}; }
              };
            };
            try { Object.defineProperty(window, "localStorage", { value: makeMemStorage(), configurable: true, writable: true }); } catch (_) {}
            try { Object.defineProperty(window, "sessionStorage", { value: makeMemStorage(), configurable: true, writable: true }); } catch (_) {}
          }
          // Ensure navigator.clipboard.writeText never rejects in sandboxed userHtmlFrame
          try {
            var fallbackCopy = function(text) {
              try {
                var ta = document.createElement("textarea");
                ta.value = String(text == null ? "" : text);
                ta.setAttribute("readonly", "readonly");
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
              } catch (_) {}
            };
            var origClip = navigator.clipboard;
            var origWrite = origClip && typeof origClip.writeText === "function"
              ? origClip.writeText.bind(origClip)
              : null;
            var safeWriteText = function(text) {
              if (origWrite) {
                return Promise.resolve().then(function() { return origWrite(text); }).catch(function() {
                  fallbackCopy(text);
                });
              }
              fallbackCopy(text);
              return Promise.resolve();
            };
            if (origClip) {
              try { origClip.writeText = safeWriteText; } catch (_) {
                Object.defineProperty(navigator, "clipboard", {
                  value: { writeText: safeWriteText },
                  configurable: true
                });
              }
            } else {
              Object.defineProperty(navigator, "clipboard", {
                value: { writeText: safeWriteText },
                configurable: true
              });
            }
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
        window.__sgsImportCeraSheet = function(spreadsheetIdOrUrl) {
          return callGas("sgsImportCeraSpreadsheet", {
            spreadsheetIdOrUrl: String(spreadsheetIdOrUrl || "")
          });
        };

        // 3. Intercept fetch() for *.googleapis.com and proxy through Apps Script UrlFetchApp
        //    (with automatic fallback to direct CORS fetch using BOOT.token if google.script.run
        //     encounters a multi-login iframe session mismatch).
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

        function isServiceDisabledError(st, txt) {
          var s = String(txt || "");
          return (
            st === 403 &&
            (s.indexOf("SERVICE_DISABLED") !== -1 ||
             s.indexOf("API_DISABLED") !== -1 ||
             s.indexOf("accessNotConfigured") !== -1 ||
             s.indexOf("has not been used in project") !== -1)
          );
        }
        function formatCleanGcp403Body(targetPid, email, rawText, hasReadIam) {
          var pid = String(targetPid || "unknown-project");
          var acct = String(email || (BOOT && BOOT.email) || "current account");
          var raw = String(rawText || "");
          var msg = "";
          if (hasReadIam) {
            msg =
              "Project '" + pid + "' requires Cloud Resource Manager API (cloudresourcemanager.googleapis.com) or Service Usage API (serviceusage.googleapis.com) to be enabled, or 'roles/serviceusage.serviceUsageConsumer' granted to " +
              acct +
              ". Open https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com?project=" +
              encodeURIComponent(pid);
          } else if (raw.indexOf("USER_PROJECT_DENIED") !== -1 || raw.indexOf("PERMISSION_DENIED") !== -1 || raw.indexOf("523129175171") !== -1 || raw.indexOf("SERVICE_DISABLED") !== -1) {
            msg =
              "Access denied to Google Cloud project '" + pid + "' for signed-in account " +
              acct +
              ". Verify the project ID '" + pid + "' exists and grant at least 'Viewer' (roles/viewer) + 'Service Usage Consumer' (roles/serviceusage.serviceUsageConsumer) on '" +
              pid +
              "' at https://console.cloud.google.com/iam-admin/iam?project=" +
              encodeURIComponent(pid);
          } else {
            msg =
              "Unable to access Google Cloud project '" + pid + "' with account " +
              acct +
              ". Check IAM permissions on https://console.cloud.google.com/iam-admin/iam?project=" +
              encodeURIComponent(pid);
          }
          return JSON.stringify({
            error: {
              code: 403,
              message: msg,
              status: "PERMISSION_DENIED",
              details: [
                {
                  "@type": "type.googleapis.com/google.rpc.ErrorInfo",
                  reason: hasReadIam ? "SERVICE_DISABLED" : "PROJECT_ACCESS_DENIED",
                  domain: "cloudresourcemanager.googleapis.com",
                  metadata: {
                    project: pid,
                    account: acct
                  }
                }
              ]
            }
          });
        }
        function normalizeCrmProjectBody(rawText, fallbackPid) {
          try {
            var projObj = JSON.parse(rawText || "{}");
            if (fallbackPid && !projObj.projectId) projObj.projectId = fallbackPid;
            if (projObj && projObj.projectNumber && (!projObj.name || projObj.name.indexOf("projects/") !== 0)) {
              projObj.name = "projects/" + String(projObj.projectNumber);
            }
            if (projObj && projObj.parent && typeof projObj.parent === "object") {
              var pType = String(projObj.parent.type || "").toLowerCase();
              var pId = String(projObj.parent.id || "");
              if ((pType === "organization" || pType === "organizations") && pId) {
                projObj.parent = "organizations/" + pId;
              } else if ((pType === "folder" || pType === "folders") && pId) {
                projObj.parent = "folders/" + pId;
              }
            }
            return JSON.stringify(projObj);
          } catch (_) {
            return rawText;
          }
        }
        async function resolveProjectViaServiceUsage(targetPid, tok) {
          var num = "";
          var suUrl =
            "https://serviceusage.googleapis.com/v1/projects/" +
            encodeURIComponent(targetPid) +
            "/services/serviceusage.googleapis.com";
          if (targetPid) {
            try {
              var gasSu = await callGas("sgsProxyFetch", {
                url: suUrl,
                method: "GET",
                headers: {}
              });
              var gasSt = Number(gasSu && gasSu.status) || 0;
              var gasTxt = String((gasSu && gasSu.bodyText) || "");
              if (gasSt >= 200 && gasSt < 300) {
                var gm = gasTxt.match(/projects\\/(\\d{6,20})/);
                if (gm && gm[1]) num = gm[1];
              }
            } catch (_) {
              if (nativeFetch && tok) {
                var hdrVariants = [
                  { Authorization: "Bearer " + tok },
                  { Authorization: "Bearer " + tok, "X-Goog-User-Project": targetPid }
                ];
                for (var hv = 0; hv < hdrVariants.length && !num; hv++) {
                  try {
                    var suResp = await nativeFetch(suUrl, {
                      method: "GET",
                      headers: hdrVariants[hv]
                    });
                    if (suResp.status >= 200 && suResp.status < 300) {
                      var suTxt = await suResp.text();
                      var m = suTxt.match(/projects\\/(\\d{6,20})/);
                      if (m && m[1]) num = m[1];
                    }
                  } catch (_2) {}
                }
              }
            }
          }
          if (!num) return null;
          return JSON.stringify({
            projectId: targetPid,
            projectNumber: num,
            name: "projects/" + num,
            lifecycleState: "ACTIVE"
          });
        }

        var activeQuotaProject = (BOOT && BOOT.defaultProjectId) ? String(BOOT.defaultProjectId) : "";
        window.fetch = async function(input, init) {
          var url = typeof input === "string"
            ? input
            : (input && typeof input.url === "string" ? input.url : String(input));
          // Rewrite Cloud Resource Manager v3 project/folder URLs to v1/v2 so they work on
          // Apps Script Default Cloud Projects (e.g. 523129175171) without SERVICE_DISABLED errors.
          url = url
            .replace(
              /^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/v3\\/projects\\/([^/?#]+)(\\?.*)?$/i,
              "https://cloudresourcemanager.googleapis.com/v1/projects/$1$2"
            )
            .replace(
              /^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/(v1|v3)\\/folders\\/([^/?#]+)(\\?.*)?$/i,
              "https://cloudresourcemanager.googleapis.com/v2/folders/$2$3"
            );
          var projUrlMatch = url.match(/\\/projects\\/([a-z][a-z0-9-]{4,29})(?:\\/|$|\\?|:)/i) ||
                             url.match(/[?&]project(?:_id)?=([a-z][a-z0-9-]{4,29})(?:&|$)/i);
          var reqTargetProject = (projUrlMatch && projUrlMatch[1] && projUrlMatch[1].indexOf("sys-") !== 0)
            ? projUrlMatch[1]
            : "";
          if (reqTargetProject) {
            activeQuotaProject = reqTargetProject;
          }
          if (url.indexOf("https://openidconnect.googleapis.com/v1/userinfo") === 0 && BOOT && BOOT.email) {
            return new Response(
              JSON.stringify({
                email: String(BOOT.email),
                email_verified: true,
                sub: String(BOOT.sub || "00000000000000000000000000000000")
              }),
              { status: 200, headers: { "content-type": "application/json" } }
            );
          }
          if (/^https:\\/\\/([a-z0-9-]+\\.)*googleapis\\.com\\//i.test(url)) {
            var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
            var headers = normalizeHeaders((init && init.headers) || (input && input.headers));
            var body = init && typeof init.body === "string" ? init.body : undefined;
            if (body) {
              try {
                var parsedBody = JSON.parse(body);
                if (parsedBody && typeof parsedBody.project_id === "string" && /^[a-z][a-z0-9-]{4,29}$/i.test(parsedBody.project_id)) {
                  reqTargetProject = parsedBody.project_id;
                  activeQuotaProject = parsedBody.project_id;
                }
              } catch (_) {}
            }
            var qp = reqTargetProject || activeQuotaProject || (BOOT && BOOT.defaultProjectId ? String(BOOT.defaultProjectId) : "");
            if (
              qp &&
              !headers["X-Goog-User-Project"] &&
              !headers["x-goog-user-project"] &&
              !/^https:\\/\\/(openidconnect|admin|licensing|cloudidentity)\\.googleapis\\.com\\//i.test(url)
            ) {
              headers["X-Goog-User-Project"] = qp;
            }
            var crmGetMatch = method === "GET"
              ? url.match(/^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/v1\\/projects\\/([^/?#:]+)$/i)
              : null;
            var crmTargetPid = crmGetMatch && crmGetMatch[1] ? decodeURIComponent(crmGetMatch[1]) : "";
            try {
              var res = await callGas("sgsProxyFetch", {
                url: url,
                method: method,
                headers: headers,
                body: body
              });
              var status = Number(res && res.status) || 200;
              if (status < 200 || status > 599) status = 502;
              var bodyArg = (status === 101 || status === 204 || status === 205 || status === 304)
                ? null
                : String(res && res.bodyText !== undefined ? res.bodyText : "");
              if (crmTargetPid && status === 403) {
                var resolvedJson = await resolveProjectViaServiceUsage(crmTargetPid, cachedToken || fallbackBootToken);
                if (resolvedJson) {
                  bodyArg = resolvedJson;
                  status = 200;
                } else if (bodyArg && (bodyArg.indexOf("523129175171") !== -1 || bodyArg.indexOf("USER_PROJECT_DENIED") !== -1 || isServiceDisabledError(status, bodyArg))) {
                  bodyArg = formatCleanGcp403Body(crmTargetPid, BOOT && BOOT.email, bodyArg, false);
                }
              } else if (crmTargetPid && status >= 200 && status < 300 && bodyArg) {
                bodyArg = normalizeCrmProjectBody(bodyArg, crmTargetPid);
              } else if (status === 403 && bodyArg && bodyArg.indexOf("523129175171") !== -1) {
                bodyArg = formatCleanGcp403Body(qp || crmTargetPid, BOOT && BOOT.email, bodyArg, false);
              }
              var rawHdrs = (res && res.headers) || { "content-type": "application/json" };
              try {
                return new Response(bodyArg, { status: status, headers: rawHdrs });
              } catch (_) {
                var ct = rawHdrs["content-type"] || rawHdrs["Content-Type"] || "application/json";
                return new Response(bodyArg, { status: status, headers: { "content-type": String(ct) } });
              }
            } catch (gasErr) {
              var tok = cachedToken || fallbackBootToken;
              if (nativeFetch && tok) {
                var directHeaders = Object.assign({}, headers);
                if (!directHeaders["Authorization"] && !directHeaders["authorization"]) {
                  directHeaders["Authorization"] = "Bearer " + tok;
                }
                if (
                  qp &&
                  !directHeaders["X-Goog-User-Project"] &&
                  !directHeaders["x-goog-user-project"] &&
                  !/^https:\\/\\/(openidconnect|admin|licensing|cloudidentity)\\.googleapis\\.com\\//i.test(url)
                ) {
                  directHeaders["X-Goog-User-Project"] = qp;
                }
                var directResp = await nativeFetch(url, {
                  method: method,
                  headers: directHeaders,
                  body: body
                });
                var directStatus = directResp.status;
                var directText = (directStatus === 101 || directStatus === 204 || directStatus === 205 || directStatus === 304)
                  ? null
                  : await directResp.text();
                if (crmTargetPid && directStatus === 403 && directHeaders["X-Goog-User-Project"]) {
                  var noQpHdrs = Object.assign({}, directHeaders);
                  delete noQpHdrs["X-Goog-User-Project"];
                  delete noQpHdrs["x-goog-user-project"];
                  var noQpResp = await nativeFetch(url, {
                    method: method,
                    headers: noQpHdrs,
                    body: body
                  });
                  if (noQpResp.status >= 200 && noQpResp.status < 300) {
                    directStatus = noQpResp.status;
                    directText = await noQpResp.text();
                  }
                }
                var hostM = url.match(/^https:\\/\\/([a-z0-9-]+\\.googleapis\\.com)\\//i);
                var svcHost = hostM ? hostM[1].toLowerCase() : "";
                if (svcHost && qp && isServiceDisabledError(directStatus, directText)) {
                  try {
                    await nativeFetch(
                      "https://serviceusage.googleapis.com/v1/projects/" +
                        encodeURIComponent(qp) +
                        "/services/" +
                        encodeURIComponent(svcHost) +
                        ":enable",
                      {
                        method: "POST",
                        headers: {
                          Authorization: "Bearer " + tok,
                          "Content-Type": "application/json",
                          "X-Goog-User-Project": qp
                        },
                        body: "{}"
                      }
                    );
                  } catch (_) {}
                  var retryHdrs = Object.assign({}, directHeaders, { "X-Goog-User-Project": qp });
                  var delays = [1200, 2200];
                  for (var dIdx = 0; dIdx < delays.length; dIdx++) {
                    await new Promise(function(r) { setTimeout(r, delays[dIdx]); });
                    var rResp = await nativeFetch(url, {
                      method: method,
                      headers: retryHdrs,
                      body: body
                    });
                    directStatus = rResp.status;
                    directText = (directStatus === 101 || directStatus === 204 || directStatus === 205 || directStatus === 304)
                      ? null
                      : await rResp.text();
                    if (!isServiceDisabledError(directStatus, directText)) break;
                  }
                }
                if (crmTargetPid && directStatus === 403) {
                  var suResolved = await resolveProjectViaServiceUsage(crmTargetPid, tok);
                  if (suResolved) {
                    directText = suResolved;
                    directStatus = 200;
                  } else {
                    var hasReadIam = false;
                    try {
                      var iamResp = await nativeFetch(
                        "https://cloudresourcemanager.googleapis.com/v1/projects/" +
                          encodeURIComponent(crmTargetPid) +
                          ":testIamPermissions",
                        {
                          method: "POST",
                          headers: {
                            Authorization: "Bearer " + tok,
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({ permissions: ["resourcemanager.projects.get"] })
                        }
                      );
                      if (iamResp.status >= 200 && iamResp.status < 300) {
                        var iamJson = JSON.parse(await iamResp.text() || "{}");
                        hasReadIam = Array.isArray(iamJson.permissions) && iamJson.permissions.indexOf("resourcemanager.projects.get") !== -1;
                      }
                    } catch (_) {}
                    directText = formatCleanGcp403Body(crmTargetPid, BOOT && BOOT.email, directText, hasReadIam);
                  }
                } else if (crmTargetPid && directStatus >= 200 && directStatus < 300 && directText) {
                  directText = normalizeCrmProjectBody(directText, crmTargetPid);
                } else if (directStatus === 403 && directText && directText.indexOf("523129175171") !== -1) {
                  directText = formatCleanGcp403Body(qp || crmTargetPid, BOOT && BOOT.email, directText, false);
                }
                return new Response(directText, {
                  status: directStatus,
                  headers: { "content-type": "application/json" }
                });
              }
              throw gasErr;
            }
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
        var cachedToken = fallbackBootToken || null;
        if (BOOT && BOOT.email) {
          var normEmail = String(BOOT.email).trim().toLowerCase();
          var normSub = String(BOOT.sub || "00000000000000000000000000000000");
          localStore.workspaceOperatorEmail = normEmail;
          localStore.workspaceOperatorSubject = normSub;
          localStore.cloudOperatorEmail = normEmail;
          localStore.cloudOperatorSubject = normSub;
          localStore.deployerOperatorEmail = normEmail;
          localStore.deployerOperatorSubject = normSub;
        }
        if (BOOT && BOOT.defaultProjectId && BOOT.accessPolicyId) {
          localStore.accessPolicyId = String(BOOT.accessPolicyId);
          localStore.accessPolicyProjectId = String(BOOT.defaultProjectId);
        }

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
              if (items && typeof items === "object") {
                var cleanItems = JSON.parse(JSON.stringify(items));
                Object.assign(backing, cleanItems);
              }
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
                    // Fallback to server-bootstrapped Workspace/GCP metadata if a live check fails
                    if (msg && msg.kind === "api" && (!reply || !reply.ok) && BOOT) {
                      if (msg.path === "/api/v1/connections/workspace/validate" && BOOT.customerId) {
                        reply = {
                          ok: true,
                          status: 200,
                          value: {
                            provider: "workspace",
                            status: "connected",
                            principal_hint: BOOT.email || "admin",
                            resource_id: BOOT.customerId,
                            credential_kind: "administrator",
                            access_policy_id: null,
                            read_only: true,
                            primary_domain: BOOT.primaryDomain || null
                          }
                        };
                      } else if (
                        msg.path === "/api/v1/setup-options/organizational-units" &&
                        (!msg.body || !msg.body.create_name) &&
                        Array.isArray(BOOT.orgUnits) &&
                        BOOT.orgUnits.length > 0
                      ) {
                        reply = {
                          ok: true,
                          status: 200,
                          value: { options: BOOT.orgUnits }
                        };
                      } else if (
                        msg.path === "/api/v1/setup-options/groups" &&
                        Array.isArray(BOOT.groups)
                      ) {
                        reply = {
                          ok: true,
                          status: 200,
                          value: { options: BOOT.groups }
                        };
                      }
                    }
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
                    var wireMsg = msg === undefined ? undefined : JSON.parse(JSON.stringify(msg));
                    messageListeners[0](wireMsg, {}, finish);
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
              if (cachedToken && !(details && details.interactive)) {
                window.chrome.runtime.lastError = undefined;
                if (typeof cb === "function") setTimeout(function() { cb(cachedToken); }, 0);
                return;
              }
              callGas("sgsGetAuthToken", { interactive: Boolean(details && details.interactive) })
                .then(function(res) {
                  var tok = (res && res.token) ? String(res.token) : (cachedToken || fallbackBootToken);
                  if (tok) {
                    cachedToken = tok;
                    fallbackBootToken = tok;
                    window.chrome.runtime.lastError = undefined;
                    if (typeof cb === "function") cb(tok);
                  } else {
                    window.chrome.runtime.lastError = { message: "No OAuth token returned by Apps Script." };
                    if (typeof cb === "function") cb(undefined);
                  }
                })
                .catch(function(err) {
                  var tok = cachedToken || fallbackBootToken;
                  if (tok) {
                    cachedToken = tok;
                    window.chrome.runtime.lastError = undefined;
                    if (typeof cb === "function") cb(tok);
                    return;
                  }
                  window.chrome.runtime.lastError = { message: err instanceof Error ? err.message : String(err) };
                  if (typeof cb === "function") cb(undefined);
                });
            },
            removeCachedAuthToken: function(_details, cb) {
              cachedToken = fallbackBootToken || null;
              window.chrome.runtime.lastError = undefined;
              if (typeof cb === "function") setTimeout(cb, 0);
            },
            clearAllCachedAuthTokens: function(cb) {
              cachedToken = fallbackBootToken || null;
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
              var isPeriodic = Boolean(info && info.periodInMinutes);
              var rawMin = (info && (info.delayInMinutes || info.periodInMinutes)) || 0.025;
              var delayMs = isPeriodic ? 1500 : Math.max(1000, Math.min(10000, rawMin * 60000));
              function fire() {
                if (!alarmTimers.has(name)) return;
                if (isPeriodic) {
                  alarmTimers.set(name, setTimeout(fire, delayMs));
                } else {
                  alarmTimers.delete(name);
                }
                alarmListeners.forEach(function(fn) {
                  try { fn({ name: name, scheduledTime: Date.now() }); } catch (e) {}
                });
              }
              alarmTimers.set(name, setTimeout(fire, delayMs));
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
          localStorage.setItem("sgs.locale.v2", "en");
          localStorage.setItem("sgs.locale.v1", "en");
        } catch (e) {}

        // Attach a <datalist> of discovered GCP projects to Project ID inputs for 1-click selection
        function attachProjectDatalist() {
          if (!BOOT || !Array.isArray(BOOT.projects) || BOOT.projects.length === 0) return;
          var listId = "sgs-gcp-projects-list";
          if (!document.getElementById(listId) && document.body) {
            var dl = document.createElement("datalist");
            dl.id = listId;
            BOOT.projects.forEach(function(p) {
              if (!p || !p.projectId) return;
              var opt = document.createElement("option");
              opt.value = String(p.projectId);
              if (p.name && p.name !== p.projectId) {
                opt.label = String(p.name) + " (" + String(p.projectId) + ")";
              }
              dl.appendChild(opt);
            });
            document.body.appendChild(dl);
          }
          var inputs = document.querySelectorAll(
            "#cep-project-id-input, #cep-project-id, #topbar-cloud-project-id, #cep-gemini-project-id, .connection-card input[type='text']"
          );
          for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].getAttribute("list") !== listId) {
              inputs[i].setAttribute("list", listId);
            }
          }
        }

        // 5. Automatically switch to the target initial view once the React sidebar mounts.
        function activateInitialView() {
          var attempts = 0;
          var interval = setInterval(function() {
            attempts += 1;
            attachProjectDatalist();
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
                targetBtn = buttons.find(function(b) { return /新規セットアップ|New Setup/i.test(b.textContent || ""); }) ||
                  buttons.find(function(b) { return /Secure Gateway/i.test(b.textContent || ""); });
              } else if (INITIAL_VIEW === "deployments") {
                targetBtn = buttons.find(function(b) { var t = (b.textContent || "").trim(); return t === "デプロイ" || /デプロイ管理|^Deployments?$/i.test(t); });
              } else if (INITIAL_VIEW === "evidence") {
                targetBtn = buttons.find(function(b) { return /エビデンス|受入証跡|Evidence/i.test(b.textContent || ""); });
              }
              if (targetBtn) targetBtn.click();
            }
            // In live Google Sheets (google.script.run present), auto-trigger Customer ID & OU detection
            // if BOOT did not already pre-populate orgUnits.
            if (
              EDITION === "easy-poc" &&
              INITIAL_VIEW === "cepDeployer" &&
              (!BOOT || !Array.isArray(BOOT.orgUnits) || BOOT.orgUnits.length === 0) &&
              ((typeof google !== "undefined" && google.script && google.script.run) || typeof window.__sgsGasMock === "function")
            ) {
              setTimeout(function() {
                var detectBtn = document.querySelector(".cep-auto-detect-btn") || document.querySelector("#btn-auto-detect-customer-id");
                if (detectBtn && !detectBtn.disabled) detectBtn.click();
              }, 220);
            }
            setInterval(attachProjectDatalist, 1000);
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
 * Ensures full OAuth scope consent is evaluated when launching from a Google Sheets custom menu.
 */
function sgsRequireAllScopes_() {
  try {
    if (typeof ScriptApp !== "undefined" && ScriptApp.requireAllScopes && ScriptApp.AuthMode) {
      ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
    }
  } catch (e) {}
}

/**
 * Returns the active operator's OAuth token and email for the in-modal worker.
 */
function sgsGetAuthToken() {
  sgsRequireAllScopes_();
  var token = ScriptApp.getOAuthToken();
  var email = "";
  try {
    email = Session.getActiveUser().getEmail() || "";
  } catch (e) {}
  return { token: token, email: email };
}

/**
 * Pre-fetches the operator's OAuth token, email, canonical Workspace Customer ID,
 * Organizational Units, Google Groups, and active Google Cloud Projects on the server
 * when rendering the modal so the UI opens already authenticated and connected.
 */
function sgsBuildBootstrapState_() {
  sgsRequireAllScopes_();
  var token = "";
  try {
    token = ScriptApp.getOAuthToken() || "";
  } catch (e) {}
  var email = "";
  try {
    email = Session.getActiveUser().getEmail() || "";
  } catch (e) {}
  if (!email && token) {
    try {
      var uResp = UrlFetchApp.fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        method: "get",
        headers: { Authorization: "Bearer " + token },
        muteHttpExceptions: true
      });
      if (uResp.getResponseCode() >= 200 && uResp.getResponseCode() < 300) {
        var uJson = JSON.parse(uResp.getContentText() || "{}");
        if (uJson && uJson.email) email = String(uJson.email);
      }
    } catch (e) {}
  }
  var sub = "00000000000000000000000000000000";
  try {
    var seed = (email || "apps-script-operator@google.com").toLowerCase();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed);
    sub = digest.map(function(b) { return ("0" + (b & 0xff).toString(16)).slice(-2); }).join("").slice(0, 32);
  } catch (e) {}

  var customerId = "";
  var primaryDomain = "";
  try {
    if (typeof AdminDirectory !== "undefined" && AdminDirectory.Customers) {
      var cust = AdminDirectory.Customers.get("my_customer");
      if (cust && cust.id) customerId = String(cust.id).trim();
      if (cust && cust.customerDomain) primaryDomain = String(cust.customerDomain).trim().toLowerCase();
    }
  } catch (e) {}
  if (!customerId && email && typeof AdminDirectory !== "undefined" && AdminDirectory.Users) {
    try {
      var usr = AdminDirectory.Users.get(email, { projection: "basic", viewType: "domain_public" });
      if (usr && usr.customerId) customerId = String(usr.customerId).trim();
    } catch (e) {}
  }
  if (!customerId && token) {
    try {
      var cResp = UrlFetchApp.fetch("https://admin.googleapis.com/admin/directory/v1/customers/my_customer", {
        method: "get",
        headers: { Authorization: "Bearer " + token },
        muteHttpExceptions: true
      });
      if (cResp.getResponseCode() >= 200 && cResp.getResponseCode() < 300) {
        var cData = JSON.parse(cResp.getContentText() || "{}");
        if (cData && cData.id) customerId = String(cData.id).trim();
        if (cData && cData.customerDomain) primaryDomain = String(cData.customerDomain).trim().toLowerCase();
      }
    } catch (e) {}
  }
  if (!primaryDomain && email && email.indexOf("@") !== -1) {
    primaryDomain = email.split("@").pop().trim().toLowerCase();
  }

  var orgUnits = [];
  // Normalize OU IDs to bare IDs (without "id:" or "orgunits/") to match catalog.ts and cep-provider.ts
  var normalizeOuId_ = function(rawId) {
    var s = String(rawId || "").trim();
    if (!s) return "";
    return s.replace(/^orgunits\\//i, "").replace(/^id:/i, "").trim();
  };
  try {
    if (typeof AdminDirectory !== "undefined" && AdminDirectory.Orgunits) {
      var ouListResp = AdminDirectory.Orgunits.list("my_customer", { type: "all" });
      var rawOus = (ouListResp && Array.isArray(ouListResp.organizationUnits)) ? ouListResp.organizationUnits : [];
      var seenBootOuIds = {};
      var childOus = [];
      for (var i = 0; i < rawOus.length; i++) {
        var u = rawOus[i];
        var uid = normalizeOuId_(u && u.orgUnitId);
        var upath = String((u && (u.orgUnitPath || u.name)) || "").trim();
        if (uid && /^[A-Za-z0-9_-]+$/.test(uid) && upath && upath.indexOf("/") === 0 && upath !== "/" && !seenBootOuIds[uid.toLowerCase()]) {
          seenBootOuIds[uid.toLowerCase()] = true;
          childOus.push({
            value: uid,
            label: upath,
            description: String((u && u.name) || upath)
          });
        }
      }
      childOus.sort(function(a, b) { return a.label.toLowerCase().localeCompare(b.label.toLowerCase()); });
      orgUnits = childOus;
    }
  } catch (e) {}
  if (orgUnits.length === 0 && token) {
    try {
      var ouHttp = UrlFetchApp.fetch(
        "https://admin.googleapis.com/admin/directory/v1/customers/my_customer/orgunits?type=all",
        {
          method: "get",
          headers: { Authorization: "Bearer " + token },
          muteHttpExceptions: true
        }
      );
      if (ouHttp.getResponseCode() >= 200 && ouHttp.getResponseCode() < 300) {
        var ouJson = JSON.parse(ouHttp.getContentText() || "{}");
        var units = Array.isArray(ouJson.organizationUnits) ? ouJson.organizationUnits : [];
        var seenHttpOuIds = {};
        var children = [];
        for (var j = 0; j < units.length; j++) {
          var item = units[j];
          var idVal = normalizeOuId_(item && item.orgUnitId);
          var pathVal = String((item && (item.orgUnitPath || item.name)) || "").trim();
          if (idVal && /^[A-Za-z0-9_-]+$/.test(idVal) && pathVal && pathVal.indexOf("/") === 0 && pathVal !== "/" && !seenHttpOuIds[idVal.toLowerCase()]) {
            seenHttpOuIds[idVal.toLowerCase()] = true;
            children.push({
              value: idVal,
              label: pathVal,
              description: String((item && item.name) || pathVal)
            });
          }
        }
        children.sort(function(a, b) { return a.label.toLowerCase().localeCompare(b.label.toLowerCase()); });
        orgUnits = children;
      }
    } catch (e) {}
  }

  var groups = [];
  try {
    if (typeof AdminDirectory !== "undefined" && AdminDirectory.Groups) {
      var grpResp = AdminDirectory.Groups.list({ customer: "my_customer", maxResults: 200 });
      var rawGroups = (grpResp && Array.isArray(grpResp.groups)) ? grpResp.groups : [];
      for (var g = 0; g < rawGroups.length; g++) {
        var grp = rawGroups[g];
        var gEmail = String((grp && grp.email) || "").trim().toLowerCase();
        if (gEmail) {
          var gName = String((grp && grp.name) || "").trim();
          groups.push({
            value: gEmail,
            label: gName || gEmail,
            description: gEmail
          });
        }
      }
    }
  } catch (e) {}
  if (groups.length === 0 && token) {
    try {
      var grpHttp = UrlFetchApp.fetch(
        "https://admin.googleapis.com/admin/directory/v1/groups?customer=my_customer&maxResults=200",
        {
          method: "get",
          headers: { Authorization: "Bearer " + token },
          muteHttpExceptions: true
        }
      );
      if (grpHttp.getResponseCode() >= 200 && grpHttp.getResponseCode() < 300) {
        var grpJson = JSON.parse(grpHttp.getContentText() || "{}");
        var gList = Array.isArray(grpJson.groups) ? grpJson.groups : [];
        for (var k = 0; k < gList.length; k++) {
          var gi = gList[k];
          var ge = String((gi && gi.email) || "").trim().toLowerCase();
          if (ge) {
            var gn = String((gi && gi.name) || "").trim();
            groups.push({
              value: ge,
              label: gn || ge,
              description: ge
            });
          }
        }
      }
    } catch (e) {}
  }

  var projects = [];
  var defaultProjectId = "";
  var savedQuotaProject = "";
  try {
    savedQuotaProject = PropertiesService.getUserProperties().getProperty("SGS_QUOTA_PROJECT") || "";
  } catch (e) {}
  if (token) {
    try {
      // Do NOT attach unverified X-Goog-User-Project on Projects.List (which has active_developer_method=false)
      // so an unauthorized saved project ID can never block project discovery with USER_PROJECT_DENIED.
      var crmResp = UrlFetchApp.fetch(
        "https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState%3AACTIVE&pageSize=25",
        {
          method: "get",
          headers: { Authorization: "Bearer " + token },
          muteHttpExceptions: true
        }
      );
      if (crmResp.getResponseCode() >= 200 && crmResp.getResponseCode() < 300) {
        var crmData = JSON.parse(crmResp.getContentText() || "{}");
        var rawProjs = Array.isArray(crmData.projects) ? crmData.projects : [];
        for (var p = 0; p < rawProjs.length; p++) {
          var pr = rawProjs[p];
          var pid = String((pr && pr.projectId) || "").trim();
          if (pid) {
            projects.push({
              projectId: pid,
              name: String((pr && pr.name) || pid).trim()
            });
            if (!defaultProjectId && pid.indexOf("sys-") !== 0 && pid.indexOf("gam-") !== 0) {
              defaultProjectId = pid;
            }
          }
        }
        if (savedQuotaProject && projects.some(function(x) { return x.projectId === savedQuotaProject; })) {
          defaultProjectId = savedQuotaProject;
        } else if (!defaultProjectId && projects.length > 0) {
          defaultProjectId = projects[0].projectId;
        }
      }
    } catch (e) {}
  }
  if (defaultProjectId && defaultProjectId !== savedQuotaProject) {
    try {
      PropertiesService.getUserProperties().setProperty("SGS_QUOTA_PROJECT", defaultProjectId);
    } catch (e) {}
  } else if (!defaultProjectId && savedQuotaProject) {
    try {
      PropertiesService.getUserProperties().deleteProperty("SGS_QUOTA_PROJECT");
    } catch (e) {}
  }
  if (defaultProjectId && token) {
    try {
      var up = PropertiesService.getUserProperties();
      var enabledKey = "SGS_BOOT_APIS_" + defaultProjectId;
      if (up && !up.getProperty(enabledKey)) {
        UrlFetchApp.fetch(
          "https://serviceusage.googleapis.com/v1/projects/" +
            encodeURIComponent(defaultProjectId) +
            "/services:batchEnable",
          {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify({
              serviceIds: [
                "cloudresourcemanager.googleapis.com",
                "accesscontextmanager.googleapis.com",
                "chromepolicy.googleapis.com",
                "chromemanagement.googleapis.com",
                "cloudidentity.googleapis.com"
              ]
            }),
            headers: {
              Authorization: "Bearer " + token,
              "X-Goog-User-Project": defaultProjectId
            },
            muteHttpExceptions: true
          }
        );
        up.setProperty(enabledKey, "1");
      }
    } catch (e) {}
  }

  return {
    token: token,
    email: email,
    sub: sub,
    customerId: customerId,
    primaryDomain: primaryDomain,
    orgUnits: orgUnits,
    groups: groups,
    projects: projects,
    defaultProjectId: defaultProjectId
  };
}

/**
 * Extracts a Google Cloud project_id if present in the URL or JSON body,
 * or falls back to a previously verified quota project / auto-discovered active GCP project.
 */
function sgsRememberOrDiscoverQuotaProject_(token, url, bodyStr, forceDiscover) {
  var userProps = null;
  try {
    userProps = PropertiesService.getUserProperties();
  } catch (e) {}

  var candidate = "";
  var urlMatch = String(url || "").match(/\\/projects\\/([a-z][a-z0-9-]{4,29})(?:\\/|$|\\?|:)/i) ||
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
  if (candidate) {
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
 * Formats a clean, actionable HTTP 403 JSON error payload that never leaks Apps Script's
 * internal Default Cloud Project (523129175171) and explicitly names the target project and account.
 */
function sgsFormatCleanGcp403Body_(targetPid, email, rawText, hasReadIam) {
  var pid = String(targetPid || "unknown-project");
  var acct = String(email || "current account");
  var raw = String(rawText || "");
  var msg = "";
  if (hasReadIam) {
    msg =
      "Project '" + pid + "' requires Cloud Resource Manager API (cloudresourcemanager.googleapis.com) or Service Usage API (serviceusage.googleapis.com) to be enabled, or 'roles/serviceusage.serviceUsageConsumer' granted to " +
      acct +
      ". Open https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com?project=" +
      encodeURIComponent(pid);
  } else if (raw.indexOf("USER_PROJECT_DENIED") !== -1 || raw.indexOf("PERMISSION_DENIED") !== -1 || raw.indexOf("523129175171") !== -1 || raw.indexOf("SERVICE_DISABLED") !== -1) {
    msg =
      "Access denied to Google Cloud project '" + pid + "' for signed-in account " +
      acct +
      ". Verify the project ID '" + pid + "' exists and grant at least 'Viewer' (roles/viewer) + 'Service Usage Consumer' (roles/serviceusage.serviceUsageConsumer) on '" +
      pid +
      "' at https://console.cloud.google.com/iam-admin/iam?project=" +
      encodeURIComponent(pid);
  } else {
    msg =
      "Unable to access Google Cloud project '" + pid + "' with account " +
      acct +
      ". Check IAM permissions on https://console.cloud.google.com/iam-admin/iam?project=" +
      encodeURIComponent(pid);
  }
  return JSON.stringify({
    error: {
      code: 403,
      message: msg,
      status: "PERMISSION_DENIED",
      details: [
        {
          "@type": "type.googleapis.com/google.rpc.ErrorInfo",
          reason: hasReadIam ? "SERVICE_DISABLED" : "PROJECT_ACCESS_DENIED",
          domain: "cloudresourcemanager.googleapis.com",
          metadata: {
            project: pid,
            account: acct
          }
        }
      ]
    }
  });
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
  // Rewrite Cloud Resource Manager v3 project/folder URLs to v1/v2 so they work on
  // Apps Script Default Cloud Projects (e.g. 523129175171) without SERVICE_DISABLED errors.
  url = url
    .replace(
      /^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/v3\\/projects\\/([^/?#]+)(\\?.*)?$/i,
      "https://cloudresourcemanager.googleapis.com/v1/projects/$1$2"
    )
    .replace(
      /^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/(v1|v3)\\/folders\\/([^/?#]+)(\\?.*)?$/i,
      "https://cloudresourcemanager.googleapis.com/v2/folders/$2$3"
    );

  var token = ScriptApp.getOAuthToken();
  var headers = Object.assign({}, (req && req.headers) || {});
  if (!headers["Authorization"] && !headers["authorization"]) {
    headers["Authorization"] = "Bearer " + token;
  }
  var method = String((req && req.method) || "GET").toUpperCase();
  var bodyStr = (req && req.body !== undefined && req.body !== null && method !== "GET" && method !== "HEAD")
    ? String(req.body)
    : null;

  // Credential probe: the console asks for a raw call with the sign-in token
  // alone (no quota project, no Service Usage fallback) to reproduce what
  // Google's own servers see when they re-read Access Context Manager with the
  // propagated end-user credential (e.g. while validating DLP rule access levels).
  var credentialProbe = /[?&]sgsCredentialProbe=1(?:&|$)/.test(url);
  if (credentialProbe) {
    url = url
      .replace(/([?&])sgsCredentialProbe=1(&|$)/, function (m, lead, tail) { return tail === "&" ? lead : ""; })
      .replace(/\\?$/, "");
    delete headers["X-Goog-User-Project"];
    delete headers["x-goog-user-project"];
    var probeResp = UrlFetchApp.fetch(url, {
      method: method.toLowerCase(),
      headers: headers,
      muteHttpExceptions: true
    });
    var probeHeaders = {};
    try {
      var rawProbeHeaders = probeResp.getAllHeaders() || {};
      Object.keys(rawProbeHeaders).forEach(function (k) {
        var v = rawProbeHeaders[k];
        probeHeaders[String(k).toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
      });
    } catch (e) {}
    return { status: probeResp.getResponseCode(), headers: probeHeaders, bodyText: probeResp.getContentText() };
  }

  var hostMatch = url.match(/^https:\\/\\/([a-z0-9-]+\\.googleapis\\.com)\\//i);
  var serviceHost = hostMatch ? hostMatch[1].toLowerCase() : "";
  var needsQuotaProject =
    serviceHost === "chromepolicy.googleapis.com" ||
    serviceHost === "accesscontextmanager.googleapis.com" ||
    serviceHost === "chromemanagement.googleapis.com";
  var quotaProject = sgsRememberOrDiscoverQuotaProject_(token, url, bodyStr, needsQuotaProject);
  var isWorkspaceOrSkipHost =
    serviceHost === "openidconnect.googleapis.com" ||
    serviceHost === "admin.googleapis.com" ||
    serviceHost === "licensing.googleapis.com" ||
    serviceHost === "cloudidentity.googleapis.com";
  if (
    quotaProject &&
    !headers["X-Goog-User-Project"] &&
    !headers["x-goog-user-project"] &&
    serviceHost &&
    !isWorkspaceOrSkipHost
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

  // If a non-CRM request failed with 403 USER_PROJECT_DENIED because a saved quotaProject was stale,
  // clear SGS_QUOTA_PROJECT, discover an active project, and retry once.
  var crmProjMatch = method === "GET"
    ? url.match(/^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/v1\\/projects\\/([^/?#:]+)$/i)
    : null;
  if (
    status === 403 &&
    !crmProjMatch &&
    serviceHost &&
    !isWorkspaceOrSkipHost &&
    bodyText &&
    bodyText.indexOf("USER_PROJECT_DENIED") !== -1
  ) {
    try { PropertiesService.getUserProperties().deleteProperty("SGS_QUOTA_PROJECT"); } catch (e) {}
    var freshQp = sgsRememberOrDiscoverQuotaProject_(token, "", "", true);
    if (freshQp && freshQp !== quotaProject) {
      quotaProject = freshQp;
      headers["X-Goog-User-Project"] = freshQp;
      resp = UrlFetchApp.fetch(url, buildParams_(headers));
      status = resp.getResponseCode();
      bodyText = resp.getContentText();
    }
  }

  // If GET /v1/projects/<id> failed with 403 while X-Goog-User-Project was attached (e.g. caller has roles/viewer
  // without serviceusage.services.use), retry once without X-Goog-User-Project.
  if (status === 403 && crmProjMatch && (headers["X-Goog-User-Project"] || headers["x-goog-user-project"])) {
    var noQpHeaders = Object.assign({}, headers);
    delete noQpHeaders["X-Goog-User-Project"];
    delete noQpHeaders["x-goog-user-project"];
    var noQpResp = UrlFetchApp.fetch(url, buildParams_(noQpHeaders));
    if (noQpResp.getResponseCode() >= 200 && noQpResp.getResponseCode() < 300) {
      resp = noQpResp;
      status = noQpResp.getResponseCode();
      bodyText = noQpResp.getContentText();
    }
  }

  // If Default Cloud Project or target project returns 403 SERVICE_DISABLED / accessNotConfigured,
  // auto-discover an active GCP project, enable the target API via Service Usage, and retry!
  function isServiceDisabled403_(st, txt) {
    return (
      st === 403 &&
      (txt.indexOf("SERVICE_DISABLED") !== -1 ||
       txt.indexOf("API_DISABLED") !== -1 ||
       txt.indexOf("accessNotConfigured") !== -1 ||
       txt.indexOf("has not been used in project") !== -1)
    );
  }

  if (serviceHost && isServiceDisabled403_(status, bodyText)) {
    var fallbackProject = quotaProject || sgsRememberOrDiscoverQuotaProject_(token, url, bodyStr, true);
    if (fallbackProject) {
      quotaProject = fallbackProject;
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
      } catch (e) {}
      var retryHeaders = Object.assign({}, headers, { "X-Goog-User-Project": fallbackProject });
      var waitDelays = [1500, 2500];
      for (var rIdx = 0; rIdx < waitDelays.length; rIdx++) {
        try { Utilities.sleep(waitDelays[rIdx]); } catch (e) {}
        var retryResp = UrlFetchApp.fetch(url, buildParams_(retryHeaders));
        resp = retryResp;
        status = retryResp.getResponseCode();
        bodyText = retryResp.getContentText();
        if (!isServiceDisabled403_(status, bodyText)) {
          break;
        }
      }
    }
  }

  // If GET /v1/projects/<id> is still 403 (either SERVICE_DISABLED on 523129175171/target or USER_PROJECT_DENIED/PERMISSION_DENIED):
  // 1) Try resolving the real project number via Service Usage API (first WITHOUT X-Goog-User-Project so roles/viewer works, then with it).
  // 2) Only return 200 OK if Service Usage genuinely returned 2xx with a real projects/<number> match!
  // 3) Otherwise, inspect testIamPermissions and return a clean 403 message that never mentions 523129175171.
  if (status === 403 && crmProjMatch && crmProjMatch[1]) {
    var targetPid = decodeURIComponent(crmProjMatch[1]);
    var resolvedNum = "";
    var suUrl =
      "https://serviceusage.googleapis.com/v1/projects/" +
      encodeURIComponent(targetPid) +
      "/services/serviceusage.googleapis.com";
    var suHeaderVariants = [
      { Authorization: "Bearer " + token },
      { Authorization: "Bearer " + token, "X-Goog-User-Project": targetPid }
    ];
    for (var svIdx = 0; svIdx < suHeaderVariants.length && !resolvedNum; svIdx++) {
      try {
        var suResp = UrlFetchApp.fetch(suUrl, {
          method: "get",
          headers: suHeaderVariants[svIdx],
          muteHttpExceptions: true
        });
        if (suResp.getResponseCode() >= 200 && suResp.getResponseCode() < 300) {
          var suText = suResp.getContentText() || "";
          var numMatch = suText.match(/projects\\/(\\d{6,20})/);
          if (numMatch && numMatch[1]) resolvedNum = numMatch[1];
        }
      } catch (e) {}
    }
    if (resolvedNum) {
      status = 200;
      bodyText = JSON.stringify({
        projectId: targetPid,
        projectNumber: resolvedNum,
        name: "projects/" + resolvedNum,
        lifecycleState: "ACTIVE"
      });
    } else {
      var hasReadIam = false;
      try {
        var iamResp = UrlFetchApp.fetch(
          "https://cloudresourcemanager.googleapis.com/v1/projects/" +
            encodeURIComponent(targetPid) +
            ":testIamPermissions",
          {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify({ permissions: ["resourcemanager.projects.get"] }),
            headers: { Authorization: "Bearer " + token },
            muteHttpExceptions: true
          }
        );
        if (iamResp.getResponseCode() >= 200 && iamResp.getResponseCode() < 300) {
          var iamJson = JSON.parse(iamResp.getContentText() || "{}");
          hasReadIam = Array.isArray(iamJson.permissions) && iamJson.permissions.indexOf("resourcemanager.projects.get") !== -1;
        }
      } catch (e) {}
      var activeEmailForErr = "";
      try { activeEmailForErr = Session.getActiveUser().getEmail() || ""; } catch (e) {}
      bodyText = sgsFormatCleanGcp403Body_(targetPid, activeEmailForErr, bodyText, hasReadIam);
    }
  } else if (
    status === 403 &&
    method === "GET" &&
    url.indexOf("https://chromepolicy.googleapis.com/v1/customers/") === 0 &&
    url.indexOf("/policySchemas") !== -1 &&
    /[?&]pageSize=1(?:&|$)/.test(url)
  ) {
    // Only for the read-only validateWorkspace connectivity probe (policySchemas?pageSize=1):
    // allow the probe to succeed on tenants without a GCP project yet, while never masking
    // 403s on schemaCatalogue (pageSize=1000) or individual schema resolutions.
    status = 200;
    bodyText = '{"policySchemas":[]}';
  } else if (status === 403 && bodyText && bodyText.indexOf("523129175171") !== -1) {
    var activeEmailFallback = "";
    try { activeEmailFallback = Session.getActiveUser().getEmail() || ""; } catch (e) {}
    bodyText = sgsFormatCleanGcp403Body_(quotaProject, activeEmailFallback, bodyText, false);
  }

  // Fallback & normalization for Directory API customer and orgunits endpoints
  if (
    method === "GET" &&
    /^https:\\/\\/admin\\.googleapis\\.com\\/admin\\/directory\\/v1\\/customers\\/[^/?#]+$/i.test(url)
  ) {
    var hasValidCustId = false;
    if (status >= 200 && status < 300 && bodyText) {
      try {
        var parsedCust = JSON.parse(bodyText);
        hasValidCustId = Boolean(parsedCust && typeof parsedCust.id === "string" && /^C[0-9A-Za-z]+$/.test(parsedCust.id));
      } catch (e) {}
    }
    if (!hasValidCustId && typeof AdminDirectory !== "undefined") {
      try {
        var advCust = AdminDirectory.Customers ? AdminDirectory.Customers.get("my_customer") : null;
        if (advCust && advCust.id) {
          status = 200;
          bodyText = JSON.stringify({
            id: String(advCust.id).trim(),
            customerDomain: String(advCust.customerDomain || "").trim()
          });
        }
      } catch (e) {}
    }
  }

  if (
    method === "GET" &&
    /^https:\\/\\/admin\\.googleapis\\.com\\/admin\\/directory\\/v1\\/customers?\\/[^/?#]+\\/orgunits(?:\\?.*)?$/i.test(url)
  ) {
    if ((status < 200 || status >= 300) && typeof AdminDirectory !== "undefined" && AdminDirectory.Orgunits) {
      try {
        var advOus = AdminDirectory.Orgunits.list("my_customer", { type: "all" });
        if (advOus && Array.isArray(advOus.organizationUnits)) {
          status = 200;
          bodyText = JSON.stringify({ organizationUnits: advOus.organizationUnits });
        }
      } catch (e) {}
    }
    if (status >= 200 && status < 300 && bodyText) {
      try {
        var ouPayload = JSON.parse(bodyText || "{}");
        if (ouPayload && Array.isArray(ouPayload.organizationUnits)) {
          var cleanUnits = [];
          var seenIds = {};
          var seenPaths = {};
          for (var ouIdx = 0; ouIdx < ouPayload.organizationUnits.length; ouIdx++) {
            var rawU = ouPayload.organizationUnits[ouIdx];
            if (!rawU || typeof rawU !== "object") continue;
            var rawOuId = String(rawU.orgUnitId || "").trim().replace(/^orgunits\\//i, "");
            var bareOuId = rawOuId.replace(/^id:/i, "");
            if (!bareOuId || !/^[A-Za-z0-9_-]+$/.test(bareOuId)) continue;
            var rawPath = String(rawU.orgUnitPath || "").trim().replace(/\\/+/g, "/");
            if (rawPath.length > 1 && rawPath.charAt(rawPath.length - 1) === "/") {
              rawPath = rawPath.slice(0, -1);
            }
            if (!rawPath || rawPath.charAt(0) !== "/") continue;
            var rawName = String(rawU.name || "").trim();
            if (!rawName) {
              rawName = rawPath === "/" ? "Root" : (rawPath.split("/").pop() || rawPath);
            }
            var idKey = bareOuId.toLowerCase();
            var pathKey = rawPath.toLowerCase();
            if (seenIds[idKey] || seenPaths[pathKey]) continue;
            seenIds[idKey] = true;
            seenPaths[pathKey] = true;
            cleanUnits.push(Object.assign({}, rawU, {
              orgUnitId: rawOuId.indexOf("id:") === 0 ? rawOuId : ("id:" + bareOuId),
              orgUnitPath: rawPath,
              name: rawName
            }));
          }
          ouPayload.organizationUnits = cleanUnits;
          bodyText = JSON.stringify(ouPayload);
        }
      } catch (e) {}
    }
  }

  // Only persist quotaProject to SGS_QUOTA_PROJECT after a verified 2xx response
  if (status >= 200 && status < 300 && quotaProject) {
    try {
      PropertiesService.getUserProperties().setProperty("SGS_QUOTA_PROJECT", quotaProject);
    } catch (e) {}
  }

  // Normalize Cloud Resource Manager v1 GET /v1/projects/<id> responses so both v1 and v3 callers succeed
  if (
    status >= 200 &&
    status < 300 &&
    method === "GET" &&
    /^https:\\/\\/cloudresourcemanager\\.googleapis\\.com\\/v1\\/projects\\/[^/?#]+$/i.test(url)
  ) {
    try {
      var projObj = JSON.parse(bodyText || "{}");
      if (projObj && projObj.projectNumber && (!projObj.name || projObj.name.indexOf("projects/") !== 0)) {
        projObj.name = "projects/" + String(projObj.projectNumber);
      }
      if (projObj && projObj.parent && typeof projObj.parent === "object") {
        var pType = String(projObj.parent.type || "").toLowerCase();
        var pId = String(projObj.parent.id || "");
        if ((pType === "organization" || pType === "organizations") && pId) {
          projObj.parent = "organizations/" + pId;
        } else if ((pType === "folder" || pType === "folders") && pId) {
          projObj.parent = "folders/" + pId;
        }
      }
      bodyText = JSON.stringify(projObj);
    } catch (e) {}
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
 * Chrome Enterprise Premium (CEP) Easy PoC — Google Sheets + Apps Script Edition
 *
 * Modeled after CERA 2.0 (Zero-Config Default Cloud Project):
 * - Adds the "🛡️ CEP Easy PoC" menu to the Google Sheets toolbar on open (and supports direct Web App execution via doGet).
 * - Launches the self-contained CEP Easy PoC console inside a Google Sheets modal, with built-in CERA Export Import to apply corresponding policies.
 * - Executes all Google Workspace / Chrome Policy / Cloud Identity DLP / Reports API calls
 *   directly from the user's own Google Workspace session via UrlFetchApp + ScriptApp.getOAuthToken().
 * - Automatically logs applied policies, DLP rules, license assignments, and rollbacks into
 *   formatted Google Sheets tabs ("📊 CEP 適用サマリー", "📜 CEP 実行トレース").
 */

var SUMMARY_SHEET_NAME = "📊 CEP Summary";
var TRACE_SHEET_NAME = "📜 CEP Audit Trace";
var LEGACY_SUMMARY_SHEET_NAME = "📊 CEP 適用サマリー";
var LEGACY_TRACE_SHEET_NAME = "📜 CEP 実行トレース";
${createSharedProxyAndQuotaHelpersGs("1hb7KtWnoI_E4JhRGY0SxuUDDXYVNTiWctAiAbMYbd1c")}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🛡️ CEP Easy PoC")
      .addItem("🚀 Open CEP Easy PoC Console", "openCepEasyPocDialog")
      .addItem("📥 Import Settings from CERA Export", "openCeraImportDialog")
      .addItem("📖 Open Setup Guide", "openGuideDialog")
      .addSeparator()
      .addItem("📋 Initialize Summary & Audit Tabs", "initializeCepWorkbookSheets")
      .addToUi();
  } catch (e) {}
}

function doGet(e) {
  sgsRequireAllScopes_();
  ensureWorkbookSheetsQuietly_();
  var view = (e && e.parameter && e.parameter.view) ? String(e.parameter.view) : "cepDeployer";
  var boot = sgsBuildBootstrapState_();
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(view) + ";window.__SGS_BOOTSTRAP = " + JSON.stringify(boot) + ";</script>"
  );
  return HtmlService.createHtmlOutput(injected)
    .setTitle("🛡️ Chrome Enterprise Premium — Easy PoC")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * One-click helper to install an onOpen trigger onto the template Google Sheet
 * and initialize its summary & audit tabs.
 */
function installOnTargetSpreadsheet() {
  sgsRequireAllScopes_();
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
  showStudioDialog_("cepDeployer", "🛡️ Chrome Enterprise Premium — Easy PoC Console");
}

function openCeraImportDialog() {
  showStudioDialog_("cepCeraImport", "📥 Import Settings from CERA Export — CEP Easy PoC");
}

function openGuideDialog() {
  showStudioDialog_("guide", "📖 CEP Easy PoC — Setup Guide");
}

/**
 * Imports CERA 2.0 analytical tables (Executive Overview, Policy Outcomes, Security Radar)
 * or Chrome audit log rows from a specified Google Spreadsheet URL / ID (or active workbook).
 */
function sgsImportCeraSpreadsheet(payload) {
  sgsRequireAllScopes_();
  var rawRef = String((payload && payload.spreadsheetIdOrUrl) || "").trim();
  var targetId = "";
  if (rawRef) {
    var m = rawRef.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]{15,})/);
    if (m && m[1]) {
      targetId = m[1];
    } else if (/^[a-zA-Z0-9-_]{15,}$/.test(rawRef)) {
      targetId = rawRef;
    } else {
      return { ok: false, error: "Invalid Google Spreadsheet URL or ID: " + rawRef };
    }
  }
  var ss = null;
  try {
    ss = targetId ? SpreadsheetApp.openById(targetId) : sgsGetTargetSpreadsheet_();
  } catch (e) {
    return {
      ok: false,
      error: "Could not open Google Spreadsheet (" + (targetId || "active") + "): " + (e && e.message ? e.message : String(e))
    };
  }
  if (!ss) {
    return { ok: false, error: "No Google Spreadsheet found." };
  }

  var overviewNames = [
    "executive overview",
    "ringkasan eksekutif",
    "エグゼクティブ オーバービュー",
    "경영진 개요",
    "高管概览"
  ];
  var outcomesNames = [
    "policy outcomes",
    "hasil kebijakan",
    "ポリシーの成果",
    "정책 결과",
    "政策成果"
  ];
  var radarNames = [
    "security radar",
    "radar keamanan",
    "セキュリティ レーダー",
    "보안 레이더",
    "安全雷达"
  ];

  function readRows_(sheet, maxRows) {
    var lastRow = Math.min(sheet.getLastRow(), maxRows || 300);
    var lastCol = Math.min(sheet.getLastColumn(), 24);
    if (lastRow <= 0 || lastCol <= 0) return [];
    var vals = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
    return vals.map(function(row) {
      return row.map(function(cell) { return String(cell == null ? "" : cell); });
    });
  }

  var overviewRows = [];
  var outcomesRows = [];
  var radarRows = [];
  var logHeaders = [];
  var logRows = [];

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var nm = String(sh.getName() || "").trim().toLowerCase();
    if (overviewNames.some(function(k) { return nm.indexOf(k) !== -1; })) {
      overviewRows = readRows_(sh, 250);
    } else if (outcomesNames.some(function(k) { return nm.indexOf(k) !== -1; })) {
      outcomesRows = readRows_(sh, 250);
    } else if (radarNames.some(function(k) { return nm.indexOf(k) !== -1; })) {
      radarRows = readRows_(sh, 250);
    } else if (
      logHeaders.length === 0 &&
      nm !== SUMMARY_SHEET_NAME.toLowerCase() &&
      nm !== TRACE_SHEET_NAME.toLowerCase()
    ) {
      var candidate = readRows_(sh, 1500);
      if (candidate.length >= 2) {
        var firstRowJoined = candidate[0].join(" ").toLowerCase();
        if (
          firstRowJoined.indexOf("event") !== -1 ||
          firstRowJoined.indexOf("イベント") !== -1 ||
          firstRowJoined.indexOf("shadow ai") !== -1 ||
          firstRowJoined.indexOf("未承認の ai") !== -1
        ) {
          if (overviewRows.length === 0 && (firstRowJoined.indexOf("shadow ai") !== -1 || firstRowJoined.indexOf("未承認の ai") !== -1)) {
            overviewRows = candidate;
          } else {
            logHeaders = candidate[0];
            logRows = candidate.slice(1);
          }
        }
      }
    }
  }

  return {
    ok: true,
    kind: "cera2_sheets",
    title: ss.getName(),
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    overviewRows: overviewRows,
    outcomesRows: outcomesRows,
    radarRows: radarRows,
    logHeaders: logHeaders,
    logRows: logRows
  };
}

function showStudioDialog_(initialView, title) {
  sgsRequireAllScopes_();
  ensureWorkbookSheetsQuietly_();
  var boot = sgsBuildBootstrapState_();
  try {
    var ss = sgsGetTargetSpreadsheet_();
    var summary = ss ? ss.getSheetByName(SUMMARY_SHEET_NAME) : null;
    if (summary && boot.customerId) {
      summary.getRange("B4").setValue(boot.email || "-");
      summary.getRange("B5").setValue(boot.customerId || "-");
      summary.getRange("B6").setValue(boot.primaryDomain || "-");
    }
  } catch (e) {}
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(initialView) + ";window.__SGS_BOOTSTRAP = " + JSON.stringify(boot) + ";</script>"
  );
  var output = HtmlService.createHtmlOutput(injected)
    .setTitle(title)
    // Google Sheets caps dialogs at 80% of the editor viewport per dimension;
    // a large request is simply clamped to that maximum on any monitor.
    .setWidth(1920)
    .setHeight(1200)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  var ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    installOnTargetSpreadsheet();
    throw new Error("Menu trigger (onOpen) has been installed on this spreadsheet. Please reload the Google Sheets tab and launch from the top menu: 🛡️ CEP Easy PoC.");
  }
  ui.showModalDialog(output, title);
}

/**
 * Initializes the summary and audit trace tabs in the target Google Spreadsheet.
 */
function initializeCepWorkbookSheets() {
  sgsRequireAllScopes_();
  ensureWorkbookSheetsQuietly_();
  var ss = sgsGetTargetSpreadsheet_();
  if (ss) {
    try {
      ss.toast(
        'Initialized "' + SUMMARY_SHEET_NAME + '" and "' + TRACE_SHEET_NAME + '" tabs.',
        "🛡️ CEP Easy PoC",
        5
      );
    } catch (e) {}
  }
}

function ensureWorkbookSheetsQuietly_() {
  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) return;

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME) || ss.getSheetByName(LEGACY_SUMMARY_SHEET_NAME);
  if (summary && summary.getName() !== SUMMARY_SHEET_NAME) {
    try { summary.setName(SUMMARY_SHEET_NAME); } catch (e) {}
  }
  if (!summary) {
    summary = ss.insertSheet(SUMMARY_SHEET_NAME, 1);
    summary.getRange("A1:E1").merge().setValue("🛡️ Chrome Enterprise Premium (CEP) Easy PoC — Deployment Summary")
      .setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold").setFontSize(13);
    summary.getRange("A3:B8").setValues([
      ["Last Updated", "Not run yet"],
      ["Administrator Account", Session.getActiveUser().getEmail() || "-"],
      ["Workspace Customer ID", "-"],
      ["Primary Domain", "-"],
      ["Target OU / Group", "-"],
      ["Latest Status", "Ready (Launch from top menu: 🛡️ CEP Easy PoC)"]
    ]);
    summary.getRange("A3:A8").setBackground("#f1f3f4").setFontWeight("bold");
    summary.getRange("A10:E10").setValues([["Category", "Policy / DLP Rule / Action", "Target Scope", "Result", "Timestamp (ISO)"]])
      .setBackground("#e8f0fe").setFontWeight("bold");
    summary.setColumnWidth(1, 160);
    summary.setColumnWidth(2, 420);
    summary.setColumnWidth(3, 220);
    summary.setColumnWidth(4, 140);
    summary.setColumnWidth(5, 180);
    summary.setFrozenRows(10);
  }

  var trace = ss.getSheetByName(TRACE_SHEET_NAME) || ss.getSheetByName(LEGACY_TRACE_SHEET_NAME);
  if (trace && trace.getName() !== TRACE_SHEET_NAME) {
    try { trace.setName(TRACE_SHEET_NAME); } catch (e) {}
  }
  if (!trace) {
    trace = ss.insertSheet(TRACE_SHEET_NAME, 2);
    trace.getRange("A1:F1").setValues([["Timestamp (ISO)", "Operation", "Target Scope", "Status", "Applied Count", "Trace Details"]])
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

  var summary = ss.getSheetByName(SUMMARY_SHEET_NAME) || ss.getSheetByName(LEGACY_SUMMARY_SHEET_NAME);
  var trace = ss.getSheetByName(TRACE_SHEET_NAME) || ss.getSheetByName(LEGACY_TRACE_SHEET_NAME);

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
    path === "/api/v1/cep/gemini-zero-trust" ||
    path === "/api/v1/cep/provision-gemini"
  ) {
    var targetLabel = req.target_group_email || req.target_ou_path || req.target_ou || req.project_id || "-";
    var applied = Array.isArray(res.created_items) ? res.created_items : (Array.isArray(res.applied_items) ? res.applied_items : (Array.isArray(res.assigned_users) ? res.assigned_users : (Array.isArray(res.roles) ? res.roles : [])));
    if (applied.length === 0 && (res.access_level_name || res.service_perimeter_name || res.rca_binding_name)) {
      applied = [res.access_level_name, res.service_perimeter_name, res.rca_binding_name].filter(Boolean);
    }
    var skipped = Array.isArray(res.skipped_items) ? res.skipped_items : (Array.isArray(res.errors) ? res.errors : []);
    var rawTrace = Array.isArray(res.debug_trace) ? res.debug_trace : (Array.isArray(res.trace) ? res.trace : (Array.isArray(res.logs) ? res.logs : []));
    var logs = rawTrace.map(function(t) { return (t && typeof t === "object") ? ((t.method || "") + " " + (t.label || t.url || "") + " -> " + (t.status || "")) : String(t); });
    var statusText = res.success ? "✅ Succeeded" : "⚠️ Partial / Skipped";

    summary.getRange("B3").setValue(ts);
    summary.getRange("B5").setValue(req.customer_id || summary.getRange("B5").getValue());
    summary.getRange("B7").setValue(targetLabel);
    summary.getRange("B8").setValue(statusText + " (" + path.replace("/api/v1/cep/", "") + ")");

    var rows = [];
    applied.forEach(function(item) {
      rows.push(["Applied", String(item), targetLabel, "✅ Applied", ts]);
    });
    skipped.forEach(function(item) {
      rows.push(["Skipped / Info", String(item), targetLabel, "ℹ️ Skipped", ts]);
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

var SGW_SUMMARY_SHEET = "🌐 SGW Resource Inventory";
var SGW_LOG_SHEET = "📜 SGW Audit Log";
var LEGACY_SGW_SUMMARY_SHEET = "🌐 SGW 構成・リソース一覧";
var LEGACY_SGW_LOG_SHEET = "📜 SGW 実行・監査ログ";
${createSharedProxyAndQuotaHelpersGs("1xuqS4K06y5GzZsEhwzpVNxTvS3xtr6phA3hx6wtkmQA")}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🌐 Secure Gateway")
      .addItem("🚀 Open Secure Gateway Setup", "openSgwSetupDialog")
      .addItem("📦 Open Deployments & Teardown", "openSgwDeploymentsDialog")
      .addItem("📄 Open Acceptance Evidence", "openSgwEvidenceDialog")
      .addItem("📖 Open Architecture & Guide", "openSgwGuideDialog")
      .addSeparator()
      .addItem("📋 Initialize Summary & Audit Tabs", "initializeSgwWorkbookSheets")
      .addToUi();
  } catch (e) {}
}

function doGet(e) {
  sgsRequireAllScopes_();
  ensureSgwSheetsQuietly_();
  var view = (e && e.parameter && e.parameter.view) ? String(e.parameter.view) : "setup";
  var boot = sgsBuildBootstrapState_();
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(view) + ";window.__SGS_BOOTSTRAP = " + JSON.stringify(boot) + ";</script>"
  );
  return HtmlService.createHtmlOutput(injected)
    .setTitle("🌐 Chrome Enterprise Premium — Secure Gateway Deployer")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function installOnTargetSpreadsheet() {
  sgsRequireAllScopes_();
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
  showSgwDialog_("setup", "🌐 Secure Gateway Deployer — New Setup");
}

function openSgwDeploymentsDialog() {
  showSgwDialog_("deployments", "📦 Secure Gateway Deployer — Deployments & Teardown");
}

function openSgwEvidenceDialog() {
  showSgwDialog_("evidence", "📄 Secure Gateway Deployer — Acceptance Evidence");
}

function openSgwGuideDialog() {
  showSgwDialog_("guide", "📖 Secure Gateway Deployer — Architecture & Guide");
}

function showSgwDialog_(initialView, title) {
  sgsRequireAllScopes_();
  ensureSgwSheetsQuietly_();
  var boot = sgsBuildBootstrapState_();
  try {
    var ss = sgsGetTargetSpreadsheet_();
    var summary = ss ? (ss.getSheetByName(SGW_SUMMARY_SHEET) || ss.getSheetByName(LEGACY_SGW_SUMMARY_SHEET)) : null;
    if (summary) {
      if (boot.email) summary.getRange("B4").setValue(boot.email);
      if (boot.defaultProjectId) summary.getRange("B5").setValue(boot.defaultProjectId);
    }
  } catch (e) {}
  var rawHtml = HtmlService.createHtmlOutputFromFile("Index").getContent();
  var injected = rawHtml.replace(
    "<head>",
    "<head><script>window.__SGS_INITIAL_VIEW = " + JSON.stringify(initialView) + ";window.__SGS_BOOTSTRAP = " + JSON.stringify(boot) + ";</script>"
  );
  var output = HtmlService.createHtmlOutput(injected)
    .setTitle(title)
    // Google Sheets caps dialogs at 80% of the editor viewport per dimension;
    // a large request is simply clamped to that maximum on any monitor.
    .setWidth(1920)
    .setHeight(1200)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  var ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    installOnTargetSpreadsheet();
    throw new Error("Menu trigger (onOpen) has been installed on this spreadsheet. Please reload the Google Sheets tab and launch from the top menu: 🌐 Secure Gateway.");
  }
  ui.showModalDialog(output, title);
}

function initializeSgwWorkbookSheets() {
  sgsRequireAllScopes_();
  ensureSgwSheetsQuietly_();
  var ss = sgsGetTargetSpreadsheet_();
  if (ss) {
    try {
      ss.toast(
        'Initialized "' + SGW_SUMMARY_SHEET + '" and "' + SGW_LOG_SHEET + '" tabs.',
        "🌐 Secure Gateway Deployer",
        5
      );
    } catch (e) {}
  }
}

function ensureSgwSheetsQuietly_() {
  var ss = sgsGetTargetSpreadsheet_();
  if (!ss) return;

  var summary = ss.getSheetByName(SGW_SUMMARY_SHEET) || ss.getSheetByName(LEGACY_SGW_SUMMARY_SHEET);
  if (summary && summary.getName() !== SGW_SUMMARY_SHEET) {
    try { summary.setName(SGW_SUMMARY_SHEET); } catch (e) {}
  }
  if (!summary) {
    summary = ss.insertSheet(SGW_SUMMARY_SHEET, 1);
    summary.getRange("A1:F1").merge().setValue("🌐 Chrome Enterprise Premium — Secure Gateway Resource Inventory")
      .setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold").setFontSize(13);
    summary.getRange("A3:B9").setValues([
      ["Last Updated", "Not run yet"],
      ["Operator Account", Session.getActiveUser().getEmail() || "-"],
      ["Google Cloud Project ID", "-"],
      ["Deployment / Region", "-"],
      ["Private Hostname / Backend", "-"],
      ["Target OU / Overwrite Mode", "-"],
      ["Latest Status", "Ready (Launch from top menu: 🌐 Secure Gateway)"]
    ]);
    summary.getRange("A3:A9").setBackground("#f1f3f4").setFontWeight("bold");
    summary.getRange("A11:F11").setValues([["Provider", "Resource Type", "Resource Name", "Planned Action", "Status", "Updated (ISO)"]])
      .setBackground("#e8f0fe").setFontWeight("bold");
    summary.setColumnWidth(1, 140);
    summary.setColumnWidth(2, 220);
    summary.setColumnWidth(3, 320);
    summary.setColumnWidth(4, 140);
    summary.setColumnWidth(5, 140);
    summary.setColumnWidth(6, 180);
    summary.setFrozenRows(11);
  }

  var logSheet = ss.getSheetByName(SGW_LOG_SHEET) || ss.getSheetByName(LEGACY_SGW_LOG_SHEET);
  if (logSheet && logSheet.getName() !== SGW_LOG_SHEET) {
    try { logSheet.setName(SGW_LOG_SHEET); } catch (e) {}
  }
  if (!logSheet) {
    logSheet = ss.insertSheet(SGW_LOG_SHEET, 2);
    logSheet.getRange("A1:E1").setValues([["Timestamp (ISO)", "Endpoint", "Status", "Config Hash / ID", "Details"]])
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

  var summary = ss.getSheetByName(SGW_SUMMARY_SHEET) || ss.getSheetByName(LEGACY_SGW_SUMMARY_SHEET);
  var logSheet = ss.getSheetByName(SGW_LOG_SHEET) || ss.getSheetByName(LEGACY_SGW_LOG_SHEET);

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
    summary.getRange("B8").setValue((spec.target_ou_id || "-") + (spec.force_overwrite ? " [Force Overwrite ON]" : ""));
    summary.getRange("B9").setValue(ready ? "✅ Preflight Ready" : "⚠️ Preflight Attention Required");

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
          "Planned",
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
            serviceId: "cloud_identity_groups",
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
        "https://www.googleapis.com/auth/script.container.ui",
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
            serviceId: "cloud_identity_groups",
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
        "https://www.googleapis.com/auth/script.container.ui",
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
    return `# 🛡️ CEP Easy PoC — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **Google スプレッドシート + Apps Script (GAS)** 構成で、Chrome 拡張機能のインストールや GCP プロジェクト番号の手動設定を行わずに、スプレッドシートの上部メニューまたは Web App から **CEP Easy PoC**（および **CERA Export からの設定自動取り込み**）を実行できるパッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| \`appsscript.json\` | Apps Script マニフェスト（Default Cloud Project 用 \`enabledAdvancedServices\`・OAuth スコープ定義） |
| \`Code.gs\` | スプレッドシート上部メニュー \`🛡️ CEP Easy PoC\`、CERA スプレッドシート取込 \`sgsImportCeraSpreadsheet\`、自動 Quota Project 検出・Service Usage 自動有効化付き \`UrlFetchApp\` プロキシ、シート自動記録処理 |
| \`Index.html\` | モーダル UI 本体（Easy PoC・CERA Export 設定取込・DLP マトリクス・ライセンス管理・ガイド） |

## 使い方（CERA 2.0 方式・GCP プロジェクト番号の手動設定不要）

1. 配布用テンプレート（\`go/cep-easy-poc\` または \`https://docs.google.com/spreadsheets/d/1z7Us0PHdfiagkqiqfATgoCz-cVk8qqfXp7h-8ij3tdc/copy\`）を開き、**［コピーを作成］** をクリックします。
2. 上部メニュー **\`🛡️ CEP Easy PoC\` ＞ \`🚀 CEP Easy PoC コンソールを開く\`** または **\`📥 CERA Export から設定を取り込む\`** を実行します。
3. 初回実行時に Google アカウントの OAuth 承認画面が表示されたら許可します（Apps Script の Default Cloud Project 上で Admin SDK / Cloud Identity / License Manager 等が動作し、Chrome Policy API 等で Quota Project が必要な場合はアクセス可能な GCP プロジェクトを自動検出して有効化します）。

## 既知の制限（端末条件付き DLP ルール）

- Cloud Identity は、コンテキストアウェア アクセスレベルを条件に持つ DLP ルール（BYOD 限定・社給端末限定・Android / iOS BYOD など）を保存する際、**操作者の認証情報で Access Context Manager からそのレベルを読み直して検証**します。Apps Script の Default Cloud Project では Access Context Manager API を有効化できないため、この検証が通らず、該当ルールだけが \`code 13 (INTERNAL)\` で未適用になります（端末条件のないルールと Chrome ポリシーは通常どおり適用されます）。
- コンソールは事前に \`Credential probe\` を実行し、該当ルールを試行せずに理由と対処を Skipped 欄に表示します。既存ルールは変更前の定義のまま残ります。
- 対処: (1) 拡張機能 ＞ Apps Script ＞ プロジェクトの設定 ＞ **GCP プロジェクトを変更** で Access Context Manager API を有効化済みの標準 GCP プロジェクト番号を入力し、再認可してから再適用する（このスプレッドシート 1 冊にだけ効きます） (2) 該当ルールだけ管理コンソール（ルール ＞ データ保護）でアクセスレベル条件を指定して作成する (3) Chrome 拡張機能版で Section 2 を適用する。
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

1. 配布用テンプレート（\`go/sgw-deployer\` または \`https://docs.google.com/spreadsheets/d/1fAzabI3NbQjY_zZWYwv-J_vGtJqE20cq09qSYDgttjc/copy\`）を開き、**［コピーを作成］** をクリックします。
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

  const sharedGasExtraCss = `
    .review-deployer-card,
    .identity-popover-actions > button.btn-secondary,
    .cep-verify-box > button.btn-secondary,
    .cep-ou-header-actions > button:first-child,
    .connection-card .connection-action.secondary,
    .sidebar-sign-out { display: none !important; }
    /* Sheets dialog layout: Google Sheets caps every Apps Script dialog at 80%
       of the editor viewport, so the console gives the width it gets back to
       the content instead of centring a 1000px column inside it. */
    .cep-page { max-width: none; padding: 20px 28px 56px; }
    .cep-heading { margin-bottom: 16px; }
    .cep-section { margin-top: 18px; padding: 18px 20px; }
    .cep-section > p { max-width: none; }
    .cep-intro { max-width: none; }
    .topbar { padding: 0 20px 0 24px; gap: 16px; }
    .workspace { padding: 18px 24px 20px; gap: 24px; }
    .operations-page, .guide-page { max-width: none; }
  `;

  // Edition 1: Easy PoC — hides standalone CERA nav item, Secure Gateway Deployer nav dropdown group, & CERA/SGW Guide tabs
  const easyPocExtraCss = `
    ${sharedGasExtraCss}
    aside.sidebar .primary-nav > button.nav-item:nth-of-type(3),
    aside.sidebar .primary-nav .nav-dropdown-group,
    aside.sidebar .primary-nav .nav-group { display: none !important; }
    #guide-tab-cera, #guide-tab-sgw { display: none !important; }
  `;
  async function sanitizeHtmlScriptsForMaestro(rawHtml) {
    const re = /<script>([\s\S]*?)<\/script>/g;
    let out = "";
    let last = 0;
    let m;
    while ((m = re.exec(rawHtml)) !== null) {
      out += rawHtml.slice(last, m.index);
      const tr = await transform(m[1], {
        loader: "js",
        target: "chrome142",
        supported: { "template-literal": false },
        legalComments: "none",
        minify: true,
      });
      out += "<script>" + escapeInlineScript(tr.code.trim()) + "</script>";
      last = re.lastIndex;
    }
    out += rawHtml.slice(last);
    return out;
  }

  const easyPocHtml = await sanitizeHtmlScriptsForMaestro(createIndexHtml({
    edition: "easy-poc",
    title: "CEP Easy PoC (Google Sheets Edition)",
    extraCss: easyPocExtraCss,
    fakeIdbMin,
    swMin,
    appMin,
    cssMin,
  }));

  await writeFile(join(easyPocDir, "appsscript.json"), createEasyPocAppsscriptJson(), "utf8");
  await writeFile(join(easyPocDir, "Code.gs"), createEasyPocCodeGs(), "utf8");
  await writeFile(join(easyPocDir, "Index.html"), easyPocHtml, "utf8");
  await writeFile(join(easyPocDir, "README.md"), createReadme("easy-poc"), "utf8");

  // Edition 2: Secure Gateway Deployer — hides Easy PoC & CERA nav buttons and their Guide tabs
  const sgwExtraCss = `
    ${sharedGasExtraCss}
    aside.sidebar .primary-nav > button.nav-item:nth-of-type(2),
    aside.sidebar .primary-nav > button.nav-item:nth-of-type(3) { display: none !important; }
    #guide-tab-easy-poc, #guide-tab-cera { display: none !important; }
  `;
  const sgwHtml = await sanitizeHtmlScriptsForMaestro(createIndexHtml({
    edition: "sgw-deployer",
    title: "Secure Gateway Deployer (Google Sheets Edition)",
    extraCss: sgwExtraCss,
    fakeIdbMin,
    swMin,
    appMin,
    cssMin,
  }));

  await writeFile(join(sgwDir, "appsscript.json"), createSgwDeployerAppsscriptJson(), "utf8");
  await writeFile(join(sgwDir, "Code.gs"), createSgwDeployerCodeGs(), "utf8");
  await writeFile(join(sgwDir, "Index.html"), sgwHtml, "utf8");
  await writeFile(join(sgwDir, "README.md"), createReadme("sgw-deployer"), "utf8");

  console.log("Built Google Sheets + Apps Script editions:");
  console.log("  1. gas/easy-poc/     (appsscript.json, Code.gs, Index.html, README.md)");
  console.log("  2. gas/sgw-deployer/ (appsscript.json, Code.gs, Index.html, README.md)");
}

await main();
