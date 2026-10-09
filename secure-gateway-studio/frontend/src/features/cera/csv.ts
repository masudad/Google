import type { ParsedFile } from "./types";

/**
 * Minimal, dependency-free RFC 4180 parser with delimiter sniffing.
 * Handles BOM, CRLF/LF, quoted fields with embedded newlines/quotes and
 * ragged rows (missing trailing cells become empty strings).
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const n = input.length;

  while (i < n) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

export function sniffDelimiter(text: string): "," | "\t" | ";" {
  const sample = text.slice(0, 20000);
  const firstLine = sample.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
  const counts: Array<[string, number]> = [
    ["\t", (firstLine.match(/\t/g) ?? []).length],
    [",", (firstLine.match(/,/g) ?? []).length],
    [";", (firstLine.match(/;/g) ?? []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  const [best, count] = counts[0];
  if (count === 0) return ",";
  return best as "," | "\t" | ";";
}

function looksLikeJson(text: string): boolean {
  const head = text.replace(/^\uFEFF/, "").trimStart();
  return head.startsWith("{") || head.startsWith("[");
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringifyCell(value: JsonValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringifyCell(item)).join("; ");
  }
  return JSON.stringify(value);
}

/** Scalar / list payload of a Reports API parameter, or `undefined` for message-typed ones. */
function scalarParameterValue(param: JsonObject): JsonValue | undefined {
  return (
    param.value ??
    param.intValue ??
    param.boolValue ??
    (Array.isArray(param.multiValue) ? param.multiValue : undefined) ??
    (Array.isArray(param.multiIntValue) ? param.multiIntValue : undefined)
  );
}

/**
 * Nested `messageValue` parameters (`{ parameter: [{ name, value }] }`) become
 * `NAME=value; NAME=value` so they stay readable in the mapping table and the
 * forensic export. Nested `RULE_NAME` entries are collected for the synthetic
 * `TRIGGERED_RULE_NAMES` column, which the alias matcher maps to `rules`.
 */
function flattenNestedMessage(message: JsonValue | undefined, ruleNames: string[]): string {
  if (!isJsonObject(message)) return stringifyCell(message);
  const nested = Array.isArray(message.parameter) ? message.parameter : [];
  const parts: string[] = [];
  for (const param of nested) {
    if (!isJsonObject(param)) continue;
    const name = stringifyCell(param.name);
    if (!name) continue;
    const value = stringifyCell(scalarParameterValue(param));
    if (name === "RULE_NAME" && value !== "") ruleNames.push(value);
    parts.push(`${name}=${value}`);
  }
  return parts.length > 0 ? parts.join("; ") : stringifyCell(message);
}

function flattenParameters(
  params: JsonValue[],
  base: Record<string, string>,
): Record<string, string> {
  const out = { ...base };
  const ruleNames: string[] = [];
  for (const param of params) {
    if (!isJsonObject(param)) continue;
    const name = stringifyCell(param.name);
    if (!name) continue;
    const scalar = scalarParameterValue(param);
    if (scalar !== undefined) {
      out[name] = stringifyCell(scalar);
      continue;
    }
    if (Array.isArray(param.multiMessageValue)) {
      out[name] = param.multiMessageValue
        .map((message) => flattenNestedMessage(message, ruleNames))
        .filter((text) => text !== "")
        .join(" | ");
      continue;
    }
    if (param.messageValue !== undefined) {
      out[name] = flattenNestedMessage(param.messageValue, ruleNames);
      continue;
    }
    out[name] = "";
  }
  if (ruleNames.length > 0 && !out.TRIGGERED_RULE_NAMES) {
    out.TRIGGERED_RULE_NAMES = Array.from(new Set(ruleNames)).join("; ");
  }
  return out;
}

/**
 * Flattens Reports API activity records (`items[].events[].parameters[]`) and
 * plain arrays of objects into header/row tables. Admin SDK parameter names
 * (TIMESTAMP, EVENT_RESULT, ...) are kept verbatim so the alias matcher can
 * resolve them like CSV headers. One row per event; an activity without
 * events still yields its actor/time row.
 */
export function flattenActivities(
  items: readonly unknown[],
): { headers: string[]; rows: Record<string, string>[] } {
  const records: Record<string, string>[] = [];

  const pushRecord = (record: Record<string, string>) => {
    if (Object.keys(record).length > 0) records.push(record);
  };

  const handleActivity = (activity: JsonObject) => {
    const base: Record<string, string> = {};
    const id = activity.id;
    if (isJsonObject(id)) {
      base.time = stringifyCell(id.time);
    }
    const actor = activity.actor;
    if (isJsonObject(actor)) {
      base.actor = stringifyCell(actor.email);
      base.profileId = stringifyCell(actor.profileId);
    }
    base.ipAddress = stringifyCell(activity.ipAddress);
    const events = Array.isArray(activity.events) ? activity.events : [];
    if (events.length === 0) {
      pushRecord(base);
      return;
    }
    for (const event of events) {
      if (!isJsonObject(event)) continue;
      const record: Record<string, string> = {
        ...base,
        event: stringifyCell(event.name),
        eventType: stringifyCell(event.type),
      };
      const params = Array.isArray(event.parameters) ? event.parameters : [];
      pushRecord(flattenParameters(params, record));
    }
  };

  const handleGeneric = (item: unknown) => {
    if (!isJsonObject(item)) return;
    if (Array.isArray(item.events) || isJsonObject(item.id)) {
      handleActivity(item);
      return;
    }
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(item)) {
      if (key === "parameters" && Array.isArray(value)) {
        Object.assign(record, flattenParameters(value, {}));
        continue;
      }
      record[key] = stringifyCell(value);
    }
    pushRecord(record);
  };

  items.forEach(handleGeneric);

  const headerSet = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) headerSet.add(key);
  }
  return { headers: Array.from(headerSet), rows: records };
}

/** Build a loadable file from activities fetched live through the Reports API. */
export function parsedFileFromActivities(name: string, items: readonly unknown[]): ParsedFile {
  const { headers, rows } = flattenActivities(items);
  return { name, format: "json", headers, rows };
}

function flattenJson(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = JSON.parse(text.replace(/^\uFEFF/, "")) as JsonValue;
  if (Array.isArray(parsed)) {
    return flattenActivities(parsed);
  }
  if (isJsonObject(parsed)) {
    const items = Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.events)
        ? parsed.events
        : Array.isArray(parsed.rows)
          ? parsed.rows
          : Array.isArray(parsed.data)
            ? parsed.data
            : null;
    return flattenActivities(items ?? [parsed]);
  }
  return { headers: [], rows: [] };
}

export function parseLogFile(name: string, text: string): ParsedFile {
  if (looksLikeJson(text)) {
    try {
      const { headers, rows } = flattenJson(text);
      return { name, format: "json", headers, rows };
    } catch {
      // fall through to delimited parsing
    }
  }
  const delimiter = sniffDelimiter(text);
  const table = parseDelimited(text, delimiter);
  if (table.length === 0) {
    return { name, format: delimiter === "\t" ? "tsv" : "csv", headers: [], rows: [] };
  }
  const headers = table[0].map((header) => header.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < table.length; r += 1) {
    const cells = table[r];
    const record: Record<string, string> = {};
    let hasValue = false;
    for (let c = 0; c < headers.length; c += 1) {
      const value = (cells[c] ?? "").trim();
      if (value !== "") hasValue = true;
      record[headers[c] || `column_${c + 1}`] = value;
    }
    if (hasValue) rows.push(record);
  }
  return { name, format: delimiter === "\t" ? "tsv" : "csv", headers, rows };
}

/** Serialises rows to RFC 4180 CSV with a UTF-8 BOM for Excel compatibility. */
export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const escapeCell = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    // Neutralise spreadsheet formula injection on export.
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    if (/[",\r\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
    return safe;
  };
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
