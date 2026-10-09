/**
 * CERA Chrome audit reader: request shaping, pagination, and consent mapping.
 *
 * Goes through `route()` like the service worker does, with a recording
 * transport standing in for the Reports API, and asserts that:
 *
 * - the Reports request carries exactly the documented query parameters,
 * - pagination is driven by `pageToken` and nothing else is re-sent,
 * - the route runs on the administrator transport, never the deployer one,
 * - a 403 for a stale token missing the Reports scope surfaces as the
 *   `consent-required` flow the UI already handles, while every other Google
 *   failure passes through unchanged,
 * - malformed page requests are refused with a 400 before any network call.
 *
 * Run with:
 *   node --experimental-strip-types extension/scripts/verify-chrome-audit.ts
 */

const failures: string[] = [];
let passed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? `\n      ${detail}` : ""}`);
}

(globalThis as Record<string, unknown>).chrome = {
  runtime: { getManifest: () => ({ version: "0.0.0-test" }) },
  storage: { local: { get: async () => ({}), set: async () => undefined } },
  alarms: { create: async () => undefined, clear: async () => undefined },
};

const { route, RouteError } = await import("../src/background/router.ts");
import type { RouteContext } from "../src/background/router.ts";
import type { Transport, TransportResponse } from "../src/providers/executor.ts";
import { GoogleApiError } from "../src/providers/executor.ts";
import { AuthenticationError } from "../src/auth/tokens.ts";
import {
  CHROME_AUDIT_ACTIVITIES_URL,
  CHROME_AUDIT_MAX_RANGE_DAYS,
  CHROME_AUDIT_PAGE_SIZE_MAX,
  ChromeAuditRequestError,
  fetchChromeAuditPage,
  normalizeChromeAuditPageRequest,
} from "../src/providers/chrome-audit.ts";

const ROUTE = "/api/v1/cera/chrome-audit-events";

interface Recorded {
  method: string;
  url: string;
  params?: Record<string, string | number>;
  body?: Record<string, unknown>;
}

function recordingTransport(
  answer: (call: Recorded) => TransportResponse | Promise<TransportResponse>,
): { transport: Transport; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const transport: Transport = {
    async requestJson(method, url, options) {
      const call: Recorded = { method, url, params: options?.params, body: options?.jsonBody };
      calls.push(call);
      return answer(call);
    },
  };
  return { transport, calls };
}

function refusingTransport(label: string): Transport {
  return {
    async requestJson(method, url) {
      throw new Error(`${label} transport must not be used: ${method} ${url}`);
    },
  };
}

function context(administrator: Transport): RouteContext {
  return {
    discoveryTransport: refusingTransport("discovery"),
    transport: refusingTransport("deployer"),
    administratorTransport: administrator,
    cloudIdentity: async () => "deployer@example.com",
    operatorEmail: async () => "admin@example.com",
    accessPolicyId: async () => undefined,
    rememberAccessPolicyId: async () => undefined,
    bootstrapOwnershipPin: async () => undefined,
    assertBootstrapOperator: async () => undefined,
    checkpointBootstrapOwnershipPin: async () => undefined,
    clearBootstrapOwnershipPin: async () => undefined,
    legacyDeployerIdentity: async () => undefined,
    rememberDeployer: async () => undefined,
    requireDeployer: async () => {
      throw new AuthenticationError("deployer-required", "must not be called");
    },
    startApply: async () => ({ run_id: "run" }),
    resumeApply: async () => ({}),
    runState: async () => ({}),
  };
}

function activity(time: string, eventCount: number): Record<string, unknown> {
  return {
    kind: "admin#reports#activity",
    id: { time, uniqueQualifier: "1", applicationName: "chrome", customerId: "C0123" },
    actor: { email: "user@example.com", profileId: "1", callerType: "USER" },
    events: Array.from({ length: eventCount }, (_, index) => ({
      type: "CHROME_EVENTS",
      name: index % 2 === 0 ? "CONTENT_TRANSFER" : "SENSITIVE_DATA_TRANSFER",
      parameters: [
        { name: "URL", value: "https://chat.openai.com/" },
        { name: "TRIGGER_TYPE", value: "FILE_UPLOAD" },
        { name: "EVENT_RESULT", value: "BLOCKED" },
      ],
    })),
  };
}

const START = "2026-09-01T00:00:00.000Z";
const END = "2026-10-01T00:00:00.000Z";

// -- Request normalization -----------------------------------------------------

{
  const normalized = normalizeChromeAuditPageRequest({ start_time: START, end_time: END });
  check("defaults to the maximum page size", normalized.maxResults === CHROME_AUDIT_PAGE_SIZE_MAX);
  check("first page has no token", normalized.pageToken === null);
  check("times are re-serialized canonically",
    normalized.startTime === START && normalized.endTime === END);

  const offset = normalizeChromeAuditPageRequest({
    start_time: "2026-09-01T09:00:00+09:00",
    end_time: "2026-09-02T09:00:00+09:00",
  });
  check("offset timestamps are converted to UTC",
    offset.startTime === "2026-09-01T00:00:00.000Z" && offset.endTime === "2026-09-02T00:00:00.000Z",
    `${offset.startTime} .. ${offset.endTime}`);

  const withToken = normalizeChromeAuditPageRequest({
    start_time: START,
    end_time: END,
    page_token: "  abc  ",
    max_results: 250,
  });
  check("page token is trimmed", withToken.pageToken === "abc");
  check("explicit max_results honoured", withToken.maxResults === 250);

  const blankToken = normalizeChromeAuditPageRequest({ start_time: START, end_time: END, page_token: "" });
  check("blank page token means first page", blankToken.pageToken === null);

  const rejects = (name: string, raw: unknown, code: string): void => {
    try {
      normalizeChromeAuditPageRequest(raw);
      check(name, false, "did not throw");
    } catch (error) {
      check(name, error instanceof ChromeAuditRequestError && error.code === code,
        error instanceof Error ? `${(error as ChromeAuditRequestError).code ?? ""} ${error.message}` : String(error));
    }
  };
  rejects("rejects non-object request", null, "chrome-audit-request-invalid");
  rejects("rejects missing start_time", { end_time: END }, "chrome-audit-time-required");
  rejects("rejects unparsable end_time", { start_time: START, end_time: "yesterday" }, "chrome-audit-time-invalid");
  rejects("rejects inverted range", { start_time: END, end_time: START }, "chrome-audit-range-invalid");
  rejects("rejects empty range", { start_time: START, end_time: START }, "chrome-audit-range-invalid");
  rejects("rejects range wider than retention",
    { start_time: "2025-01-01T00:00:00Z", end_time: END }, "chrome-audit-range-too-wide");
  rejects("rejects non-string page token", { start_time: START, end_time: END, page_token: 12 },
    "chrome-audit-page-token-invalid");
  rejects("rejects oversized page token",
    { start_time: START, end_time: END, page_token: "x".repeat(5000) }, "chrome-audit-page-token-invalid");
  rejects("rejects zero max_results", { start_time: START, end_time: END, max_results: 0 },
    "chrome-audit-max-results-invalid");
  rejects("rejects max_results above the API limit",
    { start_time: START, end_time: END, max_results: CHROME_AUDIT_PAGE_SIZE_MAX + 1 },
    "chrome-audit-max-results-invalid");
  rejects("rejects fractional max_results", { start_time: START, end_time: END, max_results: 10.5 },
    "chrome-audit-max-results-invalid");

  const edge = normalizeChromeAuditPageRequest({
    start_time: new Date(Date.parse(END) - CHROME_AUDIT_MAX_RANGE_DAYS * 86_400_000).toISOString(),
    end_time: END,
  });
  check("range exactly at the retention cap is accepted", edge.endTime === END);
}

// -- Page fetch through the route ---------------------------------------------

{
  const pages: Record<string, Record<string, unknown>> = {
    first: {
      kind: "admin#reports#activities",
      etag: "e1",
      nextPageToken: "TOKEN-2",
      items: [activity("2026-09-30T23:00:00.000Z", 2), activity("2026-09-30T22:00:00.000Z", 1)],
    },
    second: {
      kind: "admin#reports#activities",
      etag: "e2",
      items: [activity("2026-09-29T10:00:00.000Z", 3)],
    },
  };
  const { transport, calls } = recordingTransport((call) => {
    const token = call.params?.pageToken;
    return { status: 200, payload: token === "TOKEN-2" ? pages.second : pages.first };
  });
  const ctx = context(transport);

  const first = (await route(ctx, "POST", ROUTE, { start_time: START, end_time: END })) as Record<string, unknown>;
  check("first page uses GET on the Reports chrome activities endpoint",
    calls.length === 1 && calls[0].method === "GET" && calls[0].url === CHROME_AUDIT_ACTIVITIES_URL,
    JSON.stringify(calls[0]));
  check("first page sends startTime/endTime/maxResults and no pageToken",
    calls[0]?.params?.startTime === START &&
      calls[0]?.params?.endTime === END &&
      calls[0]?.params?.maxResults === CHROME_AUDIT_PAGE_SIZE_MAX &&
      calls[0]?.params?.pageToken === undefined,
    JSON.stringify(calls[0]?.params));
  check("first page sends no body", calls[0]?.body === undefined);
  check("first page returns the raw activities", first.item_count === 2 && Array.isArray(first.items));
  check("first page counts events across activities", first.event_count === 3, String(first.event_count));
  check("first page surfaces the continuation token", first.next_page_token === "TOKEN-2");
  check("page echoes the canonical range",
    first.start_time === START && first.end_time === END && first.application === "chrome");

  const second = (await route(ctx, "POST", ROUTE, {
    start_time: START,
    end_time: END,
    page_token: first.next_page_token,
  })) as Record<string, unknown>;
  check("second page carries the continuation token",
    calls.length === 2 && calls[1].params?.pageToken === "TOKEN-2", JSON.stringify(calls[1]?.params));
  check("second page keeps the same range",
    calls[1]?.params?.startTime === START && calls[1]?.params?.endTime === END);
  check("last page reports no continuation", second.next_page_token === null);
  check("last page counts its events", second.item_count === 1 && second.event_count === 3);
}

{
  // Empty response: the API omits `items` entirely when nothing matched.
  const { transport } = recordingTransport(() => ({
    status: 200,
    payload: { kind: "admin#reports#activities", etag: "e0" },
  }));
  const page = (await route(context(transport), "POST", ROUTE, {
    start_time: START,
    end_time: END,
  })) as Record<string, unknown>;
  check("missing items yields an empty page",
    Array.isArray(page.items) && (page.items as unknown[]).length === 0 &&
      page.item_count === 0 && page.event_count === 0 && page.next_page_token === null,
    JSON.stringify(page));
}

{
  // Non-object entries in `items` are dropped rather than crashing the page.
  const { transport } = recordingTransport(() => ({
    status: 200,
    payload: { items: [null, "junk", activity("2026-09-29T10:00:00.000Z", 1)], nextPageToken: "" },
  }));
  const page = (await route(context(transport), "POST", ROUTE, {
    start_time: START,
    end_time: END,
  })) as Record<string, unknown>;
  check("non-object items are filtered", page.item_count === 1 && page.event_count === 1);
  check("blank nextPageToken means last page", page.next_page_token === null);
}

// -- Transport selection -------------------------------------------------------

{
  const { transport, calls } = recordingTransport(() => ({ status: 200, payload: {} }));
  const ctx = context(transport);
  await route(ctx, "POST", ROUTE, { start_time: START, end_time: END });
  check("route reads through the administrator transport only", calls.length === 1);
}

// -- Error mapping -------------------------------------------------------------

async function expectFailure(name: string, run: () => Promise<unknown>, predicate: (error: unknown) => boolean): Promise<void> {
  try {
    await run();
    check(name, false, "did not throw");
  } catch (error) {
    check(name, predicate(error),
      error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  }
}

{
  const insufficient = new GoogleApiError({
    status: 403,
    method: "GET",
    url: CHROME_AUDIT_ACTIVITIES_URL,
    payload: {
      error: {
        code: 403,
        message: "Request had insufficient authentication scopes.",
        status: "PERMISSION_DENIED",
        details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: "ACCESS_TOKEN_SCOPE_INSUFFICIENT" }],
      },
    },
  });
  const { transport } = recordingTransport(() => { throw insufficient; });
  await expectFailure(
    "403 insufficient scope becomes consent-required",
    () => route(context(transport), "POST", ROUTE, { start_time: START, end_time: END }),
    (error) => error instanceof AuthenticationError && error.code === "consent-required" &&
      /admin\.reports\.audit\.readonly/.test(error.message),
  );
}

{
  const unauthorized = new GoogleApiError({
    status: 401,
    method: "GET",
    url: CHROME_AUDIT_ACTIVITIES_URL,
    payload: { error: { code: 401, message: "Invalid Credentials", status: "UNAUTHENTICATED" } },
  });
  const { transport } = recordingTransport(() => { throw unauthorized; });
  await expectFailure(
    "401 becomes consent-required",
    () => route(context(transport), "POST", ROUTE, { start_time: START, end_time: END }),
    (error) => error instanceof AuthenticationError && error.code === "consent-required",
  );
}

{
  // A Workspace admin without the Reports privilege: a real 403 that must
  // reach the UI as-is so the operator sees the actual reason.
  const notAuthorized = new GoogleApiError({
    status: 403,
    method: "GET",
    url: CHROME_AUDIT_ACTIVITIES_URL,
    payload: {
      error: {
        code: 403,
        message: "Not Authorized to access this resource/api",
        errors: [{ domain: "global", reason: "forbidden", message: "Not Authorized to access this resource/api" }],
      },
    },
  });
  const { transport } = recordingTransport(() => { throw notAuthorized; });
  await expectFailure(
    "403 without Reports privilege passes through as GoogleApiError",
    () => route(context(transport), "POST", ROUTE, { start_time: START, end_time: END }),
    (error) => error === notAuthorized,
  );
}

{
  const quota = new GoogleApiError({
    status: 429,
    method: "GET",
    url: CHROME_AUDIT_ACTIVITIES_URL,
    payload: { error: { code: 429, message: "Quota exceeded" } },
  });
  const { transport } = recordingTransport(() => { throw quota; });
  await expectFailure(
    "429 passes through unchanged",
    () => route(context(transport), "POST", ROUTE, { start_time: START, end_time: END }),
    (error) => error === quota,
  );
}

{
  const { transport, calls } = recordingTransport(() => ({ status: 200, payload: {} }));
  await expectFailure(
    "malformed request is refused with 400 before any network call",
    () => route(context(transport), "POST", ROUTE, { start_time: END, end_time: START }),
    (error) => error instanceof RouteError && error.status === 400 && error.code === "chrome-audit-range-invalid",
  );
  check("validation failure made no Reports call", calls.length === 0);
  await expectFailure(
    "missing body is refused with 400",
    () => route(context(transport), "POST", ROUTE, undefined),
    (error) => error instanceof RouteError && error.status === 400,
  );
}

{
  // Direct provider call: the normalized request is forwarded verbatim.
  const { transport, calls } = recordingTransport(() => ({ status: 200, payload: {} }));
  await fetchChromeAuditPage(transport, {
    startTime: START,
    endTime: END,
    pageToken: "T",
    maxResults: 42,
  });
  check("provider forwards pageToken and maxResults",
    calls[0]?.params?.pageToken === "T" && calls[0]?.params?.maxResults === 42,
    JSON.stringify(calls[0]?.params));
}

// -- Result --------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`FAIL ${failures.length} Chrome audit check(s) failed (${passed} passed)`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`OK ${passed} Chrome audit checks passed`);
