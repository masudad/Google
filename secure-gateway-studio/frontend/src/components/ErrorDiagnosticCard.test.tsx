import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ErrorDiagnosticCard,
  parseErrorDiagnostic,
} from "./ErrorDiagnosticCard";
import { getMessages } from "../i18n/messages";

const messagesEn = getMessages("en");
const messagesJa = getMessages("ja");

describe("parseErrorDiagnostic", () => {
  it("identifies cep-target-ou-confirmation-mismatch as ou_path_unconfirmed", () => {
    const diag = parseErrorDiagnostic(
      {
        status: 400,
        code: "cep-target-ou-confirmation-mismatch",
        message: "Type the exact current OU path shown in the picker before this mutation.",
      },
      messagesEn,
    );

    expect(diag.category).toBe("ou_path_unconfirmed");
    expect(diag.status).toBe(400);
    expect(diag.code).toBe("cep-target-ou-confirmation-mismatch");
    expect(diag.title).toBe(messagesEn.cepDeployer.errDiagOuConfirmTitle);
    expect(diag.remediation).toBe(messagesEn.cepDeployer.errDiagOuConfirmRemediation);
  });

  it("identifies PERMISSION_DENIED as iam_permission_denied", () => {
    const diag = parseErrorDiagnostic(
      {
        status: 403,
        code: "PERMISSION_DENIED",
        message: "The caller does not have permission",
      },
      messagesEn,
    );

    expect(diag.category).toBe("iam_permission_denied");
    expect(diag.status).toBe(403);
    expect(diag.code).toBe("PERMISSION_DENIED");
    expect(diag.title).toBe(messagesEn.cepDeployer.errDiagIamTitle);
    expect(diag.actionCommandOrTemplate).toContain("gcloud organizations add-iam-policy-binding");
    expect(diag.externalLink?.url).toContain("console.cloud.google.com/iam-admin");
  });

  it("identifies WORKSPACE_FORBIDDEN as workspace_superadmin_required", () => {
    const diag = parseErrorDiagnostic(
      {
        status: 403,
        code: "WORKSPACE_FORBIDDEN",
        message: "Not authorized to use Directory API",
      },
      messagesEn,
    );

    expect(diag.category).toBe("workspace_superadmin_required");
    expect(diag.status).toBe(403);
    expect(diag.code).toBe("WORKSPACE_FORBIDDEN");
    expect(diag.title).toBe(messagesEn.cepDeployer.errDiagWorkspaceTitle);
    expect(diag.externalLink?.url).toBe("https://admin.google.com/ac/roles");
  });

  it("identifies worker-unavailable and worker-silent as worker_unavailable", () => {
    const diagUnavailable = parseErrorDiagnostic(
      {
        status: 0,
        code: "worker-unavailable",
        message: "Could not establish connection. Receiving end does not exist.",
      },
      messagesEn,
    );
    expect(diagUnavailable.category).toBe("worker_unavailable");
    expect(diagUnavailable.status).toBe(0);
    expect(diagUnavailable.code).toBe("worker-unavailable");
    expect(diagUnavailable.title).toBe(messagesEn.cepDeployer.errDiagWorkerTitle);

    const diagSilent = parseErrorDiagnostic(
      {
        status: 0,
        code: "worker-silent",
        message: "The background worker returned no response.",
      },
      messagesJa,
    );
    expect(diagSilent.category).toBe("worker_unavailable");
    expect(diagSilent.status).toBe(0);
    expect(diagSilent.code).toBe("worker-silent");
    expect(diagSilent.title).toBe(messagesJa.cepDeployer.errDiagWorkerTitle);
  });

  it("identifies RESOURCE_EXHAUSTED and HTTP 429 as rate_limit_exceeded", () => {
    const diag = parseErrorDiagnostic(
      {
        status: 429,
        code: "RESOURCE_EXHAUSTED",
        message: "Quota exceeded for quota metric 'Queries' and limit 'Queries per minute'",
      },
      messagesEn,
    );

    expect(diag.category).toBe("rate_limit_exceeded");
    expect(diag.status).toBe(429);
    expect(diag.code).toBe("RESOURCE_EXHAUSTED");
    expect(diag.title).toBe(messagesEn.cepDeployer.errDiagRateLimitTitle);
  });

  it("falls back to generic_error for unknown or missing error fields", () => {
    const diagFromError = parseErrorDiagnostic(
      new Error("Unexpected internal state failure"),
      messagesEn,
    );
    expect(diagFromError.category).toBe("generic_error");
    expect(diagFromError.code).toBe("UNKNOWN_ERROR");
    expect(diagFromError.cause).toBe("Unexpected internal state failure");
    expect(diagFromError.title).toBe(messagesEn.cepDeployer.errDiagGenericTitle);

    const diagFromNull = parseErrorDiagnostic(null, messagesJa);
    expect(diagFromNull.category).toBe("generic_error");
    expect(diagFromNull.code).toBe("UNKNOWN_ERROR");
    expect(diagFromNull.title).toBe(messagesJa.cepDeployer.errDiagGenericTitle);
  });

  it("identifies additional CEP error codes accurately", () => {
    const diagNotFound = parseErrorDiagnostic(
      { status: 409, code: "cep-target-ou-not-found" },
      messagesEn,
    );
    expect(diagNotFound.category).toBe("ou_not_found_or_stale");
    expect(diagNotFound.code).toBe("cep-target-ou-not-found");
    expect(diagNotFound.status).toBe(409);

    const diagPathStale = parseErrorDiagnostic(
      { status: 409, code: "cep-target-ou-path-stale" },
      messagesEn,
    );
    expect(diagPathStale.category).toBe("ou_not_found_or_stale");

    const diagRootForbidden = parseErrorDiagnostic(
      { status: 400, code: "cep-root-ou-forbidden" },
      messagesEn,
    );
    expect(diagRootForbidden.category).toBe("root_ou_forbidden");
    expect(diagRootForbidden.status).toBe(400);

    const diagScopeInvalid = parseErrorDiagnostic(
      { status: 400, code: "cep-scope-invalid" },
      messagesEn,
    );
    expect(diagScopeInvalid.category).toBe("scope_invalid");

    const diagCustomerInvalid = parseErrorDiagnostic(
      { status: 400, code: "cep-customer-invalid" },
      messagesEn,
    );
    expect(diagCustomerInvalid.category).toBe("scope_invalid");

    const diagProjectRequired = parseErrorDiagnostic(
      { status: 400, code: "project-required" },
      messagesEn,
    );
    expect(diagProjectRequired.category).toBe("project_required");
  });

  it("extracts error codes from nested errors array and detail objects", () => {
    const diagFromErrorsArray = parseErrorDiagnostic(
      {
        success: false,
        message: "License assignment failed",
        errors: ["user@example.com: cep-target-ou-not-found (409)"],
      },
      messagesEn,
    );
    expect(diagFromErrorsArray.category).toBe("ou_not_found_or_stale");
    expect(diagFromErrorsArray.status).toBe(409);

    const diagFromDetailObj = parseErrorDiagnostic(
      {
        detail: {
          code: "cep-root-ou-forbidden",
          message: "Root OU cannot be targeted",
        },
      },
      messagesEn,
    );
    expect(diagFromDetailObj.category).toBe("root_ou_forbidden");
    expect(diagFromDetailObj.code).toBe("cep-root-ou-forbidden");
  });

  it("clearly distinguishes 403 Google Workspace Super Admin from 403 Google Cloud IAM", () => {
    const diagWorkspace = parseErrorDiagnostic(
      {
        status: 403,
        message: "Google Workspace admin permissions required for this operation",
      },
      messagesEn,
    );
    expect(diagWorkspace.category).toBe("workspace_superadmin_required");

    const diagIam = parseErrorDiagnostic(
      {
        status: 403,
        message: "Caller lacks permission: roles/accesscontextmanager.policyAdmin",
      },
      messagesEn,
    );
    expect(diagIam.category).toBe("iam_permission_denied");
  });
});

describe("ErrorDiagnosticCard component", () => {
  it("renders nothing when error is null or undefined", () => {
    const { container } = render(
      <ErrorDiagnosticCard error={null} messages={messagesEn} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders error badges, causes, and handles retry and links", () => {
    const onRetry = vi.fn();
    render(
      <ErrorDiagnosticCard
        error={{
          status: 403,
          code: "PERMISSION_DENIED",
          message: "The caller does not have permission to access the resource.",
        }}
        messages={messagesEn}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("HTTP 403")).toBeInTheDocument();
    expect(screen.getByText("PERMISSION_DENIED")).toBeInTheDocument();
    expect(screen.getByText(messagesEn.cepDeployer.errDiagIamTitle)).toBeInTheDocument();
    expect(screen.getByText(messagesEn.cepDeployer.errDiagIamCause)).toBeInTheDocument();
    expect(screen.getByText(messagesEn.cepDeployer.errDiagIamRemediation)).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", {
      name: new RegExp(messagesEn.cepDeployer.errDiagRetryBtn),
    });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();

    const consoleLink = screen.getByRole("link", {
      name: new RegExp(messagesEn.cepDeployer.errDiagIamConsoleLink),
    });
    expect(consoleLink).toHaveAttribute(
      "href",
      "https://console.cloud.google.com/iam-admin/iam",
    );
  });
});
