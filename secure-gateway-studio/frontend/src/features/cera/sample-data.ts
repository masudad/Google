import { toCsv } from "./csv";

/** Deterministic PRNG so the demo dataset is identical on every machine. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SAMPLE_FILE_NAME = "cera-sample-chrome-log-events.csv";
export const SAMPLE_CORPORATE_DOMAIN = "example.co.jp";

const HEADERS = [
  "Date",
  "Event",
  "Event description",
  "Actor",
  "Actor org unit name",
  "URL",
  "Tab URL",
  "URL category",
  "Content name",
  "Content type",
  "Content size",
  "Content transfer method",
  "Trigger type",
  "Trigger user",
  "Source",
  "Destination",
  "Event reason",
  "Event result",
  "Triggered rule names",
  "Scan ID",
  "Profile user name",
  "Web app signed-in account",
  "Device name",
  "Device platform",
  "Client type",
  "Browser version",
];

interface SampleUser {
  email: string;
  ou: string;
  persona: "typical" | "ai_heavy" | "personal" | "transfer" | "exec" | "contractor";
  platform: string;
}

const FIRST = [
  "sato",
  "suzuki",
  "takahashi",
  "tanaka",
  "ito",
  "watanabe",
  "yamamoto",
  "nakamura",
  "kobayashi",
  "kato",
  "yoshida",
  "yamada",
  "sasaki",
  "yamaguchi",
  "matsumoto",
  "inoue",
  "kimura",
  "hayashi",
  "shimizu",
  "yamazaki",
  "mori",
  "abe",
  "ikeda",
  "hashimoto",
  "yamashita",
  "ishikawa",
  "nakajima",
  "maeda",
  "fujita",
  "ogawa",
  "goto",
  "okada",
  "hasegawa",
  "murakami",
  "kondo",
  "ishii",
];

const OUS: Array<{ path: string; count: number }> = [
  { path: "/Engineering", count: 9 },
  { path: "/Sales", count: 8 },
  { path: "/Finance", count: 5 },
  { path: "/HR", count: 3 },
  { path: "/Marketing", count: 5 },
  { path: "/Executive", count: 2 },
  { path: "/Contractors", count: 4 },
];

interface Destination {
  host: string;
  path: string;
  category: string;
  weight: number;
  paste?: boolean;
  personal?: boolean;
}

const DESTINATIONS: Destination[] = [
  { host: "drive.google.com", path: "/drive/my-drive", category: "Online Storage", weight: 26 },
  { host: "docs.google.com", path: "/document/d/1x8K/edit", category: "Productivity", weight: 18, paste: true },
  { host: "mail.google.com", path: "/mail/u/0/#inbox", category: "Web Mail", weight: 10 },
  { host: "chat.google.com", path: "/room/AAAA", category: "Messaging", weight: 4, paste: true },
  { host: "chatgpt.com", path: "/c/8f2a", category: "Generative AI", weight: 14, paste: true },
  { host: "claude.ai", path: "/chat/44a1", category: "Generative AI", weight: 5, paste: true },
  { host: "perplexity.ai", path: "/search/new", category: "Generative AI", weight: 3, paste: true },
  { host: "chat.deepseek.com", path: "/", category: "Generative AI", weight: 3, paste: true },
  { host: "gemini.google.com", path: "/app", category: "Generative AI", weight: 9, paste: true },
  { host: "notebooklm.google.com", path: "/notebook/7c1", category: "Generative AI", weight: 3 },
  { host: "web.whatsapp.com", path: "/", category: "Messaging", weight: 3 },
  { host: "line.me", path: "/R/", category: "Messaging", weight: 3, paste: true },
  { host: "discord.com", path: "/channels/@me", category: "Messaging", weight: 2 },
  { host: "web.telegram.org", path: "/k/", category: "Messaging", weight: 1 },
  { host: "wetransfer.com", path: "/", category: "File Sharing", weight: 5 },
  { host: "gigafile.nu", path: "/", category: "File Sharing", weight: 3 },
  { host: "ilovepdf.com", path: "/compress_pdf", category: "Online Tools", weight: 4 },
  { host: "smallpdf.com", path: "/pdf-to-word", category: "Online Tools", weight: 2 },
  { host: "dropbox.com", path: "/home", category: "Online Storage", weight: 4 },
  { host: "mega.nz", path: "/fm", category: "Online Storage", weight: 1 },
  { host: "app.box.com", path: "/folder/0", category: "Online Storage", weight: 3 },
  { host: "pastebin.com", path: "/", category: "Technology", weight: 2, paste: true },
  { host: "github.com", path: "/example-corp/billing-api/issues/42", category: "Technology", weight: 4, paste: true },
  { host: "deepl.com", path: "/translator", category: "Translation", weight: 5, paste: true },
  { host: "translate.google.com", path: "/", category: "Translation", weight: 3, paste: true },
  { host: "notion.so", path: "/workspace/roadmap", category: "Productivity", weight: 3, paste: true },
  { host: "outlook.live.com", path: "/mail/0/", category: "Web Mail", weight: 2 },
  { host: "x.com", path: "/compose/post", category: "Social Networking", weight: 1, paste: true },
  { host: "facebook.com", path: "/", category: "Social Networking", weight: 1 },
  { host: "canva.com", path: "/design/DAF/edit", category: "Productivity", weight: 2 },
  { host: "intranet.example.co.jp", path: "/portal/upload", category: "Business", weight: 8 },
  { host: "kintone.example.co.jp", path: "/k/12/", category: "Business", weight: 4 },
  { host: "example.my.salesforce.com", path: "/lightning/o/Opportunity/list", category: "Business", weight: 5, paste: true },
];

const FILE_NAMES = [
  ["Q3_forecast.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 418_000],
  ["customer_list_2026.csv", "text/csv", 92_000],
  ["contract_draft_v3.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 310_000],
  ["board_deck_oct.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 6_400_000],
  ["invoice_batch_0931.pdf", "application/pdf", 1_250_000],
  ["payroll_export.csv", "text/csv", 64_000],
  ["design_mock_v2.png", "image/png", 2_100_000],
  ["source_bundle.zip", "application/zip", 14_800_000],
  ["meeting_notes.txt", "text/plain", 12_000],
  ["my_number_list.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 220_000],
  ["credit_card_recon.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 150_000],
  ["employee_handbook.pdf", "application/pdf", 3_400_000],
  ["prospect_notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 88_000],
  ["server_config.yaml", "text/yaml", 9_000],
  ["recording_0930.mp4", "video/mp4", 88_000_000],
] as const;

const RULES = [
  "CEP PoC - Credit card numbers - upload",
  "CEP PoC - Japan My Number - upload",
  "CEP PoC - Source code - upload",
  "CEP PoC - Universal upload audit - upload",
  "CEP PoC - Bulk text entry audit - paste",
];

const PLATFORMS = ["Windows 11", "Windows 11", "macOS 15", "ChromeOS", "Windows 10"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatAdminConsoleDate(ts: number): string {
  const local = new Date(ts + 9 * 3_600_000);
  const month = MONTHS[local.getUTCMonth()];
  const day = local.getUTCDate();
  const year = local.getUTCFullYear();
  let hour = local.getUTCHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour %= 12;
  if (hour === 0) hour = 12;
  const minute = String(local.getUTCMinutes()).padStart(2, "0");
  const second = String(local.getUTCSeconds()).padStart(2, "0");
  return `${month} ${day}, ${year}, ${hour}:${minute}:${second} ${ampm} GMT+9`;
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function weighted(rand: () => number, items: readonly Destination[]): Destination {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function buildUsers(rand: () => number): SampleUser[] {
  const users: SampleUser[] = [];
  let index = 0;
  for (const ou of OUS) {
    for (let i = 0; i < ou.count; i += 1) {
      const name = FIRST[index % FIRST.length];
      const email = `${name}.${String.fromCharCode(97 + (index % 26))}@${SAMPLE_CORPORATE_DOMAIN}`;
      let persona: SampleUser["persona"] = "typical";
      if (ou.path === "/Executive") persona = "exec";
      else if (ou.path === "/Contractors") persona = "contractor";
      else if (ou.path === "/Engineering" && i < 3) persona = "ai_heavy";
      else if (ou.path === "/Sales" && i < 2) persona = "transfer";
      else if ((ou.path === "/Marketing" || ou.path === "/HR") && i === 0) persona = "personal";
      users.push({ email, ou: ou.path, persona, platform: pick(rand, PLATFORMS) });
      index += 1;
    }
  }
  return users;
}

interface SampleRow {
  ts: number;
  cells: string[];
}

export interface SampleOptions {
  now?: number;
  seed?: number;
}

/**
 * Generates a 7-day Admin Console style Chrome log events export (~1,400
 * rows) with multi-row DLP events, personal Google account uploads, Shadow AI
 * pastes, web messaging, unmanaged cloud apps, downloads, prints, and
 * security signals so every CERA slide has data.
 */
export function generateSampleCsv(options: SampleOptions = {}): string {
  const now = options.now ?? Date.UTC(2026, 9, 7, 9, 0, 0);
  const rand = mulberry32(options.seed ?? 20261007);
  const users = buildUsers(rand);
  const rows: SampleRow[] = [];
  let scanCounter = 48_000;

  const dayStartUtc = (dayOffset: number) => {
    const localNow = new Date(now + 9 * 3_600_000);
    const localMidnight = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());
    return localMidnight - 9 * 3_600_000 - dayOffset * 86_400_000;
  };

  const push = (ts: number, cells: Record<string, string>) => {
    rows.push({ ts, cells: HEADERS.map((header) => cells[header] ?? "") });
  };

  const baseCells = (user: SampleUser, ts: number): Record<string, string> => ({
    Date: formatAdminConsoleDate(ts),
    Actor: user.email,
    "Actor org unit name": user.ou,
    "Profile user name": user.email,
    "Device name": `${user.ou.slice(1, 4).toUpperCase()}-LT-${String(users.indexOf(user) + 101)}`,
    "Device platform": user.platform,
    "Client type": "Chrome Browser",
    "Browser version": pick(rand, ["131.0.6778.86", "131.0.6778.140", "132.0.6834.57"]),
  });

  const businessHourTs = (dayStart: number, offHoursBias: number) => {
    const offHours = rand() < offHoursBias;
    const hour = offHours ? (rand() < 0.5 ? 6 + rand() * 2 : 20 + rand() * 4) : 9 + rand() * 10;
    return Math.floor(dayStart + hour * 3_600_000 + rand() * 60_000);
  };

  const emitTransfer = (
    user: SampleUser,
    ts: number,
    dest: Destination,
    opts: { paste?: boolean; personal?: boolean; sensitive?: boolean; result?: string; download?: boolean },
  ) => {
    const paste = opts.paste ?? false;
    const [fileName, mime, size] = pick(rand, FILE_NAMES);
    const url = `https://${dest.host}${dest.path}`;
    const signedIn = opts.personal ? `${user.email.split("@")[0]}.private@gmail.com` : "";
    const sensitive = opts.sensitive ?? false;
    const result = opts.result ?? "ALLOWED";
    const scanId = `scan-${scanCounter++}`;
    const trigger = opts.download ? "FILE_DOWNLOAD" : paste ? "WEB_CONTENT_UPLOAD" : "FILE_UPLOAD";
    const method = opts.download ? "Download" : paste ? "Paste" : "Drag and drop";
    const common = {
      ...baseCells(user, ts),
      URL: url,
      "Tab URL": url,
      "URL category": dest.category,
      "Content name": paste ? "" : fileName,
      "Content type": paste ? "text/plain" : mime,
      "Content size": paste ? String(Math.floor(400 + rand() * 6000)) : String(size),
      "Content transfer method": method,
      "Trigger type": trigger,
      "Trigger user": user.email,
      Source: opts.download ? url : "",
      Destination: opts.download ? "" : url,
      "Event result": result,
      "Scan ID": scanId,
      "Web app signed-in account": signedIn,
      "Profile user name": opts.personal && rand() < 0.5 ? signedIn : user.email,
    };
    push(ts, {
      ...common,
      Event: "CONTENT_TRANSFER",
      "Event description": opts.download ? "Content downloaded" : paste ? "Text pasted" : "File uploaded",
      "Event reason": sensitive ? "DLP_SCAN_PENDING" : "",
    });
    if (sensitive) {
      const ruleCount = rand() < 0.3 ? 2 : 1;
      for (let i = 0; i < ruleCount; i += 1) {
        const rule = paste ? RULES[4] : pick(rand, RULES.slice(0, 4));
        push(ts + 800 + i * 1_200, {
          ...common,
          Event: "SENSITIVE_DATA_TRANSFER",
          "Event description": "Sensitive data detected",
          "Event reason": "DLP_RULE_TRIGGERED",
          "Triggered rule names": rule,
        });
      }
    }
  };

  for (let day = 6; day >= 0; day -= 1) {
    const dayStart = dayStartUtc(day);
    const weekday = new Date(dayStart + 9 * 3_600_000).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const spikeDay = day === 2;

    for (const user of users) {
      let volume = weekend ? 1 + rand() * 2 : 4 + rand() * 5;
      if (user.persona === "ai_heavy") volume += 4;
      if (user.persona === "transfer") volume += spikeDay ? 18 : 3;
      if (user.persona === "exec") volume -= 1;
      if (user.persona === "contractor") volume += 2;
      const actions = Math.max(0, Math.round(volume));

      for (let i = 0; i < actions; i += 1) {
        const ts = businessHourTs(dayStart, user.persona === "contractor" ? 0.3 : 0.12);
        let dest = weighted(rand, DESTINATIONS);
        if (user.persona === "ai_heavy" && rand() < 0.5) dest = pick(rand, DESTINATIONS.filter((d) => d.category === "Generative AI"));
        if (user.persona === "transfer" && rand() < 0.55) {
          dest = pick(
            rand,
            DESTINATIONS.filter((d) => ["wetransfer.com", "gigafile.nu", "dropbox.com", "mega.nz", "ilovepdf.com"].includes(d.host)),
          );
        }
        if (user.persona === "contractor" && rand() < 0.35) {
          dest = pick(rand, DESTINATIONS.filter((d) => ["pastebin.com", "github.com", "chatgpt.com", "discord.com"].includes(d.host)));
        }
        const paste = dest.paste ? rand() < 0.65 : false;
        const personal =
          (user.persona === "personal" && dest.host.endsWith("google.com") && rand() < 0.7) ||
          (user.persona !== "personal" && dest.host === "drive.google.com" && rand() < 0.07) ||
          dest.host === "outlook.live.com";
        const sensitive =
          (!paste && rand() < 0.22) ||
          (paste && dest.category === "Generative AI" && rand() < 0.3) ||
          (paste && rand() < 0.08);
        let result = "ALLOWED";
        if (sensitive) {
          const roll = rand();
          if (dest.category === "Generative AI" && roll < 0.35) result = "WARNED";
          else if (roll < 0.12) result = "BLOCKED";
          else if (roll < 0.2) result = "BYPASSED";
          else if (roll < 0.28) result = "WARNED";
        }
        emitTransfer(user, ts, dest, { paste, personal, sensitive, result });
      }

      // Inbound downloads.
      const downloads = weekend ? (rand() < 0.3 ? 1 : 0) : Math.round(1 + rand() * 2);
      for (let i = 0; i < downloads; i += 1) {
        const ts = businessHourTs(dayStart, 0.1);
        const dest = weighted(rand, DESTINATIONS);
        const roll = rand();
        if (roll < 0.03) {
          const url = `https://${pick(rand, ["cdn-updates-free.net", "drv-share-files.com", "mega.nz"])}/dl/${Math.floor(rand() * 9999)}`;
          push(ts, {
            ...baseCells(user, ts),
            Event: "MALWARE_TRANSFER",
            "Event description": "Malware detected in download",
            URL: url,
            "Tab URL": url,
            "URL category": "File Sharing",
            "Content name": pick(rand, ["setup_tool.exe", "invoice_0931.zip", "Driver_Update.msi"]),
            "Content type": "application/octet-stream",
            "Content size": String(Math.floor(1_000_000 + rand() * 50_000_000)),
            "Content transfer method": "Download",
            "Trigger type": "FILE_DOWNLOAD",
            "Trigger user": user.email,
            Source: url,
            "Event reason": "MALWARE",
            "Event result": rand() < 0.8 ? "BLOCKED" : "WARNED",
            "Scan ID": `scan-${scanCounter++}`,
          });
          continue;
        }
        if (roll < 0.08) {
          const url = `https://${dest.host}${dest.path}`;
          push(ts, {
            ...baseCells(user, ts),
            Event: "CONTENT_UNSCANNED",
            "Event description": "File too large to scan",
            URL: url,
            "Tab URL": url,
            "URL category": dest.category,
            "Content name": "archive_backup.7z",
            "Content type": "application/x-7z-compressed",
            "Content size": String(Math.floor(60_000_000 + rand() * 300_000_000)),
            "Content transfer method": "Download",
            "Trigger type": "FILE_DOWNLOAD",
            "Trigger user": user.email,
            Source: url,
            "Event reason": "FILE_TOO_LARGE",
            "Event result": "ALLOWED",
            "Scan ID": `scan-${scanCounter++}`,
          });
          continue;
        }
        emitTransfer(user, ts, dest, { download: true, sensitive: rand() < 0.12 });
      }

      // Prints.
      if (!weekend && rand() < (user.persona === "exec" ? 0.6 : 0.22)) {
        const ts = businessHourTs(dayStart, 0.05);
        const dest = pick(
          rand,
          DESTINATIONS.filter((d) => ["docs.google.com", "intranet.example.co.jp", "example.my.salesforce.com", "mail.google.com"].includes(d.host)),
        );
        const url = `https://${dest.host}${dest.path}`;
        const sensitive = rand() < 0.3;
        const common = {
          ...baseCells(user, ts),
          URL: url,
          "Tab URL": url,
          "URL category": dest.category,
          "Content name": pick(rand, ["Customer contract.pdf", "Salary review.docx", "Pipeline Q4.pdf", "Travel policy.pdf"]),
          "Content type": "application/pdf",
          "Content size": String(Math.floor(50_000 + rand() * 900_000)),
          "Content transfer method": "Print",
          "Trigger type": "PAGE_PRINT",
          "Trigger user": user.email,
          Source: url,
          "Event result": sensitive && rand() < 0.3 ? "WARNED" : "ALLOWED",
          "Scan ID": `scan-${scanCounter++}`,
        };
        push(ts, { ...common, Event: "CONTENT_TRANSFER", "Event description": "Page printed" });
        if (sensitive) {
          push(ts + 900, {
            ...common,
            Event: "SENSITIVE_DATA_TRANSFER",
            "Event description": "Sensitive data detected",
            "Event reason": "DLP_RULE_TRIGGERED",
            "Triggered rule names": "CEP PoC - Japan My Number - print",
          });
        }
      }

      // Security signals.
      if (!weekend && rand() < 0.9) {
        const ts = Math.floor(dayStart + (8.3 + rand() * 1.5) * 3_600_000);
        push(ts, { ...baseCells(user, ts), Event: "BROWSER_LAUNCH", "Event description": "Browser launched" });
      }
      if (!weekend && rand() < 0.4) {
        const ts = businessHourTs(dayStart, 0.1);
        const url = `https://${pick(rand, ["example.my.salesforce.com", "login.microsoftonline.com", "accounts.google.com", "app.box.com"])}/login`;
        push(ts, {
          ...baseCells(user, ts),
          Event: "LOGIN_EVENT",
          "Event description": "Login detected",
          URL: url,
          "Tab URL": url,
          "Web app signed-in account": user.email,
          "Event result": "ALLOWED",
        });
      }
      if (rand() < 0.035) {
        const ts = businessHourTs(dayStart, 0.2);
        const url = `https://${pick(rand, ["secure-login-update.com", "example-co-jp-sso.net", "office365-verify.info"])}/signin`;
        push(ts, {
          ...baseCells(user, ts),
          Event: "PASSWORD_REUSE",
          "Event description": "Corporate password reused",
          URL: url,
          "Tab URL": url,
          "URL category": "Phishing",
          "Event result": rand() < 0.5 ? "WARNED" : "ALLOWED",
        });
      }
      if (rand() < 0.05) {
        const ts = businessHourTs(dayStart, 0.2);
        const url = `https://${pick(rand, ["free-pdf-tools.xyz", "video-dl-express.net", "crack-keygen-hub.top", "secure-login-update.com"])}/`;
        push(ts, {
          ...baseCells(user, ts),
          Event: "UNSAFE_SITE_VISIT",
          "Event description": "Unsafe site visited",
          URL: url,
          "Tab URL": url,
          "URL category": "Malware",
          "Event reason": "MALWARE",
          "Event result": rand() < 0.7 ? "BLOCKED" : "BYPASSED",
        });
      }
      if (rand() < 0.04) {
        const ts = businessHourTs(dayStart, 0.1);
        const ext = pick(rand, [
          ["Grammar Helper Pro", "abcdefghijklmnopabcdefghijklmnop"],
          ["Screen Recorder Lite", "bcdefghijklmnopqbcdefghijklmnopq"],
          ["AI Summarizer", "cdefghijklmnopqrcdefghijklmnopqr"],
          ["Coupon Finder", "defghijklmnopqrsdefghijklmnopqrs"],
        ]);
        push(ts, {
          ...baseCells(user, ts),
          Event: "EXTENSION_INSTALL",
          "Event description": `Extension installed: ${ext[0]} (${ext[1]})`,
          "Content name": ext[0],
          URL: `https://chromewebstore.google.com/detail/${ext[1]}`,
          "Event result": "ALLOWED",
        });
      }
      if (rand() < 0.03) {
        const ts = businessHourTs(dayStart, 0.1);
        const url = "https://notallowed-streaming.example.net/";
        push(ts, {
          ...baseCells(user, ts),
          Event: "URL_FILTERING_INTERSTITIAL",
          "Event description": "URL blocked by policy",
          URL: url,
          "Tab URL": url,
          "URL category": "Streaming Media",
          "Event result": "BLOCKED",
        });
      }
    }
  }

  rows.sort((a, b) => a.ts - b.ts);
  return toCsv(HEADERS, rows.map((row) => row.cells));
}
