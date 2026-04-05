import type { DownstreamBridgeStatus } from "./types"
import { buildBridgeWarning } from "./shared/build-bridge-warning"

export function evaluateBridgeReadiness(params: {
  acceptedForReentry: boolean
  totalInputRecords: number
  soaRows: number
  budgetRows: number
  contractRows: number
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: DownstreamBridgeStatus = "ready"

  if (!params.acceptedForReentry) {
    warnings.push(
      buildBridgeWarning({
        code: "reentry_not_accepted",
        message: "Records were not accepted for downstream re-entry",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  if (params.totalInputRecords === 0) {
    warnings.push(
      buildBridgeWarning({
        code: "no_input_records",
        message: "No corrected records available for downstream bridge",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  if (
    params.acceptedForReentry &&
    params.totalInputRecords > 0 &&
    params.soaRows + params.budgetRows + params.contractRows === 0
  ) {
    warnings.push(
      buildBridgeWarning({
        code: "no_bridge_rows_emitted",
        message: "Accepted records produced no downstream bridge rows",
        severity: "error",
      }),
    )
    status = "blocked"
  }

  if (
    status !== "blocked" &&
    (params.soaRows === 0 || params.budgetRows === 0 || params.contractRows === 0)
  ) {
    warnings.push(
      buildBridgeWarning({
        code: "partial_bridge_coverage",
        message: "Downstream bridge emitted only partial payload coverage",
        severity: "warning",
      }),
    )
    status = "partial"
  }

  if (warnings.length === 0) {
    warnings.push(
      buildBridgeWarning({
        code: "bridge_ready",
        message: "Accepted intake is ready for downstream bridge consumption",
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
