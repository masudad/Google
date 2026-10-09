import type { Locale } from "../../lib/setup-state";
import type {
  Channel,
  EasyPocPreset,
  EventResult,
  RoadmapHorizon,
  TriggerType,
  UrlCategory,
} from "./types";

export interface RoadmapCopy {
  title: string;
  rationale: (metric: number, users: number) => string;
  actions: readonly string[];
}

export interface CeraMessages {
  page: {
    eyebrow: string;
    title: string;
    intro: string;
    localBadge: string;
    steps: readonly [string, string, string];
    stepHints: readonly [string, string, string];
    back: string;
    next: string;
    analyze: string;
    reanalyze: string;
    analyzing: string;
  };
  ingest: {
    title: string;
    intro: string;
    dropTitle: string;
    dropHint: string;
    browse: string;
    sample: string;
    sampleHint: string;
    exportTitle: string;
    exportSteps: readonly string[];
    exportLink: string;
    helpLink: string;
    auditLink: string;
    filesTitle: string;
    fileHeaders: readonly [string, string, string, string, string];
    remove: string;
    clearAll: string;
    empty: string;
    readError: (name: string) => string;
    noRows: (name: string) => string;
    totalRows: (rows: number, events: number) => string;
    /** Live fetch through the signed-in Workspace administrator (extension build only). */
    autoFetch: string;
    autoFetchHint: string;
    autoFetchPeriod: string;
    autoFetchDays: (days: number) => string;
    autoFetchRunning: string;
    autoFetchProgress: (pages: number, events: number) => string;
    autoFetchCancel: string;
    autoFetchDone: (events: number, days: number) => string;
    autoFetchEmpty: (days: number) => string;
    autoFetchCancelled: (events: number) => string;
    autoFetchConsent: string;
    autoFetchSignIn: string;
    autoFetchFailed: (message: string) => string;
    autoFetchPrivilegeHint: string;
    autoFetchFileName: (from: string, to: string) => string;
  };
  mapping: {
    title: string;
    intro: string;
    autoMapped: (mapped: number, total: number) => string;
    unmapped: string;
    ignore: string;
    required: string;
    missing: (columns: string) => string;
    columnLabels: Record<string, string>;
    reset: string;
  };
  settings: {
    title: string;
    intro: string;
    corporateDomains: string;
    corporateDomainsHint: string;
    suggested: string;
    use: string;
    partnerDomains: string;
    partnerDomainsHint: string;
    sanctionedAi: string;
    sanctionedAiHint: string;
    sanctionedSuites: string;
    sanctionedSuitesHint: string;
    quickAdd: string;
    extraGenAi: string;
    extraGenAiHint: string;
    extraMessaging: string;
    extraMessagingHint: string;
    workHours: string;
    workHoursHint: string;
    timezone: string;
    timezoneHint: string;
    mask: string;
    maskHint: string;
    deckLanguage: string;
    reportTitle: string;
    reportTitlePlaceholder: string;
    customer: string;
    customerPlaceholder: string;
    listPlaceholder: string;
  };
  report: {
    title: string;
    intro: (events: number, actions: number, days: number) => string;
    period: string;
    noData: string;
    exportTitle: string;
    exportDeck: string;
    exportDeckHint: string;
    exportCsv: string;
    exportJson: string;
    applyInEasyPoc: string;
    applyHint: string;
    kpis: {
      outbound: string;
      threat: string;
      threatUsers: string;
      sensitive: string;
      shadowAi: string;
      personal: string;
      unmanaged: string;
      messaging: string;
      downloads: string;
      prints: string;
      blocked: string;
      users: string;
      destinations: string;
      offHours: string;
      weekend: string;
      hhi: string;
      topUsers: string;
      multiPortal: string;
    };
    sections: {
      matrix: string;
      matrixIntro: string;
      daily: string;
      dailyIntro: string;
      anomalies: string;
      noAnomalies: string;
      orgUnits: string;
      categories: string;
      personal: string;
      shadowAi: string;
      unmanaged: string;
      messaging: string;
      print: string;
      inbound: string;
      policy: string;
      signals: string;
      roadmap: string;
      methodology: string;
    };
    columns: {
      channel: string;
      actions: string;
      uploads: string;
      pastes: string;
      users: string;
      sensitive: string;
      blocked: string;
      warned: string;
      bypassed: string;
      detected: string;
      allowed: string;
      destination: string;
      category: string;
      orgUnit: string;
      downloads: string;
      prints: string;
      share: string;
      rule: string;
      date: string;
      zScore: string;
      baseline: string;
      identityDomain: string;
      document: string;
      fileType: string;
      user: string;
      events: string;
      extension: string;
      installs: string;
      malware: string;
      unscanned: string;
      risk: string;
      highRisk: string;
      source: string;
      threat: string;
    };
    peakDay: (date: string, count: number) => string;
    methodologyItems: readonly string[];
    appliedBanner: (preset: string) => string;
  };
  labels: {
    channels: Record<Channel, string>;
    channelDescriptions: Record<Channel, string>;
    categories: Record<UrlCategory, string>;
    triggers: Record<TriggerType, string>;
    results: Record<EventResult, string>;
    horizons: Record<RoadmapHorizon, string>;
    horizonWindows: Record<RoadmapHorizon, string>;
    presets: Record<EasyPocPreset, string>;
    unknown: string;
  };
  roadmap: Record<string, RoadmapCopy>;
  deck: {
    coverEyebrow: string;
    coverSubtitle: string;
    generatedBy: string;
    period: string;
    sources: string;
    baselineTitle: string;
    matrixTitle: string;
    matrixSubtitle: string;
    dailyTitle: string;
    dailySubtitle: string;
    orgTitle: string;
    categoryTitle: string;
    personalTitle: string;
    personalSubtitle: string;
    shadowAiTitle: string;
    shadowAiSubtitle: string;
    unmanagedTitle: string;
    unmanagedSubtitle: string;
    messagingTitle: string;
    messagingSubtitle: string;
    printTitle: string;
    printSubtitle: string;
    inboundTitle: string;
    inboundSubtitle: string;
    signalsTitle: string;
    signalsSubtitle: string;
    roadmapTitle: string;
    roadmapSubtitle: string;
    appendixTitle: string;
    appendixSubtitle: string;
    suggestedControls: string;
    easyPocPreset: string;
    privacyNote: string;
    navHint: string;
    printHint: string;
    footer: string;
    noneObserved: string;
    legendUploads: string;
    legendPastes: string;
    legendSensitive: string;
    hourLabel: string;
    dedupNote: string;
    mappingNote: string;
    unparsedNote: (rows: number) => string;
  };
}

const CHANNEL_LABELS_EN: Record<Channel, string> = {
  personal_account: "Personal accounts",
  shadow_ai: "Shadow AI",
  messaging: "Web messaging",
  unmanaged: "Unmanaged cloud apps",
  sanctioned_ai: "Sanctioned AI",
  sanctioned: "Sanctioned suites",
  partner: "Partner domains",
  internal: "Internal destinations",
};

const CHANNEL_LABELS_JA: Record<Channel, string> = {
  personal_account: "個人アカウント",
  shadow_ai: "シャドーAI",
  messaging: "Webメッセージング",
  unmanaged: "未管理クラウドアプリ",
  sanctioned_ai: "承認済みAI",
  sanctioned: "承認済みSaaS",
  partner: "パートナードメイン",
  internal: "社内宛先",
};

const CATEGORY_LABELS_EN: Record<UrlCategory, string> = {
  genai: "Generative AI",
  messaging: "Messaging",
  file_transfer: "File transfer",
  converter: "Online converters",
  cloud_storage: "Cloud storage",
  webmail: "Webmail",
  social: "Social media",
  dev_code: "Developer / paste sites",
  translation: "Translation",
  productivity: "Productivity",
  business_saas: "Business SaaS",
  google_workspace: "Google Workspace",
  other: "Other",
};

const CATEGORY_LABELS_JA: Record<UrlCategory, string> = {
  genai: "生成AI",
  messaging: "メッセージング",
  file_transfer: "ファイル転送",
  converter: "オンライン変換ツール",
  cloud_storage: "クラウドストレージ",
  webmail: "Webメール",
  social: "SNS",
  dev_code: "開発者向け・貼り付けサイト",
  translation: "翻訳",
  productivity: "生産性ツール",
  business_saas: "業務SaaS",
  google_workspace: "Google Workspace",
  other: "その他",
};

const COLUMN_LABELS_EN: Record<string, string> = {
  timestamp: "Timestamp",
  event: "Event name",
  description: "Event description",
  actor: "Actor e-mail",
  orgUnit: "Org unit",
  group: "Group",
  url: "URL",
  tabUrl: "Tab URL",
  urlCategory: "URL category",
  contentName: "Content name",
  contentType: "Content type",
  contentSize: "Content size",
  contentHash: "Content hash",
  transferMethod: "Transfer method",
  trigger: "Trigger type",
  triggerUser: "Trigger user",
  source: "Source",
  destination: "Destination",
  reason: "Event reason",
  result: "Event result",
  rules: "Triggered rules",
  scanId: "Scan ID",
  profileUser: "Profile user name",
  deviceUser: "Device user",
  deviceName: "Device name",
  devicePlatform: "Device platform",
  clientType: "Client type",
  browserVersion: "Browser version",
  signedInAccount: "Web app signed-in account",
  extensionId: "Extension ID",
  extensionName: "Extension name",
  detector: "Detector",
};

const COLUMN_LABELS_JA: Record<string, string> = {
  timestamp: "日時",
  event: "イベント名",
  description: "イベントの説明",
  actor: "アクターのメール",
  orgUnit: "組織部門",
  group: "グループ",
  url: "URL",
  tabUrl: "タブURL",
  urlCategory: "URLカテゴリ",
  contentName: "コンテンツ名",
  contentType: "コンテンツの種類",
  contentSize: "コンテンツサイズ",
  contentHash: "コンテンツハッシュ",
  transferMethod: "転送方法",
  trigger: "トリガーの種類",
  triggerUser: "トリガーユーザー",
  source: "送信元",
  destination: "送信先",
  reason: "イベントの理由",
  result: "イベントの結果",
  rules: "トリガーされたルール",
  scanId: "スキャンID",
  profileUser: "プロファイルユーザー名",
  deviceUser: "デバイスユーザー",
  deviceName: "デバイス名",
  devicePlatform: "デバイスのプラットフォーム",
  clientType: "クライアントの種類",
  browserVersion: "ブラウザのバージョン",
  signedInAccount: "Webアプリのログインアカウント",
  extensionId: "拡張機能ID",
  extensionName: "拡張機能名",
  detector: "検出器",
};

const en: CeraMessages = {
  page: {
    eyebrow: "CERA · Chrome Egress Risk Analysis",
    title: "Turn Chrome log events into an egress risk briefing",
    intro:
      "Load Chrome log events exported from the Admin Console, classify every upload, paste, print and download into four egress vectors, and export a 16:9 HTML slide deck. Nothing leaves this browser.",
    localBadge: "Local processing only · no upload · nothing stored",
    steps: ["1. Load logs", "2. Classification", "3. Report"],
    stepHints: [
      "CSV / TSV / JSON exports, multiple files",
      "Corporate domains, sanctioned apps, masking",
      "Dashboard, slide deck, forensic CSV",
    ],
    back: "Back",
    next: "Continue",
    analyze: "Run analysis",
    reanalyze: "Re-run analysis",
    analyzing: "Analyzing…",
  },
  ingest: {
    title: "Load Chrome log events",
    intro:
      "Drop one or more exports from Admin Console › Reporting › Audit and investigation › Chrome log events. Files are parsed in memory only.",
    dropTitle: "Drop CSV, TSV or JSON files here",
    dropHint: "Up to ~500k rows per file. Multiple exports are merged automatically.",
    browse: "Choose files",
    sample: "Load sample dataset",
    sampleHint: "7-day synthetic tenant with every vector populated, for demos.",
    exportTitle: "How to export the logs",
    exportSteps: [
      "Open Admin Console › Reporting › Audit and investigation › Chrome log events.",
      "Set the date range to 14–30 days and keep all event types.",
      "Export as CSV with Google Sheets or CSV download. Export in smaller slices if the row cap is reached.",
      "Drop every file here. Column names in English or Japanese are recognised automatically.",
    ],
    exportLink: "Open Chrome log events (goo.gle/cera-logs)",
    helpLink: "Help: Chrome log events",
    auditLink: "Enable audit-mode baseline in Easy PoC",
    filesTitle: "Loaded files",
    fileHeaders: ["File", "Format", "Rows", "Events", "Skipped"],
    remove: "Remove",
    clearAll: "Clear all",
    empty: "No files loaded yet.",
    readError: (name) => `Could not read ${name}.`,
    noRows: (name) => `${name} has no data rows.`,
    totalRows: (rows, events) => `${rows.toLocaleString()} rows · ${events.toLocaleString()} events recognised`,
    autoFetch: "Fetch with signed-in account",
    autoFetchHint:
      "Reads Chrome log events through the Admin SDK Reports API as the signed-in Workspace administrator. Needs the Reports privilege and the Chrome Enterprise Premium reporting connector. Events stay in this page's memory, nothing is stored.",
    autoFetchPeriod: "Period",
    autoFetchDays: (days) => `Last ${days} days`,
    autoFetchRunning: "Fetching…",
    autoFetchProgress: (pages, events) =>
      `${pages.toLocaleString()} page${pages === 1 ? "" : "s"} · ${events.toLocaleString()} events so far`,
    autoFetchCancel: "Stop",
    autoFetchDone: (events, days) =>
      `Loaded ${events.toLocaleString()} events from the last ${days} days.`,
    autoFetchEmpty: (days) =>
      `No Chrome log events in the last ${days} days. Check that the reporting connector is enabled for the target OU, then try again.`,
    autoFetchCancelled: (events) =>
      `Stopped. ${events.toLocaleString()} events fetched so far were loaded.`,
    autoFetchConsent:
      "The signed-in account has not granted read access to Chrome audit logs yet. Sign in again to grant it, then fetch again.",
    autoFetchSignIn: "Sign in again",
    autoFetchFailed: (message) => `Fetch failed: ${message}`,
    autoFetchPrivilegeHint:
      "If this persists, confirm the account holds the Reports privilege in Admin Console › Admin roles, or export CSV manually.",
    autoFetchFileName: (from, to) => `chrome-log-events-${from}-${to}.json`,
  },
  mapping: {
    title: "Column mapping",
    intro:
      "Headers were matched automatically. Adjust only if a column shows as unmapped or the preview looks wrong.",
    autoMapped: (mapped, total) => `${mapped} of ${total} canonical fields mapped`,
    unmapped: "Headers not used",
    ignore: "— not mapped —",
    required: "required",
    missing: (columns) => `Missing important fields: ${columns}. Results will be partial.`,
    columnLabels: COLUMN_LABELS_EN,
    reset: "Reset to automatic",
  },
  settings: {
    title: "Classification settings",
    intro: "Define what counts as corporate, partner and sanctioned. Everything else is treated as an egress vector.",
    corporateDomains: "Corporate domains",
    corporateDomainsHint: "Uploads to these domains count as internal; identities on these domains are corporate.",
    suggested: "Suggested from the logs",
    use: "Use",
    partnerDomains: "Partner domains",
    partnerDomainsHint: "Trusted third parties. Excluded from unmanaged cloud apps.",
    sanctionedAi: "Sanctioned AI",
    sanctionedAiHint: "GenAI hosts your organisation approved. Everything else in the GenAI catalog is Shadow AI.",
    sanctionedSuites: "Sanctioned productivity suites and SaaS",
    sanctionedSuitesHint: "Hostnames or domains. Subdomains match automatically.",
    quickAdd: "Quick add",
    extraGenAi: "Additional GenAI hosts",
    extraGenAiHint: "Internal or niche assistants not in the built-in catalog.",
    extraMessaging: "Additional messaging hosts",
    extraMessagingHint: "Regional chat apps not in the built-in catalog.",
    workHours: "Work hours",
    workHoursHint: "Used for the off-hours share. 24-hour clock in the selected time zone.",
    timezone: "Time zone offset",
    timezoneHint: "Offset from UTC used for daily buckets and work hours. Japan is +9.",
    mask: "Mask identities in outputs",
    maskHint: "E-mail addresses are replaced with stable pseudonyms U-001, U-002 … in the dashboard, deck and CSV.",
    deckLanguage: "Deck language",
    reportTitle: "Report title",
    reportTitlePlaceholder: "Chrome Egress Risk Analysis",
    customer: "Organisation name",
    customerPlaceholder: "Shown on the cover slide",
    listPlaceholder: "example.com, example.co.jp",
  },
  report: {
    title: "Egress risk report",
    intro: (events, actions, days) =>
      `${events.toLocaleString()} events merged into ${actions.toLocaleString()} user actions across ${days} day${days === 1 ? "" : "s"}.`,
    period: "Period",
    noData: "No analysable transfer events were found. Check the column mapping and that the export includes Chrome log events.",
    exportTitle: "Export",
    exportDeck: "Download 16:9 HTML slide deck",
    exportDeckHint: "Standalone file. Open locally, navigate with arrow keys, print to PDF for a 13.33 × 7.5 in deck.",
    exportCsv: "Download forensic actions CSV",
    exportJson: "Download summary JSON",
    applyInEasyPoc: "Apply countermeasure in Easy PoC",
    applyHint: "Opens Easy PoC with the matching preset selected. Nothing is deployed until you click Apply there.",
    kpis: {
      outbound: "Outbound actions",
      threat: "Egress to threat vectors",
      threatUsers: "Users on threat vectors",
      sensitive: "Sensitive outbound",
      shadowAi: "Shadow AI actions",
      personal: "Personal account actions",
      unmanaged: "Unmanaged cloud actions",
      messaging: "Messaging actions",
      downloads: "Downloads",
      prints: "Prints",
      blocked: "Blocked",
      users: "Active users",
      destinations: "Distinct destinations",
      offHours: "Off-hours share",
      weekend: "Weekend share",
      hhi: "Destination concentration (HHI)",
      topUsers: "Top 10% users share",
      multiPortal: "Multi-portal users",
    },
    sections: {
      matrix: "Threat-vector matrix",
      matrixIntro: "Outbound uploads and pastes, de-duplicated into user actions and assigned to one channel each.",
      daily: "Daily volume",
      dailyIntro: "Uploads, pastes and sensitive actions per day in the selected time zone.",
      anomalies: "Volume anomalies",
      noAnomalies: "No days exceeded two standard deviations above the mean.",
      orgUnits: "Top org units",
      categories: "Top destination categories",
      personal: "Personal accounts",
      shadowAi: "Shadow AI vs sanctioned AI",
      unmanaged: "Unmanaged cloud apps",
      messaging: "Web messaging",
      print: "Print",
      inbound: "Inbound downloads",
      policy: "Policy outcomes",
      signals: "Security signals",
      roadmap: "Suggested controls · 3 horizons",
      methodology: "Methodology and data quality",
    },
    columns: {
      channel: "Channel",
      actions: "Actions",
      uploads: "Uploads",
      pastes: "Pastes",
      users: "Users",
      sensitive: "Sensitive",
      blocked: "Blocked",
      warned: "Warned",
      bypassed: "Bypassed",
      detected: "Detected",
      allowed: "Allowed",
      destination: "Destination",
      category: "Category",
      orgUnit: "Org unit",
      downloads: "Downloads",
      prints: "Prints",
      share: "Share",
      rule: "Rule",
      date: "Date",
      zScore: "z-score",
      baseline: "Baseline",
      identityDomain: "Identity domain",
      document: "Document",
      fileType: "File type",
      user: "User",
      events: "Events",
      extension: "Extension",
      installs: "Installs",
      malware: "Malware",
      unscanned: "Unscanned",
      risk: "Risk",
      highRisk: "High",
      source: "Source",
      threat: "Threat vectors",
    },
    peakDay: (date, count) => `Peak day ${date} with ${count.toLocaleString()} outbound actions`,
    methodologyItems: [
      "Multi-row events (CONTENT_TRANSFER plus SENSITIVE_DATA_TRANSFER rows) with the same actor, trigger, destination host, file name and size within 10 seconds are merged into one user action; the most severe result wins.",
      "Outbound = file uploads and web content uploads (pastes). Downloads and prints are analysed separately.",
      "Channels are mutually exclusive and resolved in order: internal → personal account → sanctioned AI / Shadow AI → sanctioned suites → partner → web messaging → unmanaged cloud apps.",
      "A personal account is detected when the web app signed-in account or Chrome profile belongs to a non-corporate, non-partner domain.",
      "Off-hours and weekend shares use the configured time zone offset and work-hour window.",
      "All processing happens inside this browser tab. No log data is transmitted anywhere.",
    ],
    appliedBanner: (preset) => `Preset “${preset}” from CERA has been pre-selected. Review the target scope and click Apply when ready.`,
  },
  labels: {
    channels: CHANNEL_LABELS_EN,
    channelDescriptions: {
      personal_account: "Uploads while signed in with a personal Google Account or a personal Chrome profile.",
      shadow_ai: "Uploads and prompts to generative AI services that are not on the sanctioned list.",
      messaging: "Files and text sent through consumer messaging web apps.",
      unmanaged: "Uploads to any other cloud application outside the sanctioned list.",
      sanctioned_ai: "Approved AI assistants (for example corporate Gemini).",
      sanctioned: "Approved productivity suites and business SaaS.",
      partner: "Trusted partner domains.",
      internal: "Destinations on corporate domains.",
    },
    categories: CATEGORY_LABELS_EN,
    triggers: {
      file_upload: "File upload",
      file_download: "File download",
      web_content_upload: "Paste / text entry",
      page_print: "Print",
      file_transfer: "File transfer",
      unknown: "Unknown",
    },
    results: {
      allowed: "Allowed",
      blocked: "Blocked",
      warned: "Warned",
      bypassed: "Bypassed",
      detected: "Detected",
      unknown: "Unknown",
    },
    horizons: { now: "Now", next: "Next", later: "Later" },
    horizonWindows: { now: "0–30 days", next: "30–90 days", later: "90+ days" },
    presets: {
      full: "Full protection",
      ai: "GenAI governance",
      personal_account: "Block personal Google accounts",
      endpoint: "Endpoint posture",
      audit: "Audit-mode baseline",
    },
    unknown: "(unknown)",
  },
  roadmap: {
    audit_baseline: {
      title: "Audit-mode DLP baseline across the pilot OU",
      rationale: (metric, users) => `${metric.toLocaleString()} outbound actions by ${users.toLocaleString()} users were observed. Audit-only rules keep visibility without user impact.`,
      actions: [
        "Enable upload, paste, print and download connectors in audit mode.",
        "Turn on security event reporting so every vector keeps producing evidence.",
        "Re-run CERA after 14 days to measure change.",
      ],
    },
    personal_account_block: {
      title: "Block personal Google accounts in managed Chrome",
      rationale: (metric, users) => `${metric.toLocaleString()} actions by ${users.toLocaleString()} users went through personal accounts or profiles.`,
      actions: [
        "Restrict sign-in to corporate domains with AllowedDomainsForApps and RestrictSigninToPattern.",
        "Disable guest mode and Incognito to close the bypass path.",
        "Communicate the change to affected org units before enforcement.",
      ],
    },
    shadow_ai_block: {
      title: "Govern Shadow AI: allow sanctioned assistants, warn or block the rest",
      rationale: (metric, users) => `${metric.toLocaleString()} prompts or uploads from ${users.toLocaleString()} users reached unsanctioned AI services.`,
      actions: [
        "Allow-list the sanctioned assistants and apply URL blocking for the consumer AI catalog.",
        "Add paste DLP for source code, PII and payment data on AI destinations.",
        "Start in warn mode with a custom message explaining the approved alternative.",
      ],
    },
    unmanaged_warn: {
      title: "Warn-mode DLP for unmanaged cloud apps and web messaging",
      rationale: (metric, users) => `${metric.toLocaleString()} uploads to unmanaged destinations or messaging apps involve up to ${users.toLocaleString()} users.`,
      actions: [
        "Apply warn-on-upload rules for file transfer, converter and webmail categories.",
        "Enable the clipboard boundary from protected internal sites.",
        "Review the top 15 destinations with business owners and sanction or block each one.",
      ],
    },
    sanctioned_ai_dlp: {
      title: "Prompt DLP on sanctioned AI",
      rationale: (metric, users) => `${metric.toLocaleString()} AI interactions from ${users.toLocaleString()} users can carry sensitive text even on approved services.`,
      actions: [
        "Attach PII and payment detectors to paste events on sanctioned AI hosts.",
        "Keep audit mode on approved assistants to preserve productivity.",
        "Enable Gemini Zero Trust controls for enterprise AI endpoints.",
      ],
    },
    download_scanning: {
      title: "Download scanning and unscanned-file handling",
      rationale: (metric, users) => `${metric.toLocaleString()} malware or unscanned verdicts across ${users.toLocaleString()} downloads.`,
      actions: [
        "Enable download content scanning with block on malware verdicts.",
        "Decide the policy for files too large or encrypted to scan.",
        "Review top download sources for unsanctioned storage.",
      ],
    },
    block_mode_posture: {
      title: "Move to block mode with device posture scoping",
      rationale: (metric, users) => `${metric.toLocaleString()} threat-vector actions by ${users.toLocaleString()} users define the enforcement scope.`,
      actions: [
        "Create Context-Aware Access levels for corporate and BYOD devices.",
        "Promote warn rules to block for sensitive detectors on BYOD.",
        "Keep break-glass exceptions and monitor bypass rates weekly.",
      ],
    },
    print_watermark: {
      title: "Print controls and screen watermark",
      rationale: (metric, users) => `${metric.toLocaleString()} print actions by ${users.toLocaleString()} users, including sensitive documents.`,
      actions: [
        "Add print DLP rules for the detectors that fired most often.",
        "Enable the screen watermark on protected internal sites.",
        "Scope stricter print rules to org units with sensitive data.",
      ],
    },
    password_alert: {
      title: "Password reuse protection",
      rationale: (metric, users) => `${metric.toLocaleString()} corporate password reuse events from ${users.toLocaleString()} users.`,
      actions: [
        "Enable the Password Alert warning trigger for corporate credentials.",
        "Review phishing-like destinations and add URL blocking.",
        "Pair with Safe Browsing Enhanced Protection.",
      ],
    },
  },
  deck: {
    coverEyebrow: "Chrome Enterprise Premium · CERA",
    coverSubtitle: "Chrome Egress Risk Analysis",
    generatedBy: "Generated locally by Secure Gateway Studio",
    period: "Analysis period",
    sources: "Source files",
    baselineTitle: "Baseline",
    matrixTitle: "Four egress vectors",
    matrixSubtitle: "Mutually exclusive channels for outbound uploads and pastes",
    dailyTitle: "Daily volume and anomalies",
    dailySubtitle: "Outbound user actions per day",
    orgTitle: "Where egress originates",
    categoryTitle: "Top destination categories",
    personalTitle: "Personal accounts",
    personalSubtitle: "Corporate data moved through personal Google Accounts or profiles",
    shadowAiTitle: "Shadow AI vs sanctioned AI",
    shadowAiSubtitle: "Prompts and uploads to generative AI services",
    unmanagedTitle: "Unmanaged cloud apps",
    unmanagedSubtitle: "Top destinations outside the sanctioned list",
    messagingTitle: "Web messaging",
    messagingSubtitle: "Consumer chat apps used from the managed browser",
    printTitle: "Print",
    printSubtitle: "Printed documents and sensitive print events",
    inboundTitle: "Inbound downloads and policy outcomes",
    inboundSubtitle: "Malware, unscanned files and how existing rules responded",
    signalsTitle: "Security signals",
    signalsSubtitle: "Credential, navigation and browser hygiene events",
    roadmapTitle: "Suggested controls · three horizons",
    roadmapSubtitle: "Each item maps to an Easy PoC preset in Secure Gateway Studio",
    appendixTitle: "Appendix · methodology",
    appendixSubtitle: "How the numbers were produced",
    suggestedControls: "Suggested controls",
    easyPocPreset: "Easy PoC preset",
    privacyNote: "Identities are pseudonymised. Raw log data stayed on the analyst's device.",
    navHint: "Use ← → keys or click to navigate. Press P for print layout.",
    printHint: "Print to PDF at 13.33 × 7.5 in for a native 16:9 deck.",
    footer: "CERA · Secure Gateway Studio",
    noneObserved: "None observed in this dataset.",
    legendUploads: "Uploads",
    legendPastes: "Pastes",
    legendSensitive: "Sensitive",
    hourLabel: "Hour of day",
    dedupNote: "Multi-row DLP events are merged into single user actions within a 10-second window.",
    mappingNote: "Column mapping used",
    unparsedNote: (rows) => `${rows.toLocaleString()} rows could not be parsed and were excluded.`,
  },
};

const ja: CeraMessages = {
  page: {
    eyebrow: "CERA · Chrome Egress Risk Analysis",
    title: "Chromeログイベントから社外送信リスクを可視化する",
    intro:
      "管理コンソールから書き出したChromeログイベントを読み込み、アップロード・貼り付け・印刷・ダウンロードを4つの送信経路に分類し、16:9のHTMLスライドとして出力します。データはこのブラウザの外に出ません。",
    localBadge: "ローカル処理のみ · アップロードなし · 保存なし",
    steps: ["1. ログ読み込み", "2. 分類設定", "3. レポート"],
    stepHints: ["CSV / TSV / JSON、複数ファイル可", "会社ドメイン、承認済みアプリ、匿名化", "ダッシュボード、スライド、CSV"],
    back: "戻る",
    next: "次へ",
    analyze: "分析を実行",
    reanalyze: "再分析",
    analyzing: "分析中…",
  },
  ingest: {
    title: "Chromeログイベントを読み込む",
    intro:
      "管理コンソール › レポート › 監査と調査 › Chromeログイベント から書き出したファイルをドロップしてください。解析はメモリ上でのみ行います。",
    dropTitle: "CSV / TSV / JSON ファイルをここにドロップ",
    dropHint: "1ファイルあたり約50万行まで。複数ファイルは自動で結合します。",
    browse: "ファイルを選択",
    sample: "サンプルデータを読み込む",
    sampleHint: "全経路を含む7日間の架空テナント。デモ用です。",
    exportTitle: "ログの書き出し手順",
    exportSteps: [
      "管理コンソール › レポート › 監査と調査 › Chromeログイベント を開きます。",
      "期間を14〜30日に設定し、イベントの種類は絞り込まずに残します。",
      "Googleスプレッドシートまたは CSV で書き出します。行数上限に達する場合は期間を分割します。",
      "すべてのファイルをここにドロップします。英語・日本語の列名はどちらも自動認識します。",
    ],
    exportLink: "Chromeログイベントを開く goo.gle/cera-logs",
    helpLink: "ヘルプ: Chromeログイベント",
    auditLink: "Easy PoC で監査モードのベースラインを有効化",
    filesTitle: "読み込み済みファイル",
    fileHeaders: ["ファイル", "形式", "行数", "イベント", "除外"],
    remove: "削除",
    clearAll: "すべて削除",
    empty: "ファイルはまだありません。",
    readError: (name) => `${name} を読み込めませんでした。`,
    noRows: (name) => `${name} にデータ行がありません。`,
    totalRows: (rows, events) => `${rows.toLocaleString()} 行 · ${events.toLocaleString()} イベントを認識`,
    autoFetch: "ログイン中のアカウントで自動取得",
    autoFetchHint:
      "ログイン中の Workspace 管理者として Admin SDK Reports API から Chromeログイベントを読み込みます。レポート権限と Chrome Enterprise Premium のレポート コネクタが必要です。取得したイベントはこの画面のメモリ上にのみ置き、保存しません。",
    autoFetchPeriod: "期間",
    autoFetchDays: (days) => `直近 ${days} 日`,
    autoFetchRunning: "取得中…",
    autoFetchProgress: (pages, events) =>
      `${pages.toLocaleString()} ページ · ${events.toLocaleString()} イベント取得済み`,
    autoFetchCancel: "停止",
    autoFetchDone: (events, days) =>
      `直近 ${days} 日分のイベント ${events.toLocaleString()} 件を読み込みました。`,
    autoFetchEmpty: (days) =>
      `直近 ${days} 日に Chromeログイベントがありません。対象の組織部門でレポート コネクタが有効か確認してから、もう一度お試しください。`,
    autoFetchCancelled: (events) =>
      `停止しました。取得済みの ${events.toLocaleString()} 件を読み込みました。`,
    autoFetchConsent:
      "ログイン中のアカウントは Chrome 監査ログの読み取りをまだ許可していません。再ログインして許可してから、もう一度取得してください。",
    autoFetchSignIn: "再ログイン",
    autoFetchFailed: (message) => `取得に失敗しました: ${message}`,
    autoFetchPrivilegeHint:
      "続く場合は、管理コンソール › 管理者ロール でこのアカウントにレポート権限があるか確認するか、CSV を手動で書き出してください。",
    autoFetchFileName: (from, to) => `chrome-log-events-${from}-${to}.json`,
  },
  mapping: {
    title: "列マッピング",
    intro: "列名は自動で対応付けました。未対応の列がある場合や結果がおかしい場合のみ調整してください。",
    autoMapped: (mapped, total) => `${total} 項目中 ${mapped} 項目を対応付け`,
    unmapped: "未使用の列",
    ignore: "— 対応なし —",
    required: "必須",
    missing: (columns) => `重要な項目が見つかりません: ${columns}。結果は部分的になります。`,
    columnLabels: COLUMN_LABELS_JA,
    reset: "自動判定に戻す",
  },
  settings: {
    title: "分類設定",
    intro: "会社・パートナー・承認済みの範囲を定義します。それ以外はすべて送信経路として扱います。",
    corporateDomains: "会社ドメイン",
    corporateDomainsHint: "このドメイン宛は社内扱い。このドメインのアカウントは会社IDとして扱います。",
    suggested: "ログからの候補",
    use: "追加",
    partnerDomains: "パートナードメイン",
    partnerDomainsHint: "信頼できる取引先。未管理クラウドアプリから除外します。",
    sanctionedAi: "承認済みAI",
    sanctionedAiHint: "組織が承認した生成AIのホスト。カタログ内のそれ以外はシャドーAIになります。",
    sanctionedSuites: "承認済みSaaS・生産性スイート",
    sanctionedSuitesHint: "ホスト名またはドメイン。サブドメインは自動で一致します。",
    quickAdd: "クイック追加",
    extraGenAi: "追加の生成AIホスト",
    extraGenAiHint: "社内アシスタントなど、組み込みカタログにないもの。",
    extraMessaging: "追加のメッセージングホスト",
    extraMessagingHint: "組み込みカタログにない地域チャットアプリ。",
    workHours: "業務時間",
    workHoursHint: "時間外比率の計算に使います。選択したタイムゾーンの24時間表記。",
    timezone: "タイムゾーン",
    timezoneHint: "日別集計と業務時間に使うUTCからのオフセット。日本は +9。",
    mask: "出力でIDを匿名化",
    maskHint: "メールアドレスをダッシュボード・スライド・CSVで U-001, U-002 … に置き換えます。",
    deckLanguage: "スライドの言語",
    reportTitle: "レポートタイトル",
    reportTitlePlaceholder: "Chrome Egress Risk Analysis",
    customer: "組織名",
    customerPlaceholder: "表紙に表示します",
    listPlaceholder: "example.com, example.co.jp",
  },
  report: {
    title: "送信リスクレポート",
    intro: (events, actions, days) =>
      `${events.toLocaleString()} イベントを ${actions.toLocaleString()} 件のユーザー操作に統合しました。対象 ${days} 日間。`,
    period: "期間",
    noData: "分析できる転送イベントが見つかりません。列マッピングと、書き出しに Chromeログイベントが含まれているかを確認してください。",
    exportTitle: "出力",
    exportDeck: "16:9 HTMLスライドをダウンロード",
    exportDeckHint: "単体で開けるファイル。矢印キーで移動し、PDFに印刷すると 13.33 × 7.5 in のスライドになります。",
    exportCsv: "操作一覧CSVをダウンロード",
    exportJson: "サマリーJSONをダウンロード",
    applyInEasyPoc: "Easy PoC で対策を適用",
    applyHint: "対応するプリセットを選んだ状態で Easy PoC を開きます。そこで適用を押すまで何も変更しません。",
    kpis: {
      outbound: "送信操作",
      threat: "リスク経路への送信",
      threatUsers: "リスク経路の利用者",
      sensitive: "機密データの送信",
      shadowAi: "シャドーAI操作",
      personal: "個人アカウント操作",
      unmanaged: "未管理クラウド操作",
      messaging: "メッセージング操作",
      downloads: "ダウンロード",
      prints: "印刷",
      blocked: "ブロック済み",
      users: "利用者数",
      destinations: "送信先の数",
      offHours: "時間外比率",
      weekend: "週末比率",
      hhi: "送信先の集中度 HHI",
      topUsers: "上位10%ユーザーの比率",
      multiPortal: "複数経路の利用者",
    },
    sections: {
      matrix: "脅威経路マトリクス",
      matrixIntro: "アップロードと貼り付けをユーザー操作単位に統合し、1操作につき1つの経路に割り当てています。",
      daily: "日別推移",
      dailyIntro: "選択したタイムゾーンでの、日ごとのアップロード・貼り付け・機密操作。",
      anomalies: "急増した日",
      noAnomalies: "平均から標準偏差2つ分を超えた日はありません。",
      orgUnits: "送信の多い組織部門",
      categories: "送信先カテゴリ 上位",
      personal: "個人アカウント",
      shadowAi: "シャドーAIと承認済みAI",
      unmanaged: "未管理クラウドアプリ",
      messaging: "Webメッセージング",
      print: "印刷",
      inbound: "ダウンロード",
      policy: "ポリシーの結果",
      signals: "セキュリティシグナル",
      roadmap: "対策案 · 3つの時間軸",
      methodology: "分析方法とデータ品質",
    },
    columns: {
      channel: "経路",
      actions: "操作数",
      uploads: "アップロード",
      pastes: "貼り付け",
      users: "利用者",
      sensitive: "機密",
      blocked: "ブロック",
      warned: "警告",
      bypassed: "バイパス",
      detected: "検出",
      allowed: "許可",
      destination: "送信先",
      category: "カテゴリ",
      orgUnit: "組織部門",
      downloads: "ダウンロード",
      prints: "印刷",
      share: "比率",
      rule: "ルール",
      date: "日付",
      zScore: "zスコア",
      baseline: "平均",
      identityDomain: "アカウントのドメイン",
      document: "ドキュメント",
      fileType: "ファイル種別",
      user: "ユーザー",
      events: "イベント",
      extension: "拡張機能",
      installs: "インストール",
      malware: "マルウェア",
      unscanned: "未スキャン",
      risk: "リスク",
      highRisk: "高",
      source: "取得元",
      threat: "リスク経路",
    },
    peakDay: (date, count) => `ピークは ${date} の ${count.toLocaleString()} 件`,
    methodologyItems: [
      "同じアクター・トリガー・送信先ホスト・ファイル名・サイズを持つ複数行のイベントが10秒以内に並ぶ場合、1件のユーザー操作に統合し、最も厳しい結果を採用しています。",
      "送信 = ファイルアップロードとWebコンテンツのアップロード、つまり貼り付け。ダウンロードと印刷は別集計です。",
      "経路は排他的で、社内 → 個人アカウント → 承認済みAI / シャドーAI → 承認済みSaaS → パートナー → Webメッセージング → 未管理クラウドアプリ の順に判定します。",
      "Webアプリのログインアカウント、または Chrome プロファイルが会社・パートナー以外のドメインの場合に個人アカウントと判定します。",
      "時間外・週末の比率は設定したタイムゾーンと業務時間に基づきます。",
      "すべての処理はこのブラウザタブ内で完結し、ログデータはどこにも送信されません。",
    ],
    appliedBanner: (preset) => `CERA からプリセット「${preset}」を選択した状態で開きました。対象範囲を確認のうえ、適用を押してください。`,
  },
  labels: {
    channels: CHANNEL_LABELS_JA,
    channelDescriptions: {
      personal_account: "個人の Google アカウントまたは個人プロファイルでログインした状態でのアップロード。",
      shadow_ai: "承認リストにない生成AIサービスへのアップロードとプロンプト入力。",
      messaging: "個人向けメッセージングWebアプリ経由のファイル・テキスト送信。",
      unmanaged: "承認リスト外のその他クラウドアプリへのアップロード。",
      sanctioned_ai: "承認済みのAIアシスタント。例: 会社の Gemini。",
      sanctioned: "承認済みの生産性スイートと業務SaaS。",
      partner: "信頼できるパートナードメイン。",
      internal: "会社ドメイン宛の送信。",
    },
    categories: CATEGORY_LABELS_JA,
    triggers: {
      file_upload: "ファイルアップロード",
      file_download: "ファイルダウンロード",
      web_content_upload: "貼り付け・テキスト入力",
      page_print: "印刷",
      file_transfer: "ファイル転送",
      unknown: "不明",
    },
    results: {
      allowed: "許可",
      blocked: "ブロック",
      warned: "警告",
      bypassed: "バイパス",
      detected: "検出",
      unknown: "不明",
    },
    horizons: { now: "直近", next: "次に", later: "その後" },
    horizonWindows: { now: "0〜30日", next: "30〜90日", later: "90日以降" },
    presets: {
      full: "フル保護",
      ai: "生成AIガバナンス",
      personal_account: "個人アカウントのブロック",
      endpoint: "エンドポイント状態",
      audit: "監査モードのベースライン",
    },
    unknown: "不明",
  },
  roadmap: {
    audit_baseline: {
      title: "パイロットOUに監査モードのDLPベースラインを設定",
      rationale: (metric, users) => `${users.toLocaleString()} 人による ${metric.toLocaleString()} 件の送信操作を確認。監査のみのルールなら利用者への影響なく可視化を続けられます。`,
      actions: [
        "アップロード・貼り付け・印刷・ダウンロードのコネクタを監査モードで有効化します。",
        "セキュリティイベントのレポートを有効にし、各経路の証跡を取り続けます。",
        "14日後に CERA を再実行して変化を測ります。",
      ],
    },
    personal_account_block: {
      title: "管理対象 Chrome で個人 Google アカウントをブロック",
      rationale: (metric, users) => `${users.toLocaleString()} 人が個人アカウントまたは個人プロファイルで ${metric.toLocaleString()} 件を送信しています。`,
      actions: [
        "AllowedDomainsForApps と RestrictSigninToPattern でログインを会社ドメインに限定します。",
        "ゲストモードとシークレットモードを無効にして迂回経路を閉じます。",
        "適用前に対象の組織部門へ変更内容を案内します。",
      ],
    },
    shadow_ai_block: {
      title: "シャドーAI対策: 承認済みAIは許可、それ以外は警告またはブロック",
      rationale: (metric, users) => `${users.toLocaleString()} 人から未承認AIサービスへ ${metric.toLocaleString()} 件のプロンプト・アップロードがありました。`,
      actions: [
        "承認済みアシスタントを許可リストに入れ、消費者向けAIカタログにURLブロックを適用します。",
        "AI宛の貼り付けにソースコード・個人情報・決済情報のDLPを追加します。",
        "まず警告モードで開始し、承認済みの代替手段をメッセージで案内します。",
      ],
    },
    unmanaged_warn: {
      title: "未管理クラウドアプリとWebメッセージングに警告モードのDLP",
      rationale: (metric, users) => `未管理の送信先やメッセージングアプリへのアップロードが ${metric.toLocaleString()} 件、最大 ${users.toLocaleString()} 人が関与しています。`,
      actions: [
        "ファイル転送・変換ツール・Webメールのカテゴリにアップロード時警告ルールを適用します。",
        "保護対象の社内サイトからのクリップボード境界を有効にします。",
        "上位15の送信先を業務オーナーと確認し、承認またはブロックを決めます。",
      ],
    },
    sanctioned_ai_dlp: {
      title: "承認済みAIへのプロンプトDLP",
      rationale: (metric, users) => `${users.toLocaleString()} 人による ${metric.toLocaleString()} 件のAI利用は、承認済みサービスでも機密テキストを含み得ます。`,
      actions: [
        "承認済みAIホストでの貼り付けに個人情報・決済情報の検出器を設定します。",
        "承認済みアシスタントは監査モードのまま生産性を維持します。",
        "企業向けAIエンドポイントに Gemini Zero Trust 制御を有効化します。",
      ],
    },
    download_scanning: {
      title: "ダウンロードスキャンと未スキャンファイルの扱い",
      rationale: (metric, users) => `${users.toLocaleString()} 件のダウンロードのうち、マルウェアまたは未スキャンの判定が ${metric.toLocaleString()} 件。`,
      actions: [
        "ダウンロードのコンテンツスキャンを有効にし、マルウェア判定はブロックします。",
        "サイズ超過や暗号化でスキャンできないファイルの扱いを決めます。",
        "上位のダウンロード元に未承認ストレージがないか確認します。",
      ],
    },
    block_mode_posture: {
      title: "デバイス状態に応じたブロックモードへ移行",
      rationale: (metric, users) => `${users.toLocaleString()} 人による ${metric.toLocaleString()} 件のリスク経路操作が適用範囲の目安になります。`,
      actions: [
        "会社支給端末と BYOD 向けの Context-Aware Access レベルを作成します。",
        "BYOD では機密検出器の警告ルールをブロックに引き上げます。",
        "緊急時の例外を残し、バイパス率を週次で確認します。",
      ],
    },
    print_watermark: {
      title: "印刷制御と画面ウォーターマーク",
      rationale: (metric, users) => `${users.toLocaleString()} 人による ${metric.toLocaleString()} 件の印刷操作があり、機密文書を含みます。`,
      actions: [
        "多く検出された検出器に印刷DLPルールを追加します。",
        "保護対象の社内サイトで画面ウォーターマークを有効にします。",
        "機密データを扱う組織部門に厳しめの印刷ルールを適用します。",
      ],
    },
    password_alert: {
      title: "パスワード再利用の保護",
      rationale: (metric, users) => `${users.toLocaleString()} 人による会社パスワードの再利用イベントが ${metric.toLocaleString()} 件。`,
      actions: [
        "会社認証情報向けに Password Alert の警告トリガーを有効にします。",
        "フィッシングに似た送信先を確認し、URLブロックを追加します。",
        "Safe Browsing の保護強化機能と組み合わせます。",
      ],
    },
  },
  deck: {
    coverEyebrow: "Chrome Enterprise Premium · CERA",
    coverSubtitle: "Chrome Egress Risk Analysis",
    generatedBy: "Secure Gateway Studio でローカル生成",
    period: "分析期間",
    sources: "元ファイル",
    baselineTitle: "ベースライン",
    matrixTitle: "4つの送信経路",
    matrixSubtitle: "アップロードと貼り付けを排他的な経路に分類",
    dailyTitle: "日別推移と急増日",
    dailySubtitle: "1日あたりの送信ユーザー操作",
    orgTitle: "送信はどこから発生しているか",
    categoryTitle: "送信先カテゴリ 上位",
    personalTitle: "個人アカウント",
    personalSubtitle: "個人の Google アカウント・プロファイル経由で移動した会社データ",
    shadowAiTitle: "シャドーAIと承認済みAI",
    shadowAiSubtitle: "生成AIサービスへのプロンプトとアップロード",
    unmanagedTitle: "未管理クラウドアプリ",
    unmanagedSubtitle: "承認リスト外の送信先 上位",
    messagingTitle: "Webメッセージング",
    messagingSubtitle: "管理対象ブラウザから使われた個人向けチャットアプリ",
    printTitle: "印刷",
    printSubtitle: "印刷されたドキュメントと機密印刷イベント",
    inboundTitle: "ダウンロードとポリシーの結果",
    inboundSubtitle: "マルウェア・未スキャンファイルと既存ルールの反応",
    signalsTitle: "セキュリティシグナル",
    signalsSubtitle: "認証情報・閲覧・ブラウザ衛生に関するイベント",
    roadmapTitle: "対策案 · 3つの時間軸",
    roadmapSubtitle: "各項目は Secure Gateway Studio の Easy PoC プリセットに対応",
    appendixTitle: "付録 · 分析方法",
    appendixSubtitle: "数値の算出方法",
    suggestedControls: "対策案",
    easyPocPreset: "Easy PoC プリセット",
    privacyNote: "IDは匿名化しています。元のログデータは分析者の端末から出ていません。",
    navHint: "← → キーまたはクリックで移動。P キーで印刷レイアウト。",
    printHint: "13.33 × 7.5 in でPDFに印刷すると16:9のスライドになります。",
    footer: "CERA · Secure Gateway Studio",
    noneObserved: "このデータでは確認されませんでした。",
    legendUploads: "アップロード",
    legendPastes: "貼り付け",
    legendSensitive: "機密",
    hourLabel: "時刻",
    dedupNote: "複数行のDLPイベントは10秒以内の範囲で1件のユーザー操作に統合しています。",
    mappingNote: "使用した列マッピング",
    unparsedNote: (rows) => `${rows.toLocaleString()} 行は解析できず除外しました。`,
  },
};

export function getCeraMessages(locale: Locale): CeraMessages {
  return locale === "ja" ? ja : en;
}
