import { buildDocumentBridgeWarning } from "./build-document-bridge-warning"

export function evaluateDocumentBridgeStatus(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  route: "excel_hardened" | "legacy"
  recordCount: number
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (params.sourceType === "excel") {
    if (params.route !== "excel_hardened") {
      status = "blocked"
      warnings.push(
        buildDocumentBridgeWarning({
          code: "excel_bridge_not_hardened",
          message: "Excel document did not route through hardened ingestion",
          severity: "error",
        }),
      )
    } else if (params.recordCount === 0) {
      status = "partial"
      warnings.push(
        buildDocumentBridgeWarning({
          code: "excel_bridge_empty",
          message: "Excel hardened ingestion completed but produced no canonical records",
          severity: "warning",
        }),
      )
    } else {
      warnings.push(
        buildDocumentBridgeWarning({
          code: "excel_bridge_ready",
          message: "Excel hardened ingestion is ready for operational bridging",
          severity: "info",
        }),
      )
    }
  } else {
    status = "partial"
    warnings.push(
      buildDocumentBridgeWarning({
        code: "non_excel_legacy_bridge",
        message: "Non-Excel documents continue through legacy path in this step",
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
      sourceType: params.sourceType,
      route: params.route,
      recordCount: params.recordCount,
    },
    warnings,
  }
}
