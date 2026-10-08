import type { AnalysisResult } from "./types";
import { toCsv } from "./csv";
import type { CeraMessages } from "./messages";

function isoOrEmpty(timestamp: number | null): string {
  return timestamp === null ? "" : new Date(timestamp).toISOString();
}

/**
 * Forensic export: one row per de-duplicated user action. Identities follow
 * the masking setting used for the analysis; raw e-mails are only present
 * when the operator explicitly disabled masking.
 */
export function buildForensicCsv(result: AnalysisResult, messages: CeraMessages): string {
  const c = messages.report.columns;
  const headers = [
    "Action ID",
    "Timestamp (UTC)",
    c.user,
    c.orgUnit,
    "Direction",
    "Trigger",
    c.channel,
    c.category,
    c.destination,
    "Registrable domain",
    "URL",
    "Content name",
    "Content type",
    "Content size",
    "Result",
    c.sensitive,
    c.malware,
    c.unscanned,
    c.rule,
    "Reasons",
    "Identity",
    "Personal identity",
    "Merged rows",
    "Off hours",
    "Weekend",
    "Device platform",
    "Client type",
    "Source file",
    "Row",
  ];
  const rows = result.actions.map((action) => [
    action.id,
    isoOrEmpty(action.timestamp),
    action.actorMasked,
    action.orgUnit,
    action.direction,
    messages.labels.triggers[action.trigger],
    messages.labels.channels[action.channel],
    messages.labels.categories[action.category],
    action.host,
    action.registrableDomain,
    result.settings.maskIdentities ? action.host : action.url,
    action.contentName,
    action.contentType,
    action.contentSize ?? "",
    messages.labels.results[action.result],
    action.sensitive ? "yes" : "no",
    action.malware ? "yes" : "no",
    action.unscanned ? "yes" : "no",
    action.rules.join("; "),
    action.reasons.join("; "),
    action.identityMasked,
    action.personalIdentity ? "yes" : "no",
    action.mergedRows,
    action.offHours ? "yes" : "no",
    action.weekend ? "yes" : "no",
    action.devicePlatform,
    action.clientType,
    action.sourceFile,
    action.rowIndex,
  ]);
  return toCsv(headers, rows);
}

/** Machine-readable summary without the per-action list. */
export function buildSummaryJson(result: AnalysisResult): string {
  const channels = Object.fromEntries(
    Object.entries(result.channels).map(([channel, stats]) => [
      channel,
      {
        actions: stats.actions,
        uploads: stats.uploads,
        pastes: stats.pastes,
        users: stats.users,
        sensitive: stats.sensitive,
        blocked: stats.blocked,
        warned: stats.warned,
        bypassed: stats.bypassed,
        detected: stats.detected,
        allowed: stats.allowed,
        topDestinations: stats.topDestinations,
        topUsers: stats.topUsers.map((user) => ({
          user: user.actorMasked,
          orgUnit: user.orgUnit,
          actions: user.actions,
          sensitive: user.sensitive,
          destinations: user.destinations,
        })),
      },
    ]),
  );
  const payload = {
    schema: "secure-gateway-studio/cera-summary/v1",
    generatedAt: new Date(result.generatedAt).toISOString(),
    period: {
      start: isoOrEmpty(result.dateRange.start),
      end: isoOrEmpty(result.dateRange.end),
      days: result.dateRange.days,
    },
    files: result.files,
    columnMapping: result.columnMapping,
    unmappedHeaders: result.unmappedHeaders,
    missingColumns: result.missingColumns,
    settings: {
      corporateDomains: result.settings.corporateDomains,
      partnerDomains: result.settings.partnerDomains,
      sanctionedAiHosts: result.settings.sanctionedAiHosts,
      sanctionedHosts: result.settings.sanctionedHosts,
      extraGenAiHosts: result.settings.extraGenAiHosts,
      extraMessagingHosts: result.settings.extraMessagingHosts,
      workHours: [result.settings.workHoursStart, result.settings.workHoursEnd],
      timezoneOffsetMinutes: result.settings.timezoneOffsetMinutes,
      maskIdentities: result.settings.maskIdentities,
      dedupWindowMs: result.settings.dedupWindowMs,
    },
    totals: result.totals,
    channels,
    daily: result.daily,
    peakDay: result.peakDay,
    anomalies: result.anomalies,
    concentration: result.concentration,
    orgUnits: result.orgUnits,
    categories: result.categories,
    unmanagedDestinations: result.unmanagedDestinations,
    shadowAiDestinations: result.shadowAiDestinations,
    sanctionedAiDestinations: result.sanctionedAiDestinations,
    messagingDestinations: result.messagingDestinations,
    personalAccountDestinations: result.personalAccountDestinations,
    personalIdentityDomains: result.personalIdentityDomains,
    rules: result.rules,
    print: {
      ...result.print,
      topUsers: result.print.topUsers.map((user) => ({ user: user.actorMasked, orgUnit: user.orgUnit, actions: user.actions, sensitive: user.sensitive })),
    },
    inbound: result.inbound,
    signals: result.signals,
    roadmap: result.roadmap,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadTextFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileStamp(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
