import type { ScenarioCatalogDocumentKind, ScenarioCatalogEntry } from "./types"

function deriveDocumentKind(scenario: { tags: string[]; fixtureType: string }): ScenarioCatalogDocumentKind {
  if (scenario.tags.includes("soa")) return "soa"
  if (scenario.tags.includes("budget")) return "sponsor_budget"
  if (scenario.tags.includes("invoice")) return "invoice"
  if (scenario.fixtureType.includes("soa")) return "soa"
  if (scenario.fixtureType.includes("budget")) return "sponsor_budget"
  if (scenario.fixtureType.includes("invoice")) return "invoice"
  return "unknown"
}

export function toScenarioCatalogEntry(params: {
  scenario: {
    key: string
    label: string
    description: string
    fixtureType: string
    tags: string[]
  }
  runResult: {
    summary?: {
      status?: "ready" | "partial" | "blocked"
    }
    data?: {
      result?: ({
        summary?: {
          sourceType?: "excel" | "pdf" | "word" | "unknown"
          route?: "excel_hardened" | "legacy" | "unknown"
          outputsReady?: boolean
          artifactsReady?: number
          status?: "ready" | "partial" | "blocked"
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
}): ScenarioCatalogEntry {
  const resultSummary = params.runResult.data?.result?.summary
  const payload = params.runResult.data?.result?.data?.payload
  const warnings = params.runResult.warnings || []

  const status = resultSummary?.status || "blocked"

  return {
    key: params.scenario.key as ScenarioCatalogEntry["key"],
    label: params.scenario.label,
    description: params.scenario.description,
    fixtureType: params.scenario.fixtureType,
    tags: params.scenario.tags,
    fileName: payload?.meta?.fileName || null,
    sourceType: resultSummary?.sourceType || "unknown",
    route: resultSummary?.route || "unknown",
    status,
    outputsReady: resultSummary?.outputsReady === true,
    artifactsReady:
      typeof resultSummary?.artifactsReady === "number" ? resultSummary.artifactsReady : 0,
    totalWarnings: warnings.length,
    documentKind: deriveDocumentKind(params.scenario),
  }
}
