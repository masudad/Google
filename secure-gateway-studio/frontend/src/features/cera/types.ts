/**
 * CERA (Chrome Egress Risk Analysis) — shared types.
 *
 * Everything in this feature runs locally inside the extension page. Logs are
 * never uploaded anywhere; the analysis result is rendered in-app and can be
 * exported as a standalone HTML slide deck, a forensic CSV, or a JSON summary.
 */

export type ColumnKey =
  | "timestamp"
  | "event"
  | "description"
  | "actor"
  | "orgUnit"
  | "group"
  | "url"
  | "tabUrl"
  | "urlCategory"
  | "contentName"
  | "contentType"
  | "contentSize"
  | "contentHash"
  | "transferMethod"
  | "trigger"
  | "triggerUser"
  | "source"
  | "destination"
  | "reason"
  | "result"
  | "rules"
  | "scanId"
  | "profileUser"
  | "deviceUser"
  | "deviceName"
  | "devicePlatform"
  | "clientType"
  | "browserVersion"
  | "signedInAccount"
  | "extensionId"
  | "extensionName"
  | "detector";

export const COLUMN_KEYS: readonly ColumnKey[] = [
  "timestamp",
  "event",
  "description",
  "actor",
  "orgUnit",
  "group",
  "url",
  "tabUrl",
  "urlCategory",
  "contentName",
  "contentType",
  "contentSize",
  "contentHash",
  "transferMethod",
  "trigger",
  "triggerUser",
  "source",
  "destination",
  "reason",
  "result",
  "rules",
  "scanId",
  "profileUser",
  "deviceUser",
  "deviceName",
  "devicePlatform",
  "clientType",
  "browserVersion",
  "signedInAccount",
  "extensionId",
  "extensionName",
  "detector",
];

/** Mapping from canonical column key to the raw header found in the input. */
export type ColumnMapping = Partial<Record<ColumnKey, string>>;

export type EventKind =
  | "content_transfer"
  | "sensitive_data_transfer"
  | "malware_transfer"
  | "content_unscanned"
  | "password_reuse"
  | "password_changed"
  | "unsafe_site_visit"
  | "url_filtering_interstitial"
  | "login_event"
  | "extension_install"
  | "browser_crash"
  | "browser_launch"
  | "other";

export type TriggerType =
  | "file_upload"
  | "file_download"
  | "web_content_upload"
  | "page_print"
  | "file_transfer"
  | "unknown";

export type EventResult = "allowed" | "blocked" | "warned" | "bypassed" | "detected" | "unknown";

export interface ChromeLogEvent {
  rowIndex: number;
  sourceFile: string;
  timestamp: number | null;
  rawTimestamp: string;
  eventKind: EventKind;
  eventName: string;
  description: string;
  actor: string;
  orgUnit: string;
  group: string;
  url: string;
  tabUrl: string;
  urlCategory: string;
  contentName: string;
  contentType: string;
  contentSize: number | null;
  contentHash: string;
  transferMethod: string;
  trigger: TriggerType;
  triggerRaw: string;
  triggerUser: string;
  source: string;
  destination: string;
  reason: string;
  result: EventResult;
  resultRaw: string;
  rules: string;
  scanId: string;
  profileUser: string;
  deviceUser: string;
  deviceName: string;
  devicePlatform: string;
  clientType: string;
  browserVersion: string;
  signedInAccount: string;
  extensionId: string;
  extensionName: string;
  detector: string;
}

/**
 * Egress channel, mutually exclusive, resolved in priority order:
 * internal → personal_account → sanctioned_ai / shadow_ai → sanctioned →
 * partner → messaging → unmanaged.
 */
export type Channel =
  | "internal"
  | "personal_account"
  | "sanctioned_ai"
  | "shadow_ai"
  | "sanctioned"
  | "partner"
  | "messaging"
  | "unmanaged";

export const THREAT_CHANNELS: readonly Channel[] = [
  "personal_account",
  "shadow_ai",
  "messaging",
  "unmanaged",
];

export type UrlCategory =
  | "genai"
  | "messaging"
  | "file_transfer"
  | "converter"
  | "cloud_storage"
  | "webmail"
  | "social"
  | "dev_code"
  | "translation"
  | "productivity"
  | "business_saas"
  | "google_workspace"
  | "other";

export type ActionDirection = "outbound" | "inbound" | "print" | "other";

export interface UserAction {
  id: string;
  timestamp: number | null;
  actor: string;
  actorMasked: string;
  orgUnit: string;
  trigger: TriggerType;
  direction: ActionDirection;
  host: string;
  registrableDomain: string;
  url: string;
  contentName: string;
  contentType: string;
  contentSize: number | null;
  result: EventResult;
  sensitive: boolean;
  malware: boolean;
  unscanned: boolean;
  rules: string[];
  reasons: string[];
  channel: Channel;
  category: UrlCategory;
  identity: string;
  identityMasked: string;
  personalIdentity: boolean;
  mergedRows: number;
  offHours: boolean;
  weekend: boolean;
  devicePlatform: string;
  clientType: string;
  sourceFile: string;
  rowIndex: number;
}

export interface AnalysisSettings {
  corporateDomains: string[];
  partnerDomains: string[];
  sanctionedAiHosts: string[];
  sanctionedHosts: string[];
  extraGenAiHosts: string[];
  extraMessagingHosts: string[];
  /** Local work-hour window used for the off-hours metric, 24h clock. */
  workHoursStart: number;
  workHoursEnd: number;
  /** Minutes east of UTC used to derive local hour/weekday (JST = 540). */
  timezoneOffsetMinutes: number;
  /** Replace e-mail identities with stable pseudonyms (U-001 …) in outputs. */
  maskIdentities: boolean;
  /** Dedup window for multi-row events belonging to one user action. */
  dedupWindowMs: number;
}

export interface DestinationStat {
  host: string;
  category: UrlCategory;
  actions: number;
  users: number;
  sensitive: number;
  blocked: number;
  allowed: number;
}

export interface UserStat {
  actor: string;
  actorMasked: string;
  orgUnit: string;
  actions: number;
  sensitive: number;
  destinations: number;
}

export interface ChannelStats {
  channel: Channel;
  actions: number;
  uploads: number;
  pastes: number;
  users: number;
  sensitive: number;
  blocked: number;
  warned: number;
  bypassed: number;
  detected: number;
  allowed: number;
  topDestinations: DestinationStat[];
  topUsers: UserStat[];
}

export interface DailyPoint {
  date: string;
  outbound: number;
  uploads: number;
  pastes: number;
  downloads: number;
  prints: number;
  sensitive: number;
  blocked: number;
  shadowAi: number;
  personalAccount: number;
}

export interface AnomalyPoint {
  date: string;
  outbound: number;
  zScore: number;
  baseline: number;
}

export interface OrgUnitStat {
  orgUnit: string;
  uploads: number;
  pastes: number;
  downloads: number;
  prints: number;
  sensitive: number;
  users: number;
  threat: number;
}

export interface CategoryStat {
  category: UrlCategory;
  actions: number;
  users: number;
  sensitive: number;
  blocked: number;
  share: number;
}

export interface RuleStat {
  rule: string;
  actions: number;
  blocked: number;
  warned: number;
  bypassed: number;
  detected: number;
  allowed: number;
}

export interface PrintStats {
  actions: number;
  users: number;
  sensitive: number;
  blocked: number;
  topSources: DestinationStat[];
  topUsers: UserStat[];
  topDocuments: { name: string; actions: number }[];
}

export interface InboundStats {
  downloads: number;
  users: number;
  sensitive: number;
  malware: number;
  unscanned: number;
  blocked: number;
  warned: number;
  topSources: DestinationStat[];
  topFileTypes: { type: string; actions: number }[];
}

export interface SignalStats {
  malware: number;
  unscanned: number;
  passwordReuse: number;
  passwordChanged: number;
  unsafeSiteVisits: number;
  urlFilteringInterstitials: number;
  loginEvents: number;
  extensionInstalls: number;
  distinctExtensions: number;
  browserCrashes: number;
  browserLaunches: number;
  topUnsafeHosts: { host: string; events: number }[];
  topExtensions: { name: string; installs: number }[];
  passwordReuseUsers: number;
}

export type RoadmapHorizon = "now" | "next" | "later";

export type EasyPocPreset = "full" | "ai" | "personal_account" | "endpoint" | "audit";

export interface RoadmapItem {
  id: string;
  horizon: RoadmapHorizon;
  preset: EasyPocPreset;
  /** Metric that triggered the item, e.g. 143. */
  metric: number;
  /** Secondary metric (e.g. users) used by copy templates. */
  metricUsers: number;
}

export interface FileSummary {
  name: string;
  rows: number;
  parsedEvents: number;
  skippedRows: number;
  format: "csv" | "tsv" | "json";
  headers: string[];
}

export interface AnalysisTotals {
  events: number;
  actions: number;
  outbound: number;
  uploads: number;
  pastes: number;
  downloads: number;
  prints: number;
  otherActions: number;
  unclassified: number;
  sensitiveOutbound: number;
  blocked: number;
  warned: number;
  bypassed: number;
  detected: number;
  allowed: number;
  users: number;
  destinations: number;
  orgUnits: number;
  threatActions: number;
  threatUsers: number;
  internalActions: number;
  sanctionedActions: number;
  personalProfileActions: number;
}

export interface ConcentrationStats {
  destinationHhi: number;
  topDestinationShare: number;
  top10PercentUserShare: number;
  multiPortalUsers: number;
  usersWithPersonalAndCorporate: number;
  offHoursShare: number;
  weekendShare: number;
  hourHistogram: number[];
}

export interface AnalysisResult {
  generatedAt: number;
  settings: AnalysisSettings;
  files: FileSummary[];
  columnMapping: ColumnMapping;
  unmappedHeaders: string[];
  missingColumns: ColumnKey[];
  dateRange: { start: number | null; end: number | null; days: number };
  totals: AnalysisTotals;
  channels: Record<Channel, ChannelStats>;
  daily: DailyPoint[];
  peakDay: DailyPoint | null;
  anomalies: AnomalyPoint[];
  concentration: ConcentrationStats;
  orgUnits: OrgUnitStat[];
  categories: CategoryStat[];
  unmanagedDestinations: DestinationStat[];
  shadowAiDestinations: DestinationStat[];
  sanctionedAiDestinations: DestinationStat[];
  messagingDestinations: DestinationStat[];
  personalAccountDestinations: DestinationStat[];
  personalIdentityDomains: { domain: string; actions: number; users: number }[];
  rules: RuleStat[];
  print: PrintStats;
  inbound: InboundStats;
  signals: SignalStats;
  roadmap: RoadmapItem[];
  suggestedCorporateDomains: string[];
  actions: UserAction[];
}

export interface ParsedFile {
  name: string;
  format: "csv" | "tsv" | "json";
  headers: string[];
  rows: Record<string, string>[];
}
