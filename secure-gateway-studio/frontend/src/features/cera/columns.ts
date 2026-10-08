import type {
  ChromeLogEvent,
  ColumnKey,
  ColumnMapping,
  EventKind,
  EventResult,
  ParsedFile,
  TriggerType,
} from "./types";
import { COLUMN_KEYS } from "./types";

/**
 * Header normalisation: NFKC fold, lowercase, strip everything that is not a
 * letter or digit. "Event description", "event_description",
 * "EVENT-DESCRIPTION" and "イベントの説明" all collapse to stable keys.
 */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

const HEADER_ALIASES: Record<ColumnKey, readonly string[]> = {
  timestamp: [
    "date",
    "time",
    "timestamp",
    "datetime",
    "eventtime",
    "eventdate",
    "eventtimestamp",
    "idtime",
    "日付",
    "日時",
    "時刻",
    "日付と時刻",
    "イベント日時",
    "イベントの日時",
    "タイムスタンプ",
  ],
  event: [
    "event",
    "eventname",
    "eventtype",
    "name",
    "type",
    "activity",
    "イベント",
    "イベント名",
    "イベントの種類",
    "イベントタイプ",
    "アクティビティ",
  ],
  description: ["eventdescription", "description", "イベントの説明", "説明", "イベント説明"],
  actor: [
    "actor",
    "actoremail",
    "actoremailaddress",
    "user",
    "useremail",
    "email",
    "emailaddress",
    "username",
    "アクター",
    "アクターのメールアドレス",
    "ユーザー",
    "ユーザーのメールアドレス",
    "メールアドレス",
    "実行者",
  ],
  orgUnit: [
    "actororgunitname",
    "actororgunit",
    "orgunit",
    "orgunitname",
    "orgunitpath",
    "organizationalunit",
    "organizationalunitname",
    "organizationalunitpath",
    "ou",
    "アクターの組織部門名",
    "アクターの組織部門",
    "組織部門",
    "組織部門名",
    "組織部門のパス",
    "組織部門パス",
  ],
  group: ["actorgroupname", "actorgroup", "group", "groupname", "アクターのグループ名", "グループ", "グループ名"],
  url: ["url", "webpageurl", "pageurl", "requesturl", "siteurl", "website", "ウェブサイト"],
  tabUrl: ["taburl", "タブurl", "タブのurl"],
  urlCategory: ["urlcategory", "category", "sitecategory", "urlカテゴリ", "カテゴリ", "サイトカテゴリ"],
  contentName: ["contentname", "filename", "file", "attachmentname", "コンテンツ名", "ファイル名", "添付ファイル名"],
  contentType: ["contenttype", "mimetype", "filetype", "コンテンツの種類", "コンテンツタイプ", "ファイルの種類", "mimeタイプ"],
  contentSize: ["contentsize", "filesize", "size", "sizebytes", "コンテンツサイズ", "コンテンツのサイズ", "ファイルサイズ", "サイズ"],
  contentHash: ["contenthash", "hash", "sha256", "filehash", "コンテンツハッシュ", "コンテンツのハッシュ", "ハッシュ"],
  transferMethod: ["contenttransfermethod", "transfermethod", "コンテンツの転送方法", "転送方法"],
  trigger: ["triggertype", "trigger", "triggeredby", "トリガーの種類", "トリガータイプ", "トリガー"],
  triggerUser: ["triggeruser", "トリガーユーザー"],
  source: ["source", "triggersource", "ソース", "送信元", "転送元"],
  destination: ["destination", "triggerdestination", "宛先", "送信先", "転送先"],
  reason: ["eventreason", "reason", "イベントの理由", "理由"],
  result: ["eventresult", "result", "action", "outcome", "verdict", "イベントの結果", "結果", "アクション", "判定"],
  rules: [
    "triggeredrulenames",
    "triggeredrules",
    "triggeredrulesreason",
    "rulename",
    "rulenames",
    "rules",
    "rule",
    "policyname",
    "トリガーされたルール名",
    "トリガーされたルール",
    "ルール名",
    "ルール",
    "ポリシー名",
  ],
  scanId: ["scanid", "スキャンid"],
  profileUser: [
    "profileusername",
    "profileuser",
    "profile",
    "profileemail",
    "chromeprofile",
    "プロファイルユーザー名",
    "プロファイルのユーザー名",
    "プロファイル",
  ],
  deviceUser: ["deviceuser", "deviceusername", "osuser", "デバイスユーザー", "デバイスのユーザー"],
  deviceName: ["devicename", "device", "hostname", "デバイス名", "デバイス"],
  devicePlatform: ["deviceplatform", "platform", "os", "operatingsystem", "デバイスのプラットフォーム", "プラットフォーム", "os名"],
  clientType: ["clienttype", "client", "クライアントの種類", "クライアントタイプ", "クライアント"],
  browserVersion: ["browserversion", "chromeversion", "ブラウザのバージョン", "ブラウザバージョン"],
  signedInAccount: [
    "webappsignedinaccount",
    "signedinaccount",
    "signedinuser",
    "loginusername",
    "loginuser",
    "loginaccount",
    "signinaccount",
    "signedinaccountemail",
    "ウェブアプリのログインアカウント",
    "ログインユーザー名",
    "ログインアカウント",
    "ログインユーザー",
  ],
  extensionId: ["extensionid", "拡張機能id"],
  extensionName: ["extensionname", "extension", "拡張機能名", "拡張機能"],
  detector: ["detectorname", "detector", "検出器名", "検出器"],
};

const ALIAS_LOOKUP: Map<string, ColumnKey> = (() => {
  const map = new Map<string, ColumnKey>();
  for (const key of COLUMN_KEYS) {
    for (const alias of HEADER_ALIASES[key]) {
      if (!map.has(alias)) map.set(alias, key);
    }
  }
  return map;
})();

/** Columns the analysis cannot do anything useful without. */
export const REQUIRED_COLUMNS: readonly ColumnKey[] = ["timestamp", "actor"];

export const IMPORTANT_COLUMNS: readonly ColumnKey[] = [
  "timestamp",
  "event",
  "actor",
  "url",
  "trigger",
  "result",
];

export function autoMapColumns(headers: readonly string[]): {
  mapping: ColumnMapping;
  unmapped: string[];
} {
  const mapping: ColumnMapping = {};
  const unmapped: string[] = [];
  for (const header of headers) {
    const key = ALIAS_LOOKUP.get(normalizeHeader(header));
    if (key && mapping[key] === undefined) {
      mapping[key] = header;
    } else if (!key) {
      unmapped.push(header);
    }
  }
  // Admin Console exports without a dedicated "URL" column still carry the
  // destination in "Tab URL"; use that so hosts resolve.
  if (!mapping.url && mapping.tabUrl) mapping.url = mapping.tabUrl;
  return { mapping, unmapped };
}

export function mergeMappings(auto: ColumnMapping, override: ColumnMapping): ColumnMapping {
  const merged: ColumnMapping = { ...auto };
  for (const key of COLUMN_KEYS) {
    const value = override[key];
    if (value === undefined) continue;
    if (value === "") {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function missingColumns(mapping: ColumnMapping): ColumnKey[] {
  return IMPORTANT_COLUMNS.filter((key) => !mapping[key]);
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const TZ_ABBREVIATIONS: Record<string, number> = {
  jst: 540,
  kst: 540,
  utc: 0,
  gmt: 0,
  z: 0,
  pst: -480,
  pdt: -420,
  est: -300,
  edt: -240,
  cst: -360,
  cdt: -300,
  mst: -420,
  mdt: -360,
  bst: 60,
  cet: 60,
  cest: 120,
  ist: 330,
  sgt: 480,
  hkt: 480,
  aest: 600,
  aedt: 660,
};

function parseOffsetMinutes(token: string): number | null {
  const clean = token.trim().toLowerCase().replace(/^(gmt|utc)/, "");
  if (clean === "") return 0;
  const match = /^([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(clean);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? "0"));
}

/**
 * Tolerant timestamp parser. Supports ISO 8601, Admin Console exports
 * ("Oct 1, 2026, 9:14:03 AM GMT+9"), Japanese exports
 * ("2026年10月1日 9:14:03 JST", 午前/午後), slash/dot dates, and epoch
 * seconds/milliseconds. Strings without zone information are interpreted in
 * `defaultOffsetMinutes`.
 */
export function parseTimestamp(raw: string, defaultOffsetMinutes: number): number | null {
  if (!raw) return null;
  let text = raw.normalize("NFKC").trim();
  if (text === "") return null;

  if (/^\d{10}(\.\d+)?$/.test(text)) return Math.round(Number(text) * 1000);
  if (/^\d{13}$/.test(text)) return Number(text);

  // Japanese date words → numeric separators.
  text = text
    .replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1/$2/$3")
    .replace(/(\d{1,2})時(\d{1,2})分(?:(\d{1,2})秒)?/, (_m, h: string, mi: string, s?: string) =>
      `${h}:${mi}:${s ?? "00"}`,
    )
    .replace(/午前\s*/, "AM ")
    .replace(/午後\s*/, "PM ")
    .replace(/[（(]([^)）]*)[)）]/g, " $1 ")
    .replace(/\s+/g, " ")
    .replace(/\b(AM|PM) (\d{1,2}:\d{2}(?::\d{2})?)/i, "$2 $1")
    .trim();

  // Trailing zone token (JST, GMT+9, UTC+09:00, +0900, Z).
  let offset: number | null = null;
  const zoneMatch =
    /(?:\s|^)((?:gmt|utc)?[+-]\d{1,2}(?::?\d{2})?|[a-z]{1,5})$/i.exec(text) ??
    /(z)$/i.exec(text);
  if (zoneMatch) {
    const token = zoneMatch[1];
    const abbr = TZ_ABBREVIATIONS[token.toLowerCase()];
    const numeric = parseOffsetMinutes(token);
    if (abbr !== undefined) {
      offset = abbr;
      text = text.slice(0, zoneMatch.index).trim();
    } else if (numeric !== null && /[+-]/.test(token)) {
      offset = numeric;
      text = text.slice(0, zoneMatch.index).trim();
    } else if (/^(am|pm)$/i.test(token)) {
      // not a zone; keep text
    } else if (/^[a-z]{3,5}$/i.test(token) && !MONTHS[token.toLowerCase()]) {
      // unknown zone abbreviation: strip it and fall back to the default offset
      text = text.slice(0, zoneMatch.index).trim();
    }
  }

  // ISO 8601 with explicit zone or trailing offset handled by Date.parse.
  const isoMatch =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?([+-]\d{2}:?\d{2}|Z)?$/i.exec(
      text,
    );
  if (isoMatch) {
    const [, y, mo, d, h, mi, s, frac, zone] = isoMatch;
    const ms = frac ? Number(`0.${frac}`) * 1000 : 0;
    const base = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? "0"), ms);
    const zoneOffset = zone ? (zone.toUpperCase() === "Z" ? 0 : parseOffsetMinutes(zone)) : offset;
    const effective = zoneOffset ?? defaultOffsetMinutes;
    return base - effective * 60_000;
  }

  // Numeric dates: 2026/10/01 9:14:03, 2026.10.01 09:14, 10/01/2026 9:14 AM.
  const numericMatch =
    /^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i.exec(text);
  if (numericMatch) {
    const [, a, b, c, hh, mm, ss, ampm] = numericMatch;
    let year: number;
    let month: number;
    let day: number;
    if (a.length === 4) {
      year = Number(a);
      month = Number(b);
      day = Number(c);
    } else {
      year = Number(c.length === 2 ? `20${c}` : c);
      month = Number(a);
      day = Number(b);
      if (month > 12 && day <= 12) {
        [month, day] = [day, month];
      }
    }
    let hour = Number(hh ?? "0");
    if (ampm) {
      const pm = ampm.toLowerCase() === "pm";
      if (pm && hour < 12) hour += 12;
      if (!pm && hour === 12) hour = 0;
    }
    const base = Date.UTC(year, month - 1, day, hour, Number(mm ?? "0"), Number(ss ?? "0"));
    if (Number.isNaN(base)) return null;
    return base - (offset ?? defaultOffsetMinutes) * 60_000;
  }

  // Month-name dates: "Oct 1, 2026, 9:14:03 AM" / "1 Oct 2026 09:14".
  const monthFirst =
    /^([a-z]{3,9})\.? (\d{1,2}),? (\d{4})(?:,? (\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i.exec(text);
  const dayFirst =
    /^(\d{1,2}) ([a-z]{3,9})\.?,? (\d{4})(?:,? (\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i.exec(text);
  const named = monthFirst
    ? { month: monthFirst[1], day: monthFirst[2], year: monthFirst[3], rest: monthFirst.slice(4) }
    : dayFirst
      ? { month: dayFirst[2], day: dayFirst[1], year: dayFirst[3], rest: dayFirst.slice(4) }
      : null;
  if (named) {
    const monthIndex = MONTHS[named.month.slice(0, 3).toLowerCase()];
    if (monthIndex !== undefined) {
      const [hh, mm, ss, ampm] = named.rest;
      let hour = Number(hh ?? "0");
      if (ampm) {
        const pm = ampm.toLowerCase() === "pm";
        if (pm && hour < 12) hour += 12;
        if (!pm && hour === 12) hour = 0;
      }
      const base = Date.UTC(Number(named.year), monthIndex, Number(named.day), hour, Number(mm ?? "0"), Number(ss ?? "0"));
      return base - (offset ?? defaultOffsetMinutes) * 60_000;
    }
  }

  const fallback = Date.parse(raw);
  if (!Number.isNaN(fallback)) return fallback;
  return null;
}

export function classifyEventKind(eventName: string, description: string): EventKind {
  const text = `${eventName} ${description}`.normalize("NFKC").toLowerCase();
  if (text === "") return "other";
  if (/sensitive[_ ]?data|機密データ|dlp/.test(text)) return "sensitive_data_transfer";
  if (/malware|マルウェア|malicious/.test(text)) return "malware_transfer";
  if (/unscanned|スキャンされていない|未スキャン|unscannable/.test(text)) return "content_unscanned";
  if (/content[_ ]?transfer|コンテンツの転送|コンテンツ転送|file[_ ]?transfer|bulk[_ ]?text|データ転送/.test(text)) {
    return "content_transfer";
  }
  if (/password[_ ]?reuse|パスワードの再利用|パスワード再利用/.test(text)) return "password_reuse";
  if (/password[_ ]?change|パスワードの変更|パスワード変更/.test(text)) return "password_changed";
  if (/unsafe[_ ]?site|dangerous|safe[_ ]?browsing|安全でないサイト|危険なサイト|phish|フィッシング/.test(text)) {
    return "unsafe_site_visit";
  }
  if (/url[_ ]?filter|interstitial|urlフィルタ|インタースティシャル|blocked[_ ]?site/.test(text)) {
    return "url_filtering_interstitial";
  }
  if (/login|sign[_ -]?in|ログイン|サインイン/.test(text)) return "login_event";
  if (/extension|拡張機能/.test(text)) return "extension_install";
  if (/crash|クラッシュ/.test(text)) return "browser_crash";
  if (/launch|起動/.test(text)) return "browser_launch";
  if (/upload|download|print|paste|アップロード|ダウンロード|印刷|貼り付け/.test(text)) return "content_transfer";
  return "other";
}

export function classifyTrigger(raw: string, transferMethod: string, description: string): TriggerType {
  const text = `${raw} ${transferMethod}`.normalize("NFKC").toLowerCase();
  const probe = text.trim() === "" ? description.normalize("NFKC").toLowerCase() : text;
  if (/web[_ ]?content|bulk[_ ]?text|paste|clipboard|text[_ ]?entry|テキスト|貼り付け|ペースト|クリップボード/.test(probe)) {
    return "web_content_upload";
  }
  if (/print|印刷/.test(probe)) return "page_print";
  if (/download|ダウンロード/.test(probe)) return "file_download";
  if (/file[_ ]?transfer|ファイル転送|ファイルの転送/.test(probe)) return "file_transfer";
  if (/upload|attach|drag|drop|アップロード|添付/.test(probe)) return "file_upload";
  return "unknown";
}

export function classifyResult(raw: string): EventResult {
  const text = raw.normalize("NFKC").toLowerCase();
  if (text === "") return "unknown";
  if (/block|ブロック|denied|拒否/.test(text)) return "blocked";
  if (/bypass|バイパス|回避|override|proceed/.test(text)) return "bypassed";
  if (/warn|警告/.test(text)) return "warned";
  if (/detect|検出|audit|監査|report|レポート|log/.test(text)) return "detected";
  if (/allow|許可|permit|pass/.test(text)) return "allowed";
  return "unknown";
}

export const RESULT_SEVERITY: Record<EventResult, number> = {
  blocked: 5,
  warned: 4,
  bypassed: 3,
  detected: 2,
  allowed: 1,
  unknown: 0,
};

export function parseSize(raw: string): number | null {
  const text = raw.normalize("NFKC").trim().toLowerCase().replace(/,/g, "");
  if (text === "") return null;
  const match = /^([\d.]+)\s*(b|bytes?|kb|kib|mb|mib|gb|gib|バイト)?$/.exec(text);
  if (!match) {
    const digits = Number(text);
    return Number.isFinite(digits) ? digits : null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2] ?? "";
  const factor =
    unit.startsWith("k") ? 1024 : unit.startsWith("m") ? 1024 ** 2 : unit.startsWith("g") ? 1024 ** 3 : 1;
  return Math.round(value * factor);
}

function cell(row: Record<string, string>, mapping: ColumnMapping, key: ColumnKey): string {
  const header = mapping[key];
  if (!header) return "";
  return (row[header] ?? "").trim();
}

function cleanEmail(raw: string): string {
  const text = raw.normalize("NFKC").trim().toLowerCase();
  const match = /[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/.exec(text);
  return match ? match[0] : text;
}

export function toChromeLogEvent(
  row: Record<string, string>,
  mapping: ColumnMapping,
  rowIndex: number,
  sourceFile: string,
  defaultOffsetMinutes: number,
): ChromeLogEvent | null {
  const rawTimestamp = cell(row, mapping, "timestamp");
  const eventName = cell(row, mapping, "event");
  const description = cell(row, mapping, "description");
  const actor = cleanEmail(cell(row, mapping, "actor"));
  if (!rawTimestamp && !eventName && !actor) return null;

  const transferMethod = cell(row, mapping, "transferMethod");
  const triggerRaw = cell(row, mapping, "trigger");
  const resultRaw = cell(row, mapping, "result");
  const url = cell(row, mapping, "url");
  const tabUrl = cell(row, mapping, "tabUrl");

  return {
    rowIndex,
    sourceFile,
    timestamp: parseTimestamp(rawTimestamp, defaultOffsetMinutes),
    rawTimestamp,
    eventKind: classifyEventKind(eventName, description),
    eventName,
    description,
    actor,
    orgUnit: cell(row, mapping, "orgUnit"),
    group: cell(row, mapping, "group"),
    url: url || tabUrl,
    tabUrl,
    urlCategory: cell(row, mapping, "urlCategory"),
    contentName: cell(row, mapping, "contentName"),
    contentType: cell(row, mapping, "contentType"),
    contentSize: parseSize(cell(row, mapping, "contentSize")),
    contentHash: cell(row, mapping, "contentHash"),
    transferMethod,
    trigger: classifyTrigger(triggerRaw, transferMethod, description),
    triggerRaw,
    triggerUser: cleanEmail(cell(row, mapping, "triggerUser")),
    source: cell(row, mapping, "source"),
    destination: cell(row, mapping, "destination"),
    reason: cell(row, mapping, "reason"),
    result: classifyResult(resultRaw),
    resultRaw,
    rules: cell(row, mapping, "rules"),
    scanId: cell(row, mapping, "scanId"),
    profileUser: cleanEmail(cell(row, mapping, "profileUser")),
    deviceUser: cell(row, mapping, "deviceUser"),
    deviceName: cell(row, mapping, "deviceName"),
    devicePlatform: cell(row, mapping, "devicePlatform"),
    clientType: cell(row, mapping, "clientType"),
    browserVersion: cell(row, mapping, "browserVersion"),
    signedInAccount: cleanEmail(cell(row, mapping, "signedInAccount")),
    extensionId: cell(row, mapping, "extensionId"),
    extensionName: cell(row, mapping, "extensionName"),
    detector: cell(row, mapping, "detector"),
  };
}

export interface NormalizedFile {
  file: ParsedFile;
  mapping: ColumnMapping;
  unmapped: string[];
  events: ChromeLogEvent[];
  skipped: number;
}

export function normalizeFile(
  file: ParsedFile,
  overrides: ColumnMapping,
  defaultOffsetMinutes: number,
): NormalizedFile {
  const { mapping: auto, unmapped } = autoMapColumns(file.headers);
  const mapping = mergeMappings(auto, overrides);
  const events: ChromeLogEvent[] = [];
  let skipped = 0;
  file.rows.forEach((row, index) => {
    const event = toChromeLogEvent(row, mapping, index + 2, file.name, defaultOffsetMinutes);
    if (event) {
      events.push(event);
    } else {
      skipped += 1;
    }
  });
  return { file, mapping, unmapped, events, skipped };
}
