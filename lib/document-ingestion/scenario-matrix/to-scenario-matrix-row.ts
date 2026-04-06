import type { ScenarioMatrixRow } from "./types"

export function toScenarioMatrixRow(params: {
  scenario: {
    key: string
    label: string
    fixtureType: string
  } | null
  runResult: {
    summary?: {
      status?: "ready" | "partial" | "blocked"
    }
    data?: {
      result?: ({
        summary?: {
          status?: "ready" | "partial" | "blocked"
          sourceType?: "excel" | "pdf" | "word" | "unknown"
          route?: "excel_hardened" | "legacy" | "unknown"
          outputsReady?: boolean
          artifactsReady?: number
        }
        data?: {
          payload?: {
            meta?: {
              fileName?: string | null
            }
          }
        }
      } | null)
    }
    warnings?: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
}): ScenarioMatrixRow {
  const payloadSummary = params.runResult.data?.result?.summary
  const payloadData = params.runResult.data?.result?.data?.payload
  const warnings = params.runResult.warnings || []

  return {
    key: (params.scenario?.key || "budget_simple_happy_path") as ScenarioMatrixRow["key"],
    label: params.scenario?.label || "Unknown Scenario",
    fixtureType: params.scenario?.fixtureType || "unknown",
    fileName: payloadData?.meta?.fileName || null,
    status: payloadSummary?.status || "blocked",
    sourceType: payloadSummary?.sourceType || "unknown",
    route: payloadSummary?.route || "unknown",
    outputsReady: payloadSummary?.outputsReady === true,
    artifactsReady:
      typeof payloadSummary?.artifactsReady === "number"
        ? payloadSummary.artifactsReady
        : 0,
    totalWarnings: warnings.length,
  }
}
