import { buildRevenueBindingWarning } from "./shared/build-revenue-binding-warning"

export function evaluateRevenueBindingStatus(params: {
  claimsReady: boolean
  invoicesReady: boolean
  leakageReady: boolean
  outputsReady: boolean
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (!params.claimsReady || !params.invoicesReady || !params.leakageReady) {
    warnings.push(
      buildRevenueBindingWarning({
        code: "revenue_binding_blocked",
        message: "Revenue binding is blocked before core revenue artifacts were built",
        severity: "error",
      })
    )
    status = "blocked"
  }

  if (status !== "blocked" && !params.outputsReady) {
    warnings.push(
      buildRevenueBindingWarning({
        code: "revenue_outputs_partial",
        message: "Revenue core artifacts were built but output layer is partial",
        severity: "warning",
      })
    )
    status = "partial"
  }

  if (warnings.length === 0) {
    warnings.push(
      buildRevenueBindingWarning({
        code: "revenue_binding_ready",
        message: "Document-originated operational chain produced full revenue outputs",
        severity: "info",
      })
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
