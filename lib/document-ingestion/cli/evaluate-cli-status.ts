import { buildCliWarning } from "./build-cli-warning"

export function evaluateCliStatus(params: {
  status: "ready" | "partial" | "blocked"
  sourceType: "excel" | "pdf" | "word" | "unknown"
  route: "excel_hardened" | "legacy" | "unknown"
  outputsReady: boolean
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let finalStatus: "ready" | "partial" | "blocked" = params.status

  if (params.sourceType === "excel" && params.route !== "excel_hardened") {
    finalStatus = "blocked"
    warnings.push(
      buildCliWarning({
        code: "cli_excel_not_hardened",
        message: "Excel source must use hardened route in CLI execution",
        severity: "error",
      }),
    )
  }

  if (!params.outputsReady && finalStatus === "ready") {
    finalStatus = "partial"
    warnings.push(
      buildCliWarning({
        code: "cli_outputs_partial",
        message: "CLI execution completed but outputs are partial",
        severity: "warning",
      }),
    )
  }

  if (warnings.length === 0) {
    warnings.push(
      buildCliWarning({
        code: "cli_execution_ready",
        message: "CLI execution completed successfully",
        severity: "info",
      }),
    )
  }

  return {
    data: {
      status: finalStatus,
    },
    summary: {
      status: finalStatus,
    },
    warnings,
  }
}
