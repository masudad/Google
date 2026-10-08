/**
 * Locale-aware date formatting that follows the language selected in the app
 * (mirrored onto `<html lang>`) rather than only the browser locale, so a
 * Japanese UI does not show en-US timestamps next to Japanese labels.
 */
function appLocale(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const lang = document.documentElement.lang;
  return lang ? lang : undefined;
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | number | Date): string {
  const date = toDate(value);
  if (!date) return typeof value === "string" ? value : "";
  try {
    return date.toLocaleString(appLocale());
  } catch {
    return date.toLocaleString();
  }
}

export function formatTime(value: string | number | Date): string {
  const date = toDate(value);
  if (!date) return typeof value === "string" ? value : "";
  try {
    return date.toLocaleTimeString(appLocale());
  } catch {
    return date.toLocaleTimeString();
  }
}
