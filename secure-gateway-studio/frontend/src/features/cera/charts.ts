import type { Channel } from "./types";

export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const CHANNEL_COLORS: Record<Channel, string> = {
  personal_account: "#c5221f",
  shadow_ai: "#e37400",
  messaging: "#8430ce",
  unmanaged: "#1967d2",
  sanctioned_ai: "#188038",
  sanctioned: "#0b8f8a",
  partner: "#5f6368",
  internal: "#9aa0a6",
};

export const RESULT_COLORS = {
  blocked: "#c5221f",
  warned: "#e37400",
  bypassed: "#8430ce",
  detected: "#1967d2",
  allowed: "#9aa0a6",
};


function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export interface StackedSeries {
  label: string;
  color: string;
  values: number[];
}

export interface StackedBarOptions {
  width: number;
  height: number;
  categories: string[];
  series: StackedSeries[];
  line?: { label: string; color: string; values: number[] };
  highlight?: Set<string>;
  ariaLabel?: string;
}

/** Stacked daily bars with optional overlay line (e.g. sensitive actions). */
export function stackedBarSvg(options: StackedBarOptions): string {
  const { width, height, categories, series, line, highlight } = options;
  const margin = { top: 16, right: 16, bottom: 44, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const n = Math.max(categories.length, 1);
  const totals = categories.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const lineMax = line ? Math.max(...line.values, 0) : 0;
  const max = niceMax(Math.max(...totals, lineMax, 1));
  const slot = innerW / n;
  const barW = Math.max(2, Math.min(28, slot * 0.68));
  const y = (value: number) => margin.top + innerH - (value / max) * innerH;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(options.ariaLabel ?? "")}">`,
  );
  for (let g = 0; g <= 4; g += 1) {
    const value = (max / 4) * g;
    const gy = y(value);
    parts.push(`<line x1="${margin.left}" x2="${width - margin.right}" y1="${gy}" y2="${gy}" stroke="#e3e8ef" stroke-width="1"/>`);
    parts.push(`<text x="${margin.left - 8}" y="${gy + 4}" text-anchor="end" font-size="11" fill="#5f6b7a">${fmt(value)}</text>`);
  }
  categories.forEach((category, i) => {
    const x = margin.left + slot * i + (slot - barW) / 2;
    let acc = 0;
    series.forEach((s) => {
      const value = s.values[i] ?? 0;
      if (value <= 0) return;
      const top = y(acc + value);
      const h = y(acc) - top;
      parts.push(`<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${s.color}" rx="2"><title>${escapeHtml(category)} · ${escapeHtml(s.label)}: ${value}</title></rect>`);
      acc += value;
    });
    if (highlight?.has(category)) {
      parts.push(`<circle cx="${(x + barW / 2).toFixed(1)}" cy="${(y(acc) - 10).toFixed(1)}" r="5" fill="#c5221f"><title>${escapeHtml(category)}</title></circle>`);
    }
    const every = n > 16 ? Math.ceil(n / 12) : 1;
    if (i % every === 0 || i === n - 1) {
      const label = category.length > 5 ? category.slice(5) : category;
      parts.push(`<text x="${(x + barW / 2).toFixed(1)}" y="${height - margin.bottom + 16}" text-anchor="middle" font-size="11" fill="#5f6b7a">${escapeHtml(label)}</text>`);
    }
  });
  if (line && line.values.some((value) => value > 0)) {
    const points = line.values
      .map((value, i) => `${(margin.left + slot * i + slot / 2).toFixed(1)},${y(value).toFixed(1)}`)
      .join(" ");
    parts.push(`<polyline points="${points}" fill="none" stroke="${line.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  let lx = margin.left;
  const legendY = height - 10;
  for (const s of [...series, ...(line ? [{ label: line.label, color: line.color }] : [])]) {
    parts.push(`<rect x="${lx}" y="${legendY - 9}" width="10" height="10" rx="2" fill="${s.color}"/>`);
    parts.push(`<text x="${lx + 14}" y="${legendY}" font-size="11" fill="#354158">${escapeHtml(s.label)}</text>`);
    lx += 14 + s.label.length * 7 + 18;
  }
  parts.push("</svg>");
  return parts.join("");
}

export interface HBarItem {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

export function horizontalBarsSvg(items: HBarItem[], width: number, rowHeight = 26, labelWidth = 190): string {
  const max = Math.max(...items.map((item) => item.value), 1);
  const height = Math.max(items.length, 1) * rowHeight + 4;
  const barX = labelWidth + 8;
  const valueLabels = items.map((item) => `${item.value.toLocaleString()}${item.suffix ?? ""}`);
  const valueWidth = Math.max(40, ...valueLabels.map((label) => label.length * 6.6 + 10));
  const barMaxW = Math.max(40, width - barX - valueWidth);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">`);
  items.forEach((item, i) => {
    const y = i * rowHeight + 2;
    const w = Math.max(2, (item.value / max) * barMaxW);
    const label = item.label.length > 30 ? `${item.label.slice(0, 29)}…` : item.label;
    parts.push(`<text x="${labelWidth}" y="${y + rowHeight * 0.66}" text-anchor="end" font-size="12" fill="#243048">${escapeHtml(label)}</text>`);
    parts.push(`<rect x="${barX}" y="${y + 5}" width="${w.toFixed(1)}" height="${rowHeight - 10}" rx="3" fill="${item.color ?? "#1967d2"}"><title>${escapeHtml(item.label)}: ${item.value}</title></rect>`);
    parts.push(`<text x="${barX + w + 6}" y="${y + rowHeight * 0.66}" font-size="12" fill="#354158" font-variant-numeric="tabular-nums">${item.value.toLocaleString()}${escapeHtml(item.suffix ?? "")}</text>`);
  });
  parts.push("</svg>");
  return parts.join("");
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function donutSvg(segments: DonutSegment[], size = 200, centerLabel = "", centerValue = ""): string {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.max(14, size * 0.14);
  const circumference = 2 * Math.PI * r;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e3e8ef" stroke-width="${stroke}"/>`);
  let offset = 0;
  if (total > 0) {
    for (const segment of segments) {
      if (segment.value <= 0) continue;
      const length = (segment.value / total) * circumference;
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${segment.color}" stroke-width="${stroke}" stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${escapeHtml(segment.label)}: ${segment.value}</title></circle>`,
      );
      offset += length;
    }
  }
  if (centerValue) {
    parts.push(`<text x="${cx}" y="${cy + 2}" text-anchor="middle" font-size="${Math.round(size * 0.16)}" font-weight="700" fill="#172033">${escapeHtml(centerValue)}</text>`);
  }
  if (centerLabel) {
    parts.push(`<text x="${cx}" y="${cy + size * 0.13}" text-anchor="middle" font-size="11" fill="#5f6b7a">${escapeHtml(centerLabel)}</text>`);
  }
  parts.push("</svg>");
  return parts.join("");
}

export function hourHistogramSvg(values: number[], width: number, height: number, workStart: number, workEnd: number): string {
  const max = Math.max(...values, 1);
  const margin = { top: 6, right: 6, bottom: 18, left: 6 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const slot = innerW / 24;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">`);
  values.forEach((value, hour) => {
    const h = (value / max) * innerH;
    const x = margin.left + slot * hour;
    const offHours = hour < workStart || hour >= workEnd;
    parts.push(`<rect x="${(x + 1).toFixed(1)}" y="${(margin.top + innerH - h).toFixed(1)}" width="${(slot - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${offHours ? "#e37400" : "#1967d2"}"><title>${hour}:00 – ${value}</title></rect>`);
    if (hour % 6 === 0) {
      parts.push(`<text x="${(x + slot / 2).toFixed(1)}" y="${height - 4}" text-anchor="middle" font-size="10" fill="#5f6b7a">${hour}</text>`);
    }
  });
  parts.push("</svg>");
  return parts.join("");
}

export function outcomeBarSvg(
  counts: { blocked: number; warned: number; bypassed: number; detected: number; allowed: number },
  labels: Record<"blocked" | "warned" | "bypassed" | "detected" | "allowed", string>,
  width: number,
): string {
  const order = ["blocked", "warned", "bypassed", "detected", "allowed"] as const;
  const total = order.reduce((sum, key) => sum + counts[key], 0);
  const height = 44;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">`);
  let x = 0;
  if (total === 0) {
    parts.push(`<rect x="0" y="0" width="${width}" height="18" rx="4" fill="#e3e8ef"/>`);
  }
  for (const key of order) {
    const value = counts[key];
    if (value <= 0 || total === 0) continue;
    const w = (value / total) * width;
    parts.push(`<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="18" fill="${RESULT_COLORS[key]}"><title>${escapeHtml(labels[key])}: ${value}</title></rect>`);
    x += w;
  }
  let lx = 0;
  for (const key of order) {
    parts.push(`<rect x="${lx}" y="28" width="10" height="10" rx="2" fill="${RESULT_COLORS[key]}"/>`);
    const text = `${labels[key]} ${counts[key].toLocaleString()}`;
    parts.push(`<text x="${lx + 14}" y="37" font-size="11" fill="#354158">${escapeHtml(text)}</text>`);
    lx += 14 + text.length * 6.6 + 16;
  }
  parts.push("</svg>");
  return parts.join("");
}
