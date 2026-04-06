import { buildTracePackWarning } from "./build-trace-pack-warning"

export function evaluateTracePackStatus(params: {
  found: boolean
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

  if (!params.found || !params.documentReady || !params.actionCenterReady || !params.postPersistenceReady) {
    status = "blocked"
    warnings.push(
      buildTracePackWarning({
        code: "trace_pack_blocked",
        message:
          "Trace pack cannot be considered ready because scenario or operational prerequisites are incomplete",
        severity: "error",
      }),
    )
  } else if (!params.revenueReady || !params.outputsReady) {
    status = "partial"
    warnings.push(
      buildTracePackWarning({
        code: "trace_pack_partial",
        message: "Trace pack built successfully but revenue or output layers remain partial",
        severity: "warning",
      }),
    )
  } else {
    warnings.push(
      buildTracePackWarning({
        code: "trace_pack_ready",
        message: "Internal trace pack built successfully",
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
    },
    warnings,
  }
}
