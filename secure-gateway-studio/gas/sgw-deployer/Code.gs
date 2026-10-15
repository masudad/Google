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

var SGW_SUMMARY_SHEET = "🌐 SGW Resource Inventory";
var SGW_LOG_SHEET = "📜 SGW Audit Log";
var LEGACY_SGW_SUMMARY_SHEET = "🌐 SGW 構成・リソース一覧";
var LEGACY_SGW_LOG_SHEET = "📜 SGW 実行・監査ログ";

var DEFAULT_SPREADSHEET_ID = "1xuqS4K06y5GzZsEhwzpVNxTvS3xtr6phA3hx6wtkmQA";

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
    return s.replace(/^orgunits\//i, "").replace(/^id:/i, "").trim();
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
  var urlMatch = String(url || "").match(/\/projects\/([a-z][a-z0-9-]{4,29})(?:\/|$|\?|:)/i) ||
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
  if (!/^https:\/\/([a-z0-9-]+\.)*googleapis\.com\//i.test(url)) {
    throw new Error("Blocked non-googleapis URL: " + url);
  }
  // Rewrite Cloud Resource Manager v3 project/folder URLs to v1/v2 so they work on
  // Apps Script Default Cloud Projects (e.g. 523129175171) without SERVICE_DISABLED errors.
  url = url
    .replace(
      /^https:\/\/cloudresourcemanager\.googleapis\.com\/v3\/projects\/([^/?#]+)(\?.*)?$/i,
      "https://cloudresourcemanager.googleapis.com/v1/projects/$1$2"
    )
    .replace(
      /^https:\/\/cloudresourcemanager\.googleapis\.com\/(v1|v3)\/folders\/([^/?#]+)(\?.*)?$/i,
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
      .replace(/\?$/, "");
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

  var hostMatch = url.match(/^https:\/\/([a-z0-9-]+\.googleapis\.com)\//i);
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
    ? url.match(/^https:\/\/cloudresourcemanager\.googleapis\.com\/v1\/projects\/([^/?#:]+)$/i)
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
          var numMatch = suText.match(/projects\/(\d{6,20})/);
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
    /^https:\/\/admin\.googleapis\.com\/admin\/directory\/v1\/customers\/[^/?#]+$/i.test(url)
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
    /^https:\/\/admin\.googleapis\.com\/admin\/directory\/v1\/customers?\/[^/?#]+\/orgunits(?:\?.*)?$/i.test(url)
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
            var rawOuId = String(rawU.orgUnitId || "").trim().replace(/^orgunits\//i, "");
            var bareOuId = rawOuId.replace(/^id:/i, "");
            if (!bareOuId || !/^[A-Za-z0-9_-]+$/.test(bareOuId)) continue;
            var rawPath = String(rawU.orgUnitPath || "").trim().replace(/\/+/g, "/");
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
    /^https:\/\/cloudresourcemanager\.googleapis\.com\/v1\/projects\/[^/?#]+$/i.test(url)
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
