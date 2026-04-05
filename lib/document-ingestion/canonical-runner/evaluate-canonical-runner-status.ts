import { buildCanonicalRunnerWarning } from "./build-canonical-runner-warning"

export function evaluateCanonicalRunnerStatus(params: {
  route: "excel_hardened" | "legacy" | "unknown"
  sourceType: "excel" | "pdf" | "word" | "unknown"
  documentReady: boolean
  actionCenterReady: boolean
  postPersistenceReady: boolean
  revenueReady: boolean
  outputsReady: boolean
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (!params.documentReady || !params.actionCenterReady || !params.postPersistenceReady) {
    status = "blocked"
    warnings.push(
      buildCanonicalRunnerWarning({
        code: "canonical_runner_blocked",
        message:
          "Canonical runner is blocked because document, Action Center, or post-persistence prerequisites are incomplete",
        severity: "error",
      }),
    )
  } else if (!params.revenueReady || !params.outputsReady) {
    status = "partial"
    warnings.push(
      buildCanonicalRunnerWarning({
        code: "canonical_runner_partial",
        message:
          "Canonical runner completed the operational chain but revenue or output layers are partial",
        severity: "warning",
      }),
    )
  } else {
    warnings.push(
      buildCanonicalRunnerWarning({
        code: "canonical_runner_ready",
        message: "Canonical ClinIQ runner completed successfully",
        severity: "info",
      }),
    )
  }

  if (params.sourceType === "excel" && params.route !== "excel_hardened") {
    warnings.push(
      buildCanonicalRunnerWarning({
        code: "excel_not_hardened_in_canonical_runner",
        message: "Excel source did not use the hardened route inside the canonical runner",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  return {
    data: {
      status,
    },
    summary: {
      status,
    },
    warnings,
  }
}
