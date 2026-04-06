import type { InternalScenarioKey } from "../scenarios/types"

export type ScenarioFamilyKey =
  | "happy_path"
  | "sheet_selection"
  | "boundary_detection"
  | "header_variants"
  | "row_structure"
  | "visit_schedule"

export type ScenarioFamilyDefinition = {
  key: ScenarioFamilyKey
  label: string
  description: string
  scenarioKeys: InternalScenarioKey[]
}

export type ScenarioFamilyRunSummary = {
  key: ScenarioFamilyKey
  label: string
  description: string
  totalScenarios: number
  readyCount: number
  partialCount: number
  blockedCount: number
  outputsReadyCount: number
  scenarioKeys: InternalScenarioKey[]
}

export type ScenarioFamilyResult = {
  data: {
    families: ScenarioFamilyRunSummary[]
  }
  summary: {
    totalFamilies: number
    totalScenarios: number
    readyCount: number
    partialCount: number
    blockedCount: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
