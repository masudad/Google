import type { Locale } from "../../lib/setup-state";
import type { AnalysisResult, Channel, DestinationStat, RoadmapHorizon, UserStat } from "./types";
import { THREAT_CHANNELS } from "./types";
import {
  CHANNEL_COLORS,
  donutSvg,
  escapeHtml as esc,
  horizontalBarsSvg,
  hourHistogramSvg,
  outcomeBarSvg,
  stackedBarSvg,
} from "./charts";
import { HIGH_RISK_CATEGORIES } from "./domains";
import { getCeraMessages, type CeraMessages } from "./messages";

export interface DeckOptions {
  locale: Locale;
  title: string;
  customer: string;
}

const SLIDE_W = 1280;
const SLIDE_H = 720;

function num(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "ja" ? "ja-JP" : "en-US");
}

function pct(value: number, locale: Locale): string {
  return `${(value * 100).toLocaleString(locale === "ja" ? "ja-JP" : "en-US", { maximumFractionDigits: 1 })}%`;
}

function dateLabel(timestamp: number | null, locale: Locale, offsetMinutes: number): string {
  if (timestamp === null) return "—";
  const local = new Date(timestamp + offsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return locale === "ja" ? `${y}/${m}/${d}` : `${y}-${m}-${d}`;
}

function kpi(label: string, value: string, tone: "default" | "danger" | "warning" | "success" | "muted" = "default", sub = ""): string {
  return `<div class="kpi kpi-${tone}"><span class="kpi-value">${esc(value)}</span><span class="kpi-label">${esc(label)}</span>${sub ? `<span class="kpi-sub">${esc(sub)}</span>` : ""}</div>`;
}

const NUMERIC_CELL = /^[\d\s.,%+−–-]+$/;

function table(headers: string[], rows: string[][], className = ""): string {
  if (rows.length === 0) return "";
  const numeric = headers.map((_, column) => column > 0 && rows.some((row) => NUMERIC_CELL.test(row[column] ?? "") && (row[column] ?? "").length > 0) && rows.every((row) => !row[column] || row[column] === "—" || NUMERIC_CELL.test(row[column])));
  const head = headers.map((header, i) => `<th${numeric[i] ? ' class="num"' : ""}>${esc(header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell, i) => `<td${numeric[i] ? ' class="num"' : ""}>${cell}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="tbl ${className}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function destinationRows(items: DestinationStat[], messages: CeraMessages, locale: Locale, withRisk = false): string[][] {
  return items.map((item) => {
    const row = [
      esc(item.host),
      esc(messages.labels.categories[item.category]),
      num(item.actions, locale),
      num(item.users, locale),
      num(item.sensitive, locale),
      num(item.blocked, locale),
    ];
    if (withRisk) {
      row.push(
        HIGH_RISK_CATEGORIES.includes(item.category)
          ? `<span class="pill pill-danger">${esc(messages.report.columns.highRisk)}</span>`
          : "",
      );
    }
    return row;
  });
}

function userRows(items: UserStat[], locale: Locale): string[][] {
  return items.map((item) => [esc(item.actorMasked), esc(item.orgUnit || "—"), num(item.actions, locale), num(item.sensitive, locale), num(item.destinations, locale)]);
}

function controlCard(messages: CeraMessages, result: AnalysisResult, ids: string[]): string {
  const items = result.roadmap.filter((item) => ids.includes(item.id));
  if (items.length === 0) return "";
  return items
    .map((item) => {
      const copy = messages.roadmap[item.id];
      if (!copy) return "";
      return `<aside class="control"><p class="control-eyebrow">${esc(messages.deck.suggestedControls)} · ${esc(messages.deck.easyPocPreset)}: ${esc(messages.labels.presets[item.preset])}</p><h3>${esc(copy.title)}</h3><p>${esc(copy.rationale(item.metric, item.metricUsers))}</p><ul>${copy.actions.map((action) => `<li>${esc(action)}</li>`).join("")}</ul></aside>`;
    })
    .join("");
}

function slide(index: number, total: number, messages: CeraMessages, title: string, subtitle: string, body: string, extraClass = ""): string {
  const className = extraClass ? `slide ${extraClass}` : "slide";
  return `<section class="${className}" data-index="${index}" aria-label="${esc(title)}"><header class="slide-head"><p class="eyebrow">${esc(messages.deck.coverEyebrow)}</p><h2>${esc(title)}</h2>${subtitle ? `<p class="subtitle">${esc(subtitle)}</p>` : ""}</header><div class="slide-body">${body}</div><footer class="slide-foot"><span>${esc(messages.deck.footer)}</span><span>${index} / ${total}</span></footer></section>`;
}

export function buildDeckHtml(result: AnalysisResult, options: DeckOptions): string {
  const { locale } = options;
  const messages = getCeraMessages(locale);
  const d = messages.deck;
  const c = messages.report.columns;
  const t = result.totals;
  const offset = result.settings.timezoneOffsetMinutes;
  const title = options.title.trim() || messages.settings.reportTitlePlaceholder;
  const customer = options.customer.trim();
  const period = `${dateLabel(result.dateRange.start, locale, offset)} – ${dateLabel(result.dateRange.end, locale, offset)} · ${num(result.dateRange.days, locale)}d`;
  const slides: string[] = [];
  const TOTAL = 13;
  let n = 0;

  // 1. Cover + baseline
  n += 1;
  slides.push(
    `<section class="slide cover" data-index="${n}" aria-label="${esc(title)}"><div class="cover-top"><p class="eyebrow">${esc(d.coverEyebrow)}</p><h1>${esc(title)}</h1><p class="cover-sub">${esc(d.coverSubtitle)}${customer ? ` · ${esc(customer)}` : ""}</p><p class="cover-meta">${esc(d.period)}: ${esc(period)}</p></div><div class="kpi-grid cover-kpis">${kpi(c.events, num(t.events, locale), "muted")}${kpi(c.actions, num(t.actions, locale), "muted")}${kpi(messages.report.kpis.users, num(t.users, locale), "muted")}${kpi(messages.report.kpis.outbound, num(t.outbound, locale))}${kpi(messages.report.kpis.threat, num(t.threatActions, locale), "danger", `${num(t.threatUsers, locale)} ${c.users}`)}${kpi(messages.report.kpis.sensitive, num(t.sensitiveOutbound, locale), "warning")}</div><p class="cover-note">${esc(d.generatedBy)} · ${esc(new Date(result.generatedAt).toISOString().slice(0, 10))} · ${esc(d.privacyNote)}</p><footer class="slide-foot"><span>${esc(d.footer)}</span><span>${n} / ${TOTAL}</span></footer></section>`,
  );

  // 2. Threat-vector matrix
  n += 1;
  {
    const rows = THREAT_CHANNELS.map((channel) => {
      const s = result.channels[channel];
      return [
        `<span class="dot" style="background:${CHANNEL_COLORS[channel]}"></span>${esc(messages.labels.channels[channel])}<br><small>${esc(messages.labels.channelDescriptions[channel])}</small>`,
        num(s.actions, locale),
        num(s.uploads, locale),
        num(s.pastes, locale),
        num(s.users, locale),
        num(s.sensitive, locale),
        num(s.blocked + s.warned, locale),
        num(s.allowed + s.bypassed, locale),
      ];
    });
    const benign = (["sanctioned_ai", "sanctioned", "partner", "internal"] as Channel[]).map((channel) => {
      const s = result.channels[channel];
      return [`<span class="dot" style="background:${CHANNEL_COLORS[channel]}"></span>${esc(messages.labels.channels[channel])}`, num(s.actions, locale), num(s.uploads, locale), num(s.pastes, locale), num(s.users, locale), num(s.sensitive, locale), num(s.blocked + s.warned, locale), num(s.allowed + s.bypassed, locale)];
    });
    const donut = donutSvg(
      THREAT_CHANNELS.map((channel) => ({ label: messages.labels.channels[channel], value: result.channels[channel].actions, color: CHANNEL_COLORS[channel] })),
      210,
      messages.report.kpis.threat,
      num(t.threatActions, locale),
    );
    const legend = THREAT_CHANNELS.map((channel) => `<li><span class="dot" style="background:${CHANNEL_COLORS[channel]}"></span>${esc(messages.labels.channels[channel])} <strong>${num(result.channels[channel].actions, locale)}</strong></li>`).join("");
    slides.push(
      slide(n, TOTAL, messages, d.matrixTitle, d.matrixSubtitle, `<div class="two-col wide-left"><div>${table([c.channel, c.actions, c.uploads, c.pastes, c.users, c.sensitive, `${c.blocked}/${c.warned}`, `${c.allowed}/${c.bypassed}`], rows, "matrix")}${table([c.channel, c.actions, c.uploads, c.pastes, c.users, c.sensitive, `${c.blocked}/${c.warned}`, `${c.allowed}/${c.bypassed}`], benign, "matrix benign")}</div><div class="center-col">${donut}<ul class="legend">${legend}</ul></div></div>`),
    );
  }

  // 3. Daily volume & anomalies
  n += 1;
  {
    const highlight = new Set(result.anomalies.map((a) => a.date));
    const chart = stackedBarSvg({
      width: 760,
      height: 300,
      categories: result.daily.map((p) => p.date),
      series: [
        { label: d.legendUploads, color: "#1967d2", values: result.daily.map((p) => p.uploads) },
        { label: d.legendPastes, color: "#8ab4f8", values: result.daily.map((p) => p.pastes) },
      ],
      line: { label: d.legendSensitive, color: "#c5221f", values: result.daily.map((p) => p.sensitive) },
      highlight,
      ariaLabel: d.dailyTitle,
    });
    const anomalyRows = result.anomalies.map((a) => [esc(a.date), num(a.outbound, locale), String(a.zScore), String(a.baseline)]);
    const hist = hourHistogramSvg(result.concentration.hourHistogram, 360, 110, result.settings.workHoursStart, result.settings.workHoursEnd);
    const side = `<div class="kpi-grid small">${kpi(messages.report.kpis.offHours, pct(result.concentration.offHoursShare, locale), "warning")}${kpi(messages.report.kpis.weekend, pct(result.concentration.weekendShare, locale), "warning")}</div><p class="chart-caption">${esc(d.hourLabel)}</p>${hist}<h4>${esc(messages.report.sections.anomalies)}</h4>${anomalyRows.length ? table([c.date, c.actions, c.zScore, c.baseline], anomalyRows, "compact") : `<p class="muted">${esc(messages.report.sections.noAnomalies)}</p>`}`;
    const peak = result.peakDay ? `<p class="chart-caption">${esc(messages.report.peakDay(result.peakDay.date, result.peakDay.outbound))}</p>` : "";
    slides.push(slide(n, TOTAL, messages, d.dailyTitle, d.dailySubtitle, `<div class="two-col wide-left"><div>${chart}${peak}</div><div>${side}</div></div>`));
  }

  // 4. Top OUs & categories
  n += 1;
  {
    const ouRows = result.orgUnits.map((ou) => [esc(ou.orgUnit), num(ou.uploads, locale), num(ou.pastes, locale), num(ou.downloads, locale), num(ou.prints, locale), num(ou.sensitive, locale), num(ou.threat, locale), num(ou.users, locale)]);
    const catBars = horizontalBarsSvg(
      result.categories.map((cat) => ({ label: messages.labels.categories[cat.category], value: cat.actions, color: cat.category === "genai" ? "#e37400" : HIGH_RISK_CATEGORIES.includes(cat.category) ? "#c5221f" : "#1967d2", suffix: ` · ${pct(cat.share, locale)}` })),
      420,
      28,
      150,
    );
    slides.push(slide(n, TOTAL, messages, d.orgTitle, "", `<div class="two-col wide-left"><div><h4>${esc(messages.report.sections.orgUnits)}</h4>${table([c.orgUnit, c.uploads, c.pastes, c.downloads, c.prints, c.sensitive, c.threat, c.users], ouRows, "compact")}</div><div><h4>${esc(d.categoryTitle)}</h4>${result.categories.length ? catBars : `<p class="muted">${esc(d.noneObserved)}</p>`}</div></div>`));
  }

  // 5. Personal accounts
  n += 1;
  {
    const s = result.channels.personal_account;
    const body = `<div class="kpi-grid">${kpi(c.actions, num(s.actions, locale), "danger")}${kpi(c.users, num(s.users, locale))}${kpi(c.sensitive, num(s.sensitive, locale), "warning")}${kpi(messages.report.kpis.topUsers.replace(/10%.*$/, "").trim() || c.users, num(result.concentration.usersWithPersonalAndCorporate, locale), "muted", messages.labels.channels.personal_account + " + " + messages.labels.channels.sanctioned)}</div><div class="two-col"><div><h4>${esc(c.destination)}</h4>${s.topDestinations.length ? table([c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked], destinationRows(s.topDestinations.slice(0, 8), messages, locale)) : `<p class="muted">${esc(d.noneObserved)}</p>`}<h4>${esc(c.identityDomain)}</h4>${result.personalIdentityDomains.length ? table([c.identityDomain, c.actions, c.users], result.personalIdentityDomains.map((row) => [esc(row.domain), num(row.actions, locale), num(row.users, locale)]), "compact") : ""}</div><div>${controlCard(messages, result, ["personal_account_block"]) || `<p class="muted">${esc(d.noneObserved)}</p>`}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.personalTitle, d.personalSubtitle, body));
  }

  // 6. Shadow AI vs sanctioned AI
  n += 1;
  {
    const shadow = result.channels.shadow_ai;
    const sanctioned = result.channels.sanctioned_ai;
    const pasteShare = shadow.actions ? pct(shadow.pastes / shadow.actions, locale) : "0%";
    const body = `<div class="kpi-grid">${kpi(messages.labels.channels.shadow_ai, num(shadow.actions, locale), "danger", `${num(shadow.users, locale)} ${c.users}`)}${kpi(`${messages.labels.channels.shadow_ai} · ${c.sensitive}`, num(shadow.sensitive, locale), "warning")}${kpi(`${messages.labels.channels.shadow_ai} · ${c.pastes}`, pasteShare, "muted")}${kpi(messages.labels.channels.sanctioned_ai, num(sanctioned.actions, locale), "success", `${num(sanctioned.users, locale)} ${c.users}`)}</div><div class="two-col"><div><h4>${esc(messages.labels.channels.shadow_ai)}</h4>${shadow.topDestinations.length ? table([c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked], destinationRows(shadow.topDestinations.slice(0, 8), messages, locale)) : `<p class="muted">${esc(d.noneObserved)}</p>`}<h4>${esc(messages.labels.channels.sanctioned_ai)}</h4>${sanctioned.topDestinations.length ? table([c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked], destinationRows(sanctioned.topDestinations.slice(0, 4), messages, locale), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}</div><div>${controlCard(messages, result, ["shadow_ai_block"]) || controlCard(messages, result, ["sanctioned_ai_dlp"]) || `<p class="muted">${esc(d.noneObserved)}</p>`}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.shadowAiTitle, d.shadowAiSubtitle, body));
  }

  // 7. Unmanaged cloud apps
  n += 1;
  {
    const s = result.channels.unmanaged;
    const body = `<div class="kpi-grid">${kpi(c.actions, num(s.actions, locale), "danger", `${num(s.users, locale)} ${c.users}`)}${kpi(c.sensitive, num(s.sensitive, locale), "warning")}${kpi(messages.report.kpis.destinations, num(result.unmanagedDestinations.length, locale), "muted")}${kpi(messages.report.kpis.hhi, num(Math.round(result.concentration.destinationHhi * 10000), locale), "muted", `${messages.report.kpis.multiPortal}: ${num(result.concentration.multiPortalUsers, locale)}`)}</div><div class="two-col wide-left"><div>${result.unmanagedDestinations.length ? table([c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked, c.risk], destinationRows(result.unmanagedDestinations.slice(0, 12), messages, locale, true), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}</div><div>${controlCard(messages, result, ["unmanaged_warn"])}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.unmanagedTitle, d.unmanagedSubtitle, body));
  }

  // 8. Messaging
  n += 1;
  {
    const s = result.channels.messaging;
    const body = `<div class="kpi-grid">${kpi(c.actions, num(s.actions, locale), "danger", `${num(s.users, locale)} ${c.users}`)}${kpi(c.uploads, num(s.uploads, locale))}${kpi(c.pastes, num(s.pastes, locale))}${kpi(c.sensitive, num(s.sensitive, locale), "warning")}</div><div class="two-col"><div>${s.topDestinations.length ? table([c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked], destinationRows(s.topDestinations.slice(0, 8), messages, locale)) : `<p class="muted">${esc(d.noneObserved)}</p>`}<h4>${esc(c.user)}</h4>${s.topUsers.length ? table([c.user, c.orgUnit, c.actions, c.sensitive, c.destination], userRows(s.topUsers.slice(0, 5), locale), "compact") : ""}</div><div>${controlCard(messages, result, ["unmanaged_warn"])}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.messagingTitle, d.messagingSubtitle, body));
  }

  // 9. Print
  n += 1;
  {
    const p = result.print;
    const body = `<div class="kpi-grid">${kpi(c.prints, num(p.actions, locale))}${kpi(c.users, num(p.users, locale))}${kpi(c.sensitive, num(p.sensitive, locale), "warning")}${kpi(c.blocked, num(p.blocked, locale), "muted")}</div><div class="two-col"><div><h4>${esc(c.document)}</h4>${p.topDocuments.length ? table([c.document, c.actions], p.topDocuments.map((doc) => [esc(doc.name), num(doc.actions, locale)]), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}<h4>${esc(c.source)}</h4>${p.topSources.length ? table([c.source, c.category, c.actions, c.users, c.sensitive, c.blocked], destinationRows(p.topSources.slice(0, 5), messages, locale), "compact") : ""}</div><div><h4>${esc(c.user)}</h4>${p.topUsers.length ? table([c.user, c.orgUnit, c.actions, c.sensitive, c.destination], userRows(p.topUsers.slice(0, 6), locale), "compact") : ""}${controlCard(messages, result, ["print_watermark"])}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.printTitle, d.printSubtitle, body));
  }

  // 10. Inbound & policy outcomes
  n += 1;
  {
    const i = result.inbound;
    const outcome = outcomeBarSvg({ blocked: t.blocked, warned: t.warned, bypassed: t.bypassed, detected: t.detected, allowed: t.allowed }, { blocked: c.blocked, warned: c.warned, bypassed: c.bypassed, detected: c.detected, allowed: c.allowed }, 540);
    const ruleRows = result.rules.map((rule) => [esc(rule.rule), num(rule.actions, locale), num(rule.blocked, locale), num(rule.warned, locale), num(rule.bypassed, locale), num(rule.allowed + rule.detected, locale)]);
    const body = `<div class="kpi-grid">${kpi(c.downloads, num(i.downloads, locale), "default", `${num(i.users, locale)} ${c.users}`)}${kpi(c.malware, num(i.malware, locale), "danger")}${kpi(c.unscanned, num(i.unscanned, locale), "warning")}${kpi(c.sensitive, num(i.sensitive, locale), "warning")}${kpi(c.blocked, num(i.blocked, locale), "muted")}</div><div class="two-col"><div><h4>${esc(c.source)}</h4>${i.topSources.length ? table([c.source, c.category, c.actions, c.users, c.sensitive, c.blocked], destinationRows(i.topSources.slice(0, 6), messages, locale), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}<h4>${esc(c.fileType)}</h4><p class="inline-list">${i.topFileTypes.map((ft) => `<span class="pill">${esc(ft.type)} ${num(ft.actions, locale)}</span>`).join(" ")}</p></div><div><h4>${esc(messages.report.sections.policy)}</h4>${outcome}${ruleRows.length ? table([c.rule, c.actions, c.blocked, c.warned, c.bypassed, `${c.allowed}/${c.detected}`], ruleRows.slice(0, 6), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.inboundTitle, d.inboundSubtitle, body));
  }

  // 11. Security signals
  n += 1;
  {
    const s = result.signals;
    const body = `<div class="kpi-grid five">${kpi(c.malware, num(s.malware, locale), "danger")}${kpi(c.unscanned, num(s.unscanned, locale), "warning")}${kpi("Password reuse", num(s.passwordReuse, locale), "danger", `${num(s.passwordReuseUsers, locale)} ${c.users}`)}${kpi("Unsafe site visits", num(s.unsafeSiteVisits, locale), "warning")}${kpi("URL filtering", num(s.urlFilteringInterstitials, locale), "muted")}${kpi("Login events", num(s.loginEvents, locale), "muted")}${kpi(c.extension, num(s.extensionInstalls, locale), "muted", `${num(s.distinctExtensions, locale)} distinct`)}${kpi("Browser launches", num(s.browserLaunches, locale), "muted")}${kpi("Browser crashes", num(s.browserCrashes, locale), "muted")}${kpi("Password changed", num(s.passwordChanged, locale), "muted")}</div><div class="two-col"><div><h4>Unsafe hosts</h4>${s.topUnsafeHosts.length ? table(["Host", c.events], s.topUnsafeHosts.map((h) => [esc(h.host), num(h.events, locale)]), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}</div><div><h4>${esc(c.extension)}</h4>${s.topExtensions.length ? table([c.extension, c.installs], s.topExtensions.map((e) => [esc(e.name), num(e.installs, locale)]), "compact") : `<p class="muted">${esc(d.noneObserved)}</p>`}${controlCard(messages, result, ["password_alert"])}</div></div>`;
    slides.push(slide(n, TOTAL, messages, d.signalsTitle, d.signalsSubtitle, body));
  }

  // 12. Roadmap
  n += 1;
  {
    const columns = (["now", "next", "later"] as RoadmapHorizon[])
      .map((horizon) => {
        const items = result.roadmap.filter((item) => item.horizon === horizon);
        const cards = items
          .map((item) => {
            const copy = messages.roadmap[item.id];
            if (!copy) return "";
            return `<article class="road-card"><span class="pill pill-preset">${esc(messages.labels.presets[item.preset])}</span><h4>${esc(copy.title)}</h4><p>${esc(copy.rationale(item.metric, item.metricUsers))}</p><ul>${copy.actions.slice(0, 1).map((action) => `<li>${esc(action)}</li>`).join("")}</ul></article>`;
          })
          .join("");
        return `<div class="road-col"><h3>${esc(messages.labels.horizons[horizon])} <small>${esc(messages.labels.horizonWindows[horizon])}</small></h3>${cards || `<p class="muted">${esc(d.noneObserved)}</p>`}</div>`;
      })
      .join("");
    slides.push(slide(n, TOTAL, messages, d.roadmapTitle, d.roadmapSubtitle, `<div class="road-grid">${columns}</div>`));
  }

  // 13. Appendix
  n += 1;
  {
    const mappingRows = Object.entries(result.columnMapping).map(([key, header]) => [esc(messages.mapping.columnLabels[key] ?? key), esc(header ?? "")]);
    const fileRows = result.files.map((file) => [esc(file.name), esc(file.format.toUpperCase()), num(file.rows, locale), num(file.parsedEvents, locale), num(file.skippedRows, locale)]);
    const skipped = result.files.reduce((sum, file) => sum + file.skippedRows, 0);
    const settingsList = `<ul class="settings-list"><li><strong>${esc(messages.settings.corporateDomains)}:</strong> ${esc(result.settings.corporateDomains.join(", ") || "—")}</li><li><strong>${esc(messages.settings.partnerDomains)}:</strong> ${esc(result.settings.partnerDomains.join(", ") || "—")}</li><li><strong>${esc(messages.settings.sanctionedAi)}:</strong> ${esc(result.settings.sanctionedAiHosts.join(", ") || "—")}</li><li><strong>${esc(messages.settings.sanctionedSuites)}:</strong> ${num(result.settings.sanctionedHosts.length, locale)}</li><li><strong>${esc(messages.settings.workHours)}:</strong> ${result.settings.workHoursStart}:00–${result.settings.workHoursEnd}:00 · UTC${result.settings.timezoneOffsetMinutes >= 0 ? "+" : "−"}${Math.abs(result.settings.timezoneOffsetMinutes) / 60}</li><li><strong>${esc(messages.settings.mask)}:</strong> ${result.settings.maskIdentities ? "on" : "off"}</li></ul>`;
    const body = `<div class="two-col"><div><ul class="method-list">${messages.report.methodologyItems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>${settingsList}</div><div><h4>${esc(d.sources)}</h4>${table([messages.ingest.fileHeaders[0], messages.ingest.fileHeaders[1], messages.ingest.fileHeaders[2], messages.ingest.fileHeaders[3], messages.ingest.fileHeaders[4]], fileRows, "compact")}${skipped ? `<p class="muted">${esc(d.unparsedNote(skipped))}</p>` : ""}<h4>${esc(d.mappingNote)}</h4><div class="mapping-wrap">${table([c.channel.length ? "Field" : "Field", "Header"], mappingRows, "compact tiny")}</div></div></div>`;
    slides.push(slide(n, TOTAL, messages, d.appendixTitle, d.appendixSubtitle, body));
  }

  const css = `
:root{--ink:#172033;--ink-2:#354158;--muted:#5f6b7a;--line:#e3e8ef;--bg:#0b1830;--accent:#1a73e8;--danger:#c5221f;--warning:#e37400;--success:#188038}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:Inter,"Noto Sans JP","Hiragino Sans","Yu Gothic UI",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.slide{width:${SLIDE_W}px;height:${SLIDE_H}px;background:#fff;padding:44px 56px 40px;position:relative;overflow:hidden;display:none;flex-direction:column;border-radius:4px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.slide.active{display:flex;transform:scale(var(--scale,1));transform-origin:center center}
.slide-head{margin-bottom:14px}
.eyebrow{margin:0 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700}
h1{font-size:46px;line-height:1.1;margin:8px 0 10px;letter-spacing:-.01em}
h2{font-size:30px;line-height:1.15;margin:0;letter-spacing:-.01em}
h3{font-size:16px;margin:0 0 6px}
h4{font-size:13px;margin:12px 0 6px;color:var(--ink-2);text-transform:uppercase;letter-spacing:.06em}
.subtitle{margin:6px 0 0;color:var(--muted);font-size:15px}
.slide-body{flex:1;min-height:0;font-size:13px;line-height:1.45}
.slide-foot{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);border-top:1px solid var(--line);padding-top:8px;margin-top:10px}
.cover{background:linear-gradient(135deg,#0b1830 0%,#102746 60%,#0d3b66 100%);color:#fff;justify-content:space-between}
.cover .eyebrow{color:#8ab4f8}
.cover h1{color:#fff;font-size:52px;max-width:1000px}
.cover-sub{font-size:20px;color:#c9d6ea;margin:0}
.cover-meta{margin:10px 0 0;color:#8ab4f8;font-size:14px}
.cover-kpis .kpi{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}
.cover-kpis .kpi-value,.cover-kpis .kpi-label,.cover-kpis .kpi-sub{color:#fff}
.cover-kpis .kpi-danger .kpi-value{color:#ff8a80}
.cover-kpis .kpi-warning .kpi-value{color:#ffcc80}
.cover-note{font-size:12px;color:#aab8cc;margin:0}
.cover .slide-foot{border-color:rgba(255,255,255,.18);color:#aab8cc}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.kpi-grid.small{grid-template-columns:1fr 1fr;margin-bottom:8px}
.kpi-grid.five{grid-template-columns:repeat(5,1fr)}
.kpi{border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;background:#fafbfd}
.kpi-value{font-size:28px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.kpi-label{font-size:12px;color:var(--muted)}
.kpi-sub{font-size:11px;color:var(--muted)}
.kpi-danger .kpi-value{color:var(--danger)}
.kpi-warning .kpi-value{color:var(--warning)}
.kpi-success .kpi-value{color:var(--success)}
.kpi-muted .kpi-value{color:var(--ink-2)}
.two-col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;min-height:0}
.two-col.wide-left{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}
.two-col svg{max-width:100%;height:auto}
.center-col{display:flex;flex-direction:column;align-items:center;gap:10px}
.tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.tbl th{text-align:left;font-weight:600;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--line);padding:6px 8px;white-space:nowrap}
.tbl td{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.tbl td.num,.tbl th.num{text-align:right;font-variant-numeric:tabular-nums}
.tbl.compact td,.tbl.compact th{padding:4px 6px;font-size:11.5px}
.tbl.tiny td,.tbl.tiny th{padding:2px 6px;font-size:10.5px}
.tbl.matrix td:first-child{font-weight:600}
.tbl.matrix small{font-weight:400;color:var(--muted);font-size:11px}
.tbl.benign{margin-top:10px;opacity:.75}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
.legend{list-style:none;padding:0;margin:0;font-size:13px;display:grid;gap:6px}
.legend strong{margin-left:6px;font-variant-numeric:tabular-nums}
.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:11px;background:#fff;margin:2px 2px 2px 0}
.pill-danger{background:#fce8e6;border-color:#f6aea9;color:var(--danger);font-weight:600}
.pill-preset{background:#e8f0fe;border-color:#aecbfa;color:#174ea6;font-weight:600}
.muted{color:var(--muted)}
.chart-caption{margin:4px 0 0;font-size:12px;color:var(--muted)}
.control{border:1px solid #aecbfa;background:#f3f7fe;border-radius:12px;padding:14px 16px;margin-top:4px}
.control-eyebrow{margin:0 0 4px;font-size:11px;color:#174ea6;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.control h3{font-size:15px;margin:0 0 6px}
.control p{margin:0 0 8px;color:var(--ink-2)}
.control ul{margin:0;padding-left:18px;display:grid;gap:4px}
.road-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;height:100%;min-height:0}
.road-col{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.road-col h3{font-size:17px;border-bottom:2px solid var(--accent);padding-bottom:5px;margin-bottom:8px;flex:0 0 auto}
.road-col h3 small{font-weight:500;color:var(--muted);font-size:12px;margin-left:6px}
.road-card{border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin-bottom:8px;background:#fafbfd;flex:0 1 auto;min-height:0;overflow:hidden}
.road-card .pill{margin:0 0 2px;font-size:10px;padding:1px 7px}
.road-card h4{margin:4px 0 3px;text-transform:none;letter-spacing:0;font-size:12.5px;line-height:1.3;color:var(--ink)}
.road-card p{margin:0 0 4px;font-size:11px;line-height:1.4;color:var(--ink-2)}
.road-card ul{margin:0;padding-left:14px;font-size:10.5px;line-height:1.4;color:var(--ink-2)}
.method-list{margin:0 0 12px;padding-left:18px;display:grid;gap:6px;font-size:12px}
.settings-list{list-style:none;padding:0;margin:0;font-size:11.5px;display:grid;gap:3px;color:var(--ink-2)}
.inline-list{margin:0}
.mapping-wrap{max-height:250px;overflow:hidden;columns:2;column-gap:16px}
.hud{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;background:rgba(7,23,46,.85);color:#fff;padding:6px 10px;border-radius:999px;font-size:12px;backdrop-filter:blur(6px);z-index:10}
.hud button{background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:999px;padding:4px 10px;cursor:pointer;font:inherit}
.hud button:hover{background:rgba(255,255,255,.12)}
.hud .hint{color:#aab8cc;margin-left:6px}
body.overview .stage{position:static;display:block;padding:24px 0}
body.overview .slide{display:flex;transform:scale(.6);transform-origin:top center;margin:-${Math.round(SLIDE_H * 0.4)}px auto 0;height:${SLIDE_H}px}
body.overview .slide:first-child{margin-top:0}
@media print{
  @page{size: 13.333in 7.5in;margin:0}
  html,body{background:#fff}
  .stage{position:static;display:block}
  .slide{display:flex !important;transform:none !important;margin:0;box-shadow:none;border-radius:0;page-break-after:always;break-after:page;width:13.333in;height:7.5in;padding:0.46in 0.58in 0.42in}
  .slide:last-child{page-break-after:auto;break-after:auto}
  .hud{display:none}
}`;

  const js = `(function(){var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));var idx=0;var counter=document.getElementById('counter');function fit(){var s=Math.min(window.innerWidth/${SLIDE_W},window.innerHeight/${SLIDE_H})*0.96;document.documentElement.style.setProperty('--scale',String(Math.max(0.2,s)));}function show(i){idx=Math.max(0,Math.min(slides.length-1,i));slides.forEach(function(el,j){el.classList.toggle('active',j===idx);});if(counter){counter.textContent=(idx+1)+' / '+slides.length;}if(history.replaceState){history.replaceState(null,'','#'+(idx+1));}}function next(){show(idx+1);}function prev(){show(idx-1);}document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '||e.key==='ArrowDown'){e.preventDefault();next();}else if(e.key==='ArrowLeft'||e.key==='PageUp'||e.key==='ArrowUp'){e.preventDefault();prev();}else if(e.key==='Home'){show(0);}else if(e.key==='End'){show(slides.length-1);}else if(e.key==='p'||e.key==='P'){document.body.classList.toggle('overview');}});document.getElementById('next').addEventListener('click',next);document.getElementById('prev').addEventListener('click',prev);document.getElementById('print').addEventListener('click',function(){window.print();});document.getElementById('overview').addEventListener('click',function(){document.body.classList.toggle('overview');});document.querySelector('.stage').addEventListener('click',function(e){if(document.body.classList.contains('overview')){return;}if(e.target.closest('a,button')){return;}var rect=document.body.getBoundingClientRect();if(e.clientX-rect.left>rect.width/2){next();}else{prev();}});window.addEventListener('resize',fit);window.addEventListener('beforeprint',function(){slides.forEach(function(el){el.classList.add('active');});});window.addEventListener('afterprint',function(){show(idx);});fit();var h=parseInt((location.hash||'').replace('#',''),10);show(isNaN(h)?0:h-1);})();`;

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}${customer ? ` · ${esc(customer)}` : ""}</title>
<style>${css}</style>
</head>
<body>
<div class="stage" id="deck">
${slides.join("\n")}
</div>
<div class="hud" role="toolbar" aria-label="Deck controls"><button type="button" id="prev" aria-label="Previous">‹</button><span id="counter">1 / ${TOTAL}</span><button type="button" id="next" aria-label="Next">›</button><button type="button" id="overview">P</button><button type="button" id="print">PDF</button><span class="hint">${esc(d.navHint)} ${esc(d.printHint)}</span></div>
<script>${js}</script>
</body>
</html>
`;
}
