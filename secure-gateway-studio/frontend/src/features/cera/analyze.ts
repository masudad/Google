import type {
  ActionDirection,
  AnalysisResult,
  AnalysisSettings,
  AnalysisTotals,
  AnomalyPoint,
  CategoryStat,
  Channel,
  ChannelStats,
  ChromeLogEvent,
  ConcentrationStats,
  DailyPoint,
  DestinationStat,
  EventResult,
  FileSummary,
  InboundStats,
  OrgUnitStat,
  PrintStats,
  RoadmapItem,
  RuleStat,
  SignalStats,
  UrlCategory,
  UserAction,
  UserStat,
} from "./types";
import { THREAT_CHANNELS } from "./types";
import { RESULT_SEVERITY, missingColumns, type NormalizedFile } from "./columns";
import {
  DEFAULT_SANCTIONED_AI_HOSTS,
  GENAI_HOSTS,
  MESSAGING_HOSTS,
  SANCTIONED_PRESETS,
  categorizeHost,
  emailDomain,
  hostFromUrl,
  hostMatchesAny,
  isGoogleOwnedHost,
  normalizeDomainList,
  registrableDomain,
} from "./domains";

export const ALL_CHANNELS: readonly Channel[] = [
  "personal_account",
  "shadow_ai",
  "messaging",
  "unmanaged",
  "sanctioned_ai",
  "sanctioned",
  "partner",
  "internal",
];

const TRANSFER_KINDS = new Set([
  "content_transfer",
  "sensitive_data_transfer",
  "malware_transfer",
  "content_unscanned",
]);

const DAY_MS = 86_400_000;
const MAX_DAILY_POINTS = 400;

export function defaultSettings(overrides: Partial<AnalysisSettings> = {}): AnalysisSettings {
  return {
    corporateDomains: [],
    partnerDomains: [],
    sanctionedAiHosts: [...DEFAULT_SANCTIONED_AI_HOSTS],
    sanctionedHosts: [...SANCTIONED_PRESETS[0].hosts],
    extraGenAiHosts: [],
    extraMessagingHosts: [],
    workHoursStart: 8,
    workHoursEnd: 20,
    timezoneOffsetMinutes: 540,
    maskIdentities: true,
    dedupWindowMs: 10_000,
    ...overrides,
  };
}

/**
 * Suggests corporate domains from actor e-mail addresses: the tenant identity
 * (if known) plus any actor domain covering at least 10 % of distinct actors.
 */
export function suggestCorporateDomains(events: readonly ChromeLogEvent[], workspaceIdentity = ""): string[] {
  const actorsByDomain = new Map<string, Set<string>>();
  for (const event of events) {
    const domain = emailDomain(event.actor);
    if (!domain) continue;
    let set = actorsByDomain.get(domain);
    if (!set) {
      set = new Set();
      actorsByDomain.set(domain, set);
    }
    set.add(event.actor);
  }
  const totalActors = new Set(events.map((event) => event.actor).filter(Boolean)).size;
  const ranked = Array.from(actorsByDomain.entries())
    .map(([domain, set]) => ({ domain, actors: set.size }))
    .sort((a, b) => b.actors - a.actors || a.domain.localeCompare(b.domain));
  const suggestions: string[] = [];
  const identityDomain = emailDomain(workspaceIdentity);
  if (identityDomain) suggestions.push(identityDomain);
  for (const entry of ranked) {
    if (suggestions.includes(entry.domain)) continue;
    if (suggestions.length === (identityDomain ? 1 : 0) || entry.actors / Math.max(totalActors, 1) >= 0.1) {
      suggestions.push(entry.domain);
    }
  }
  return suggestions.slice(0, 6);
}

interface MutableAction extends UserAction {
  firstTimestamp: number | null;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function localDateKey(timestamp: number, offsetMinutes: number): string {
  const local = new Date(timestamp + offsetMinutes * 60_000);
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
}

function localHour(timestamp: number, offsetMinutes: number): number {
  return new Date(timestamp + offsetMinutes * 60_000).getUTCHours();
}

function localWeekday(timestamp: number, offsetMinutes: number): number {
  return new Date(timestamp + offsetMinutes * 60_000).getUTCDay();
}

function directionFor(trigger: UserAction["trigger"]): ActionDirection {
  switch (trigger) {
    case "file_upload":
    case "web_content_upload":
      return "outbound";
    case "file_download":
      return "inbound";
    case "page_print":
      return "print";
    default:
      return "other";
  }
}

function splitList(raw: string): string[] {
  return raw
    .split(/[;|,\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniquePush(target: string[], values: string[]): void {
  for (const value of values) {
    if (!target.includes(value)) target.push(value);
  }
}

class IdentityMasker {
  private readonly map = new Map<string, string>();

  constructor(private readonly enabled: boolean) {}

  prime(identities: Iterable<string>): void {
    const sorted = Array.from(new Set(Array.from(identities).filter(Boolean))).sort();
    sorted.forEach((identity, index) => {
      this.map.set(identity, `U-${String(index + 1).padStart(3, "0")}`);
    });
  }

  mask(identity: string): string {
    if (!identity) return "";
    if (!this.enabled) return identity;
    const existing = this.map.get(identity);
    if (existing) return existing;
    const next = `U-${String(this.map.size + 1).padStart(3, "0")}`;
    this.map.set(identity, next);
    return next;
  }
}

function newResultCounters() {
  return { blocked: 0, warned: 0, bypassed: 0, detected: 0, allowed: 0 };
}

function bumpResult(counters: ReturnType<typeof newResultCounters>, result: EventResult): void {
  if (result === "unknown") return;
  counters[result] += 1;
}

function buildDestinationStats(actions: readonly UserAction[], limit: number): DestinationStat[] {
  const byHost = new Map<string, DestinationStat & { userSet: Set<string> }>();
  for (const action of actions) {
    const host = action.host || "(unknown)";
    let stat = byHost.get(host);
    if (!stat) {
      stat = {
        host,
        category: action.category,
        actions: 0,
        users: 0,
        sensitive: 0,
        blocked: 0,
        allowed: 0,
        userSet: new Set(),
      };
      byHost.set(host, stat);
    }
    stat.actions += 1;
    if (action.sensitive) stat.sensitive += 1;
    if (action.result === "blocked") stat.blocked += 1;
    if (action.result === "allowed" || action.result === "bypassed") stat.allowed += 1;
    stat.userSet.add(action.actor);
  }
  return Array.from(byHost.values())
    .map(({ userSet, ...stat }) => ({ ...stat, users: userSet.size }))
    .sort((a, b) => b.actions - a.actions || b.sensitive - a.sensitive || a.host.localeCompare(b.host))
    .slice(0, limit);
}

function buildUserStats(actions: readonly UserAction[], limit: number): UserStat[] {
  const byUser = new Map<string, UserStat & { hostSet: Set<string> }>();
  for (const action of actions) {
    let stat = byUser.get(action.actor);
    if (!stat) {
      stat = {
        actor: action.actor,
        actorMasked: action.actorMasked,
        orgUnit: action.orgUnit,
        actions: 0,
        sensitive: 0,
        destinations: 0,
        hostSet: new Set(),
      };
      byUser.set(action.actor, stat);
    }
    stat.actions += 1;
    if (action.sensitive) stat.sensitive += 1;
    if (action.host) stat.hostSet.add(action.host);
  }
  return Array.from(byUser.values())
    .map(({ hostSet, ...stat }) => ({ ...stat, destinations: hostSet.size }))
    .sort((a, b) => b.actions - a.actions || b.sensitive - a.sensitive || a.actor.localeCompare(b.actor))
    .slice(0, limit);
}

function buildChannelStats(channel: Channel, actions: readonly UserAction[]): ChannelStats {
  const counters = newResultCounters();
  const users = new Set<string>();
  let uploads = 0;
  let pastes = 0;
  let sensitive = 0;
  for (const action of actions) {
    bumpResult(counters, action.result);
    users.add(action.actor);
    if (action.trigger === "file_upload") uploads += 1;
    if (action.trigger === "web_content_upload") pastes += 1;
    if (action.sensitive) sensitive += 1;
  }
  return {
    channel,
    actions: actions.length,
    uploads,
    pastes,
    users: users.size,
    sensitive,
    ...counters,
    topDestinations: buildDestinationStats(actions, 10),
    topUsers: buildUserStats(actions, 10),
  };
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values: readonly number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function hostOf(event: ChromeLogEvent): string {
  return hostFromUrl(event.url) || hostFromUrl(event.tabUrl) || hostFromUrl(event.destination);
}

function assembleActions(
  events: readonly ChromeLogEvent[],
  settings: AnalysisSettings,
  masker: IdentityMasker,
): UserAction[] {
  const transfers = events
    .filter((event) => TRANSFER_KINDS.has(event.eventKind))
    .map((event) => ({ event, actor: event.actor || event.triggerUser || event.profileUser || "(unknown)" }));

  transfers.sort((a, b) => {
    if (a.actor !== b.actor) return a.actor < b.actor ? -1 : 1;
    const ta = a.event.timestamp ?? Number.MAX_SAFE_INTEGER;
    const tb = b.event.timestamp ?? Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return a.event.rowIndex - b.event.rowIndex;
  });

  const actions: MutableAction[] = [];
  const open = new Map<string, MutableAction>();
  let currentActor = "";
  let sequence = 0;

  for (const { event, actor } of transfers) {
    if (actor !== currentActor) {
      open.clear();
      currentActor = actor;
    }
    const host = hostOf(event);
    const key = [event.trigger, host, event.contentName, event.contentSize ?? ""].join("\u0000");
    const existing = open.get(key);
    const ts = event.timestamp;

    if (
      existing &&
      ts !== null &&
      existing.firstTimestamp !== null &&
      ts - existing.firstTimestamp <= settings.dedupWindowMs
    ) {
      if (RESULT_SEVERITY[event.result] > RESULT_SEVERITY[existing.result]) existing.result = event.result;
      if (event.eventKind === "sensitive_data_transfer" || event.rules) existing.sensitive = true;
      if (event.eventKind === "malware_transfer") existing.malware = true;
      if (event.eventKind === "content_unscanned") existing.unscanned = true;
      uniquePush(existing.rules, splitList(event.rules));
      uniquePush(existing.reasons, splitList(event.reason));
      if (!existing.contentType && event.contentType) existing.contentType = event.contentType;
      if (!existing.identity) existing.identity = event.signedInAccount || event.profileUser;
      if (!existing.orgUnit && event.orgUnit) existing.orgUnit = event.orgUnit;
      existing.mergedRows += 1;
      continue;
    }

    sequence += 1;
    const identity = event.signedInAccount || event.profileUser;
    const action: MutableAction = {
      id: `A${String(sequence).padStart(6, "0")}`,
      timestamp: ts,
      actor,
      actorMasked: masker.mask(actor),
      orgUnit: event.orgUnit,
      trigger: event.trigger,
      direction: directionFor(event.trigger),
      host,
      registrableDomain: registrableDomain(host),
      url: event.url || event.tabUrl,
      contentName: event.contentName,
      contentType: event.contentType,
      contentSize: event.contentSize,
      result: event.result,
      sensitive: event.eventKind === "sensitive_data_transfer" || event.rules !== "",
      malware: event.eventKind === "malware_transfer",
      unscanned: event.eventKind === "content_unscanned",
      rules: splitList(event.rules),
      reasons: splitList(event.reason),
      channel: "unmanaged",
      category: "other",
      identity,
      identityMasked: masker.mask(identity),
      personalIdentity: false,
      mergedRows: 1,
      offHours: false,
      weekend: false,
      devicePlatform: event.devicePlatform,
      clientType: event.clientType,
      sourceFile: event.sourceFile,
      rowIndex: event.rowIndex,
      firstTimestamp: ts,
    };
    actions.push(action);
    open.set(key, action);
  }

  const corporate = settings.corporateDomains;
  const partner = settings.partnerDomains;
  const genAi = [...GENAI_HOSTS, ...settings.extraGenAiHosts];
  const messaging = [...MESSAGING_HOSTS, ...settings.extraMessagingHosts];

  for (const action of actions) {
    const identityDomain = emailDomain(action.identity);
    const corporateIdentity = identityDomain === "" || hostMatchesAny(identityDomain, corporate);
    const partnerIdentity = !corporateIdentity && hostMatchesAny(identityDomain, partner);
    action.personalIdentity = !corporateIdentity && !partnerIdentity;
    action.category = categorizeHost(action.host, settings.extraGenAiHosts, settings.extraMessagingHosts, "");

    const host = action.host;
    if (host && hostMatchesAny(host, corporate)) {
      action.channel = "internal";
    } else if (
      action.personalIdentity &&
      (isGoogleOwnedHost(host) || host === "" || !hostMatchesAny(host, genAi))
    ) {
      action.channel = "personal_account";
    } else if (hostMatchesAny(host, genAi)) {
      action.channel = hostMatchesAny(host, settings.sanctionedAiHosts) ? "sanctioned_ai" : "shadow_ai";
    } else if (hostMatchesAny(host, settings.sanctionedHosts)) {
      action.channel = "sanctioned";
    } else if (hostMatchesAny(host, partner)) {
      action.channel = "partner";
    } else if (hostMatchesAny(host, messaging)) {
      action.channel = "messaging";
    } else {
      action.channel = "unmanaged";
    }

    if (action.timestamp !== null) {
      const hour = localHour(action.timestamp, settings.timezoneOffsetMinutes);
      const weekday = localWeekday(action.timestamp, settings.timezoneOffsetMinutes);
      action.offHours = hour < settings.workHoursStart || hour >= settings.workHoursEnd;
      action.weekend = weekday === 0 || weekday === 6;
    }
  }

  actions.sort((a, b) => {
    const ta = a.timestamp ?? Number.MAX_SAFE_INTEGER;
    const tb = b.timestamp ?? Number.MAX_SAFE_INTEGER;
    return ta - tb || a.rowIndex - b.rowIndex;
  });

  return actions.map(({ firstTimestamp: _first, ...action }) => action);
}

function buildDaily(actions: readonly UserAction[], settings: AnalysisSettings): DailyPoint[] {
  const byDate = new Map<string, DailyPoint>();
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const action of actions) {
    if (action.timestamp === null) continue;
    min = Math.min(min, action.timestamp);
    max = Math.max(max, action.timestamp);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  const startKey = localDateKey(min, settings.timezoneOffsetMinutes);
  const totalDays = Math.min(
    MAX_DAILY_POINTS,
    Math.floor((max - min) / DAY_MS) + 2,
  );
  const [y, m, d] = startKey.split("-").map(Number);
  const startUtc = Date.UTC(y, m - 1, d);
  for (let i = 0; i < totalDays; i += 1) {
    const key = localDateKey(startUtc + i * DAY_MS, 0);
    if (key > localDateKey(max, settings.timezoneOffsetMinutes)) break;
    byDate.set(key, {
      date: key,
      outbound: 0,
      uploads: 0,
      pastes: 0,
      downloads: 0,
      prints: 0,
      sensitive: 0,
      blocked: 0,
      shadowAi: 0,
      personalAccount: 0,
    });
  }
  for (const action of actions) {
    if (action.timestamp === null) continue;
    const key = localDateKey(action.timestamp, settings.timezoneOffsetMinutes);
    const point = byDate.get(key);
    if (!point) continue;
    if (action.direction === "outbound") {
      point.outbound += 1;
      if (action.trigger === "file_upload") point.uploads += 1;
      if (action.trigger === "web_content_upload") point.pastes += 1;
      if (action.sensitive) point.sensitive += 1;
      if (action.result === "blocked") point.blocked += 1;
      if (action.channel === "shadow_ai") point.shadowAi += 1;
      if (action.channel === "personal_account") point.personalAccount += 1;
    } else if (action.direction === "inbound") {
      point.downloads += 1;
    } else if (action.direction === "print") {
      point.prints += 1;
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function detectAnomalies(daily: readonly DailyPoint[]): AnomalyPoint[] {
  if (daily.length < 4) return [];
  const values = daily.map((point) => point.outbound);
  const avg = mean(values);
  const sd = stdev(values, avg);
  if (sd === 0) return [];
  return daily
    .map((point) => ({
      date: point.date,
      outbound: point.outbound,
      zScore: round((point.outbound - avg) / sd, 2),
      baseline: round(avg, 1),
    }))
    .filter((point) => point.zScore >= 2 && point.outbound >= 5)
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, 5);
}

function buildOrgUnits(actions: readonly UserAction[]): OrgUnitStat[] {
  const byOu = new Map<string, OrgUnitStat & { userSet: Set<string> }>();
  for (const action of actions) {
    const ou = action.orgUnit || "(unknown)";
    let stat = byOu.get(ou);
    if (!stat) {
      stat = { orgUnit: ou, uploads: 0, pastes: 0, downloads: 0, prints: 0, sensitive: 0, users: 0, threat: 0, userSet: new Set() };
      byOu.set(ou, stat);
    }
    if (action.trigger === "file_upload") stat.uploads += 1;
    if (action.trigger === "web_content_upload") stat.pastes += 1;
    if (action.trigger === "file_download") stat.downloads += 1;
    if (action.trigger === "page_print") stat.prints += 1;
    if (action.sensitive) stat.sensitive += 1;
    if (action.direction === "outbound" && THREAT_CHANNELS.includes(action.channel)) stat.threat += 1;
    stat.userSet.add(action.actor);
  }
  return Array.from(byOu.values())
    .map(({ userSet, ...stat }) => ({ ...stat, users: userSet.size }))
    .sort((a, b) => b.uploads + b.pastes - (a.uploads + a.pastes) || b.threat - a.threat || a.orgUnit.localeCompare(b.orgUnit))
    .slice(0, 5);
}

function buildCategories(actions: readonly UserAction[]): CategoryStat[] {
  const byCategory = new Map<UrlCategory, CategoryStat & { userSet: Set<string> }>();
  const total = actions.length;
  for (const action of actions) {
    let stat = byCategory.get(action.category);
    if (!stat) {
      stat = { category: action.category, actions: 0, users: 0, sensitive: 0, blocked: 0, share: 0, userSet: new Set() };
      byCategory.set(action.category, stat);
    }
    stat.actions += 1;
    if (action.sensitive) stat.sensitive += 1;
    if (action.result === "blocked") stat.blocked += 1;
    stat.userSet.add(action.actor);
  }
  return Array.from(byCategory.values())
    .map(({ userSet, ...stat }) => ({ ...stat, users: userSet.size, share: total ? round(stat.actions / total) : 0 }))
    .sort((a, b) => b.actions - a.actions || a.category.localeCompare(b.category))
    .slice(0, 10);
}

function buildRules(actions: readonly UserAction[]): RuleStat[] {
  const byRule = new Map<string, RuleStat>();
  for (const action of actions) {
    for (const rule of action.rules) {
      let stat = byRule.get(rule);
      if (!stat) {
        stat = { rule, actions: 0, ...newResultCounters() };
        byRule.set(rule, stat);
      }
      stat.actions += 1;
      bumpResult(stat, action.result);
    }
  }
  return Array.from(byRule.values())
    .sort((a, b) => b.actions - a.actions || a.rule.localeCompare(b.rule))
    .slice(0, 10);
}

function buildConcentration(
  outbound: readonly UserAction[],
  allActions: readonly UserAction[],
  settings: AnalysisSettings,
): ConcentrationStats {
  const hostCounts = new Map<string, number>();
  const userCounts = new Map<string, number>();
  const userThreatHosts = new Map<string, Set<string>>();
  const userChannels = new Map<string, Set<Channel>>();
  const hourHistogram = new Array<number>(24).fill(0);
  let offHours = 0;
  let weekend = 0;
  let timed = 0;

  for (const action of outbound) {
    if (action.host) hostCounts.set(action.host, (hostCounts.get(action.host) ?? 0) + 1);
    userCounts.set(action.actor, (userCounts.get(action.actor) ?? 0) + 1);
    if (THREAT_CHANNELS.includes(action.channel)) {
      let set = userThreatHosts.get(action.actor);
      if (!set) {
        set = new Set();
        userThreatHosts.set(action.actor, set);
      }
      if (action.host) set.add(action.host);
    }
    let channels = userChannels.get(action.actor);
    if (!channels) {
      channels = new Set();
      userChannels.set(action.actor, channels);
    }
    channels.add(action.channel);
    if (action.timestamp !== null) {
      timed += 1;
      hourHistogram[localHour(action.timestamp, settings.timezoneOffsetMinutes)] += 1;
      if (action.offHours) offHours += 1;
      if (action.weekend) weekend += 1;
    }
  }

  const totalOutbound = outbound.length;
  let hhi = 0;
  let topShare = 0;
  if (totalOutbound > 0) {
    for (const count of hostCounts.values()) {
      const share = count / totalOutbound;
      hhi += share * share;
      topShare = Math.max(topShare, share);
    }
  }

  const sortedUsers = Array.from(userCounts.values()).sort((a, b) => b - a);
  const topUsers = Math.max(1, Math.ceil(sortedUsers.length * 0.1));
  const topUserActions = sortedUsers.slice(0, topUsers).reduce((sum, value) => sum + value, 0);

  let multiPortal = 0;
  for (const set of userThreatHosts.values()) {
    if (set.size >= 3) multiPortal += 1;
  }
  let personalAndCorporate = 0;
  for (const channels of userChannels.values()) {
    if (channels.has("personal_account") && (channels.has("sanctioned") || channels.has("internal"))) {
      personalAndCorporate += 1;
    }
  }
  void allActions;

  return {
    destinationHhi: round(hhi),
    topDestinationShare: round(topShare),
    top10PercentUserShare: totalOutbound ? round(topUserActions / totalOutbound) : 0,
    multiPortalUsers: multiPortal,
    usersWithPersonalAndCorporate: personalAndCorporate,
    offHoursShare: timed ? round(offHours / timed) : 0,
    weekendShare: timed ? round(weekend / timed) : 0,
    hourHistogram,
  };
}

function buildPrint(actions: readonly UserAction[]): PrintStats {
  const prints = actions.filter((action) => action.direction === "print");
  const docs = new Map<string, number>();
  for (const action of prints) {
    const name = action.contentName || action.url || "(untitled)";
    docs.set(name, (docs.get(name) ?? 0) + 1);
  }
  return {
    actions: prints.length,
    users: new Set(prints.map((action) => action.actor)).size,
    sensitive: prints.filter((action) => action.sensitive).length,
    blocked: prints.filter((action) => action.result === "blocked").length,
    topSources: buildDestinationStats(prints, 8),
    topUsers: buildUserStats(prints, 8),
    topDocuments: Array.from(docs.entries())
      .map(([name, count]) => ({ name, actions: count }))
      .sort((a, b) => b.actions - a.actions || a.name.localeCompare(b.name))
      .slice(0, 8),
  };
}

function buildInbound(actions: readonly UserAction[]): InboundStats {
  const downloads = actions.filter((action) => action.direction === "inbound");
  const types = new Map<string, number>();
  for (const action of downloads) {
    const ext = action.contentName.includes(".")
      ? action.contentName.slice(action.contentName.lastIndexOf(".") + 1).toLowerCase()
      : action.contentType || "(unknown)";
    types.set(ext, (types.get(ext) ?? 0) + 1);
  }
  return {
    downloads: downloads.length,
    users: new Set(downloads.map((action) => action.actor)).size,
    sensitive: downloads.filter((action) => action.sensitive).length,
    malware: downloads.filter((action) => action.malware).length,
    unscanned: downloads.filter((action) => action.unscanned).length,
    blocked: downloads.filter((action) => action.result === "blocked").length,
    warned: downloads.filter((action) => action.result === "warned").length,
    topSources: buildDestinationStats(downloads, 8),
    topFileTypes: Array.from(types.entries())
      .map(([type, count]) => ({ type, actions: count }))
      .sort((a, b) => b.actions - a.actions || a.type.localeCompare(b.type))
      .slice(0, 8),
  };
}

function buildSignals(events: readonly ChromeLogEvent[], actions: readonly UserAction[]): SignalStats {
  const unsafeHosts = new Map<string, number>();
  const extensions = new Map<string, number>();
  const passwordReuseUsers = new Set<string>();
  let passwordReuse = 0;
  let passwordChanged = 0;
  let unsafe = 0;
  let interstitials = 0;
  let logins = 0;
  let extensionInstalls = 0;
  let crashes = 0;
  let launches = 0;
  for (const event of events) {
    switch (event.eventKind) {
      case "password_reuse":
        passwordReuse += 1;
        if (event.actor) passwordReuseUsers.add(event.actor);
        break;
      case "password_changed":
        passwordChanged += 1;
        break;
      case "unsafe_site_visit": {
        unsafe += 1;
        const host = hostOf(event) || "(unknown)";
        unsafeHosts.set(host, (unsafeHosts.get(host) ?? 0) + 1);
        break;
      }
      case "url_filtering_interstitial":
        interstitials += 1;
        break;
      case "login_event":
        logins += 1;
        break;
      case "extension_install": {
        extensionInstalls += 1;
        const name = event.extensionName || event.extensionId || event.contentName || "(unknown)";
        extensions.set(name, (extensions.get(name) ?? 0) + 1);
        break;
      }
      case "browser_crash":
        crashes += 1;
        break;
      case "browser_launch":
        launches += 1;
        break;
      default:
        break;
    }
  }
  return {
    malware: actions.filter((action) => action.malware).length,
    unscanned: actions.filter((action) => action.unscanned).length,
    passwordReuse,
    passwordChanged,
    unsafeSiteVisits: unsafe,
    urlFilteringInterstitials: interstitials,
    loginEvents: logins,
    extensionInstalls,
    distinctExtensions: extensions.size,
    browserCrashes: crashes,
    browserLaunches: launches,
    topUnsafeHosts: Array.from(unsafeHosts.entries())
      .map(([host, count]) => ({ host, events: count }))
      .sort((a, b) => b.events - a.events || a.host.localeCompare(b.host))
      .slice(0, 6),
    topExtensions: Array.from(extensions.entries())
      .map(([name, count]) => ({ name, installs: count }))
      .sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name))
      .slice(0, 6),
    passwordReuseUsers: passwordReuseUsers.size,
  };
}

function buildRoadmap(
  totals: AnalysisTotals,
  channels: Record<Channel, ChannelStats>,
  inbound: InboundStats,
  print: PrintStats,
  signals: SignalStats,
): RoadmapItem[] {
  const items: RoadmapItem[] = [];
  items.push({ id: "audit_baseline", horizon: "now", preset: "audit", metric: totals.outbound, metricUsers: totals.users });
  if (channels.personal_account.actions > 0) {
    items.push({
      id: "personal_account_block",
      horizon: "now",
      preset: "personal_account",
      metric: channels.personal_account.actions,
      metricUsers: channels.personal_account.users,
    });
  }
  if (channels.shadow_ai.actions > 0) {
    items.push({
      id: "shadow_ai_block",
      horizon: "now",
      preset: "ai",
      metric: channels.shadow_ai.actions,
      metricUsers: channels.shadow_ai.users,
    });
  }
  const unmanagedTotal = channels.unmanaged.actions + channels.messaging.actions;
  if (unmanagedTotal > 0) {
    items.push({
      id: "unmanaged_warn",
      horizon: "next",
      preset: "full",
      metric: unmanagedTotal,
      metricUsers: Math.max(channels.unmanaged.users, channels.messaging.users),
    });
  }
  if (channels.sanctioned_ai.actions + channels.shadow_ai.actions > 0) {
    items.push({
      id: "sanctioned_ai_dlp",
      horizon: "next",
      preset: "ai",
      metric: channels.sanctioned_ai.actions + channels.shadow_ai.actions,
      metricUsers: Math.max(channels.sanctioned_ai.users, channels.shadow_ai.users),
    });
  }
  if (inbound.downloads > 0) {
    items.push({
      id: "download_scanning",
      horizon: "next",
      preset: "full",
      metric: inbound.malware + inbound.unscanned,
      metricUsers: inbound.downloads,
    });
  }
  items.push({
    id: "block_mode_posture",
    horizon: "later",
    preset: "endpoint",
    metric: totals.threatActions,
    metricUsers: totals.threatUsers,
  });
  if (print.actions > 0) {
    items.push({ id: "print_watermark", horizon: "later", preset: "full", metric: print.actions, metricUsers: print.users });
  }
  if (signals.passwordReuse > 0) {
    items.push({
      id: "password_alert",
      horizon: "later",
      preset: "endpoint",
      metric: signals.passwordReuse,
      metricUsers: signals.passwordReuseUsers,
    });
  }
  return items;
}

export interface AnalyzeInput {
  files: readonly NormalizedFile[];
  settings: AnalysisSettings;
  now?: number;
}

export function analyze({ files, settings: rawSettings, now = Date.now() }: AnalyzeInput): AnalysisResult {
  const settings: AnalysisSettings = {
    ...rawSettings,
    corporateDomains: normalizeDomainList(rawSettings.corporateDomains),
    partnerDomains: normalizeDomainList(rawSettings.partnerDomains),
    sanctionedAiHosts: normalizeDomainList(rawSettings.sanctionedAiHosts),
    sanctionedHosts: normalizeDomainList(rawSettings.sanctionedHosts),
    extraGenAiHosts: normalizeDomainList(rawSettings.extraGenAiHosts),
    extraMessagingHosts: normalizeDomainList(rawSettings.extraMessagingHosts),
  };

  const events: ChromeLogEvent[] = [];
  const fileSummaries: FileSummary[] = [];
  const mergedMapping = { ...(files[0]?.mapping ?? {}) };
  const unmappedHeaders = new Set<string>();
  for (const file of files) {
    events.push(...file.events);
    fileSummaries.push({
      name: file.file.name,
      rows: file.file.rows.length,
      parsedEvents: file.events.length,
      skippedRows: file.skipped,
      format: file.file.format,
      headers: file.file.headers,
    });
    for (const header of file.unmapped) unmappedHeaders.add(header);
    for (const [key, value] of Object.entries(file.mapping)) {
      if (value && !(key in mergedMapping)) Object.assign(mergedMapping, { [key]: value });
    }
  }

  const masker = new IdentityMasker(settings.maskIdentities);
  masker.prime(events.flatMap((event) => [event.actor, event.signedInAccount, event.profileUser]));

  const actions = assembleActions(events, settings, masker);
  const outbound = actions.filter((action) => action.direction === "outbound");
  const egress = outbound.filter((action) => action.channel !== "internal");
  const threat = outbound.filter((action) => THREAT_CHANNELS.includes(action.channel));

  const channels = {} as Record<Channel, ChannelStats>;
  for (const channel of ALL_CHANNELS) {
    channels[channel] = buildChannelStats(
      channel,
      outbound.filter((action) => action.channel === channel),
    );
  }

  const counters = newResultCounters();
  for (const action of actions) bumpResult(counters, action.result);

  const timestamps = events.map((event) => event.timestamp).filter((value): value is number => value !== null);
  const start = timestamps.length ? Math.min(...timestamps) : null;
  const end = timestamps.length ? Math.max(...timestamps) : null;
  const days =
    start !== null && end !== null
      ? new Set(timestamps.map((value) => localDateKey(value, settings.timezoneOffsetMinutes))).size
      : 0;

  const totals: AnalysisTotals = {
    events: events.length,
    actions: actions.length,
    outbound: outbound.length,
    uploads: outbound.filter((action) => action.trigger === "file_upload").length,
    pastes: outbound.filter((action) => action.trigger === "web_content_upload").length,
    downloads: actions.filter((action) => action.direction === "inbound").length,
    prints: actions.filter((action) => action.direction === "print").length,
    otherActions: actions.filter((action) => action.direction === "other").length,
    unclassified: actions.filter((action) => action.trigger === "unknown").length,
    sensitiveOutbound: outbound.filter((action) => action.sensitive).length,
    ...counters,
    users: new Set(actions.map((action) => action.actor)).size,
    destinations: new Set(outbound.map((action) => action.host).filter(Boolean)).size,
    orgUnits: new Set(actions.map((action) => action.orgUnit).filter(Boolean)).size,
    threatActions: threat.length,
    threatUsers: new Set(threat.map((action) => action.actor)).size,
    internalActions: channels.internal.actions,
    sanctionedActions: channels.sanctioned.actions + channels.sanctioned_ai.actions,
    personalProfileActions: outbound.filter((action) => action.personalIdentity).length,
  };

  const daily = buildDaily(actions, settings);
  const peakDay = daily.reduce<DailyPoint | null>(
    (best, point) => (best === null || point.outbound > best.outbound ? point : best),
    null,
  );

  const personalIdentityDomains = (() => {
    const map = new Map<string, { actions: number; users: Set<string> }>();
    for (const action of outbound) {
      if (action.channel !== "personal_account") continue;
      const domain = emailDomain(action.identity) || "(unknown)";
      let entry = map.get(domain);
      if (!entry) {
        entry = { actions: 0, users: new Set() };
        map.set(domain, entry);
      }
      entry.actions += 1;
      entry.users.add(action.actor);
    }
    return Array.from(map.entries())
      .map(([domain, entry]) => ({ domain, actions: entry.actions, users: entry.users.size }))
      .sort((a, b) => b.actions - a.actions || a.domain.localeCompare(b.domain))
      .slice(0, 8);
  })();

  const inbound = buildInbound(actions);
  const print = buildPrint(actions);
  const signals = buildSignals(events, actions);

  return {
    generatedAt: now,
    settings,
    files: fileSummaries,
    columnMapping: mergedMapping,
    unmappedHeaders: Array.from(unmappedHeaders),
    missingColumns: missingColumns(mergedMapping),
    dateRange: { start, end, days },
    totals,
    channels,
    daily,
    peakDay: peakDay && peakDay.outbound > 0 ? peakDay : null,
    anomalies: detectAnomalies(daily),
    concentration: buildConcentration(outbound, actions, settings),
    orgUnits: buildOrgUnits(actions),
    categories: buildCategories(egress),
    unmanagedDestinations: buildDestinationStats(
      outbound.filter((action) => action.channel === "unmanaged"),
      15,
    ),
    shadowAiDestinations: channels.shadow_ai.topDestinations,
    sanctionedAiDestinations: channels.sanctioned_ai.topDestinations,
    messagingDestinations: channels.messaging.topDestinations,
    personalAccountDestinations: channels.personal_account.topDestinations,
    personalIdentityDomains,
    rules: buildRules(actions),
    print,
    inbound,
    signals,
    roadmap: buildRoadmap(totals, channels, inbound, print, signals),
    suggestedCorporateDomains: suggestCorporateDomains(events),
    actions,
  };
}
