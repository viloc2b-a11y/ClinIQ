import { buildCoreBindingWarning } from "./shared/build-core-binding-warning"

export function evaluateCoreBindingStatus(params: {
  downstreamStatus: "ready" | "partial" | "blocked"
  soaRows: number
  economicsRows: number
  contractRows: number
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = params.downstreamStatus

  if (params.downstreamStatus === "blocked") {
    warnings.push(
      buildCoreBindingWarning({
        code: "downstream_blocked",
        message: "Downstream bridge status is blocked; core binding cannot continue",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  if (
    status !== "blocked" &&
    params.soaRows === 0 &&
    params.economicsRows === 0 &&
    params.contractRows === 0
  ) {
    warnings.push(
      buildCoreBindingWarning({
        code: "empty_core_binding_inputs",
        message: "No rows available for any core binding input",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  if (
    status !== "blocked" &&
    (params.soaRows === 0 || params.economicsRows === 0)
  ) {
    warnings.push(
      buildCoreBindingWarning({
        code: "partial_core_binding",
        message: "Core binding has partial SoA/Economics coverage",
        severity: "warning",
      }),
    )
    status = "partial"
  }

  if (warnings.length === 0) {
    warnings.push(
      buildCoreBindingWarning({
        code: "core_binding_ready",
        message: "Core binding payloads are ready for execution package assembly",
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
