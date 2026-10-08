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

function stringifyCell(value: JsonValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringifyCell(item)).join("; ");
  }
  return JSON.stringify(value);
}

/**
 * Flattens Reports API activity records (`items[].events[].parameters[]`) and
 * plain arrays of objects into header/row tables. Admin SDK parameter names
 * (TIMESTAMP, EVENT_RESULT, ...) are kept verbatim so the alias matcher can
 * resolve them like CSV headers.
 */
function flattenJson(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = JSON.parse(text.replace(/^\uFEFF/, "")) as JsonValue;
  const records: Record<string, string>[] = [];

  const pushRecord = (record: Record<string, string>) => {
    if (Object.keys(record).length > 0) records.push(record);
  };

  const flattenParameters = (
    params: JsonValue[],
    base: Record<string, string>,
  ): Record<string, string> => {
    const out = { ...base };
    for (const param of params) {
      if (!param || typeof param !== "object" || Array.isArray(param)) continue;
      const name = stringifyCell(param.name);
      if (!name) continue;
      const value =
        param.value ??
        param.intValue ??
        param.boolValue ??
        (Array.isArray(param.multiValue) ? param.multiValue : undefined) ??
        (Array.isArray(param.multiIntValue) ? param.multiIntValue : undefined) ??
        param.messageValue;
      out[name] = stringifyCell(value);
    }
    return out;
  };

  const handleActivity = (activity: { [key: string]: JsonValue }) => {
    const base: Record<string, string> = {};
    const id = activity.id;
    if (id && typeof id === "object" && !Array.isArray(id)) {
      base.time = stringifyCell(id.time);
    }
    const actor = activity.actor;
    if (actor && typeof actor === "object" && !Array.isArray(actor)) {
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
      if (!event || typeof event !== "object" || Array.isArray(event)) continue;
      const record: Record<string, string> = {
        ...base,
        event: stringifyCell(event.name),
        eventType: stringifyCell(event.type),
      };
      const params = Array.isArray(event.parameters) ? event.parameters : [];
      pushRecord(flattenParameters(params, record));
    }
  };

  const handleGeneric = (item: JsonValue) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    if (Array.isArray(item.events) || (item.id && typeof item.id === "object")) {
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

  if (Array.isArray(parsed)) {
    parsed.forEach(handleGeneric);
  } else if (parsed && typeof parsed === "object") {
    const items = Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.events)
        ? parsed.events
        : Array.isArray(parsed.rows)
          ? parsed.rows
          : Array.isArray(parsed.data)
            ? parsed.data
            : null;
    if (items) {
      items.forEach(handleGeneric);
    } else {
      handleGeneric(parsed);
    }
  }

  const headerSet = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) headerSet.add(key);
  }
  return { headers: Array.from(headerSet), rows: records };
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
