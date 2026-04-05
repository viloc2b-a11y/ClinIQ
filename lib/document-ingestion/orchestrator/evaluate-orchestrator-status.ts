import { buildOrchestratorWarning } from "./shared/build-orchestrator-warning"

export function evaluateOrchestratorStatus(params: {
  acceptanceStatus: string | null
  reentryStatus: string | null
  downstreamStatus: "ready" | "partial" | "blocked" | null
  coreBindingStatus: "ready" | "partial" | "blocked" | null
  executionReady: boolean
  totalActionSeeds: number
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (!params.executionReady || params.coreBindingStatus === "blocked" || params.downstreamStatus === "blocked") {
    warnings.push(
      buildOrchestratorWarning({
        code: "orchestrator_blocked",
        message: "Document orchestration is blocked before execution",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  if (
    status !== "blocked" &&
    (
      params.acceptanceStatus === "accepted_with_warnings" ||
      params.reentryStatus === "accepted_with_warnings" ||
      params.downstreamStatus === "partial" ||
      params.coreBindingStatus === "partial"
    )
  ) {
    warnings.push(
      buildOrchestratorWarning({
        code: "orchestrator_partial",
        message: "Document orchestration completed with partial coverage or warnings",
        severity: "warning",
      }),
    )
    status = "partial"
  }

  if (status !== "blocked" && params.totalActionSeeds === 0) {
    warnings.push(
      buildOrchestratorWarning({
        code: "no_action_seeds_emitted",
        message: "Execution pipeline completed but no Action Center seeds were produced",
        severity: "warning",
      }),
    )
    status = "partial"
  }

  if (warnings.length === 0) {
    warnings.push(
      buildOrchestratorWarning({
        code: "orchestrator_ready",
        message: "Document-to-execution orchestration completed successfully",
        severity: "info",
      }),
    )
  }

  return {
    data: {
      status,
    },
    summary: {
      status,
      totalWarnings: warnings.length,
    },
    warnings,
  }
}
