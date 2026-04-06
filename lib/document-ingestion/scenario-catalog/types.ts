import type { InternalScenarioKey } from "../scenarios/types"

export type ScenarioCatalogDocumentKind = "soa" | "sponsor_budget" | "invoice" | "unknown"

export type ScenarioCatalogEntry = {
  key: InternalScenarioKey
  label: string
  description: string
  fixtureType: string
  tags: string[]
  fileName: string | null
  sourceType: "excel" | "pdf" | "word" | "unknown"
  route: "excel_hardened" | "legacy" | "unknown"
  status: "ready" | "partial" | "blocked"
  outputsReady: boolean
  artifactsReady: number
  totalWarnings: number
  documentKind: ScenarioCatalogDocumentKind
}

export type ScenarioCatalogResult = {
  data: {
    entries: ScenarioCatalogEntry[]
  }
  summary: {
    totalEntries: number
    readyCount: number
    partialCount: number
    blockedCount: number
    outputsReadyCount: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
