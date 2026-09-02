import { useState } from "react";
import type { Messages } from "../i18n/messages";
import {
  CheckCircleIcon,
  ClipboardIcon,
  ExclamationCircleIcon,
  ExternalLinkIcon,
  RefreshIcon,
} from "./Icons";

export interface ErrorDiagnosticInfo {
  category:
    | "iam_permission_denied"
    | "workspace_superadmin_required"
    | "vpc_sc_conflict"
    | "ou_path_unconfirmed"
    | "rate_limit_exceeded"
    | "worker_unavailable"
    | "project_not_in_org"
    | "access_policy_not_found"
    | "generic_error";
  status?: number;
  code?: string;
  title: string;
  cause: string;
  remediation: string;
  actionCommandOrTemplate?: string;
  externalLink?: { label: string; url: string };
}

export function parseErrorDiagnostic(
  rawError: unknown,
  messages: Messages,
): ErrorDiagnosticInfo {
  const m = messages.cepDeployer;
  const rawMsg =
    rawError instanceof Error
      ? rawError.message
      : typeof rawError === "string"
      ? rawError
      : JSON.stringify(rawError ?? "");
  const status = (rawError as { status?: number })?.status;
  const code = (rawError as { code?: string })?.code;

  const text = `${rawMsg} ${code || ""}`.toLowerCase();

  // 1. Google Cloud IAM Permission Denied
  if (
    status === 403 ||
    text.includes("permission_denied") ||
    text.includes("the caller does not have permission") ||
    text.includes("accesscontextmanager.policies") ||
    text.includes("accesscontextmanager.accesslevels") ||
    text.includes("accesscontextmanager.serviceperimeters")
  ) {
    return {
      category: "iam_permission_denied",
      status: 403,
      code: code || "PERMISSION_DENIED",
      title: m.errDiagIamTitle,
      cause: m.errDiagIamCause,
      remediation: m.errDiagIamRemediation,
      actionCommandOrTemplate: `gcloud organizations add-iam-policy-binding YOUR_ORGANIZATION_ID \\
  --member="user:$(gcloud config get-value account)" \\
  --role="roles/accesscontextmanager.policyAdmin"`,
      externalLink: {
        label: m.errDiagIamConsoleLink,
        url: "https://console.cloud.google.com/iam-admin/iam",
      },
    };
  }

  // 2. Google Workspace Super Admin Required
  if (
    text.includes("not authorized to use directory api") ||
    text.includes("not authorized to access this resource/api") ||
    text.includes("customer not found") ||
    text.includes("admin.directory")
  ) {
    return {
      category: "workspace_superadmin_required",
      status: 403,
      code: code || "WORKSPACE_FORBIDDEN",
      title: m.errDiagWorkspaceTitle,
      cause: m.errDiagWorkspaceCause,
      remediation: m.errDiagWorkspaceRemediation,
      externalLink: {
        label: m.errDiagWorkspaceConsoleLink,
        url: "https://admin.google.com/ac/roles",
      },
    };
  }

  // 3. VPC Service Controls Conflict / Already Exists
  if (
    status === 409 ||
    text.includes("already exists") ||
    text.includes("service perimeter already exists") ||
    text.includes("belongs to perimeter")
  ) {
    return {
      category: "vpc_sc_conflict",
      status: 409,
      code: code || "PERIMETER_CONFLICT",
      title: m.errDiagVpcScConflictTitle,
      cause: m.errDiagVpcScConflictCause,
      remediation: m.errDiagVpcScConflictRemediation,
      externalLink: {
        label: m.errDiagVpcScConsoleLink,
        url: "https://console.cloud.google.com/security/service-perimeter",
      },
    };
  }

  // 4. OU Path Unconfirmed
  if (
    text.includes("target-ou-unconfirmed") ||
    text.includes("target_ou_confirmation") ||
    text.includes("target ou confirmation")
  ) {
    return {
      category: "ou_path_unconfirmed",
      status: 400,
      code: "OU_PATH_MISMATCH",
      title: m.errDiagOuConfirmTitle,
      cause: m.errDiagOuConfirmCause,
      remediation: m.errDiagOuConfirmRemediation,
    };
  }

  // 5. Rate Limit Exceeded
  if (
    status === 429 ||
    text.includes("quota exceeded") ||
    text.includes("resource_exhausted")
  ) {
    return {
      category: "rate_limit_exceeded",
      status: 429,
      code: "RESOURCE_EXHAUSTED",
      title: m.errDiagRateLimitTitle,
      cause: m.errDiagRateLimitCause,
      remediation: m.errDiagRateLimitRemediation,
    };
  }

  // 6. Service Worker Sleep / Unavailable
  if (
    text.includes("worker-unavailable") ||
    text.includes("worker-silent") ||
    text.includes("could not establish connection")
  ) {
    return {
      category: "worker_unavailable",
      status: 0,
      code: "WORKER_DISCONNECTED",
      title: m.errDiagWorkerTitle,
      cause: m.errDiagWorkerCause,
      remediation: m.errDiagWorkerRemediation,
    };
  }

  // 7. Project not in organization
  if (
    text.includes("project-not-in-organization") ||
    text.includes("not in an organization")
  ) {
    return {
      category: "project_not_in_org",
      status: 400,
      code: "PROJECT_NO_ORG",
      title: m.errDiagProjectNoOrgTitle,
      cause: m.errDiagProjectNoOrgCause,
      remediation: m.errDiagProjectNoOrgRemediation,
    };
  }

  // 8. Access Policy Not Found
  if (
    text.includes("access-policy-not-found") ||
    text.includes("no access context manager policy")
  ) {
    return {
      category: "access_policy_not_found",
      status: 404,
      code: "ACCESS_POLICY_NOT_FOUND",
      title: m.errDiagPolicyNotFoundTitle,
      cause: m.errDiagPolicyNotFoundCause,
      remediation: m.errDiagPolicyNotFoundRemediation,
      externalLink: {
        label: m.errDiagPolicyConsoleLink,
        url: "https://console.cloud.google.com/security/access-context-manager",
      },
    };
  }

  // Default Generic
  return {
    category: "generic_error",
    status,
    code: code || "UNKNOWN_ERROR",
    title: m.errDiagGenericTitle,
    cause: rawMsg || m.errDiagGenericCause,
    remediation: m.errDiagGenericRemediation,
  };
}

interface ErrorDiagnosticCardProps {
  error: unknown;
  messages: Messages;
  onRetry?: () => void;
  titleOverride?: string;
}

export function ErrorDiagnosticCard({
  error,
  messages,
  onRetry,
  titleOverride,
}: ErrorDiagnosticCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const m = messages.cepDeployer;

  if (!error) return null;

  const diag = parseErrorDiagnostic(error, messages);
  const rawString =
    error instanceof Error
      ? `${error.name}: ${error.message}${error.stack ? `\n\nStack:\n${error.stack}` : ""}`
      : typeof error === "string"
      ? error
      : JSON.stringify(error, null, 2);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cep-error-diagnostic-card" role="alert">
      <div className="cep-error-diagnostic-header">
        <div className="cep-error-title-row">
          <ExclamationCircleIcon size={20} />
          <h4>{titleOverride || diag.title}</h4>
        </div>
        <div className="cep-error-badges">
          {diag.status !== undefined && diag.status > 0 && (
            <span className="cep-badge-http">HTTP {diag.status}</span>
          )}
          {diag.code && <span className="cep-badge-code">{diag.code}</span>}
        </div>
      </div>

      <div className="cep-error-body">
        <div className="cep-error-field">
          <strong>{m.errDiagCauseLabel}</strong>
          <p>{diag.cause}</p>
        </div>

        <div className="cep-error-field">
          <strong>{m.errDiagRemediationLabel}</strong>
          <p>{diag.remediation}</p>
        </div>

        {diag.actionCommandOrTemplate && (
          <div className="cep-error-snippet-box">
            <div className="snippet-header">
              <span>{m.errDiagCommandHeader}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopy(diag.actionCommandOrTemplate!)}
                type="button"
              >
                {copied ? <CheckCircleIcon size={14} /> : <ClipboardIcon size={14} />}
                <span>{copied ? m.copiedToClipboard : m.copyDummyData}</span>
              </button>
            </div>
            <pre className="snippet-code">
              <code>{diag.actionCommandOrTemplate}</code>
            </pre>
          </div>
        )}

        <div className="cep-error-actions">
          {onRetry && (
            <button className="btn btn-primary btn-sm" onClick={onRetry} type="button">
              <RefreshIcon size={14} />
              <span>{m.errDiagRetryBtn}</span>
            </button>
          )}
          {diag.externalLink && (
            <a
              className="btn btn-secondary btn-sm"
              href={diag.externalLink.url}
              rel="noreferrer"
              target="_blank"
            >
              <span>{diag.externalLink.label}</span>
              <ExternalLinkIcon size={14} />
            </a>
          )}
        </div>

        <details className="step-collapsible cep-raw-error-toggle">
          <summary className="step-collapsible-summary">{m.errDiagRawDetails}</summary>
          <pre className="cep-raw-error-pre">
            <code>{rawString}</code>
          </pre>
        </details>
      </div>
    </div>
  );
}
