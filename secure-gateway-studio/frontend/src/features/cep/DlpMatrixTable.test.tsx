import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DEFAULT_DLP_MATRIX, DlpMatrixTable } from "./DlpMatrixTable";
import { DLP_PLATFORM_SUPPORT_VERIFIED_ON, isOperationEnforceable, supportForScope } from "./platform-support";
import { getMessages } from "../../i18n/messages";
import type { CepDlpMatrixState } from "../../lib/api";

const en = getMessages("en");
const ja = getMessages("ja");

function Harness({
  locale = "en",
  initial = DEFAULT_DLP_MATRIX,
  onState,
}: {
  locale?: "en" | "ja";
  initial?: CepDlpMatrixState;
  onState?: (state: CepDlpMatrixState) => void;
}) {
  const [matrix, setMatrix] = useState<CepDlpMatrixState>(initial);
  return (
    <DlpMatrixTable
      matrix={matrix}
      messages={locale === "ja" ? ja : en}
      onChange={(next) => {
        setMatrix(next);
        onState?.(next);
      }}
      onRegionChange={() => undefined}
      region="JP"
    />
  );
}

function rowByName(name: string): HTMLElement {
  // Row titles are rendered as "<emoji> <name>" inside <strong>.
  const heading = screen.getByText(
    (_, element) => element?.tagName === "STRONG" && (element.textContent ?? "").trim().endsWith(name),
  );
  return heading.closest("tr") as HTMLElement;
}

describe("platform support table", () => {
  it("marks download as enforced on every platform and upload/paste/print as desktop-only", () => {
    expect(isOperationEnforceable("android_byod", "download")).toBe(true);
    expect(isOperationEnforceable("ios_all", "download")).toBe(true);
    expect(isOperationEnforceable("mobile_byod", "upload")).toBe(false);
    expect(isOperationEnforceable("android_all", "paste")).toBe(false);
    expect(isOperationEnforceable("ios_byod", "print")).toBe(false);
    // Mixed scopes keep every operation because desktop Chrome enforces them.
    expect(supportForScope("byod_only", "upload")).toEqual({
      level: "mixed",
      unsupportedPlatforms: ["android", "ios"],
      partialPlatforms: [],
    });
    expect(supportForScope("desktop_byod", "print").level).toBe("supported");
    expect(supportForScope("ios_byod", "watermark").level).toBe("partial");
    expect(supportForScope("all", "download").level).toBe("supported");
  });
});

describe("DlpMatrixTable platform gating", () => {
  it("locks upload, paste and print on the Android and iOS BYOD rows and keeps download selectable", () => {
    const m = en.cepDeployer;
    render(<Harness />);

    for (const rowName of [m.dlpRowAndroidByod, m.dlpRowIosByod]) {
      const row = rowByName(rowName);
      const locked = within(row).getAllByRole("button", { name: new RegExp(`: ${m.dlpSupportUnsupportedBadge}$`) });
      expect(locked).toHaveLength(3);
      for (const button of locked) {
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("title", expect.stringContaining("does not enforce this rule yet"));
      }
      expect(
        within(row).getByRole("button", { name: `${rowName} ${m.dlpColDownload}: ${m.dlpActionBadgeOff}` }),
      ).toBeEnabled();
    }
  });

  it("cycles the Android download cell but never turns a locked cell on", () => {
    const m = en.cepDeployer;
    const states: CepDlpMatrixState[] = [];
    render(<Harness onState={(s) => states.push(s)} />);
    const row = rowByName(m.dlpRowAndroidByod);

    fireEvent.click(
      within(row).getByRole("button", { name: `${m.dlpRowAndroidByod} ${m.dlpColDownload}: ${m.dlpActionBadgeOff}` }),
    );
    expect(states.at(-1)?.android_byod).toEqual(
      expect.objectContaining({ download: "auditOnly", upload: "off", paste: "off", print: "off" }),
    );

    // Locked cells are disabled buttons; a click on them changes nothing.
    const lockedUpload = within(row).getAllByRole("button", { name: new RegExp(`: ${m.dlpSupportUnsupportedBadge}$`) })[0];
    const before = states.length;
    fireEvent.click(lockedUpload);
    expect(states).toHaveLength(before);
  });

  it("switches operations off and locks them when a row is re-scoped to a mobile-only scope", () => {
    const m = en.cepDeployer;
    const states: CepDlpMatrixState[] = [];
    render(<Harness onState={(s) => states.push(s)} />);

    // Payment card starts with upload/paste/print = warn on all devices.
    const row = rowByName(m.dlpRowPaymentCard);
    expect(
      within(row).getByRole("button", { name: `${m.dlpRowPaymentCard} ${m.dlpColUpload}: ${m.dlpActionBadgeWarn}` }),
    ).toBeInTheDocument();

    fireEvent.change(within(row).getByLabelText(`${m.dlpRowPaymentCard} - ${m.dlpColDeviceScope}`), {
      target: { value: "ios_byod" },
    });

    expect(states.at(-1)?.payment_card).toEqual(
      expect.objectContaining({ deviceScope: "ios_byod", upload: "off", paste: "off", print: "off" }),
    );
    expect(
      within(rowByName(m.dlpRowPaymentCard)).getAllByRole("button", {
        name: new RegExp(`: ${m.dlpSupportUnsupportedBadge}$`),
      }),
    ).toHaveLength(3);

    // Back to all devices: cells unlock again (values stay off until the operator chooses).
    fireEvent.change(
      within(rowByName(m.dlpRowPaymentCard)).getByLabelText(`${m.dlpRowPaymentCard} - ${m.dlpColDeviceScope}`),
      { target: { value: "all" } },
    );
    expect(
      within(rowByName(m.dlpRowPaymentCard)).queryAllByRole("button", {
        name: new RegExp(`: ${m.dlpSupportUnsupportedBadge}$`),
      }),
    ).toHaveLength(0);
  });

  it("limits the BYOD & Mobile preset to download on the OS rows", () => {
    const m = en.cepDeployer;
    const states: CepDlpMatrixState[] = [];
    render(<Harness onState={(s) => states.push(s)} />);

    fireEvent.click(screen.getByRole("button", { name: m.dlpPresetByodMobile }));
    const last = states.at(-1);
    expect(last?.android_byod).toEqual(
      expect.objectContaining({ upload: "off", download: "blockContent", paste: "off", print: "off" }),
    );
    expect(last?.ios_byod).toEqual(
      expect.objectContaining({ upload: "off", download: "blockContent", paste: "off", print: "off" }),
    );
    // The mixed BYOD scope (PC + mobile) keeps upload because desktop enforces it.
    expect(last?.universal_upload).toEqual(expect.objectContaining({ upload: "blockContent", deviceScope: "byod_only" }));
  });

  it("shows per-platform coverage in the column headers and the coverage table with the verification date", () => {
    const m = ja.cepDeployer;
    render(<Harness locale="ja" />);

    const table = screen.getByRole("table", { name: m.dlpMatrixTitle });
    const headers = within(table).getAllByRole("columnheader");
    const uploadHeader = headers.find((h) => h.textContent?.startsWith(m.dlpColUpload)) as HTMLElement;
    const downloadHeader = headers.find((h) => h.textContent?.startsWith(m.dlpColDownload)) as HTMLElement;
    expect(uploadHeader.querySelectorAll(".dlp-platform-chip.is-supported")).toHaveLength(1);
    expect(uploadHeader.querySelectorAll(".dlp-platform-chip.is-unsupported")).toHaveLength(2);
    expect(downloadHeader.querySelectorAll(".dlp-platform-chip.is-supported")).toHaveLength(3);

    const details = screen.getByRole("table", { name: m.dlpPlatformDetailsTitle });
    expect(within(details).getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText(m.dlpPlatformVerified(DLP_PLATFORM_SUPPORT_VERIFIED_ON))).toBeInTheDocument();
    expect(screen.getByText(m.dlpPlatformNoteMobileGap)).toBeInTheDocument();
    expect(screen.getByText(m.dlpPlatformNoteDeviceAttributes)).toBeInTheDocument();
  });

  it("notes that watermark rows reaching mobile apply the warning and screenshot block only there", () => {
    const m = en.cepDeployer;
    render(<Harness />);
    // "All devices" includes Android / iOS, so the note is present by default.
    expect(within(rowByName(m.dlpRowWatermark)).getByText(m.dlpSupportPartialBadge)).toBeInTheDocument();

    fireEvent.change(within(rowByName(m.dlpRowWatermark)).getByLabelText(`${m.dlpRowWatermark} - ${m.dlpColDeviceScope}`), {
      target: { value: "desktop_byod" },
    });
    expect(within(rowByName(m.dlpRowWatermark)).queryByText(m.dlpSupportPartialBadge)).not.toBeInTheDocument();

    fireEvent.change(within(rowByName(m.dlpRowWatermark)).getByLabelText(`${m.dlpRowWatermark} - ${m.dlpColDeviceScope}`), {
      target: { value: "mobile_byod" },
    });
    expect(within(rowByName(m.dlpRowWatermark)).getByText(m.dlpSupportPartialBadge)).toBeInTheDocument();
  });
});
