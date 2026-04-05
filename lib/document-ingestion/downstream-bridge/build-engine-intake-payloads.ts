import type { DownstreamBridgeResult } from "./types"

export function buildEngineIntakePayloads(params: {
  bridge: DownstreamBridgeResult
}) {
  return {
    data: {
      soaEngineInput:
        params.bridge.summary.status !== "blocked"
          ? params.bridge.data.soa.rows
          : [],
      budgetEngineInput:
        params.bridge.summary.status !== "blocked"
          ? params.bridge.data.budget.rows
          : [],
      contractEngineInput:
        params.bridge.summary.status !== "blocked"
          ? params.bridge.data.contract.rows
          : [],
    },
    summary: {
      status: params.bridge.summary.status,
      soaRows:
        params.bridge.summary.status !== "blocked"
          ? params.bridge.summary.soaRows
          : 0,
      budgetRows:
        params.bridge.summary.status !== "blocked"
          ? params.bridge.summary.budgetRows
          : 0,
      contractRows:
        params.bridge.summary.status !== "blocked"
          ? params.bridge.summary.contractRows
          : 0,
    },
    warnings: params.bridge.warnings,
  }
}
