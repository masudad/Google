import type { CepDataBoundaryMode, CepDlpAction, CepDlpMatrixState } from "../../lib/api";
import { analyze, defaultSettings } from "../cera/analyze";
import { normalizeFile } from "../cera/columns";
import { parseDelimited, parseLogFile, sniffDelimiter } from "../cera/csv";
import type { RecommendedPolicyConfig } from "./SecurityAssessmentModal";

export type CeraEnforcementMode = "block" | "warn" | "audit";

export type CeraExportFormatKind =
  | "cera2_sheets"
  | "cera2_csv"
  | "studio_summary_json"
  | "studio_forensic_csv"
  | "chrome_audit_log";

export interface CeraImportedProfile {
  formatKind: CeraExportFormatKind;
  sourceName: string;
  totalEvents: number;
  totalVolumeGb: number | null;
  shadowAiEvents: number;
  shadowAiSensitive: number;
  shadowAiTopDomains: string[];
  personalAccountEvents: number;
  personalAccountSensitive: number;
  personalAccountTopDomains: string[];
  unmanagedEvents: number;
  unmanagedSensitive: number;
  unmanagedTopDomains: string[];
  messagingEvents: number;
  messagingSensitive: number;
  messagingTopDomains: string[];
  downloadEvents: number;
  printEvents: number;
  sensitivePrintEvents: number;
  sensitiveEvents: number;
  malwareEvents: number;
  unscannedEvents: number;
  passwordReuseEvents: number;
  unsafeSiteEvents: number;
  extensionInstallEvents: number;
  corporateDomains: string[];
  internalHosts: string[];
  topOu: string;
  outcomeModeHint: CeraEnforcementMode | null;
}

export interface CeraSpreadsheetPayload {
  ok?: boolean;
  kind?: string;
  title?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  overviewRows?: string[][];
  outcomesRows?: string[][];
  radarRows?: string[][];
  logHeaders?: string[];
  logRows?: string[][];
  error?: string;
}

const VECTOR_LABELS = {
  personal: [
    "personal accounts",
    "personal account",
    "akun pribadi",
    "個人アカウント",
    "개인 계정",
    "个人账号",
  ],
  shadowAi: [
    "shadow ai",
    "unsanctioned ai",
    "ai tidak resmi",
    "未承認の ai",
    "未承認のai",
    "シャドー ai",
    "シャドーai",
    "비승인 ai",
    "未经批准的 ai",
  ],
  unmanaged: [
    "unmanaged apps",
    "unmanaged app",
    "aplikasi tidak terkelola",
    "管理対象外のアプリ",
    "未管理アプリ",
    "비관리 앱",
    "非受管应用",
  ],
  messaging: [
    "web messaging",
    "pesan web",
    "web メッセージング",
    "웹 메신저",
    "网页即时通讯",
  ],
  securityRadar: [
    "security radar",
    "radar keamanan",
    "セキュリティレーダー",
    "セキュリティ レーダー",
    "보안 레이더",
    "安全雷达",
  ],
} as const;

const PRINT_ROW_LABELS = [
  "prints",
  "print",
  "印刷",
  "cetak",
  "인쇄",
  "打印",
];

const SENSITIVE_PRINT_ROW_LABELS = [
  "sensitive prints",
  "機密データの印刷",
  "機密印刷",
  "cetakan sensitif",
  "민감한 인쇄",
  "敏感打印",
];

const PASSWORD_REUSE_LABELS = [
  "password reuse",
  "パスワードの再利用",
  "penggunaan ulang sandi",
  "비밀번호 재사용",
  "密码重复使用",
];

const MALWARE_LABELS = [
  "potentially malicious files",
  "malicious files",
  "malware transfer",
  "悪意のある可能性のあるファイル",
  "マルウェア",
  "file berpotensi berbahaya",
  "잠재적 악성 파일",
  "潜在恶意文件",
];

const UNSAFE_SITE_LABELS = [
  "unsafe site visits",
  "unsafe sites",
  "安全でないサイトへのアクセス",
  "kunjungan situs tidak aman",
  "안전하지 않은 사이트 방문",
  "不安全网站访问",
];

function cleanCell(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).normalize("NFKC").trim();
}

function parseLeadingInt(raw: unknown): number {
  const s = cleanCell(raw);
  if (!s) return 0;
  const m = /(\d[\d,]*)/.exec(s);
  if (!m) return 0;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function parseLeadingFloat(raw: unknown): number | null {
  const s = cleanCell(raw);
  if (!s) return null;
  const m = /(\d[\d,]*(?:\.\d+)?)/.exec(s);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function matchesLabel(cellValue: string, candidates: readonly string[]): boolean {
  const norm = cellValue.normalize("NFKC").trim().toLowerCase();
  if (!norm) return false;
  return candidates.some((cand) => norm === cand || norm.startsWith(`${cand} `) || norm.startsWith(`${cand}:`));
}

function extractDomainsFromText(raw: string): string[] {
  const matches = raw
    .normalize("NFKC")
    .toLowerCase()
    .match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/g);
  if (!matches) return [];
  const filtered = matches.filter(
    (d) =>
      !d.endsWith(".googleapis.com") &&
      !d.endsWith(".googleusercontent.com") &&
      d !== "none" &&
      d !== "n.a",
  );
  return Array.from(new Set(filtered));
}

function cleanTopDomain(raw: string): string[] {
  const s = cleanCell(raw);
  if (!s || s === "-" || s === "—" || /^none|n\/a|なし|該当なし$/i.test(s)) return [];
  return extractDomainsFromText(s);
}

function cleanOu(raw: string): string {
  const s = cleanCell(raw);
  if (!s || s === "-" || s === "—" || /^none|n\/a|なし|該当なし|all|root|\/$/i.test(s)) return "";
  // Strip trailing counts like "/Sales (42)" if present
  return s.replace(/\s*\(\d[\d,]*.*?\)\s*$/, "").trim();
}

/**
 * Inspects a 2D array of spreadsheet/CSV cells to see if it matches CERA 2.0's
 * `Executive Overview` or `Policy Outcomes` sheet structure.
 */
export function isCera2TableRows(rows: string[][]): boolean {
  let matchedVectors = 0;
  for (const row of rows) {
    for (const rawCell of row) {
      const c = cleanCell(rawCell);
      if (!c) continue;
      if (
        matchesLabel(c, VECTOR_LABELS.personal) ||
        matchesLabel(c, VECTOR_LABELS.shadowAi) ||
        matchesLabel(c, VECTOR_LABELS.unmanaged) ||
        matchesLabel(c, VECTOR_LABELS.messaging)
      ) {
        matchedVectors += 1;
        break;
      }
    }
  }
  return matchedVectors >= 2;
}

export function parseCera2SheetTables(
  sourceName: string,
  overviewRows: string[][],
  outcomesRows: string[][] = [],
  radarRows: string[][] = [],
  formatKind: CeraExportFormatKind = "cera2_csv",
): CeraImportedProfile {
  const profile: CeraImportedProfile = {
    formatKind,
    sourceName,
    totalEvents: 0,
    totalVolumeGb: null,
    shadowAiEvents: 0,
    shadowAiSensitive: 0,
    shadowAiTopDomains: [],
    personalAccountEvents: 0,
    personalAccountSensitive: 0,
    personalAccountTopDomains: [],
    unmanagedEvents: 0,
    unmanagedSensitive: 0,
    unmanagedTopDomains: [],
    messagingEvents: 0,
    messagingSensitive: 0,
    messagingTopDomains: [],
    downloadEvents: 0,
    printEvents: 0,
    sensitivePrintEvents: 0,
    sensitiveEvents: 0,
    malwareEvents: 0,
    unscannedEvents: 0,
    passwordReuseEvents: 0,
    unsafeSiteEvents: 0,
    extensionInstallEvents: 0,
    corporateDomains: [],
    internalHosts: [],
    topOu: "",
    outcomeModeHint: null,
  };

  const ouCounts = new Map<string, number>();
  const recordOu = (ouRaw: string, weight: number) => {
    const ou = cleanOu(ouRaw);
    if (!ou) return;
    ouCounts.set(ou, (ouCounts.get(ou) ?? 0) + Math.max(1, weight));
  };

  const allRows = [...overviewRows, ...outcomesRows, ...radarRows];

  // 1. Scan Executive Overview & Policy Outcomes rows
  for (let r = 0; r < allRows.length; r += 1) {
    const row = allRows[r];
    for (let c = 0; c < row.length; c += 1) {
      const cell = cleanCell(row[c]);
      if (!cell) continue;
      const lower = cell.toLowerCase();

      // Detect Corporate Domains row (e.g. "CORPORATE DOMAINS", "社内ドメイン")
      if (
        lower.includes("corporate domain") ||
        lower.includes("社内ドメイン") ||
        lower.includes("domain korporat")
      ) {
        const doms = extractDomainsFromText(row.slice(c + 1).map(cleanCell).join(" "));
        if (doms.length > 0) {
          profile.corporateDomains = Array.from(new Set([...profile.corporateDomains, ...doms]));
        }
      }

      // Detect Policy Outcomes mode hint (e.g. "Block", "Warn", "Audit")
      if (lower.includes("policy outcome") || lower.includes("ポリシーの結果")) {
        const nextText = row
          .slice(c + 1)
          .map(cleanCell)
          .join(" ")
          .toLowerCase();
        if (nextText.includes("block") || nextText.includes("ブロック")) {
          profile.outcomeModeHint = "block";
        } else if (nextText.includes("warn") || nextText.includes("警告")) {
          profile.outcomeModeHint = "warn";
        } else if (nextText.includes("audit") || nextText.includes("監査")) {
          profile.outcomeModeHint = "audit";
        }
      }

      // Detect Vector rows in Executive Overview (B14:H18) or Policy Outcomes (B7:Q11)
      const isPersonal = matchesLabel(cell, VECTOR_LABELS.personal);
      const isShadowAi = matchesLabel(cell, VECTOR_LABELS.shadowAi);
      const isUnmanaged = matchesLabel(cell, VECTOR_LABELS.unmanaged);
      const isMessaging = matchesLabel(cell, VECTOR_LABELS.messaging);
      const isRadar = matchesLabel(cell, VECTOR_LABELS.securityRadar);

      if (isPersonal || isShadowAi || isUnmanaged || isMessaging || isRadar) {
        const events = parseLeadingInt(row[c + 1]);
        const col2 = cleanCell(row[c + 2]);
        const trailingCells = row.slice(c + 2).map(cleanCell).filter(Boolean);
        const extractedDomains: string[] = [];
        for (const tc of trailingCells) {
          if (tc.startsWith("/")) {
            const ou = cleanOu(tc);
            if (ou) recordOu(ou, events);
          } else {
            const doms = cleanTopDomain(tc);
            if (doms.length > 0) extractedDomains.push(...doms);
          }
        }
        const looksLikeOverview =
          col2.includes("%") ||
          extractedDomains.length > 0 ||
          trailingCells.some((tc) => tc.startsWith("/"));

        if (looksLikeOverview) {
          const volGb = col2.includes("%") ? parseLeadingFloat(row[c + 3]) : null;
          const sensCount = !col2.includes("%") ? parseLeadingInt(col2) : 0;
          if (sensCount > 0) profile.sensitiveEvents += sensCount;
          if (volGb !== null && volGb > 0) {
            profile.totalVolumeGb = Number(((profile.totalVolumeGb ?? 0) + volGb).toFixed(3));
          }
          if (isPersonal) {
            profile.personalAccountEvents = Math.max(profile.personalAccountEvents, events);
            if (sensCount > 0) {
              profile.personalAccountSensitive = Math.max(profile.personalAccountSensitive, sensCount);
            }
            profile.personalAccountTopDomains = Array.from(
              new Set([...profile.personalAccountTopDomains, ...extractedDomains]),
            );
          } else if (isShadowAi) {
            profile.shadowAiEvents = Math.max(profile.shadowAiEvents, events);
            if (sensCount > 0) {
              profile.shadowAiSensitive = Math.max(profile.shadowAiSensitive, sensCount);
            }
            profile.shadowAiTopDomains = Array.from(
              new Set([...profile.shadowAiTopDomains, ...extractedDomains]),
            );
          } else if (isUnmanaged) {
            profile.unmanagedEvents = Math.max(profile.unmanagedEvents, events);
            if (sensCount > 0) {
              profile.unmanagedSensitive = Math.max(profile.unmanagedSensitive, sensCount);
            }
            profile.unmanagedTopDomains = Array.from(
              new Set([...profile.unmanagedTopDomains, ...extractedDomains]),
            );
          } else if (isMessaging) {
            profile.messagingEvents = Math.max(profile.messagingEvents, events);
            if (sensCount > 0) {
              profile.messagingSensitive = Math.max(profile.messagingSensitive, sensCount);
            }
            profile.messagingTopDomains = Array.from(
              new Set([...profile.messagingTopDomains, ...extractedDomains]),
            );
          } else if (isRadar) {
            profile.malwareEvents = Math.max(profile.malwareEvents, events);
          }
        } else {
          // Policy Outcomes row: col+1 = total, col+4 = sensitive, col+13 = downloads
          const sensitiveCount = parseLeadingInt(row[c + 4]);
          const dlCount = parseLeadingInt(row[c + 13]);
          if (dlCount > 0) profile.downloadEvents += dlCount;
          if (sensitiveCount > 0) profile.sensitiveEvents += sensitiveCount;
          if (isPersonal) {
            profile.personalAccountEvents = Math.max(profile.personalAccountEvents, events);
            profile.personalAccountSensitive = Math.max(
              profile.personalAccountSensitive,
              sensitiveCount,
            );
          } else if (isShadowAi) {
            profile.shadowAiEvents = Math.max(profile.shadowAiEvents, events);
            profile.shadowAiSensitive = Math.max(profile.shadowAiSensitive, sensitiveCount);
          } else if (isUnmanaged) {
            profile.unmanagedEvents = Math.max(profile.unmanagedEvents, events);
            profile.unmanagedSensitive = Math.max(profile.unmanagedSensitive, sensitiveCount);
          } else if (isMessaging) {
            profile.messagingEvents = Math.max(profile.messagingEvents, events);
            profile.messagingSensitive = Math.max(profile.messagingSensitive, sensitiveCount);
          }
        }
      }

      // Prints / Sensitive prints in Policy Outcomes
      if (matchesLabel(cell, SENSITIVE_PRINT_ROW_LABELS)) {
        const cnt = parseLeadingInt(row[c + 1]);
        profile.sensitivePrintEvents = Math.max(profile.sensitivePrintEvents, cnt);
        profile.printEvents = Math.max(profile.printEvents, cnt);
      } else if (matchesLabel(cell, PRINT_ROW_LABELS)) {
        const cnt = parseLeadingInt(row[c + 1]);
        profile.printEvents = Math.max(profile.printEvents, cnt);
      }

      // Security Radar signals in Executive Overview (L21/M21, L24/M24, L30/M30)
      if (PASSWORD_REUSE_LABELS.some((lbl) => lower.includes(lbl))) {
        const nearby = [row[c + 1], row[c + 2], allRows[r + 1]?.[c], allRows[r + 1]?.[c + 1]]
          .map(cleanCell)
          .filter(Boolean);
        for (const item of nearby) {
          const cnt = parseLeadingInt(item);
          if (cnt > 0) {
            profile.passwordReuseEvents = Math.max(profile.passwordReuseEvents, cnt);
            break;
          }
        }
      }
      if (MALWARE_LABELS.some((lbl) => lower.includes(lbl))) {
        const nearby = [row[c + 1], row[c + 2], allRows[r + 1]?.[c], allRows[r + 1]?.[c + 1]]
          .map(cleanCell)
          .filter(Boolean);
        for (const item of nearby) {
          const cnt = parseLeadingInt(item);
          if (cnt > 0) {
            profile.malwareEvents = Math.max(profile.malwareEvents, cnt);
            break;
          }
        }
      }
      if (UNSAFE_SITE_LABELS.some((lbl) => lower.includes(lbl))) {
        const nearby = [row[c + 1], row[c + 2], allRows[r + 1]?.[c], allRows[r + 1]?.[c + 1]]
          .map(cleanCell)
          .filter(Boolean);
        for (const item of nearby) {
          const cnt = parseLeadingInt(item);
          if (cnt > 0) {
            profile.unsafeSiteEvents = Math.max(profile.unsafeSiteEvents, cnt);
            break;
          }
        }
      }
    }
  }

  const vectorSum =
    profile.personalAccountEvents +
    profile.shadowAiEvents +
    profile.unmanagedEvents +
    profile.messagingEvents;
  profile.totalEvents = Math.max(
    profile.totalEvents,
    vectorSum + profile.printEvents + profile.downloadEvents,
  );
  profile.sensitiveEvents = Math.max(
    profile.sensitiveEvents,
    profile.personalAccountSensitive +
      profile.shadowAiSensitive +
      profile.unmanagedSensitive +
      profile.messagingSensitive +
      profile.sensitivePrintEvents,
  );

  if (ouCounts.size > 0) {
    const sortedOus = Array.from(ouCounts.entries()).sort((a, b) => b[1] - a[1]);
    profile.topOu = sortedOus[0][0];
  }

  return profile;
}

function parseStudioSummaryJson(sourceName: string, data: Record<string, unknown>): CeraImportedProfile {
  const totals = (data.totals ?? {}) as Record<string, unknown>;
  const channels = (data.channels ?? {}) as Record<string, Record<string, unknown>>;
  const settings = (data.settings ?? {}) as Record<string, unknown>;
  const print = (data.print ?? {}) as Record<string, unknown>;
  const inbound = (data.inbound ?? {}) as Record<string, unknown>;
  const signals = (data.signals ?? {}) as Record<string, unknown>;
  const orgUnits = Array.isArray(data.orgUnits) ? (data.orgUnits as Array<Record<string, unknown>>) : [];

  const extractTopDest = (list: unknown): string[] => {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => cleanCell((item as Record<string, unknown>)?.host))
      .filter(Boolean)
      .slice(0, 5);
  };

  const shadowCh = channels.shadow_ai ?? {};
  const personalCh = channels.personal_account ?? {};
  const unmanagedCh = channels.unmanaged ?? channels.unmanaged_app ?? {};
  const messagingCh = channels.messaging ?? channels.web_messaging ?? {};

  const nonRootOus = orgUnits.filter((u) => {
    const name = cleanOu(String(u.orgUnit ?? ""));
    return name !== "" && name !== "/";
  });
  nonRootOus.sort(
    (a, b) =>
      Number(b.threat ?? b.uploads ?? 0) - Number(a.threat ?? a.uploads ?? 0),
  );
  const topOu = nonRootOus[0] ? cleanOu(String(nonRootOus[0].orgUnit ?? "")) : "";

  const corpDomainsRaw = Array.isArray(settings.corporateDomains)
    ? settings.corporateDomains
    : Array.isArray(data.suggestedCorporateDomains)
      ? data.suggestedCorporateDomains
      : [];
  const corporateDomains = corpDomainsRaw
    .map((d) => cleanCell(d).toLowerCase())
    .filter(Boolean);

  return {
    formatKind: "studio_summary_json",
    sourceName,
    totalEvents: Number(totals.actions ?? totals.events ?? totals.outbound ?? 0),
    totalVolumeGb: null,
    shadowAiEvents: Number(shadowCh.actions ?? 0),
    shadowAiSensitive: Number(shadowCh.sensitive ?? 0),
    shadowAiTopDomains: extractTopDest(data.shadowAiDestinations ?? shadowCh.topDestinations),
    personalAccountEvents: Number(personalCh.actions ?? 0),
    personalAccountSensitive: Number(personalCh.sensitive ?? 0),
    personalAccountTopDomains: extractTopDest(
      data.personalAccountDestinations ?? personalCh.topDestinations,
    ),
    unmanagedEvents: Number(unmanagedCh.actions ?? 0),
    unmanagedSensitive: Number(unmanagedCh.sensitive ?? 0),
    unmanagedTopDomains: extractTopDest(data.unmanagedDestinations ?? unmanagedCh.topDestinations),
    messagingEvents: Number(messagingCh.actions ?? 0),
    messagingSensitive: Number(messagingCh.sensitive ?? 0),
    messagingTopDomains: extractTopDest(data.messagingDestinations ?? messagingCh.topDestinations),
    downloadEvents: Number(inbound.downloads ?? totals.downloads ?? 0),
    printEvents: Number(print.actions ?? totals.prints ?? 0),
    sensitivePrintEvents: Number(print.sensitive ?? 0),
    sensitiveEvents: Number(totals.sensitiveOutbound ?? 0) + Number(print.sensitive ?? 0),
    malwareEvents: Number(signals.malware ?? inbound.malware ?? 0),
    unscannedEvents: Number(signals.unscanned ?? inbound.unscanned ?? 0),
    passwordReuseEvents: Number(signals.passwordReuse ?? 0),
    unsafeSiteEvents: Number(signals.unsafeSiteVisits ?? 0),
    extensionInstallEvents: Number(signals.extensionInstalls ?? 0),
    corporateDomains,
    internalHosts: [],
    topOu,
    outcomeModeHint: null,
  };
}

function isStudioForensicCsv(headers: string[]): boolean {
  const lower = new Set(headers.map((h) => h.trim().toLowerCase()));
  return (
    lower.has("action id") &&
    lower.has("channel") &&
    lower.has("trigger") &&
    (lower.has("registrable domain") || lower.has("destination"))
  );
}

function parseStudioForensicCsv(
  sourceName: string,
  headers: string[],
  rows: Record<string, string>[],
): CeraImportedProfile {
  const get = (row: Record<string, string>, name: string): string => {
    const key = headers.find((h) => h.trim().toLowerCase() === name);
    return key ? (row[key] ?? "").trim() : "";
  };

  let shadowAiEvents = 0;
  let shadowAiSensitive = 0;
  const shadowDomains = new Map<string, number>();

  let personalAccountEvents = 0;
  let personalAccountSensitive = 0;
  const personalDomains = new Map<string, number>();

  let unmanagedEvents = 0;
  let unmanagedSensitive = 0;
  const unmanagedDomains = new Map<string, number>();

  let messagingEvents = 0;
  let messagingSensitive = 0;
  const messagingDomains = new Map<string, number>();

  let downloadEvents = 0;
  let printEvents = 0;
  let sensitivePrintEvents = 0;
  let sensitiveEvents = 0;
  let malwareEvents = 0;
  let unscannedEvents = 0;
  let totalBytes = 0;
  const ouCounts = new Map<string, number>();

  const bump = (map: Map<string, number>, key: string) => {
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  };

  for (const row of rows) {
    const channel = get(row, "channel").toLowerCase();
    const direction = get(row, "direction").toLowerCase();
    const trigger = get(row, "trigger").toLowerCase();
    const isSensitive = /^(yes|true|1|はい)$/i.test(get(row, "sensitive"));
    const isMalware = /^(yes|true|1|はい)$/i.test(get(row, "malware"));
    const isUnscanned = /^(yes|true|1|はい)$/i.test(get(row, "unscanned"));
    const host = get(row, "destination") || get(row, "registrable domain");
    const ou = cleanOu(get(row, "org unit"));
    const sizeBytes = Number(get(row, "content size")) || 0;
    if (sizeBytes > 0) totalBytes += sizeBytes;

    if (isSensitive) sensitiveEvents += 1;
    if (isMalware) malwareEvents += 1;
    if (isUnscanned) unscannedEvents += 1;
    if (direction === "inbound" || trigger === "file_download") downloadEvents += 1;
    if (direction === "print" || trigger === "page_print") {
      printEvents += 1;
      if (isSensitive) sensitivePrintEvents += 1;
    }

    if (channel === "shadow_ai") {
      shadowAiEvents += 1;
      if (isSensitive) shadowAiSensitive += 1;
      bump(shadowDomains, host);
      if (ou) bump(ouCounts, ou);
    } else if (channel === "personal_account") {
      personalAccountEvents += 1;
      if (isSensitive) personalAccountSensitive += 1;
      bump(personalDomains, host);
      if (ou) bump(ouCounts, ou);
    } else if (channel === "unmanaged") {
      unmanagedEvents += 1;
      if (isSensitive) unmanagedSensitive += 1;
      bump(unmanagedDomains, host);
      if (ou) bump(ouCounts, ou);
    } else if (channel === "messaging") {
      messagingEvents += 1;
      if (isSensitive) messagingSensitive += 1;
      bump(messagingDomains, host);
      if (ou) bump(ouCounts, ou);
    }
  }

  const topKeys = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

  return {
    formatKind: "studio_forensic_csv",
    sourceName,
    totalEvents: rows.length,
    totalVolumeGb: totalBytes > 0 ? Number((totalBytes / 1024 ** 3).toFixed(3)) : null,
    shadowAiEvents,
    shadowAiSensitive,
    shadowAiTopDomains: topKeys(shadowDomains),
    personalAccountEvents,
    personalAccountSensitive,
    personalAccountTopDomains: topKeys(personalDomains),
    unmanagedEvents,
    unmanagedSensitive,
    unmanagedTopDomains: topKeys(unmanagedDomains),
    messagingEvents,
    messagingSensitive,
    messagingTopDomains: topKeys(messagingDomains),
    downloadEvents,
    printEvents,
    sensitivePrintEvents,
    sensitiveEvents,
    malwareEvents,
    unscannedEvents,
    passwordReuseEvents: 0,
    unsafeSiteEvents: 0,
    extensionInstallEvents: 0,
    corporateDomains: [],
    internalHosts: [],
    topOu: topKeys(ouCounts)[0] ?? "",
    outcomeModeHint: null,
  };
}

/**
 * Parses any CERA export file (CERA 2.0 CSV, Studio CERA Summary JSON,
 * Studio CERA Forensic CSV, or raw Admin Console Chrome Audit Log CSV/JSON)
 * into a unified `CeraImportedProfile`.
 */
export function parseCeraExportFile(
  fileName: string,
  rawText: string,
  primaryDomain?: string | null,
): CeraImportedProfile {
  const trimmed = rawText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    throw new Error("The selected CERA export file is empty.");
  }

  // 1. Check JSON formats (Studio Summary JSON, CERA 2.0 Workbook JSON, or JSON log array)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsedJson = JSON.parse(trimmed) as unknown;
      if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
        const obj = parsedJson as Record<string, unknown>;
        if (
          obj.schema === "secure-gateway-studio/cera-summary/v1" ||
          (obj.channels && obj.totals && typeof obj.channels === "object")
        ) {
          return parseStudioSummaryJson(fileName, obj);
        }
        if (obj.kind === "cera2_sheets" || Array.isArray(obj.overviewRows)) {
          return parseCeraSpreadsheetPayload(obj as CeraSpreadsheetPayload, primaryDomain);
        }
      }
    } catch {
      // Fall through to CSV/log parser
    }
  }

  // 2. Check CERA 2.0 Exported CSV (`Executive Overview.csv` / `Policy Outcomes.csv`)
  const delimiter = sniffDelimiter(trimmed);
  const rawRows = parseDelimited(trimmed, delimiter);
  if (isCera2TableRows(rawRows)) {
    const profile = parseCera2SheetTables(fileName, rawRows, [], [], "cera2_csv");
    if (primaryDomain && profile.corporateDomains.length === 0) {
      profile.corporateDomains = [primaryDomain];
    }
    return profile;
  }

  // 3. Check Studio CERA Forensic CSV (`cera-forensic-*.csv`)
  const parsedLog = parseLogFile(fileName, trimmed);
  if (isStudioForensicCsv(parsedLog.headers) && parsedLog.rows.length > 0) {
    const profile = parseStudioForensicCsv(fileName, parsedLog.headers, parsedLog.rows);
    if (primaryDomain && profile.corporateDomains.length === 0) {
      profile.corporateDomains = [primaryDomain];
    }
    return profile;
  }

  // 4. Raw Admin Console Chrome Log CSV / TSV / JSON (analyzed via CERA engine)
  const normalized = normalizeFile(parsedLog, {}, 540);
  if (normalized.events.length === 0) {
    throw new Error(
      "No recognizable CERA summary rows or Chrome audit log events were found in the file.",
    );
  }
  const initialDomains = primaryDomain ? [primaryDomain] : [];
  const analysisResult = analyze({
    files: [normalized],
    settings: defaultSettings({ corporateDomains: initialDomains }),
  });

  const nonRootOus = analysisResult.orgUnits.filter(
    (u) => cleanOu(u.orgUnit) !== "" && cleanOu(u.orgUnit) !== "/",
  );
  const topOu = nonRootOus[0] ? cleanOu(nonRootOus[0].orgUnit) : "";
  const corpDomains =
    analysisResult.suggestedCorporateDomains.length > 0
      ? analysisResult.suggestedCorporateDomains
      : initialDomains;

  return {
    formatKind: "chrome_audit_log",
    sourceName: fileName,
    totalEvents: analysisResult.totals.actions || analysisResult.totals.events,
    totalVolumeGb: null,
    shadowAiEvents: analysisResult.channels.shadow_ai.actions,
    shadowAiSensitive: analysisResult.channels.shadow_ai.sensitive,
    shadowAiTopDomains: analysisResult.shadowAiDestinations.slice(0, 5).map((d) => d.host),
    personalAccountEvents: analysisResult.channels.personal_account.actions,
    personalAccountSensitive: analysisResult.channels.personal_account.sensitive,
    personalAccountTopDomains: analysisResult.personalAccountDestinations
      .slice(0, 5)
      .map((d) => d.host),
    unmanagedEvents: analysisResult.channels.unmanaged.actions,
    unmanagedSensitive: analysisResult.channels.unmanaged.sensitive,
    unmanagedTopDomains: analysisResult.unmanagedDestinations.slice(0, 5).map((d) => d.host),
    messagingEvents: analysisResult.channels.messaging.actions,
    messagingSensitive: analysisResult.channels.messaging.sensitive,
    messagingTopDomains: analysisResult.messagingDestinations.slice(0, 5).map((d) => d.host),
    downloadEvents: analysisResult.inbound.downloads,
    printEvents: analysisResult.print.actions,
    sensitivePrintEvents: analysisResult.print.sensitive,
    sensitiveEvents: analysisResult.totals.sensitiveOutbound + analysisResult.print.sensitive,
    malwareEvents: analysisResult.signals.malware,
    unscannedEvents: analysisResult.signals.unscanned,
    passwordReuseEvents: analysisResult.signals.passwordReuse,
    unsafeSiteEvents: analysisResult.signals.unsafeSiteVisits,
    extensionInstallEvents: analysisResult.signals.extensionInstalls,
    corporateDomains: corpDomains,
    internalHosts: [],
    topOu,
    outcomeModeHint: null,
  };
}

/**
 * Parses a CERA 2.0 Google Sheets payload returned by Apps Script `sgsImportCeraSpreadsheet`.
 */
export function parseCeraSpreadsheetPayload(
  payload: CeraSpreadsheetPayload,
  primaryDomain?: string | null,
): CeraImportedProfile {
  if (payload.error) {
    throw new Error(payload.error);
  }
  const sourceName = payload.title || payload.spreadsheetId || "CERA 2.0 Google Sheet";
  const overviewRows = Array.isArray(payload.overviewRows) ? payload.overviewRows : [];
  const outcomesRows = Array.isArray(payload.outcomesRows) ? payload.outcomesRows : [];
  const radarRows = Array.isArray(payload.radarRows) ? payload.radarRows : [];

  if (overviewRows.length > 0 || outcomesRows.length > 0) {
    const profile = parseCera2SheetTables(
      sourceName,
      overviewRows,
      outcomesRows,
      radarRows,
      "cera2_sheets",
    );
    if (primaryDomain && profile.corporateDomains.length === 0) {
      profile.corporateDomains = [primaryDomain];
    }
    return profile;
  }

  if (Array.isArray(payload.logHeaders) && Array.isArray(payload.logRows) && payload.logRows.length > 0) {
    const csvLines = [
      payload.logHeaders.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...payload.logRows.map((r) =>
        r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ];
    return parseCeraExportFile(sourceName, csvLines.join("\n"), primaryDomain);
  }

  throw new Error(
    "The specified Google Sheet does not contain CERA 2.0 tabs (Executive Overview / Policy Outcomes) or Chrome audit log rows.",
  );
}

/**
 * Builds a deterministic sample CERA 2.0 profile for immediate testing and preview.
 */
export function createSampleCeraProfile(primaryDomain?: string | null): CeraImportedProfile {
  return {
    formatKind: "cera2_sheets",
    sourceName: "CERA 2.0 Executive Overview (Sample)",
    totalEvents: 418,
    totalVolumeGb: 2.84,
    shadowAiEvents: 146,
    shadowAiSensitive: 29,
    shadowAiTopDomains: ["chatgpt.com", "claude.ai", "deepseek.com"],
    personalAccountEvents: 112,
    personalAccountSensitive: 18,
    personalAccountTopDomains: ["drive.google.com", "mail.google.com"],
    unmanagedEvents: 94,
    unmanagedSensitive: 14,
    unmanagedTopDomains: ["wetransfer.com", "mega.nz", "ilovepdf.com"],
    messagingEvents: 38,
    messagingSensitive: 7,
    messagingTopDomains: ["web.whatsapp.com", "discord.com"],
    downloadEvents: 64,
    printEvents: 28,
    sensitivePrintEvents: 9,
    sensitiveEvents: 77,
    malwareEvents: 3,
    unscannedEvents: 11,
    passwordReuseEvents: 6,
    unsafeSiteEvents: 12,
    extensionInstallEvents: 15,
    corporateDomains: primaryDomain ? [primaryDomain] : ["example.com"],
    internalHosts: [],
    topOu: "/CEP-PoC",
    outcomeModeHint: "block",
  };
}

/**
 * Maps an imported CERA profile + chosen rollout enforcement mode to Easy PoC's
 * `RecommendedPolicyConfig` (including DLP Matrix, Data Boundary, Allowed Domains, and Target OU).
 */
export function computeConfigFromCeraProfile(
  profile: CeraImportedProfile,
  enforcementMode: CeraEnforcementMode,
  options: { applyTopOu?: boolean; customMessage?: string; appliedBannerMessage?: string } = {},
): RecommendedPolicyConfig {
  const primaryAction: CepDlpAction =
    enforcementMode === "block"
      ? "blockContent"
      : enforcementMode === "warn"
        ? "warnUser"
        : "auditOnly";
  const secondaryAction: CepDlpAction =
    enforcementMode === "block" ? "warnUser" : "auditOnly";

  const hasShadowAi = profile.shadowAiEvents > 0;
  const hasPersonal = profile.personalAccountEvents > 0;
  const hasUnmanaged = profile.unmanagedEvents > 0;
  const hasMessaging = profile.messagingEvents > 0;
  const hasSensitive = profile.sensitiveEvents > 0;
  const hasPrints = profile.printEvents > 0 || profile.sensitivePrintEvents > 0;
  const hasDownloads =
    profile.downloadEvents > 0 || profile.malwareEvents > 0 || profile.unscannedEvents > 0;
  const hasSignals =
    profile.passwordReuseEvents > 0 ||
    profile.malwareEvents > 0 ||
    profile.unsafeSiteEvents > 0 ||
    profile.extensionInstallEvents > 0;
  const hasAnyOutbound =
    hasShadowAi || hasPersonal || hasUnmanaged || hasMessaging || profile.totalEvents > 0;

  let dataBoundaryMode: CepDataBoundaryMode = "none";
  if (enforcementMode !== "audit") {
    if (hasShadowAi || hasMessaging || hasSensitive) {
      dataBoundaryMode = "copy_paste";
    } else if (hasPersonal || hasUnmanaged) {
      dataBoundaryMode = "block_non_corp";
    } else {
      dataBoundaryMode = "copy_paste";
    }
  }

  const dlpMatrix: CepDlpMatrixState = {
    universal_upload: {
      upload:
        hasUnmanaged || hasPersonal || hasMessaging
          ? hasSensitive && enforcementMode === "block"
            ? "blockContent"
            : enforcementMode === "audit"
              ? "auditOnly"
              : "warnUser"
          : hasShadowAi
            ? secondaryAction
            : "off",
      byodOnly: false,
    },
    universal_download: {
      download:
        profile.malwareEvents > 0 || profile.unscannedEvents > 0
          ? primaryAction
          : hasDownloads || hasUnmanaged || hasPersonal
            ? secondaryAction
            : "off",
      byodOnly: false,
    },
    payment_card: {
      upload: hasSensitive || hasAnyOutbound ? primaryAction : "off",
      paste: hasSensitive || hasShadowAi || hasMessaging ? primaryAction : "off",
      print: hasPrints || hasSensitive ? primaryAction : "off",
      byodOnly: false,
    },
    national_id: {
      upload: hasSensitive || hasAnyOutbound ? primaryAction : "off",
      paste: hasSensitive || hasShadowAi || hasMessaging ? primaryAction : "off",
      print: hasPrints || hasSensitive ? primaryAction : "off",
      byodOnly: false,
    },
    access_level: {
      upload: "off",
      download: "off",
      paste: "off",
      print: "off",
      byodOnly: false,
    },
    android_byod: {
      upload: "off",
      download: "off",
      paste: "off",
      print: "off",
      byodOnly: true,
      deviceScope: "android_byod",
    },
    ios_byod: {
      upload: "off",
      download: "off",
      paste: "off",
      print: "off",
      byodOnly: true,
      deviceScope: "ios_byod",
    },
    watermark: {
      watermark:
        enforcementMode !== "audit" && (hasPrints || hasSensitive || hasShadowAi || hasPersonal),
      byodOnly: false,
    },
    genai_block: {
      paste: hasShadowAi
        ? primaryAction
        : hasSensitive || hasMessaging
          ? secondaryAction
          : "off",
      upload: hasShadowAi
        ? primaryAction
        : hasUnmanaged || hasMessaging
          ? secondaryAction
          : "off",
      byodOnly: false,
    },
  };

  return {
    corePolicies: true,
    forceExtensions:
      profile.extensionInstallEvents > 0 ||
      profile.unsafeSiteEvents > 0 ||
      profile.passwordReuseEvents > 0,
    connectors: hasAnyOutbound || hasDownloads || hasPrints || hasSignals,
    accessLevel: "NONE",
    dlpRules: true,
    dataBoundaryMode,
    autoSubOus: false,
    dlpMatrix,
    geminiEnforceAccessLevel: hasShadowAi,
    geminiEnforcePerimeter: false,
    internalUrls: profile.internalHosts.length > 0 ? profile.internalHosts.join("\n") : "",
    dlpCustomMessage: options.customMessage ?? "",
    allowedDomains: profile.corporateDomains.length > 0 ? profile.corporateDomains : undefined,
    targetOuName: options.applyTopOu !== false && profile.topOu ? profile.topOu : undefined,
    appliedBannerMessage: options.appliedBannerMessage,
  };
}
