/**
 * Chrome audit log reader for the CERA tab.
 *
 * CERA analyzes Chrome Enterprise Premium log events (uploads, downloads,
 * pastes, prints, unsafe navigation) that administrators otherwise export from
 * Admin Console as CSV. This module fetches the same events directly through
 * the Admin SDK Reports API so the operator can skip the export step:
 *
 *   GET https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/chrome
 *
 * Design constraints:
 *
 * - Read-only. The Reports API has no narrower scope than
 *   `admin.reports.audit.readonly`; it exposes the audit activity feed only and
 *   grants no mutation surface anywhere.
 * - Runs as the signed-in Workspace administrator (`administratorTransport`),
 *   never as the impersonated deployer, because Reports authorizes against the
 *   administrator's Reports privilege.
 * - One page per call. The UI drives pagination so each
 *   `chrome.runtime.sendMessage` payload stays bounded and progress is visible.
 * - Nothing is persisted. Pages are returned to the page and held in memory by
 *   CERA exactly like a dropped CSV; the worker never writes them anywhere.
 */

import { consentRequired } from "../auth/tokens.ts";
import { GoogleApiError, type Transport } from "./executor.ts";

export const CHROME_AUDIT_ACTIVITIES_URL =
  "https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/chrome";

/** Reports API hard limit for `maxResults`. */
export const CHROME_AUDIT_PAGE_SIZE_MAX = 1000;

/** The Reports API keeps roughly six months; cap requests at that horizon. */
export const CHROME_AUDIT_MAX_RANGE_DAYS = 190;

/** `pageToken` values are opaque; this only bounds obviously malformed input. */
const PAGE_TOKEN_MAX_LENGTH = 4096;

export class ChromeAuditRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ChromeAuditRequestError";
    this.code = code;
  }
}

export interface ChromeAuditPageRequest {
  /** RFC 3339 timestamp, inclusive lower bound. */
  start_time: string;
  /** RFC 3339 timestamp, exclusive upper bound. */
  end_time: string;
  /** Opaque continuation token from the previous page. */
  page_token?: string | null;
  /** 1..1000, defaults to 1000. */
  max_results?: number;
}

export interface NormalizedChromeAuditPageRequest {
  startTime: string;
  endTime: string;
  pageToken: string | null;
  maxResults: number;
}

export interface ChromeAuditPage {
  application: "chrome";
  start_time: string;
  end_time: string;
  /** Raw Reports API `Activity` resources, untouched. */
  items: Record<string, unknown>[];
  item_count: number;
  /** Sum of `events[]` across the page; CERA flattens one row per event. */
  event_count: number;
  next_page_token: string | null;
}

function parseInstant(value: unknown, field: string): Date {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ChromeAuditRequestError(
      "chrome-audit-time-required",
      `${field} must be an RFC 3339 timestamp.`,
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ChromeAuditRequestError(
      "chrome-audit-time-invalid",
      `${field} is not a valid RFC 3339 timestamp.`,
    );
  }
  return parsed;
}

/**
 * Validate a page request from the UI and re-serialize it canonically.
 *
 * Times are re-emitted through `toISOString()` so the outbound query never
 * carries an operator-supplied string verbatim, and the range is bounded to
 * the retention window so a typo cannot turn into a multi-year crawl.
 */
export function normalizeChromeAuditPageRequest(raw: unknown): NormalizedChromeAuditPageRequest {
  if (raw === null || typeof raw !== "object") {
    throw new ChromeAuditRequestError(
      "chrome-audit-request-invalid",
      "Chrome audit page request must be an object.",
    );
  }
  const request = raw as Record<string, unknown>;
  const start = parseInstant(request.start_time, "start_time");
  const end = parseInstant(request.end_time, "end_time");
  if (start.getTime() >= end.getTime()) {
    throw new ChromeAuditRequestError(
      "chrome-audit-range-invalid",
      "start_time must be earlier than end_time.",
    );
  }
  const rangeDays = (end.getTime() - start.getTime()) / 86_400_000;
  if (rangeDays > CHROME_AUDIT_MAX_RANGE_DAYS) {
    throw new ChromeAuditRequestError(
      "chrome-audit-range-too-wide",
      `The requested range spans ${Math.ceil(rangeDays)} days; the Reports API keeps at most ${CHROME_AUDIT_MAX_RANGE_DAYS}.`,
    );
  }

  let pageToken: string | null = null;
  if (request.page_token !== undefined && request.page_token !== null) {
    if (typeof request.page_token !== "string") {
      throw new ChromeAuditRequestError(
        "chrome-audit-page-token-invalid",
        "page_token must be a string.",
      );
    }
    const trimmed = request.page_token.trim();
    if (trimmed.length > PAGE_TOKEN_MAX_LENGTH) {
      throw new ChromeAuditRequestError(
        "chrome-audit-page-token-invalid",
        "page_token is longer than the Reports API ever issues.",
      );
    }
    pageToken = trimmed === "" ? null : trimmed;
  }

  let maxResults = CHROME_AUDIT_PAGE_SIZE_MAX;
  if (request.max_results !== undefined && request.max_results !== null) {
    if (
      typeof request.max_results !== "number" ||
      !Number.isInteger(request.max_results) ||
      request.max_results < 1 ||
      request.max_results > CHROME_AUDIT_PAGE_SIZE_MAX
    ) {
      throw new ChromeAuditRequestError(
        "chrome-audit-max-results-invalid",
        `max_results must be an integer between 1 and ${CHROME_AUDIT_PAGE_SIZE_MAX}.`,
      );
    }
    maxResults = request.max_results;
  }

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    pageToken,
    maxResults,
  };
}

const INSUFFICIENT_SCOPE_PATTERN =
  /insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions/i;

/**
 * Chrome's identity cache can hand back a token minted before the Reports
 * scope existed in the manifest. The API answers 403 for that; the UI already
 * knows how to recover from `consent-required`, so surface it as that.
 */
function isInsufficientScope(error: GoogleApiError): boolean {
  if (error.status === 401) return true;
  if (error.status !== 403) return false;
  let serialized = "";
  try {
    serialized = JSON.stringify(error.payload);
  } catch {
    serialized = "";
  }
  return INSUFFICIENT_SCOPE_PATTERN.test(serialized) || INSUFFICIENT_SCOPE_PATTERN.test(error.message);
}

function countEvents(items: readonly Record<string, unknown>[]): number {
  let total = 0;
  for (const item of items) {
    const events = item.events;
    total += Array.isArray(events) ? events.length : 0;
  }
  return total;
}

/** Fetch a single page of Chrome audit activities as the administrator. */
export async function fetchChromeAuditPage(
  transport: Transport,
  request: NormalizedChromeAuditPageRequest,
): Promise<ChromeAuditPage> {
  const params: Record<string, string | number> = {
    startTime: request.startTime,
    endTime: request.endTime,
    maxResults: request.maxResults,
  };
  if (request.pageToken !== null) {
    params.pageToken = request.pageToken;
  }

  let payload: Record<string, unknown>;
  try {
    const response = await transport.requestJson("GET", CHROME_AUDIT_ACTIVITIES_URL, { params });
    payload = response.payload;
  } catch (error) {
    if (error instanceof GoogleApiError && isInsufficientScope(error)) {
      throw consentRequired(
        "The signed-in account has not granted admin.reports.audit.readonly. " +
          "Sign in again, or use Switch Google account to pick a Workspace administrator.",
      );
    }
    throw error;
  }

  const rawItems = payload.items;
  const items = Array.isArray(rawItems)
    ? rawItems.filter(
        (item): item is Record<string, unknown> => item !== null && typeof item === "object",
      )
    : [];
  const nextToken = payload.nextPageToken;

  return {
    application: "chrome",
    start_time: request.startTime,
    end_time: request.endTime,
    items,
    item_count: items.length,
    event_count: countEvents(items),
    next_page_token: typeof nextToken === "string" && nextToken !== "" ? nextToken : null,
  };
}
