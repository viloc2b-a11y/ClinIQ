export type ScenarioDraftAuthoringReadinessStatus =
  | "ready"
  | "ready_with_warnings"
  | "not_ready"

export type ScenarioDraftAuthoringReadinessChecks = {
  hasWorksets: boolean
  allWorksetsPopulated: boolean
  hasScheduledItems: boolean
  hasRepresentedFamilies: boolean
  hasRepresentedStructureIntents: boolean
  hasNullFamilyRepresentation: boolean
}

export type ScenarioDraftAuthoringReadinessSnapshot = {
  status: ScenarioDraftAuthoringReadinessStatus
  checks: ScenarioDraftAuthoringReadinessChecks
  reasons: string[]
}

export type ScenarioDraftAuthoringReadinessResult = {
  data: {
    readiness: ScenarioDraftAuthoringReadinessSnapshot
  }
  summary: {
    status: ScenarioDraftAuthoringReadinessStatus
    totalWorksets: number
    totalScheduledItems: number
    representedFamilyCount: number
    representedStructureIntentCount: number
    nullFamilyRepresented: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
