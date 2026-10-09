import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CeraPage } from "./CeraPage";
import * as api from "../../lib/api";
import { ApiError, runtimeCapabilities } from "../../lib/api";

const mutableCapabilities = runtimeCapabilities as unknown as { chromeAuditFetch: boolean };

function activity(time: string, eventCount: number): Record<string, unknown> {
  return {
    id: { time, uniqueQualifier: "1", applicationName: "chrome", customerId: "C0123" },
    actor: { email: "user@example.co.jp", profileId: "1", callerType: "USER" },
    events: Array.from({ length: eventCount }, (_, index) => ({
      type: "CHROME_EVENTS",
      name: index % 2 === 0 ? "CONTENT_TRANSFER" : "SENSITIVE_DATA_TRANSFER",
      parameters: [
        { name: "URL", value: "https://chatgpt.com/" },
        { name: "TRIGGER_TYPE", value: "FILE_UPLOAD" },
        { name: "EVENT_RESULT", value: "BLOCKED" },
      ],
    })),
  };
}

function page(items: Record<string, unknown>[], nextPageToken: string | null): api.ChromeAuditActivityPage {
  return {
    application: "chrome",
    start_time: "2026-09-01T00:00:00.000Z",
    end_time: "2026-10-01T00:00:00.000Z",
    items,
    item_count: items.length,
    event_count: items.reduce((sum, item) => sum + ((item.events as unknown[]) ?? []).length, 0),
    next_page_token: nextPageToken,
  };
}

describe("CeraPage signed-in fetch", () => {
  const previous = mutableCapabilities.chromeAuditFetch;

  afterEach(() => {
    mutableCapabilities.chromeAuditFetch = previous;
    vi.restoreAllMocks();
  });

  it("hides the signed-in fetch in the local build", () => {
    mutableCapabilities.chromeAuditFetch = false;
    render(<CeraPage locale="en" />);
    expect(screen.getByRole("button", { name: "Choose files" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load sample dataset" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Fetch with signed-in account/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Period")).not.toBeInTheDocument();
  });

  it("pages through the Reports API as the administrator and loads the events as one file", async () => {
    mutableCapabilities.chromeAuditFetch = true;
    const fetchPage = vi
      .spyOn(api, "fetchChromeAuditActivityPage")
      .mockResolvedValueOnce(page([activity("2026-09-30T23:00:00.000Z", 2), activity("2026-09-30T22:00:00.000Z", 1)], "TOKEN-2"))
      .mockResolvedValueOnce(page([activity("2026-09-29T10:00:00.000Z", 1)], null));

    render(<CeraPage locale="en" />);

    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: /Fetch with signed-in account/ }));

    await screen.findByText("Loaded 4 events from the last 90 days.");

    expect(fetchPage).toHaveBeenCalledTimes(2);
    const first = fetchPage.mock.calls[0][0];
    const second = fetchPage.mock.calls[1][0];
    expect(first.page_token).toBeNull();
    expect(second.page_token).toBe("TOKEN-2");
    expect(second.start_time).toBe(first.start_time);
    expect(second.end_time).toBe(first.end_time);
    const spanDays = (Date.parse(first.end_time) - Date.parse(first.start_time)) / 86_400_000;
    expect(Math.round(spanDays)).toBe(90);

    // Loaded like a dropped JSON export: one file row, events recognised.
    expect(screen.getByText(/chrome-log-events-\d{8}-\d{8}\.json/)).toBeInTheDocument();
    expect(screen.getByText(/4 rows · 4 events recognised/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("reports an empty window without loading a file", async () => {
    mutableCapabilities.chromeAuditFetch = true;
    vi.spyOn(api, "fetchChromeAuditActivityPage").mockResolvedValue(page([], null));

    render(<CeraPage locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Fetch with signed-in account/ }));

    await screen.findByText(/No Chrome log events in the last 30 days/);
    expect(screen.getByText("No files loaded yet.")).toBeInTheDocument();
  });

  it("offers re-sign-in when the token lacks the Reports scope and retries afterwards", async () => {
    mutableCapabilities.chromeAuditFetch = true;
    const fetchPage = vi
      .spyOn(api, "fetchChromeAuditActivityPage")
      .mockRejectedValueOnce(new ApiError(401, "consent-required", "Google authorization is unavailable or was revoked."))
      .mockResolvedValueOnce(page([activity("2026-09-30T23:00:00.000Z", 1)], null));
    const signIn = vi.spyOn(api, "signInSession").mockResolvedValue({ authenticated: true, operator: "admin@example.co.jp" });

    render(<CeraPage locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Fetch with signed-in account/ }));

    const again = await screen.findByRole("button", { name: "Sign in again" });
    expect(screen.getByText(/has not granted read access to Chrome audit logs/)).toBeInTheDocument();
    expect(screen.getByText("No files loaded yet.")).toBeInTheDocument();

    fireEvent.click(again);
    await screen.findByText("Loaded 1 events from the last 30 days.");
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("surfaces a real authorization failure with the privilege hint", async () => {
    mutableCapabilities.chromeAuditFetch = true;
    vi.spyOn(api, "fetchChromeAuditActivityPage").mockRejectedValue(
      new ApiError(403, "google-api-403", "GET …/applications/chrome: Not Authorized to access this resource/api"),
    );

    render(<CeraPage locale="ja" />);
    fireEvent.click(screen.getByRole("button", { name: /ログイン中のアカウントで自動取得/ }));

    await screen.findByText(/取得に失敗しました: .*Not Authorized/);
    expect(screen.getByText(/レポート権限があるか確認するか/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /ログイン中のアカウントで自動取得/ })).toBeEnabled());
  });
});
