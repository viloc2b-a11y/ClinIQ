import { buildCanonicalDemoWarning } from "./build-canonical-demo-warning"

export function evaluateCanonicalDemoStatus(params: {
  documentAccepted: boolean
  actionCenterReady: boolean
  recordsReady: boolean
  metricsReady: boolean
  revenueReady: boolean
  outputsReady: boolean
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (
    !params.documentAccepted ||
    !params.actionCenterReady ||
    !params.recordsReady ||
    !params.metricsReady
  ) {
    status = "blocked"
    warnings.push(
      buildCanonicalDemoWarning({
        code: "canonical_demo_blocked",
        message:
          "Canonical demo cannot be considered ready because operational prerequisites failed",
        severity: "error",
      })
    )
  }

  if (status !== "blocked" && (!params.revenueReady || !params.outputsReady)) {
    status = "partial"
    warnings.push(
      buildCanonicalDemoWarning({
        code: "canonical_demo_partial",
        message:
          "Canonical demo completed the operational chain but revenue/output layer is partial",
        severity: "warning",
      })
    )
  }

  if (warnings.length === 0) {
    warnings.push(
      buildCanonicalDemoWarning({
        code: "canonical_demo_ready",
        message: "Canonical ClinIQ demo runner produced full storyline successfully",
        severity: "info",
      })
    )
  }

  return {
    data: { status },
    summary: { status, totalWarnings: warnings.length },
    warnings,
  }
}
