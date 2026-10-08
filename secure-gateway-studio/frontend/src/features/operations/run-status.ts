import type { OperationsMessages } from "../../i18n/messages";
import type { DeploymentRun } from "../../lib/api";

export type RunStatus = DeploymentRun["status"];

/**
 * Status of a run as the operator should perceive it: a run whose teardown
 * has completed is reported as torn down regardless of the apply outcome.
 */
export function effectiveRunStatus(
  runStatus: RunStatus | undefined,
  teardownStatus: string | undefined,
): RunStatus {
  if (teardownStatus === "succeeded") return "torn_down";
  return runStatus ?? "pending";
}

/**
 * Human-readable label for a run status. Keeps the deployment list and the
 * deployment manager header in sync, and never leaks snake_case identifiers
 * into the UI in either locale.
 */
export function runStatusText(status: RunStatus, copy: OperationsMessages): string {
  switch (status) {
    case "succeeded":
      return copy.statusSucceeded || "Success";
    case "deleted":
    case "torn_down":
    case "clean":
      return copy.statusDeleted || "Torn down";
    case "running":
      return copy.statusRunning || "Running";
    case "rolling_back":
      return copy.statusRollingBack || "Rolling back";
    case "pending":
      return copy.statusPending || "Pending";
    case "failed":
    case "rollback_unavailable":
      return copy.statusFailed || "Failed";
    case "rolled_back":
      return copy.statusRolledBack || "Rolled back";
    case "rollback_failed":
      return copy.statusRollbackFailed || "Rollback failed";
    case "interrupted":
      return copy.statusInterrupted || "Interrupted";
    default:
      return String(status);
  }
}
