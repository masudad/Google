import type { UrlCategory } from "./types";

/** Multi-label public suffixes that matter for the tenants we typically see. */
const MULTI_LABEL_SUFFIXES = new Set([
  "co.jp",
  "ne.jp",
  "or.jp",
  "ac.jp",
  "go.jp",
  "ad.jp",
  "ed.jp",
  "gr.jp",
  "lg.jp",
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "me.uk",
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "gov.au",
  "com.br",
  "com.cn",
  "com.hk",
  "com.sg",
  "com.tw",
  "com.my",
  "com.ph",
  "com.vn",
  "co.kr",
  "or.kr",
  "co.in",
  "co.nz",
  "co.th",
  "co.id",
  "co.za",
  "com.mx",
  "com.ar",
  "com.tr",
  "co.il",
]);

export function normalizeHost(input: string): string {
  let host = input.trim().toLowerCase();
  if (host === "") return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(host)) {
    host = `http://${host}`;
  }
  try {
    const url = new URL(host);
    host = url.hostname;
  } catch {
    host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split(/[/?#]/)[0] ?? "";
    host = host.replace(/^[^@]*@/, "").replace(/:\d+$/, "");
  }
  host = host.replace(/\.$/, "");
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}

export function hostFromUrl(url: string): string {
  if (!url) return "";
  return normalizeHost(url);
}

export function registrableDomain(host: string): string {
  const clean = normalizeHost(host);
  if (!clean) return "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean) || clean.includes(":")) return clean;
  const labels = clean.split(".");
  if (labels.length <= 2) return clean;
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_LABEL_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }
  return lastTwo;
}

export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1) return "";
  return email
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/[>)\]]+$/, "");
}

export function normalizeDomainList(raw: string | string[]): string[] {
  const parts = Array.isArray(raw) ? raw : raw.split(/[\s,;、，]+/);
  const out: string[] = [];
  for (const part of parts) {
    const host = normalizeHost(part.replace(/^\*\./, "").replace(/^@/, ""));
    if (host && !out.includes(host)) out.push(host);
  }
  return out;
}

/** True when `host` equals `pattern` or is a subdomain of it. */
export function hostMatches(host: string, pattern: string): boolean {
  if (!host || !pattern) return false;
  if (host === pattern) return true;
  return host.endsWith(`.${pattern}`);
}

export function hostMatchesAny(host: string, patterns: readonly string[]): boolean {
  for (const pattern of patterns) {
    if (hostMatches(host, pattern)) return true;
  }
  return false;
}

export const CONSUMER_IDENTITY_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.jp",
  "ymail.com",
  "outlook.com",
  "outlook.jp",
  "hotmail.com",
  "hotmail.co.jp",
  "live.com",
  "live.jp",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "docomo.ne.jp",
  "ezweb.ne.jp",
  "au.com",
  "softbank.ne.jp",
  "i.softbank.jp",
  "nifty.com",
  "biglobe.ne.jp",
  "so-net.ne.jp",
  "excite.co.jp",
  "goo.jp",
  "naver.com",
  "daum.net",
  "qq.com",
  "163.com",
  "126.com",
  "mail.ru",
  "yandex.ru",
  "gmx.com",
  "gmx.de",
  "zoho.com",
];

export const GENAI_HOSTS: readonly string[] = [
  "chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "sora.com",
  "claude.ai",
  "anthropic.com",
  "gemini.google.com",
  "bard.google.com",
  "aistudio.google.com",
  "notebooklm.google.com",
  "labs.google",
  "copilot.microsoft.com",
  "copilot.cloud.microsoft",
  "m365.cloud.microsoft",
  "perplexity.ai",
  "poe.com",
  "character.ai",
  "midjourney.com",
  "huggingface.co",
  "you.com",
  "deepseek.com",
  "mistral.ai",
  "groq.com",
  "cohere.com",
  "jasper.ai",
  "writesonic.com",
  "copy.ai",
  "quillbot.com",
  "grammarly.com",
  "grok.com",
  "x.ai",
  "meta.ai",
  "kimi.com",
  "moonshot.cn",
  "qwen.ai",
  "tongyi.aliyun.com",
  "yiyan.baidu.com",
  "manus.im",
  "genspark.ai",
  "felo.ai",
  "replika.com",
  "pi.ai",
  "inflection.ai",
  "leonardo.ai",
  "stability.ai",
  "runwayml.com",
  "elevenlabs.io",
  "otter.ai",
  "fireflies.ai",
  "tldv.io",
  "notion.ai",
  "gamma.app",
  "tome.app",
  "beautiful.ai",
  "chatpdf.com",
  "humata.ai",
  "scite.ai",
  "consensus.app",
  "elicit.com",
  "cursor.com",
  "cursor.sh",
  "codeium.com",
  "windsurf.com",
  "tabnine.com",
  "replit.com",
  "lovable.dev",
  "bolt.new",
  "v0.dev",
  "chatglm.cn",
  "doubao.com",
  "rinna.co.jp",
  "tenbin.ai",
  "ai-chat.jp",
];

export const DEFAULT_SANCTIONED_AI_HOSTS: readonly string[] = [
  "gemini.google.com",
  "notebooklm.google.com",
];

export const MESSAGING_HOSTS: readonly string[] = [
  "web.whatsapp.com",
  "whatsapp.com",
  "web.telegram.org",
  "telegram.org",
  "t.me",
  "discord.com",
  "discordapp.com",
  "discord.gg",
  "messenger.com",
  "line.me",
  "line.biz",
  "chat.line.biz",
  "slack.com",
  "signal.org",
  "wechat.com",
  "web.wechat.com",
  "weixin.qq.com",
  "kakao.com",
  "kakaocorp.com",
  "skype.com",
  "web.skype.com",
  "viber.com",
  "chatwork.com",
  "teams.live.com",
  "snapchat.com",
  "web.snapchat.com",
  "wire.com",
  "element.io",
  "matrix.org",
  "rocket.chat",
  "mattermost.com",
  "zalo.me",
  "imo.im",
  "band.us",
];

export interface SanctionedPreset {
  id: string;
  label: string;
  hosts: readonly string[];
}

export const SANCTIONED_PRESETS: readonly SanctionedPreset[] = [
  {
    id: "google_workspace",
    label: "Google Workspace",
    hosts: [
      "drive.google.com",
      "docs.google.com",
      "sheets.google.com",
      "slides.google.com",
      "mail.google.com",
      "meet.google.com",
      "chat.google.com",
      "calendar.google.com",
      "sites.google.com",
      "forms.google.com",
      "keep.google.com",
      "groups.google.com",
      "contacts.google.com",
      "admin.google.com",
      "workspace.google.com",
      "classroom.google.com",
      "console.cloud.google.com",
      "storage.cloud.google.com",
      "script.google.com",
      "lookerstudio.google.com",
      "appsheet.com",
    ],
  },
  {
    id: "microsoft_365",
    label: "Microsoft 365",
    hosts: [
      "office.com",
      "microsoft365.com",
      "cloud.microsoft",
      "sharepoint.com",
      "teams.microsoft.com",
      "outlook.office.com",
      "outlook.office365.com",
      "login.microsoftonline.com",
      "onedrive.com",
      "forms.office.com",
      "powerbi.com",
      "dynamics.com",
    ],
  },
  { id: "box", label: "Box", hosts: ["box.com", "boxcloud.com"] },
  { id: "slack", label: "Slack", hosts: ["slack.com", "slack-edge.com"] },
  { id: "zoom", label: "Zoom", hosts: ["zoom.us", "zoom.com"] },
  { id: "salesforce", label: "Salesforce", hosts: ["salesforce.com", "force.com", "salesforce-sites.com"] },
  { id: "dropbox", label: "Dropbox", hosts: ["dropbox.com", "dropboxusercontent.com"] },
  { id: "atlassian", label: "Atlassian", hosts: ["atlassian.net", "atlassian.com", "jira.com", "bitbucket.org"] },
  { id: "github", label: "GitHub", hosts: ["github.com", "githubusercontent.com"] },
  { id: "servicenow", label: "ServiceNow", hosts: ["service-now.com", "servicenow.com"] },
  { id: "notion", label: "Notion", hosts: ["notion.so", "notion.site"] },
  { id: "workday", label: "Workday", hosts: ["myworkday.com", "workday.com"] },
  { id: "cybozu", label: "kintone / Cybozu", hosts: ["cybozu.com", "kintone.com"] },
  { id: "chatwork", label: "Chatwork", hosts: ["chatwork.com"] },
  { id: "lineworks", label: "LINE WORKS", hosts: ["worksmobile.com", "lineworks.com"] },
  { id: "adobe", label: "Adobe", hosts: ["adobe.com", "adobe.io"] },
  { id: "docusign", label: "DocuSign", hosts: ["docusign.net", "docusign.com"] },
  { id: "figma", label: "Figma", hosts: ["figma.com"] },
  { id: "miro", label: "Miro", hosts: ["miro.com"] },
  { id: "canva", label: "Canva", hosts: ["canva.com"] },
  { id: "zendesk", label: "Zendesk", hosts: ["zendesk.com"] },
  { id: "hubspot", label: "HubSpot", hosts: ["hubspot.com"] },
  { id: "freee", label: "freee", hosts: ["freee.co.jp"] },
  { id: "moneyforward", label: "Money Forward", hosts: ["moneyforward.com"] },
  { id: "smarthr", label: "SmartHR", hosts: ["smarthr.jp"] },
  { id: "sansan", label: "Sansan", hosts: ["sansan.com"] },
];

const GOOGLE_WORKSPACE_HOSTS = SANCTIONED_PRESETS[0].hosts;

const CLOUD_STORAGE_HOSTS: readonly string[] = [
  "drive.google.com",
  "dropbox.com",
  "box.com",
  "onedrive.live.com",
  "1drv.ms",
  "sharepoint.com",
  "icloud.com",
  "mega.nz",
  "mega.io",
  "mediafire.com",
  "pcloud.com",
  "sync.com",
  "disk.yandex.com",
  "disk.yandex.ru",
  "pan.baidu.com",
  "s3.amazonaws.com",
  "storage.googleapis.com",
  "blob.core.windows.net",
  "degoo.com",
  "icedrive.net",
  "koofr.net",
  "terabox.com",
  "4shared.com",
  "zippyshare.com",
];

const FILE_TRANSFER_HOSTS: readonly string[] = [
  "wetransfer.com",
  "we.tl",
  "sendanywhere.com",
  "send-anywhere.com",
  "gigafile.nu",
  "firestorage.jp",
  "datadeliver.net",
  "bitsend.jp",
  "filemail.com",
  "transfernow.net",
  "fromsmash.com",
  "file.io",
  "transfer.sh",
  "dropmefiles.com",
  "tmpfiles.org",
  "sendgb.com",
  "pixeldrain.com",
  "gofile.io",
  "anonfiles.com",
  "catbox.moe",
  "filetransfer.io",
  "swisstransfer.com",
  "ufile.io",
  "easyupload.io",
  "limewire.com",
  "jumpshare.com",
  "hightail.com",
  "wormhole.app",
  "toffeeshare.com",
  "myairbridge.com",
  "xgf.nu",
  "okurin.bitpark.co.jp",
  "oshiete.goo.ne.jp",
];

const CONVERTER_HOSTS: readonly string[] = [
  "ilovepdf.com",
  "iloveimg.com",
  "smallpdf.com",
  "pdf2go.com",
  "convertio.co",
  "cloudconvert.com",
  "zamzar.com",
  "online-convert.com",
  "pdfcandy.com",
  "sodapdf.com",
  "pdf24.org",
  "freeconvert.com",
  "online2pdf.com",
  "pdf.io",
  "tinypng.com",
  "compressjpeg.com",
  "remove.bg",
  "photopea.com",
  "pdfescape.com",
  "sejda.com",
  "combinepdf.com",
  "docupub.com",
  "pdfforge.org",
  "lightpdf.com",
  "pdfsimpli.com",
  "hipdf.com",
  "aconvert.com",
  "ocr.space",
  "onlineocr.net",
  "i2ocr.com",
  "pdftoexcel.com",
  "pdf2doc.com",
  "squoosh.app",
  "veed.io",
  "kapwing.com",
  "123apps.com",
  "cdkm.com",
];

const WEBMAIL_HOSTS: readonly string[] = [
  "mail.google.com",
  "outlook.live.com",
  "outlook.office.com",
  "mail.yahoo.com",
  "mail.yahoo.co.jp",
  "proton.me",
  "protonmail.com",
  "mail.aol.com",
  "mail.ru",
  "gmx.com",
  "gmx.net",
  "mail.zoho.com",
  "mail.goo.ne.jp",
  "webmail.nifty.com",
  "webmail.biglobe.ne.jp",
  "mail.excite.co.jp",
  "mail.naver.com",
  "mail.daum.net",
  "mail.qq.com",
  "mail.163.com",
  "mail.126.com",
  "fastmail.com",
  "tutanota.com",
  "tuta.com",
  "hey.com",
  "icloud.com",
];

const SOCIAL_HOSTS: readonly string[] = [
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "tiktok.com",
  "reddit.com",
  "pinterest.com",
  "threads.net",
  "youtube.com",
  "note.com",
  "ameblo.jp",
  "mixi.jp",
  "tumblr.com",
  "bsky.app",
  "mastodon.social",
  "weibo.com",
  "vk.com",
  "nicovideo.jp",
  "pixiv.net",
  "hatena.ne.jp",
  "hatenablog.com",
  "qiita.com",
  "zenn.dev",
  "medium.com",
  "quora.com",
  "yahoo.co.jp",
];

const DEV_CODE_HOSTS: readonly string[] = [
  "github.com",
  "gist.github.com",
  "gitlab.com",
  "bitbucket.org",
  "pastebin.com",
  "jsfiddle.net",
  "codepen.io",
  "stackoverflow.com",
  "stackblitz.com",
  "codesandbox.io",
  "npmjs.com",
  "pypi.org",
  "hub.docker.com",
  "colab.research.google.com",
  "kaggle.com",
  "paste.ee",
  "hastebin.com",
  "ghostbin.me",
  "jsbin.com",
  "glitch.com",
  "vercel.app",
  "netlify.app",
  "dpaste.org",
  "codeshare.io",
  "ideone.com",
  "onlinegdb.com",
  "jsonformatter.org",
  "jsonlint.com",
  "regex101.com",
  "base64decode.org",
  "jwt.io",
  "cyberchef.io",
  "gchq.github.io",
  "diffchecker.com",
  "text-compare.com",
  "sqlfiddle.com",
  "dbfiddle.uk",
  "postman.com",
  "swagger.io",
  "ngrok.io",
  "ngrok-free.app",
  "requestbin.com",
  "webhook.site",
  "pipedream.net",
];

const TRANSLATION_HOSTS: readonly string[] = [
  "translate.google.com",
  "translate.google.co.jp",
  "deepl.com",
  "papago.naver.com",
  "bing.com",
  "translate.yandex.com",
  "reverso.net",
  "weblio.jp",
  "miraitranslate.com",
  "translator.microsoft.com",
  "lingvanex.com",
  "systransoft.com",
  "yarakuzen.com",
  "t-4oo.com",
  "excite.co.jp",
];

const PRODUCTIVITY_HOSTS: readonly string[] = [
  "notion.so",
  "notion.site",
  "evernote.com",
  "trello.com",
  "asana.com",
  "monday.com",
  "airtable.com",
  "clickup.com",
  "todoist.com",
  "miro.com",
  "figma.com",
  "canva.com",
  "lucidchart.com",
  "lucid.app",
  "office.com",
  "microsoft365.com",
  "sharepoint.com",
  "teams.microsoft.com",
  "zoom.us",
  "calendly.com",
  "typeform.com",
  "surveymonkey.com",
  "smartsheet.com",
  "dropbox.com",
  "box.com",
  "coda.io",
  "quip.com",
  "loom.com",
  "prezi.com",
  "mentimeter.com",
  "slido.com",
  "whimsical.com",
  "mural.co",
  "docusign.net",
  "docusign.com",
  "cloudsign.jp",
  "adobe.com",
  "backlog.com",
  "backlog.jp",
  "esa.io",
  "kibe.la",
  "scrapbox.io",
  "cosense.io",
];

const BUSINESS_SAAS_HOSTS: readonly string[] = [
  "salesforce.com",
  "force.com",
  "hubspot.com",
  "zendesk.com",
  "service-now.com",
  "servicenow.com",
  "myworkday.com",
  "workday.com",
  "sap.com",
  "successfactors.com",
  "oracle.com",
  "oraclecloud.com",
  "atlassian.net",
  "atlassian.com",
  "freshdesk.com",
  "intercom.com",
  "cybozu.com",
  "kintone.com",
  "freee.co.jp",
  "moneyforward.com",
  "smarthr.jp",
  "bakuraku.jp",
  "sansan.com",
  "worksmobile.com",
  "chatwork.com",
  "concur.com",
  "concursolutions.com",
  "zuora.com",
  "netsuite.com",
  "tableau.com",
  "powerbi.com",
  "looker.com",
  "snowflake.com",
  "databricks.com",
  "okta.com",
  "onelogin.com",
  "jobcan.jp",
  "kaonavi.jp",
  "talentio.com",
  "hrmos.co",
  "obic7.com",
  "biztex.co.jp",
  "ntt.com",
  "ricoh.com",
  "fujifilm.com",
  "canon.jp",
];

interface CategoryRule {
  category: UrlCategory;
  hosts: readonly string[];
}

const CATEGORY_RULES: readonly CategoryRule[] = [
  { category: "genai", hosts: GENAI_HOSTS },
  { category: "messaging", hosts: MESSAGING_HOSTS },
  { category: "file_transfer", hosts: FILE_TRANSFER_HOSTS },
  { category: "converter", hosts: CONVERTER_HOSTS },
  { category: "webmail", hosts: WEBMAIL_HOSTS },
  { category: "google_workspace", hosts: GOOGLE_WORKSPACE_HOSTS },
  { category: "cloud_storage", hosts: CLOUD_STORAGE_HOSTS },
  { category: "social", hosts: SOCIAL_HOSTS },
  { category: "dev_code", hosts: DEV_CODE_HOSTS },
  { category: "translation", hosts: TRANSLATION_HOSTS },
  { category: "productivity", hosts: PRODUCTIVITY_HOSTS },
  { category: "business_saas", hosts: BUSINESS_SAAS_HOSTS },
];

/** Categories that are treated as elevated risk in the unmanaged cloud slide. */
export const HIGH_RISK_CATEGORIES: readonly UrlCategory[] = [
  "file_transfer",
  "converter",
  "webmail",
  "dev_code",
  "social",
];

const ADMIN_CATEGORY_HINTS: Array<[RegExp, UrlCategory]> = [
  [/gen(erative)?\s*ai|chat\s*bot|llm|人工知能|生成\s*ai/i, "genai"],
  [/messag|chat|instant|メッセージ|チャット/i, "messaging"],
  [/file\s*(transfer|shar)|ファイル(転送|共有)/i, "file_transfer"],
  [/convert|変換/i, "converter"],
  [/storage|backup|ストレージ|バックアップ/i, "cloud_storage"],
  [/web\s*mail|e-?mail|メール/i, "webmail"],
  [/social|sns|ソーシャル|blog|forum|掲示板/i, "social"],
  [/develop|code|git|software|開発|プログラミング/i, "dev_code"],
  [/translat|翻訳/i, "translation"],
  [/productiv|collaborat|office|生産性|オフィス/i, "productivity"],
  [/business|saas|crm|erp|hr|finance|ビジネス|業務/i, "business_saas"],
];

export function categorizeHost(
  host: string,
  extraGenAiHosts: readonly string[] = [],
  extraMessagingHosts: readonly string[] = [],
  adminCategory = "",
): UrlCategory {
  if (!host) return "other";
  if (hostMatchesAny(host, extraGenAiHosts)) return "genai";
  if (hostMatchesAny(host, extraMessagingHosts)) return "messaging";
  for (const rule of CATEGORY_RULES) {
    if (hostMatchesAny(host, rule.hosts)) return rule.category;
  }
  if (adminCategory) {
    for (const [pattern, category] of ADMIN_CATEGORY_HINTS) {
      if (pattern.test(adminCategory)) return category;
    }
  }
  return "other";
}

export function isGoogleOwnedHost(host: string): boolean {
  return (
    hostMatches(host, "google.com") ||
    hostMatches(host, "googleusercontent.com") ||
    hostMatches(host, "youtube.com") ||
    hostMatches(host, "gstatic.com") ||
    hostMatches(host, "google.co.jp") ||
    hostMatches(host, "blogger.com") ||
    hostMatches(host, "googleapis.com")
  );
}

export function isConsumerIdentityDomain(domain: string): boolean {
  return hostMatchesAny(domain, CONSUMER_IDENTITY_DOMAINS);
}
