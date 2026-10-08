import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CepDeployerPage } from "./CepDeployerPage";
import { getMessages } from "../../i18n/messages";
import * as api from "../../lib/api";

const messages = getMessages("ja");
const m = messages.cepDeployer;

const OU_OPTIONS = [
  { value: "03root", label: "/", description: "Root" },
  { value: "03pilot", label: "/Pilot", description: "Pilot" },
];

const GROUP_OPTIONS = [
  { value: "sec-poc@example.com", label: "Security PoC Group", description: "sec-poc@example.com" },
  { value: "finance-dlp@example.com", label: "Finance DLP Pilot", description: "finance-dlp@example.com" },
];

const ACCESS_LEVELS = [
  {
    value: "accessPolicies/123/accessLevels/corp_managed",
    label: "Corporate managed devices",
    description: "",
  },
];

function renderPage() {
  const rendered = render(
    <CepDeployerPage customerId="C012345" messages={messages} projectId="my-test-proj" />,
  );
  // Simulate clicking the verify button to load OUs in tests
  const verifyBtn = screen.queryByRole("button", { name: m.verifyGoogleAccount }) ?? screen.queryByText(/Verify Google Account|認証してOUを取得/i);
  if (verifyBtn) {
    fireEvent.click(verifyBtn);
  }
  return rendered;
}

async function selectPilotOu(_confirm = true): Promise<void> {
  const pickers = await screen.findAllByLabelText(m.selectTargetOu);
  const picker = pickers[0];
  expect(picker).toHaveValue("");
  fireEvent.change(picker, { target: { value: "03pilot" } });
}

function emptyResult(overrides: Partial<api.CepProvisionResult> = {}): api.CepProvisionResult {
  return {
    success: true,
    message: "ok",
    created_items: [],
    skipped_items: [],
    debug_trace: [],
    ...overrides,
  };
}

describe("CepDeployerPage", () => {
  it("discloses the bounded licence pilot contract in English and Japanese", () => {
    for (const locale of ["en", "ja"] as const) {
      const notice = getMessages(locale).cepDeployer.licensePilotLimitNotice;
      expect(notice).toContain("10");
    }
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "listOrganizationalUnitOptions").mockResolvedValue(OU_OPTIONS);
    vi.spyOn(api, "listGroupOptions").mockResolvedValue(GROUP_OPTIONS);
    vi.spyOn(api, "listAccessLevelOptions").mockResolvedValue(ACCESS_LEVELS);
  });

  it("asks Google for consent before it reports the organizational units", async () => {
    const order: string[] = [];
    const signIn = vi.spyOn(api, "signInSession").mockImplementation(async () => {
      order.push("signIn");
      return { authenticated: true };
    });
    vi.spyOn(api, "listOrganizationalUnitOptions").mockImplementation(async () => {
      order.push("listOus");
      return OU_OPTIONS;
    });

    renderPage();

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    // A profile that never granted consent would otherwise be told it simply
    // has no organizational units.
    expect(order).toEqual(["signIn", "listOus"]);
  });

  it("renders the modules and presets it can actually apply", async () => {
    renderPage();

    expect(screen.getByText(m.title)).toBeInTheDocument();
    expect(screen.getByText(m.presetFullPoc)).toBeInTheDocument();
    expect(screen.getByText(m.moduleCorePolicies)).toBeInTheDocument();
    expect(screen.getByText(m.moduleConnectors)).toBeInTheDocument();
    // Context-Aware Access is a dropdown now, not a toggle: an existing level
    // can be selected instead of only ever creating one.
    expect(screen.getByLabelText(m.accessLevelTitle)).toBeInTheDocument();
    expect(screen.getByText(m.accessLevelAutoAny)).toBeInTheDocument();
    expect(
      screen.getByLabelText(m.autoCreateSubOus, { exact: false }),
    ).not.toBeChecked();

    // Unsupported URL-list detector mutation is not exposed. Remaining manual
    // setup items are still shown explicitly instead of becoming inert toggles.
    const manualTitles = m.manualChecklistItems.map((item) => item.title);
    for (const title of manualTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("blocks CEP actions until Workspace validation supplies a canonical customer id", () => {
    render(
      <CepDeployerPage customerId="my_customer" messages={messages} projectId="my-test-proj" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(m.canonicalCustomerIdRequired);
    expect(screen.getByRole("button", { name: m.verifyGoogleAccount })).toBeDisabled();
    expect(api.listOrganizationalUnitOptions).not.toHaveBeenCalled();
  });

  it("leaves a root-first OU list unselected and enables mutations immediately upon selecting a non-root OU", async () => {
    renderPage();

    const pickers = await screen.findAllByLabelText(m.selectTargetOu);
    const picker = pickers[0];
    expect(picker).toHaveValue("");
    expect(
      within(picker).getByRole("option", { name: new RegExp(m.rootOuUnavailable) }),
    ).toBeDisabled();
    expect(screen.getByText(m.btnDeploy)).toBeDisabled();
    expect(screen.getByText(m.btnAssignLicensesToOu)).toBeDisabled();

    fireEvent.change(picker, { target: { value: "03pilot" } });
    expect(screen.getByText(m.targetOuImpact)).toBeInTheDocument();
    expect(m.targetOuImpact).toMatch(/descendant|配下/i);
    expect(screen.getByText(m.btnDeploy)).toBeEnabled();
    expect(screen.getByText(m.btnAssignLicensesToOu)).toBeEnabled();
  });

  it("sends the selected OU, its path, and the module choices", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(
      emptyResult({ message: "Applied 5 CEP settings to the target OU.", created_items: ["Enhanced Safe Browsing"] }),
    );

    renderPage();
    await selectPilotOu();

    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledWith(
        expect.objectContaining({
          target_ou_id: "03pilot",
          target_ou_path: "/Pilot",
          target_ou_confirmation: "/Pilot",
          create_sub_ous: false,
          core_policies: true,
          connectors: true,
          dlp_detectors: false,
          dlp_rules: false,
        }),
      );
    });
    expect(screen.getByText("Applied 5 CEP settings to the target OU.")).toBeInTheDocument();
  });

  it("creates CEP sub OUs only after an explicit checkbox selection", async () => {
    const provision = vi
      .spyOn(api, "provisionCepPolicies")
      .mockResolvedValue(emptyResult());

    renderPage();
    await selectPilotOu();
    fireEvent.click(screen.getByLabelText(m.autoCreateSubOus, { exact: false }));
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledWith(
        expect.objectContaining({ create_sub_ous: true }),
      );
    });
  });

  it("shows what was applied and what was skipped, not just the trace", async () => {
    vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(
      emptyResult({
        created_items: ["Enhanced Safe Browsing"],
        skipped_items: ["Security event reporting: policy schema is not available"],
        debug_trace: [
          {
            label: "Apply core policies (4)",
            method: "POST",
            url: "https://chromepolicy.googleapis.com",
            status: 200,
            ok: true,
          },
        ],
      }),
    );

    renderPage();
    await selectPilotOu();
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(screen.getByText("Enhanced Safe Browsing")).toBeInTheDocument();
      expect(
        screen.getByText("Security event reporting: policy schema is not available"),
      ).toBeInTheDocument();
      expect(screen.getByText(/Apply core policies/)).toBeInTheDocument();
    });
  });

  it("refuses to deploy when the OU list could not be loaded", async () => {
    vi.spyOn(api, "listOrganizationalUnitOptions").mockRejectedValue(new Error("no access"));
    const provision = vi.spyOn(api, "provisionCepPolicies");

    renderPage();

    await waitFor(() => expect(screen.getByText(m.ouLoadFailed)).toBeInTheDocument());
    expect(screen.getByText(m.btnDeploy)).toBeDisabled();
    expect(provision).not.toHaveBeenCalled();
  });

  it("refuses to deploy when no module is selected", async () => {
    renderPage();
    await selectPilotOu();

    // The accessible name of each toggle is its title plus its description, so
    // these match on the title alone.
    for (const label of [
      m.moduleCorePolicies,
      m.moduleForceExtensions,
      m.moduleConnectors,
      m.moduleDlpRules,
    ]) {
      fireEvent.click(screen.getByLabelText(label, { exact: false }));
    }
    fireEvent.click(screen.getByLabelText(m.dataBoundaryModeNoneDesc, { exact: false }));
    fireEvent.change(screen.getByLabelText(m.accessLevelTitle), {
      target: { value: "NONE" },
    });

    expect(screen.getByText(m.btnDeploy)).toBeDisabled();
    expect(screen.getByText(m.noModulesSelected)).toBeInTheDocument();
  });

  it("copies the sample value alone, without its explanatory hint", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderPage();
    fireEvent.click(screen.getAllByText(m.copyDummyData)[0]);

    expect(writeText).toHaveBeenCalledWith(m.dummyPiiValue);
    expect(m.dummyPiiValue).not.toContain(m.dummyPiiHint);
  });

  it("routes Workspace administrator assignment to the Admin console", async () => {
    renderPage();
    const adminLink = screen.getByRole("link", { name: m.rolesAdminConsoleLink });
    expect(adminLink).toHaveAttribute("href", "https://admin.google.com/ac/roles");
    expect(screen.getByText(m.rolesVerificationNote)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /IAM ロールを作成/ })).not.toBeInTheDocument();
  });

  it("asks for confirmation before rolling back", async () => {
    const rollback = vi.spyOn(api, "rollbackCepPolicies").mockResolvedValue(emptyResult());
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();
    await selectPilotOu(false);
    fireEvent.click(screen.getByText(m.btnRollback));

    expect(confirm).toHaveBeenCalledWith(m.confirmRollback);
    expect(rollback).not.toHaveBeenCalled();
  });

  it("assigns licenses to users in the selected OU when clicking the license button", async () => {
    const assign = vi.spyOn(api, "assignCepLicenses").mockResolvedValue({
      success: true,
      message: "組織部門「/Pilot」内のユーザー 3 名を処理しました（新規割り当て: 2 名、割り当て済み: 1 名）。",
      total_users: 3,
      assigned_count: 2,
      already_assigned_count: 1,
      failed_count: 0,
      assigned_users: ["user1@example.com", "user2@example.com"],
      errors: [],
      debug_trace: [],
    });

    renderPage();
    await selectPilotOu();

    expect(screen.getByText(m.licenseCardTitle)).toBeInTheDocument();
    expect(screen.getByText(m.licensePilotLimitNotice)).toBeInTheDocument();
    expect(
      screen.getByText(m.licenseAutoAssignWarningLink, { exact: false }),
    ).toHaveAttribute("href", "https://admin.google.com/ac/billing/licensesettings");

    fireEvent.click(screen.getByText(m.btnAssignLicensesToOu));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith({
        customer_id: "C012345",
        project_id: "my-test-proj",
        target_ou_id: "03pilot",
        target_ou_path: "/Pilot",
        target_ou_confirmation: "/Pilot",
      });
      expect(
        screen.getByText(
          "組織部門「/Pilot」内のユーザー 3 名を処理しました（新規割り当て: 2 名、割り当て済み: 1 名）。",
        ),
      ).toBeInTheDocument();
    });
  });

  it("renders the DLP matrix table with presets and threat rows", async () => {
    renderPage();
    await selectPilotOu(false);

    expect(screen.getByText(m.dlpMatrixTitle)).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowUniversalUpload, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowUniversalDownload, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowPaymentCard, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowNationalId, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowAccessLevel, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowWatermark, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(m.dlpRowGenAiBlock, { exact: false })).toBeInTheDocument();
    const accessLevelRow = screen.getByRole("row", {
      name: new RegExp(m.dlpRowAccessLevel),
    });
    expect(within(accessLevelRow).getAllByRole("button")).toHaveLength(4);

    // Presets
    expect(screen.getByText(m.dlpPresetRecommended)).toBeInTheDocument();
    expect(screen.getByText(m.dlpPresetStrictZeroTrust)).toBeInTheDocument();
    expect(screen.getByText(m.dlpPresetGenAiSecure)).toBeInTheDocument();
    expect(screen.getByText(m.dlpPresetAuditOnly)).toBeInTheDocument();
  });

  it.each([
    ["top-level audit preset", () => screen.getByText(m.presetAudit)],
    ["matrix Warning First preset", () => screen.getByText(m.dlpPresetAuditOnly)],
  ])("keeps screenshots unblocked in the %s", async (_label, preset) => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    fireEvent.click(preset());
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledWith(
        expect.objectContaining({
          dlp_matrix: expect.objectContaining({
            watermark: expect.objectContaining({ watermark: false }),
          }),
        }),
      );
    });
  });

  it("sends mixed supported DLP cells without inventing BYOD scope", async () => {
    const provision = vi
      .spyOn(api, "provisionCepPolicies")
      .mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    const paymentRow = screen.getByRole("row", {
      name: new RegExp(m.dlpRowPaymentCard),
    });
    fireEvent.click(
      within(paymentRow).getByRole("button", { name: new RegExp(m.dlpColUpload) }),
    );
    fireEvent.click(
      within(paymentRow).getByRole("button", { name: new RegExp(m.dlpColPrint) }),
    );
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledWith(
        expect.objectContaining({
          dlp_matrix: expect.objectContaining({
            payment_card: {
              upload: "blockContent",
              paste: "warnUser",
              print: "blockContent",
              byodOnly: false,
            },
          }),
        }),
      );
    });
    const payload = provision.mock.calls[0]?.[0];
    expect(payload?.dlp_rule_actions).toBeUndefined();
  });

  it("defaults Gemini Zero Trust to Audit / dry-run mode and requires project confirmation when disabled", async () => {
    renderPage();
    await selectPilotOu();

    const dryRunCheckbox = screen.getByLabelText(m.geminiDryRunLabel);
    expect(dryRunCheckbox).toBeChecked();

    const provisionBtn = screen.getByRole("button", { name: m.geminiAutoProvisionBtn });
    expect(provisionBtn).not.toBeDisabled();

    // Turn off dry run (strict mode)
    fireEvent.click(dryRunCheckbox);
    expect(dryRunCheckbox).not.toBeChecked();

    // The confirmation box should appear and provision button should be disabled
    const confirmInput = screen.getByLabelText(m.geminiConfirmProjectLabel);
    expect(confirmInput).toHaveValue("");
    expect(provisionBtn).toBeDisabled();

    // Type mismatch
    fireEvent.change(confirmInput, { target: { value: "wrong-project" } });
    expect(provisionBtn).toBeDisabled();

    // Type correct project
    fireEvent.change(confirmInput, { target: { value: "my-test-proj" } });
    expect(provisionBtn).not.toBeDisabled();
  });

  it("renders ErrorDiagnosticCard when license assignment fails", async () => {
    vi.spyOn(api, "assignCepLicenses").mockResolvedValue({
      success: false,
      message: "License assignment failed",
      total_users: 1,
      assigned_count: 0,
      already_assigned_count: 0,
      failed_count: 1,
      assigned_users: [],
      errors: ["cep-target-ou-not-found: OU 03pilot does not exist"],
      debug_trace: [],
    });

    renderPage();
    await selectPilotOu();

    fireEvent.click(screen.getByText(m.btnAssignLicensesToOu));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(m.errDiagOuStaleTitle)).toBeInTheDocument();
    });
  });

  it("renders ErrorDiagnosticCard when deployment encounters an error", async () => {
    vi.spyOn(api, "provisionCepPolicies").mockRejectedValue(
      new api.ApiError(403, "WORKSPACE_FORBIDDEN", "Not authorized to access Directory API"),
    );

    renderPage();
    await selectPilotOu();

    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(m.errDiagWorkspaceTitle)).toBeInTheDocument();
    });
  });

  it("supports switching to Google Group target and renders group selection", async () => {
    renderPage();

    // Switch to Google Group tab
    const groupTabs = screen.getAllByRole("tab", { name: new RegExp(m.targetTypeGroup || "Google グループ") });
    fireEvent.click(groupTabs[0]);
    expect(groupTabs[0]).toHaveAttribute("aria-selected", "true");

    // Group dropdown is visible with options
    const groupSelects = await screen.findAllByLabelText(m.selectTargetGroup);
    const groupSelect = groupSelects[0];
    expect(groupSelect).toBeInTheDocument();
    expect(within(groupSelect).getByRole("option", { name: /Security PoC Group/ })).toBeInTheDocument();

    // Manual input fallback is visible
    expect(screen.getAllByPlaceholderText(m.customGroupInputPlaceholder)[0]).toBeInTheDocument();
  });

  it("keeps deploy and rollback locked after selecting a Google Group until the operator types the matching email", async () => {
    renderPage();

    // Switch to Group tab
    fireEvent.click(screen.getAllByRole("tab", { name: new RegExp(m.targetTypeGroup || "Google グループ") })[0]);
    const groupSelects = await screen.findAllByLabelText(m.selectTargetGroup);
    const groupSelect = groupSelects[0];

    expect(screen.getByText(m.btnDeploy)).toBeDisabled();

    // Selecting a group shows the impact box but does not unlock mutations
    fireEvent.change(groupSelect, { target: { value: "sec-poc@example.com" } });
    expect(screen.getByText(m.targetGroupImpact)).toBeInTheDocument();
    const confirmation = screen.getByLabelText(m.targetGroupConfirmationLabel);
    expect(confirmation).toHaveValue("");
    expect(screen.getByText(m.targetGroupConfirmationHint)).toBeInTheDocument();
    expect(screen.getByText(m.btnDeploy)).toBeDisabled();
    expect(screen.getByText(m.btnRollback)).toBeDisabled();
    // Read-only script download only needs a selected group
    expect(screen.getByRole("button", { name: m.btnDownloadScript })).toBeEnabled();

    // A near miss stays locked and is flagged
    fireEvent.change(confirmation, { target: { value: "sec-poc@example.co" } });
    expect(screen.getByText(m.targetGroupConfirmationMismatch)).toBeInTheDocument();
    expect(confirmation).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(m.btnDeploy)).toBeDisabled();
    expect(screen.getByText(m.btnRollback)).toBeDisabled();

    // Case and surrounding whitespace are tolerated, like the extension router
    fireEvent.change(confirmation, { target: { value: " Sec-PoC@Example.com " } });
    expect(screen.getByText(m.targetGroupConfirmationMatched)).toBeInTheDocument();
    expect(confirmation).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByText(m.btnDeploy)).toBeEnabled();
    expect(screen.getByText(m.btnRollback)).toBeEnabled();

    // Changing the group clears the confirmation and locks again
    const manualInputs = screen.getAllByPlaceholderText(m.customGroupInputPlaceholder);
    fireEvent.change(manualInputs[0], { target: { value: "other-team@example.com" } });
    expect(screen.getByLabelText(m.targetGroupConfirmationLabel)).toHaveValue("");
    expect(screen.getByText(m.btnDeploy)).toBeDisabled();
    expect(screen.getByText(m.btnRollback)).toBeDisabled();
  });

  it("sends target_type group and the operator-typed confirmation in the provision payload", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(
      emptyResult({ message: "Applied 5 CEP settings to the target Group." }),
    );

    renderPage();

    // Switch to Group tab
    fireEvent.click(screen.getAllByRole("tab", { name: new RegExp(m.targetTypeGroup || "Google グループ") })[0]);
    const groupSelects = await screen.findAllByLabelText(m.selectTargetGroup);
    const groupSelect = groupSelects[0];

    // Select group and type the confirmation
    fireEvent.change(groupSelect, { target: { value: "sec-poc@example.com" } });
    fireEvent.change(screen.getByLabelText(m.targetGroupConfirmationLabel), {
      target: { value: " Sec-PoC@example.com " },
    });

    // Deploy
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledWith(
        expect.objectContaining({
          target_type: "group",
          target_group_key: "sec-poc@example.com",
          target_group_confirmation: "Sec-PoC@example.com",
          create_sub_ous: false,
        }),
      );
    });
    expect(screen.getByText("Applied 5 CEP settings to the target Group.")).toBeInTheDocument();
  });

  it("supports manual group email entry and rolls back with the typed confirmation", async () => {
    const rollback = vi.spyOn(api, "rollbackCepPolicies").mockResolvedValue(emptyResult());
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    // Switch to Group tab
    fireEvent.click(screen.getAllByRole("tab", { name: new RegExp(m.targetTypeGroup || "Google グループ") })[0]);

    // Type custom group email
    const manualInputs = await screen.findAllByPlaceholderText(m.customGroupInputPlaceholder);
    fireEvent.change(manualInputs[0], { target: { value: "custom-sec@example.com" } });

    // Rollback stays locked until the email is typed again as confirmation
    expect(screen.getByText(m.btnRollback)).toBeDisabled();
    fireEvent.change(screen.getByLabelText(m.targetGroupConfirmationLabel), {
      target: { value: "custom-sec@example.com" },
    });
    expect(screen.getByText(m.btnRollback)).toBeEnabled();

    // Rollback
    fireEvent.click(screen.getByText(m.btnRollback));

    await waitFor(() => {
      expect(rollback).toHaveBeenCalledWith(
        expect.objectContaining({
          target_type: "group",
          target_group_key: "custom-sec@example.com",
          target_group_confirmation: "custom-sec@example.com",
        }),
      );
    });
  });

  it("enables Download Script when a Google Group target is selected", async () => {
    renderPage();

    fireEvent.click(screen.getAllByRole("tab", { name: new RegExp(m.targetTypeGroup || "Google グループ") })[0]);
    const groupSelects = await screen.findAllByLabelText(m.selectTargetGroup);
    const groupSelect = groupSelects[0];

    const downloadBtn = screen.getByRole("button", { name: m.btnDownloadScript });
    expect(downloadBtn).toBeDisabled();

    fireEvent.change(groupSelect, { target: { value: "sec-poc@example.com" } });
    expect(downloadBtn).toBeEnabled();
  });

  it("retries deploy (not rollback) when clicking Retry on ErrorDiagnosticCard after a failed deploy", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockRejectedValue(
      new api.ApiError(403, "WORKSPACE_FORBIDDEN", "Not authorized to access Directory API"),
    );
    const rollback = vi.spyOn(api, "rollbackCepPolicies").mockResolvedValue(emptyResult());

    renderPage();
    await selectPilotOu();

    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(provision).toHaveBeenCalledTimes(1);

    const retryBtn = screen.getByRole("button", { name: m.errDiagRetryBtn });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(2);
    });
    expect(rollback).not.toHaveBeenCalled();
  });

  it("resolves my_customer into a canonical Customer ID via the 1-click auto-detect button", async () => {
    const validateWs = vi.spyOn(api, "validateWorkspaceConnection").mockResolvedValue({
      provider: "workspace",
      status: "connected",
      principal_hint: "admin@example.com",
      resource_id: "C09876543",
      credential_kind: "chrome_identity",
      access_policy_id: null,
      read_only: true,
    });
    const onResolved = vi.fn();

    render(
      <CepDeployerPage
        customerId="my_customer"
        messages={messages}
        onCustomerIdResolved={onResolved}
        projectId="my-test-proj"
      />,
    );

    const autoBtn = screen.getByRole("button", { name: m.autoDetectCustomerIdBtn });
    fireEvent.click(autoBtn);

    await waitFor(() => {
      expect(validateWs).toHaveBeenCalledWith("my_customer");
      expect(onResolved).toHaveBeenCalledWith("C09876543", "admin@example.com");
      expect(api.listOrganizationalUnitOptions).toHaveBeenCalledWith("C09876543");
    });
  });

  it("automatically loads OUs and Groups when workspaceConnected is true from topbar login", async () => {
    render(
      <CepDeployerPage
        customerId="C012345"
        messages={messages}
        projectId="my-test-proj"
        workspaceConnected={true}
      />,
    );

    await waitFor(() => {
      expect(api.listOrganizationalUnitOptions).toHaveBeenCalledWith("C012345");
      expect(api.listGroupOptions).toHaveBeenCalledWith("C012345");
    });
  });

  it("renders English localization without any Japanese characters across Setup, DLP Matrix, and Security Assessment Wizard", async () => {
    const enMessages = getMessages("en");
    const enM = enMessages.cepDeployer;
    render(
      <CepDeployerPage customerId="C012345" messages={enMessages} projectId="my-test-proj" />,
    );
    fireEvent.click(screen.getByRole("button", { name: enM.verifyGoogleAccount }));

    await waitFor(() => {
      expect(
        screen.getByText(enM.googleAccountVerifiedBanner("C012345", 2, 2)),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(enM.rolesScopeManualChecklistTitle)).toBeInTheDocument();

    // Open Security Assessment & Policy Wizard
    fireEvent.click(screen.getByRole("button", { name: enM.assessOpenBtn }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify zero Japanese characters (Hiragana, Katakana, Kanji) in the entire rendered page & modal
    const fullText = document.body.textContent ?? "";
    expect(fullText).not.toMatch(/[\u3040-\u30ff\u4e00-\u9faf]/);
  });

  it("allows applying policies without a GCP Project ID and editing the optional GCP Project ID in Easy PoC", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    const onProjectIdChange = vi.fn();

    render(
      <CepDeployerPage
        customerId="C012345"
        messages={messages}
        onProjectIdChange={onProjectIdChange}
        projectId=""
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: m.verifyGoogleAccount }));
    await selectPilotOu();
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });
    expect(provision.mock.calls[0]?.[0]?.project_id).toBe("");

    // Now enter an optional GCP Project ID directly in Easy PoC
    const projectInput = screen.getByLabelText(m.projectIdOptionalLabel);
    fireEvent.change(projectInput, { target: { value: "easy-poc-gcp-proj" } });
    expect(onProjectIdChange).toHaveBeenCalledWith("easy-poc-gcp-proj");

    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(2);
    });
    expect(provision.mock.calls[1]?.[0]?.project_id).toBe("easy-poc-gcp-proj");
  });

  it("scopes policy deployment per tab (Setup vs DLP vs Operations vs All) and supports 1-click Apply All + Quick Test bar", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(
      emptyResult({ message: "Applied CEP policies." }),
    );
    renderPage();
    await selectPilotOu();

    // Shared Target Scope renders a single OU selector at the top of the page across all tabs
    expect(screen.getAllByLabelText(m.selectTargetOu)).toHaveLength(1);

    // 1. On Tab 1 (Baseline Policies & License): btnDeploy applies only Chrome baseline modules (dlp_rules: false)
    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });
    expect(provision.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        core_policies: true,
        force_extensions: true,
        connectors: true,
        dlp_rules: false,
      }),
    );

    // Post-deploy Quick Test dummy data copy bar appears immediately below the success banner
    expect(screen.getByRole("region", { name: m.quickTestBarTitle })).toBeInTheDocument();

    // 2. Clicking 1-click Apply All (btnDeployAll) from Tab 1 deploys BOTH Baseline Policies and DLP Matrix rules without switching tabs
    fireEvent.click(screen.getByText(m.btnDeployAll));
    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(2);
    });
    expect(provision.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        core_policies: true,
        force_extensions: true,
        connectors: true,
        dlp_rules: true,
      }),
    );

    const nav = screen.getByRole("navigation", { name: "CEP PoC Sections" });

    // 3. Switch to Tab 2 (DLP & Threat Matrix): btnDeploy applies only DLP Matrix rules (core_policies: false, dlp_rules: true)
    fireEvent.click(within(nav).getByRole("button", { name: m.tabDlp }));
    expect(screen.getByText(m.btnDeploy).closest(".cep-tab-panel")).toHaveClass("active");
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(3);
    });
    expect(provision.mock.calls[2]?.[0]).toEqual(
      expect.objectContaining({
        create_sub_ous: false,
        core_policies: false,
        force_extensions: false,
        connectors: false,
        data_boundary_mode: "none",
        dlp_rules: true,
      }),
    );

    // 4. Switch to Tab 3 (Operations & Testing): policy action bar is hidden
    fireEvent.click(within(nav).getByRole("button", { name: m.tabOperations }));
    expect(screen.getByText(m.btnDeploy).closest(".cep-tab-panel")).toHaveClass("hidden");

    // 5. Switch to Tab 4 (View All Sections): applies both Setup and DLP rules
    fireEvent.click(within(nav).getByRole("button", { name: m.tabAll }));
    expect(screen.getByText(m.btnDeploy).closest(".cep-tab-panel")).toHaveClass("active");
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(4);
    });
    expect(provision.mock.calls[3]?.[0]).toEqual(
      expect.objectContaining({
        core_policies: true,
        force_extensions: true,
        connectors: true,
        dlp_rules: true,
      }),
    );
  });

  it("includes SaaS tenant restriction HTTP header rules (HttpHeaderInjection) in Step 1 provision", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    fireEvent.click(screen.getByRole("button", { name: "+ Slack" }));
    const slackTenantInput = screen.getByLabelText(
      `${m.httpHeadersTenantValueLabel} (Slack)`,
    );
    fireEvent.change(slackTenantInput, { target: { value: "T0123456789" } });

    fireEvent.click(screen.getByRole("button", { name: "+ ChatGPT (OpenAI)" }));
    const chatgptTenantInput = screen.getByLabelText(
      `${m.httpHeadersTenantValueLabel} (ChatGPT (OpenAI))`,
    );
    fireEvent.change(chatgptTenantInput, { target: { value: "ws-uuid-999" } });

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });

    expect(provision.mock.calls[0]?.[0]?.http_header_rules).toEqual([
      {
        id: "slack",
        app: "Slack",
        patterns: ["https://slack.com", "https://*.slack.com"],
        headers: [
          { name: "X-Slack-Allowed-Workspaces-Requester", value: "T0123456789" },
          { name: "X-Slack-Allowed-Workspaces", value: "T0123456789" },
        ],
      },
      {
        id: "chatgpt",
        app: "ChatGPT (OpenAI)",
        patterns: ["https://chatgpt.com", "https://*.chatgpt.com", "https://chat.openai.com"],
        headers: [
          { name: "ChatGPT-Allowed-Workspace-Id", value: "ws-uuid-999" },
        ],
      },
    ]);
  });

  it("creates a pilot OU in 1 click and automatically selects it", async () => {
    const createOuSpy = vi
      .spyOn(api, "createOrganizationalUnitOption")
      .mockResolvedValue({
        created: {
          value: "03ceppoc",
          label: "/CEP-PoC",
          description: "CEP-PoC (Pilot OU created by Secure Gateway Studio)",
        },
        options: [
          ...OU_OPTIONS,
          {
            value: "03ceppoc",
            label: "/CEP-PoC",
            description: "CEP-PoC (Pilot OU created by Secure Gateway Studio)",
          },
        ],
      });

    renderPage();

    const createBtn = await screen.findByRole("button", { name: m.createPilotOuBtn });
    expect(createBtn).not.toBeDisabled();
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(createOuSpy).toHaveBeenCalledWith("C012345", "CEP-PoC", "/");
    });

    const pickers = await screen.findAllByLabelText(m.selectTargetOu);
    expect(pickers[0]).toHaveValue("03ceppoc");
    expect(screen.getByText(m.pilotOuCreatedBanner("/CEP-PoC"))).toBeInTheDocument();
  });

  it("includes personal account blocking (data_boundary_mode: block_non_corp) in Personal Account and Endpoint presets", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    // Select the dedicated "個人アカウントのブロック" preset
    fireEvent.click(screen.getByText(m.presetPersonalAccount));
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });
    expect(provision.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        core_policies: true,
        force_extensions: false,
        connectors: false,
        dlp_rules: false,
        data_boundary_mode: "block_non_corp",
      }),
    );

    // Select the "端末ハードニング" preset
    fireEvent.click(screen.getByText(m.presetEndpoint));
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(2);
    });
    expect(provision.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        core_policies: true,
        force_extensions: true,
        connectors: true,
        dlp_rules: false,
        data_boundary_mode: "block_non_corp",
      }),
    );
  });

  it("collects extra corporate domains under Data boundary and sends them as allowed_domains", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();
    fireEvent.click(screen.getByText(m.presetPersonalAccount));

    const block = screen.getByTestId("cep-allowed-domains");
    // The primary domain is only known after Workspace validation.
    expect(within(block).getByText(m.allowedDomainsPrimaryPending)).toBeInTheDocument();

    const input = screen.getByLabelText(m.allowedDomainsTitle);
    fireEvent.change(input, {
      target: { value: "Example.co.jp, https://example-group.com/path\n*@example.co.jp; bad_domain" },
    });

    // Chips are canonical and de-duplicated; invalid entries are called out.
    const chips = within(block).getByRole("list", { name: m.allowedDomainsCount(2) });
    expect(within(chips).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      m.allowedDomainsPrimaryPending,
      "example.co.jp",
      "example-group.com",
    ]);
    expect(within(block).getByRole("status")).toHaveTextContent(
      m.allowedDomainsInvalid("bad_domain"),
    );

    // The preview shows the exact shapes written to the three policies.
    expect(within(block).getByText(m.allowedDomainsPreviewTitle)).toBeInTheDocument();
    expect(within(block).getByText("example.co.jp,example-group.com")).toBeInTheDocument();
    expect(within(block).getByText("*@example.co.jp, *@example-group.com")).toBeInTheDocument();
    expect(
      within(block).getByText(".*@(example\\.co\\.jp|example-group\\.com)$"),
    ).toBeInTheDocument();
    expect(within(block).getByText(m.allowedDomainsPreviewNote)).toBeInTheDocument();

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => expect(provision).toHaveBeenCalledTimes(1));
    expect(provision.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        data_boundary_mode: "block_non_corp",
        allowed_domains: ["example.co.jp", "example-group.com"],
      }),
    );
  });

  it("hides the domain allowlist and omits allowed_domains when the data boundary is inherited", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    // Type domains first, then switch to a preset that inherits the boundary.
    fireEvent.click(screen.getByText(m.presetPersonalAccount));
    fireEvent.change(screen.getByLabelText(m.allowedDomainsTitle), {
      target: { value: "example.co.jp" },
    });
    fireEvent.click(screen.getByText(m.presetAudit));
    expect(screen.queryByTestId("cep-allowed-domains")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => expect(provision).toHaveBeenCalledTimes(1));
    const payload = provision.mock.calls[0]?.[0];
    expect(payload).toEqual(expect.objectContaining({ data_boundary_mode: "none" }));
    expect(payload).not.toHaveProperty("allowed_domains", expect.anything());
    expect(payload?.allowed_domains).toBeUndefined();

    // Re-enabling the boundary brings the typed domains back untouched.
    fireEvent.click(screen.getByText(m.presetPersonalAccount));
    expect(screen.getByLabelText(m.allowedDomainsTitle)).toHaveValue("example.co.jp");
  });

  it("omits allowed_domains when only the primary domain is in play", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();
    fireEvent.click(screen.getByText(m.presetPersonalAccount));
    fireEvent.change(screen.getByLabelText(m.allowedDomainsTitle), {
      target: { value: "   " },
    });

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => expect(provision).toHaveBeenCalledTimes(1));
    expect(provision.mock.calls[0]?.[0]?.allowed_domains).toBeUndefined();
  });

  it("shows the detected primary domain as a fixed chip and never duplicates it", async () => {
    vi.spyOn(api, "validateWorkspaceConnection").mockResolvedValue({
      provider: "workspace",
      status: "connected",
      principal_hint: "admin@example.com",
      resource_id: "C09876543",
      credential_kind: "chrome_identity",
      access_policy_id: null,
      read_only: true,
      primary_domain: "example.com",
    });
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());

    render(
      <CepDeployerPage customerId="my_customer" messages={messages} projectId="my-test-proj" />,
    );
    fireEvent.click(screen.getByRole("button", { name: m.autoDetectCustomerIdBtn }));
    const pickers = await screen.findAllByLabelText(m.selectTargetOu);
    fireEvent.change(pickers[0], { target: { value: "03pilot" } });
    fireEvent.click(screen.getByText(m.presetPersonalAccount));

    const block = screen.getByTestId("cep-allowed-domains");
    expect(within(block).getByText(m.allowedDomainsPrimaryBadge)).toBeInTheDocument();
    expect(within(block).queryByText(m.allowedDomainsPrimaryPending)).not.toBeInTheDocument();

    // Typing the primary domain again does not create a second chip.
    fireEvent.change(screen.getByLabelText(m.allowedDomainsTitle), {
      target: { value: "EXAMPLE.COM, sub.example.com" },
    });
    const chips = within(block).getByRole("list", { name: m.allowedDomainsCount(2) });
    expect(within(chips).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      `example.com${m.allowedDomainsPrimaryBadge}`,
      "sub.example.com",
    ]);
    expect(within(block).getByText(".*@(example\\.com|sub\\.example\\.com)$")).toBeInTheDocument();

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => expect(provision).toHaveBeenCalledTimes(1));
    // The extension resolves the primary domain itself; the UI only forwards
    // what the operator typed, including a harmless repeat of the primary.
    expect(provision.mock.calls[0]?.[0]?.allowed_domains).toEqual(["example.com", "sub.example.com"]);
  });

  it("rolls back CEP PoC DLP rules with delete_dlp_rules: true and scopes rollback_modules on the DLP tab", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const rollback = vi.spyOn(api, "rollbackCepPolicies").mockResolvedValue(
      emptyResult({
        message: "Deleted 2 CEP PoC DLP rule(s).",
        created_items: ['Deleted DLP rule "CEP PoC - Payment card numbers - upload" (policies/rule1)'],
      }),
    );

    renderPage();
    await selectPilotOu();

    // Switch to Tab 3 (DLP & Threat Matrix) and click rollback
    const nav = screen.getByRole("navigation", { name: "CEP PoC Sections" });
    fireEvent.click(within(nav).getByRole("button", { name: m.tabDlp }));
    fireEvent.click(screen.getByText(m.btnRollback));

    await waitFor(() => {
      expect(rollback).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "C012345",
          project_id: "my-test-proj",
          target_type: "ou",
          target_ou_id: "03pilot",
          target_ou_path: "/Pilot",
          rollback_modules: ["dlpRules"],
          delete_dlp_rules: true,
        }),
      );
    });
    expect(
      screen.getByText('Deleted DLP rule "CEP PoC - Payment card numbers - upload" (policies/rule1)'),
    ).toBeInTheDocument();
  });

  it("auto-configures BYOD vs Corp-Owned and Android vs iOS DLP rules via the Company Device & OS Environment Selector", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    const nav = screen.getByRole("navigation", { name: "CEP PoC Sections" });
    fireEvent.click(within(nav).getByRole("button", { name: m.tabDlp }));

    // Verify the Company Device & OS Environment Selector is rendered with all 6 checkboxes
    const envRegion = screen.getByRole("region", { name: m.dlpEnvBuilderTitle });
    expect(within(envRegion).getByLabelText(m.dlpEnvCorpPc, { exact: false })).toBeChecked();
    expect(within(envRegion).getByLabelText(m.dlpEnvByodPc, { exact: false })).toBeChecked();
    expect(within(envRegion).getByLabelText(m.dlpEnvByodAndroid, { exact: false })).toBeChecked();
    expect(within(envRegion).getByLabelText(m.dlpEnvByodIos, { exact: false })).toBeChecked();

    // Uncheck PC BYOD so only Android BYOD + iOS BYOD + Corp PC are active: 1-click reactive toggle immediately updates the DLP matrix
    fireEvent.click(within(envRegion).getByLabelText(m.dlpEnvByodPc, { exact: false }));
    expect(within(envRegion).getByRole("button", { name: m.dlpEnvApplyBtn })).toBeInTheDocument();

    // Deploy from Tab 2 (DLP)
    fireEvent.click(screen.getByText(m.btnDeploy));

    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });

    const payload = provision.mock.calls[0]?.[0];
    expect(payload?.dlp_rules).toBe(true);
    expect(payload?.dlp_matrix?.universal_upload).toEqual(
      expect.objectContaining({
        upload: "blockContent",
        deviceScope: "mobile_byod",
        byodOnly: true,
      }),
    );
    expect(payload?.dlp_matrix?.android_byod).toEqual(
      expect.objectContaining({
        upload: "blockContent",
        download: "blockContent",
        paste: "warnUser",
        print: "blockContent",
        deviceScope: "android_byod",
      }),
    );
    expect(payload?.dlp_matrix?.ios_byod).toEqual(
      expect.objectContaining({
        upload: "blockContent",
        download: "blockContent",
        paste: "warnUser",
        print: "blockContent",
        deviceScope: "ios_byod",
      }),
    );
  });

  it("defaults Context-Aware Access level to NONE across presets and displays the Manual CEL Setup Guide when Cloud Project ID is empty", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    render(<CepDeployerPage customerId="C012345" messages={messages} projectId="" />);
    fireEvent.click(screen.getByRole("button", { name: m.verifyGoogleAccount }));
    await selectPilotOu();

    // Default accessLevel in Full PoC preset is NONE
    const accessLevelSelect = screen.getByLabelText(m.accessLevelTitle);
    expect(accessLevelSelect).toHaveValue("NONE");

    // Selecting Endpoint preset also keeps accessLevel as NONE
    fireEvent.click(screen.getByText(m.presetEndpoint));
    expect(accessLevelSelect).toHaveValue("NONE");

    // Switch back to Full PoC preset and select an AUTO_CREATE_* option while projectId is empty:
    // Step 1 immediately displays the Manual CEL Setup Guide Card with the exact CEL expression
    fireEvent.click(screen.getByText(m.presetFullPoc));
    fireEvent.change(accessLevelSelect, { target: { value: "AUTO_CREATE_CORP_OWNED" } });
    expect(screen.getByRole("region", { name: m.manualCelGuideTitle })).toBeInTheDocument();
    expect(
      screen.getByText(
        /device\.is_corp_owned_device == true \|\| device\.chrome\.management_state == ChromeManagementState\.CHROME_MANAGEMENT_STATE_BROWSER_MANAGED/,
      ),
    ).toBeInTheDocument();

    // Reset accessLevel to NONE, switch to Tab 3 (DLP & Threat Matrix), and apply the Company Device Environment Selector
    fireEvent.change(accessLevelSelect, { target: { value: "NONE" } });
    const nav = screen.getByRole("navigation", { name: "CEP PoC Sections" });
    fireEvent.click(within(nav).getByRole("button", { name: m.tabDlp }));

    const envRegion = screen.getByRole("region", { name: m.dlpEnvBuilderTitle });
    fireEvent.click(within(envRegion).getByRole("button", { name: m.dlpEnvApplyBtn }));

    // Because projectId is empty, accessLevel remains NONE and the Manual CEL Setup Guide Card automatically appears in Tab 3
    const manualCelRegion = screen.getByRole("region", { name: m.manualCelGuideTitle });
    expect(manualCelRegion).toBeInTheDocument();
    expect(within(manualCelRegion).getByText("secgw_byod_devices")).toBeInTheDocument();
    expect(within(manualCelRegion).getByText("secgw_android_byod")).toBeInTheDocument();
    expect(within(manualCelRegion).getByText("secgw_ios_byod")).toBeInTheDocument();
    expect(
      within(manualCelRegion).getByRole("link", { name: new RegExp(m.manualCelStep1LinkLabel) }),
    ).toHaveAttribute("href", "https://admin.google.com/ac/caa/levels");
    expect(
      within(manualCelRegion).getByRole("link", { name: new RegExp(m.manualCelStep2LinkLabel) }),
    ).toHaveAttribute("href", "https://admin.google.com/ac/dp");

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });
    expect(provision.mock.calls[0]?.[0]?.access_level).toBe("NONE");
    expect(provision.mock.calls[0]?.[0]?.project_id).toBe("");
  });

  it("allows duplicating and removing DLP matrix rows to configure e.g. BYOD Block + Company-Owned Audit", async () => {
    const provision = vi.spyOn(api, "provisionCepPolicies").mockResolvedValue(emptyResult());
    renderPage();
    await selectPilotOu();

    const nav = screen.getByRole("navigation", { name: "CEP PoC Sections" });
    fireEvent.click(within(nav).getByRole("button", { name: m.tabDlp }));

    // Find the Universal File Upload row and click "+ 行を複製"
    const uploadRow = screen.getByRole("row", {
      name: new RegExp(m.dlpRowUniversalUpload),
    });
    const dupBtn = within(uploadRow).getByRole("button", {
      name: new RegExp(m.dlpDuplicateRowBtn),
    });
    fireEvent.click(dupBtn);

    // A remove button "× 削除" now appears in the duplicated row
    const removeButtons = screen.getAllByRole("button", {
      name: new RegExp(m.dlpRemoveRowBtn),
    });
    expect(removeButtons).toHaveLength(1);

    // Deploy and verify universal_upload has Row 1 (byod_only: blockContent) and extraRows[0] (corp_only: auditOnly)
    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(1);
    });

    const matrix = provision.mock.calls[0]?.[0]?.dlp_matrix;
    expect(matrix?.universal_upload).toEqual({
      upload: "blockContent",
      deviceScope: "byod_only",
      byodOnly: true,
      extraRows: [
        {
          upload: "auditOnly",
          deviceScope: "corp_only",
          byodOnly: false,
        },
      ],
    });

    // Click "× 削除" to remove the duplicated row and re-deploy
    fireEvent.click(removeButtons[0]);
    expect(
      screen.queryByRole("button", { name: new RegExp(m.dlpRemoveRowBtn) }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(m.btnDeploy));
    await waitFor(() => {
      expect(provision).toHaveBeenCalledTimes(2);
    });
    expect(provision.mock.calls[1]?.[0]?.dlp_matrix?.universal_upload?.extraRows).toBeUndefined();
  });
});
