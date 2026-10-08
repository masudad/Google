import { describe, expect, it } from "vitest";
import { parseDelimited, parseLogFile, sniffDelimiter, toCsv } from "./csv";
import {
  autoMapColumns,
  classifyEventKind,
  classifyResult,
  classifyTrigger,
  normalizeFile,
  parseTimestamp,
} from "./columns";
import { categorizeHost, hostFromUrl, normalizeDomainList, registrableDomain } from "./domains";
import { analyze, defaultSettings, suggestCorporateDomains } from "./analyze";
import { SAMPLE_CORPORATE_DOMAIN, generateSampleCsv } from "./sample-data";
import { buildDeckHtml } from "./deck-html";
import { buildForensicCsv, buildSummaryJson } from "./exports";
import { getCeraMessages } from "./messages";

const JST = 540;

function analyzeCsv(name: string, csv: string, settingsOverride = {}) {
  const parsed = parseLogFile(name, csv);
  const normalized = normalizeFile(parsed, {}, JST);
  return analyze({
    files: [normalized],
    settings: defaultSettings({ corporateDomains: [SAMPLE_CORPORATE_DOMAIN], ...settingsOverride }),
    now: Date.UTC(2026, 9, 7, 9, 0, 0),
  });
}

describe("csv parsing", () => {
  it("parses quoted fields, embedded newlines and CRLF", () => {
    const rows = parseDelimited('a,b,c\r\n1,"x, y","line1\nline2"\r\n2,"he said ""hi""",\r\n', ",");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "x, y", "line1\nline2"],
      ["2", 'he said "hi"', ""],
    ]);
  });

  it("sniffs tab-separated exports and strips BOM", () => {
    const text = "\uFEFFDate\tEvent\tActor\n2026-10-01T00:00:00Z\tCONTENT_TRANSFER\ta@example.co.jp\n";
    expect(sniffDelimiter(text)).toBe("\t");
    const parsed = parseLogFile("log.tsv", text);
    expect(parsed.format).toBe("tsv");
    expect(parsed.headers).toEqual(["Date", "Event", "Actor"]);
    expect(parsed.rows[0].Actor).toBe("a@example.co.jp");
  });

  it("flattens Reports API JSON activities into rows", () => {
    const json = JSON.stringify({
      items: [
        {
          id: { time: "2026-10-01T01:02:03.000Z" },
          actor: { email: "b@example.co.jp" },
          events: [
            {
              name: "CONTENT_TRANSFER",
              parameters: [
                { name: "TRIGGER_TYPE", value: "FILE_UPLOAD" },
                { name: "URL", value: "https://chatgpt.com/c/1" },
                { name: "EVENT_RESULT", value: "ALLOWED" },
                { name: "CONTENT_SIZE", intValue: "1234" },
              ],
            },
          ],
        },
      ],
    });
    const parsed = parseLogFile("events.json", json);
    expect(parsed.format).toBe("json");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].TRIGGER_TYPE).toBe("FILE_UPLOAD");
    const { mapping } = autoMapColumns(parsed.headers);
    expect(mapping.timestamp).toBe("time");
    expect(mapping.actor).toBe("actor");
    expect(mapping.url).toBe("URL");
    expect(mapping.contentSize).toBe("CONTENT_SIZE");
  });

  it("neutralises formula injection on export", () => {
    const csv = toCsv(["a"], [["=HYPERLINK(\"x\")"], ["plain"]]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });
});

describe("column mapping", () => {
  it("maps English Admin Console headers", () => {
    const { mapping, unmapped } = autoMapColumns([
      "Date",
      "Event",
      "Event description",
      "Actor",
      "Actor org unit name",
      "URL",
      "Trigger type",
      "Event result",
      "Triggered rule names",
      "Profile user name",
      "Web app signed-in account",
      "Mystery column",
    ]);
    expect(mapping.timestamp).toBe("Date");
    expect(mapping.description).toBe("Event description");
    expect(mapping.orgUnit).toBe("Actor org unit name");
    expect(mapping.trigger).toBe("Trigger type");
    expect(mapping.result).toBe("Event result");
    expect(mapping.rules).toBe("Triggered rule names");
    expect(mapping.profileUser).toBe("Profile user name");
    expect(mapping.signedInAccount).toBe("Web app signed-in account");
    expect(unmapped).toEqual(["Mystery column"]);
  });

  it("maps Japanese Admin Console headers", () => {
    const { mapping } = autoMapColumns([
      "日付",
      "イベント",
      "イベントの説明",
      "アクター",
      "アクターの組織部門名",
      "URL",
      "トリガーの種類",
      "イベントの結果",
      "コンテンツ名",
      "コンテンツサイズ",
      "送信先",
      "プロファイル ユーザー名",
    ]);
    expect(mapping.timestamp).toBe("日付");
    expect(mapping.event).toBe("イベント");
    expect(mapping.description).toBe("イベントの説明");
    expect(mapping.actor).toBe("アクター");
    expect(mapping.orgUnit).toBe("アクターの組織部門名");
    expect(mapping.trigger).toBe("トリガーの種類");
    expect(mapping.result).toBe("イベントの結果");
    expect(mapping.contentName).toBe("コンテンツ名");
    expect(mapping.contentSize).toBe("コンテンツサイズ");
    expect(mapping.destination).toBe("送信先");
    expect(mapping.profileUser).toBe("プロファイル ユーザー名");
  });

  it("falls back to Tab URL when URL is absent", () => {
    const { mapping } = autoMapColumns(["Date", "Actor", "Tab URL"]);
    expect(mapping.url).toBe("Tab URL");
  });

  it("classifies event kinds, triggers and results in EN and JA", () => {
    expect(classifyEventKind("CONTENT_TRANSFER", "")).toBe("content_transfer");
    expect(classifyEventKind("", "機密データの転送")).toBe("sensitive_data_transfer");
    expect(classifyEventKind("Malware transfer", "")).toBe("malware_transfer");
    expect(classifyEventKind("", "パスワードの再利用")).toBe("password_reuse");
    expect(classifyEventKind("UNSAFE_SITE_VISIT", "")).toBe("unsafe_site_visit");
    expect(classifyTrigger("WEB_CONTENT_UPLOAD", "", "")).toBe("web_content_upload");
    expect(classifyTrigger("", "貼り付け", "")).toBe("web_content_upload");
    expect(classifyTrigger("FILE_UPLOAD", "", "")).toBe("file_upload");
    expect(classifyTrigger("", "", "ファイルをダウンロードしました")).toBe("file_download");
    expect(classifyTrigger("PAGE_PRINT", "", "")).toBe("page_print");
    expect(classifyResult("BLOCKED")).toBe("blocked");
    expect(classifyResult("警告")).toBe("warned");
    expect(classifyResult("Bypassed")).toBe("bypassed");
    expect(classifyResult("許可")).toBe("allowed");
    expect(classifyResult("DETECTED")).toBe("detected");
  });
});

describe("timestamp parsing", () => {
  it("parses Admin Console, ISO, Japanese and epoch formats", () => {
    const expected = Date.UTC(2026, 9, 1, 0, 14, 3);
    expect(parseTimestamp("Oct 1, 2026, 9:14:03 AM GMT+9", 0)).toBe(expected);
    expect(parseTimestamp("Oct 1, 2026, 9:14:03\u202fAM GMT+09:00", 0)).toBe(expected);
    expect(parseTimestamp("2026-10-01T00:14:03.000Z", JST)).toBe(expected);
    expect(parseTimestamp("2026-10-01 09:14:03 JST", 0)).toBe(expected);
    expect(parseTimestamp("2026年10月1日 9:14:03", JST)).toBe(expected);
    expect(parseTimestamp("2026年10月1日 午前9:14:03 GMT+9", 0)).toBe(expected);
    expect(parseTimestamp("2026/10/01 9:14:03", JST)).toBe(expected);
    expect(parseTimestamp("10/01/2026 9:14 AM", JST)).toBe(Date.UTC(2026, 9, 1, 0, 14, 0));
    expect(parseTimestamp(String(Math.floor(expected / 1000)), 0)).toBe(expected);
    expect(parseTimestamp("not a date", 0)).toBeNull();
  });
});

describe("domains", () => {
  it("normalises hosts and registrable domains", () => {
    expect(hostFromUrl("https://www.Drive.Google.com/drive/u/0/")).toBe("drive.google.com");
    expect(hostFromUrl("docs.google.com/document/d/1")).toBe("docs.google.com");
    expect(registrableDomain("kintone.example.co.jp")).toBe("example.co.jp");
    expect(registrableDomain("app.box.com")).toBe("box.com");
    expect(normalizeDomainList("Example.co.jp, *.partner.com; @gmail.com")).toEqual([
      "example.co.jp",
      "partner.com",
      "gmail.com",
    ]);
  });

  it("categorises destinations", () => {
    expect(categorizeHost("chatgpt.com")).toBe("genai");
    expect(categorizeHost("chat.openai.com")).toBe("genai");
    expect(categorizeHost("web.whatsapp.com")).toBe("messaging");
    expect(categorizeHost("wetransfer.com")).toBe("file_transfer");
    expect(categorizeHost("ilovepdf.com")).toBe("converter");
    expect(categorizeHost("drive.google.com")).toBe("google_workspace");
    expect(categorizeHost("mega.nz")).toBe("cloud_storage");
    expect(categorizeHost("unknown-saas.example", [], [], "File Sharing")).toBe("file_transfer");
    expect(categorizeHost("my-llm.example", ["my-llm.example"])).toBe("genai");
  });
});

const HEADER = "Date,Event,Event description,Actor,Actor org unit name,URL,Trigger type,Event result,Triggered rule names,Content name,Content size,Profile user name,Web app signed-in account";

function row(parts: Partial<Record<string, string>>): string {
  const order = [
    "Date",
    "Event",
    "Event description",
    "Actor",
    "Actor org unit name",
    "URL",
    "Trigger type",
    "Event result",
    "Triggered rule names",
    "Content name",
    "Content size",
    "Profile user name",
    "Web app signed-in account",
  ];
  return order.map((key) => parts[key] ?? "").join(",");
}

describe("analysis engine", () => {
  it("merges multi-row DLP events into one user action within 10 seconds", () => {
    const csv = [
      HEADER,
      row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", "Actor org unit name": "/Sales", URL: "https://chatgpt.com/c/1", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "x.xlsx", "Content size": "100" }),
      row({ Date: "2026-10-01T01:00:02Z", Event: "SENSITIVE_DATA_TRANSFER", Actor: "a@example.co.jp", "Actor org unit name": "/Sales", URL: "https://chatgpt.com/c/1", "Trigger type": "FILE_UPLOAD", "Event result": "WARNED", "Triggered rule names": "Rule A", "Content name": "x.xlsx", "Content size": "100" }),
      row({ Date: "2026-10-01T01:00:04Z", Event: "SENSITIVE_DATA_TRANSFER", Actor: "a@example.co.jp", "Actor org unit name": "/Sales", URL: "https://chatgpt.com/c/1", "Trigger type": "FILE_UPLOAD", "Event result": "BLOCKED", "Triggered rule names": "Rule B", "Content name": "x.xlsx", "Content size": "100" }),
      row({ Date: "2026-10-01T01:00:30Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", "Actor org unit name": "/Sales", URL: "https://chatgpt.com/c/1", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "x.xlsx", "Content size": "100" }),
    ].join("\n");
    const result = analyzeCsv("dedup.csv", csv);
    expect(result.totals.events).toBe(4);
    expect(result.totals.actions).toBe(2);
    const merged = result.actions.find((action) => action.mergedRows === 3);
    expect(merged).toBeDefined();
    expect(merged?.result).toBe("blocked");
    expect(merged?.sensitive).toBe(true);
    expect(merged?.rules).toEqual(["Rule A", "Rule B"]);
    expect(merged?.channel).toBe("shadow_ai");
    expect(result.channels.shadow_ai.actions).toBe(2);
  });

  it("classifies channels in priority order", () => {
    const csv = [
      HEADER,
      row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://intranet.example.co.jp/upload", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "1" }),
      row({ Date: "2026-10-01T01:01:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://drive.google.com/drive", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "2", "Web app signed-in account": "a.private@gmail.com" }),
      row({ Date: "2026-10-01T01:02:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://drive.google.com/drive", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "3", "Web app signed-in account": "a@example.co.jp" }),
      row({ Date: "2026-10-01T01:03:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://gemini.google.com/app", "Trigger type": "WEB_CONTENT_UPLOAD", "Event result": "ALLOWED" }),
      row({ Date: "2026-10-01T01:04:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://claude.ai/chat", "Trigger type": "WEB_CONTENT_UPLOAD", "Event result": "ALLOWED" }),
      row({ Date: "2026-10-01T01:05:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://web.whatsapp.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "6" }),
      row({ Date: "2026-10-01T01:06:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://wetransfer.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "7" }),
      row({ Date: "2026-10-01T01:07:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://portal.partner.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "8" }),
      row({ Date: "2026-10-01T01:08:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://acme.slack.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "9" }),
      row({ Date: "2026-10-01T01:09:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://x.com/", "Trigger type": "FILE_DOWNLOAD", "Event result": "ALLOWED", "Content name": "10" }),
      row({ Date: "2026-10-01T01:10:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://docs.google.com/", "Trigger type": "PAGE_PRINT", "Event result": "ALLOWED", "Content name": "11" }),
    ].join("\n");
    const result = analyzeCsv("channels.csv", csv, {
      partnerDomains: ["partner.com"],
      sanctionedHosts: ["drive.google.com", "slack.com"],
    });
    const byName = Object.fromEntries(result.actions.map((action) => [action.contentName || action.host, action.channel]));
    expect(byName["1"]).toBe("internal");
    expect(byName["2"]).toBe("personal_account");
    expect(byName["3"]).toBe("sanctioned");
    expect(byName["gemini.google.com"]).toBe("sanctioned_ai");
    expect(byName["claude.ai"]).toBe("shadow_ai");
    expect(byName["6"]).toBe("messaging");
    expect(byName["7"]).toBe("unmanaged");
    expect(byName["8"]).toBe("partner");
    expect(byName["9"]).toBe("sanctioned");
    expect(result.totals.outbound).toBe(9);
    expect(result.totals.downloads).toBe(1);
    expect(result.totals.prints).toBe(1);
    expect(result.totals.threatActions).toBe(4);
    expect(result.unmanagedDestinations[0].host).toBe("wetransfer.com");
    expect(result.unmanagedDestinations[0].category).toBe("file_transfer");
  });

  it("suggests corporate domains from actors and the signed-in admin", () => {
    const parsed = parseLogFile(
      "x.csv",
      [HEADER, row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp" }), row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "b@example.co.jp" }), row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "c@sub.example.com" })].join("\n"),
    );
    const normalized = normalizeFile(parsed, {}, JST);
    expect(suggestCorporateDomains(normalized.events, "admin@tenant.example")).toEqual([
      "tenant.example",
      "example.co.jp",
      "sub.example.com",
    ]);
  });

  it("computes off-hours and weekend shares in the configured timezone", () => {
    const csv = [
      HEADER,
      // 2026-10-03 is a Saturday. 23:00Z on Friday = 08:00 JST Saturday.
      row({ Date: "2026-10-02T23:00:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://wetransfer.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "1" }),
      // Monday 14:00Z = 23:00 JST → off-hours.
      row({ Date: "2026-10-05T14:00:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://wetransfer.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "2" }),
      // Monday 02:00Z = 11:00 JST → business hours.
      row({ Date: "2026-10-05T02:00:00Z", Event: "CONTENT_TRANSFER", Actor: "a@example.co.jp", URL: "https://wetransfer.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "3" }),
    ].join("\n");
    const result = analyzeCsv("hours.csv", csv);
    expect(result.concentration.weekendShare).toBeCloseTo(1 / 3, 4);
    expect(result.concentration.offHoursShare).toBeCloseTo(1 / 3, 4);
    expect(result.daily.map((point) => point.date)).toEqual(["2026-10-03", "2026-10-04", "2026-10-05"]);
  });

  it("masks identities with stable pseudonyms and keeps raw e-mails when masking is off", () => {
    const csv = [
      HEADER,
      row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "zed@example.co.jp", URL: "https://wetransfer.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "1" }),
      row({ Date: "2026-10-01T01:00:00Z", Event: "CONTENT_TRANSFER", Actor: "amy@example.co.jp", URL: "https://wetransfer.com/", "Trigger type": "FILE_UPLOAD", "Event result": "ALLOWED", "Content name": "2" }),
    ].join("\n");
    const masked = analyzeCsv("mask.csv", csv);
    const amy = masked.actions.find((action) => action.actor === "amy@example.co.jp");
    expect(amy?.actorMasked).toBe("U-001");
    const raw = analyzeCsv("mask.csv", csv, { maskIdentities: false });
    expect(raw.actions[0].actorMasked).toBe(raw.actions[0].actor);
  });
});

describe("sample dataset end to end", () => {
  const csv = generateSampleCsv();
  const result = analyzeCsv("sample.csv", csv);

  it("is deterministic and populates every slide input", () => {
    expect(generateSampleCsv()).toBe(csv);
    expect(result.totals.events).toBeGreaterThan(1000);
    expect(result.totals.actions).toBeLessThan(result.totals.events);
    expect(result.missingColumns).toEqual([]);
    expect(result.dateRange.days).toBe(7);
    expect(result.channels.personal_account.actions).toBeGreaterThan(0);
    expect(result.channels.shadow_ai.actions).toBeGreaterThan(0);
    expect(result.channels.sanctioned_ai.actions).toBeGreaterThan(0);
    expect(result.channels.messaging.actions).toBeGreaterThan(0);
    expect(result.channels.unmanaged.actions).toBeGreaterThan(0);
    expect(result.channels.internal.actions).toBeGreaterThan(0);
    expect(result.totals.downloads).toBeGreaterThan(0);
    expect(result.totals.prints).toBeGreaterThan(0);
    expect(result.inbound.malware + result.inbound.unscanned).toBeGreaterThan(0);
    expect(result.signals.passwordReuse).toBeGreaterThan(0);
    expect(result.signals.browserLaunches).toBeGreaterThan(0);
    expect(result.orgUnits.length).toBeGreaterThan(2);
    expect(result.categories.length).toBeGreaterThan(4);
    expect(result.roadmap.some((item) => item.id === "shadow_ai_block")).toBe(true);
    expect(result.suggestedCorporateDomains[0]).toBe(SAMPLE_CORPORATE_DOMAIN);
    expect(result.actions.some((action) => action.mergedRows > 1)).toBe(true);
  });

  it("renders an escaped standalone HTML deck in both languages", () => {
    for (const locale of ["en", "ja"] as const) {
      const html = buildDeckHtml(result, { locale, title: "<script>alert(1)</script> Report", customer: "ACME & Co" });
      expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(html).toContain("ACME &amp; Co");
      expect(html).toContain('class="slide"');
      expect((html.match(/<section class="slide[" ]/g) ?? []).length).toBe(13);
      expect(html).toContain("size: 13.333in 7.5in");
      expect(html).not.toMatch(/U-\d{3}@/);
      const messages = getCeraMessages(locale);
      expect(html).toContain(messages.deck.matrixTitle);
    }
  });

  it("masks identities in the deck and the forensic CSV by default", () => {
    const html = buildDeckHtml(result, { locale: "ja", title: "t", customer: "" });
    expect(html).not.toContain(`@${SAMPLE_CORPORATE_DOMAIN}`);
    const forensic = buildForensicCsv(result, getCeraMessages("en"));
    expect(forensic).not.toContain(`@${SAMPLE_CORPORATE_DOMAIN}`);
    expect(forensic.split("\r\n")[0]).toContain("Channel");
    const summary = JSON.parse(buildSummaryJson(result));
    expect(summary.totals.actions).toBe(result.totals.actions);
    expect(JSON.stringify(summary)).not.toContain(`@${SAMPLE_CORPORATE_DOMAIN}`);
  });
});
