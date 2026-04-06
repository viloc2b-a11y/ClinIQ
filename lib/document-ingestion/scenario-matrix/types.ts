import type { InternalScenarioKey } from "../scenarios/types"

export type ScenarioMatrixRow = {
  key: InternalScenarioKey
  label: string
  fixtureType: string
  fileName: string | null
  status: "ready" | "partial" | "blocked"
  sourceType: "excel" | "pdf" | "word" | "unknown"
  route: "excel_hardened" | "legacy" | "unknown"
  outputsReady: boolean
  artifactsReady: number
  totalWarnings: number
}

export type ScenarioMatrixResult = {
  data: {
    rows: ScenarioMatrixRow[]
  }
  summary: {
    totalScenarios: number
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
