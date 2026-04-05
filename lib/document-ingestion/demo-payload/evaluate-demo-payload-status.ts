import { buildDemoPayloadWarning } from "./build-demo-payload-warning"

export function evaluateDemoPayloadStatus(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  route: "excel_hardened" | "legacy" | "unknown"
  documentReady: boolean
  actionCenterReady: boolean
  postPersistenceReady: boolean
  revenueReady: boolean
  outputsReady: boolean
  artifactsReady: number
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
      buildDemoPayloadWarning({
        code: "demo_payload_blocked",
        message:
          "Canonical demo payload is blocked because the operational prerequisites are incomplete",
        severity: "error",
      }),
    )
  } else if (!params.revenueReady || !params.outputsReady) {
    status = "partial"
    warnings.push(
      buildDemoPayloadWarning({
        code: "demo_payload_partial",
        message:
          "Canonical demo payload was built but revenue or output layers remain partial",
        severity: "warning",
      }),
    )
  } else {
    warnings.push(
      buildDemoPayloadWarning({
        code: "demo_payload_ready",
        message: "Canonical demo payload built successfully",
        severity: "info",
      }),
    )
  }

  if (params.sourceType === "excel" && params.route !== "excel_hardened") {
    status = "blocked"
    warnings.push(
      buildDemoPayloadWarning({
        code: "demo_payload_excel_not_hardened",
        message: "Excel source must use hardened route in canonical demo payload",
        severity: "error",
      }),
    )
  }

  if (params.artifactsReady === 0) {
    warnings.push(
      buildDemoPayloadWarning({
        code: "demo_payload_no_artifacts",
        message: "No commercial artifacts were available in the payload",
        severity: "warning",
      }),
    )
    if (status === "ready") {
      status = "partial"
    }
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
