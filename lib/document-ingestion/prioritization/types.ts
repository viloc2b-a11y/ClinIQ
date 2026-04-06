import type { InternalScenarioKey } from "../scenarios/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"

export type ScenarioPriority = {
  scenarioKey: InternalScenarioKey
  familyKey: ScenarioFamilyKey
  score: number
  priority: "high" | "medium" | "low"
  reasons: string[]
}

export type FamilyPriority = {
  familyKey: ScenarioFamilyKey
  score: number
  priority: "high" | "medium" | "low"
  totalScenarios: number
}

export type PrioritizationResult = {
  data: {
    scenarioPriorities: ScenarioPriority[]
    familyPriorities: FamilyPriority[]
  }
  summary: {
    totalScenarios: number
    highPriorityCount: number
    mediumPriorityCount: number
    lowPriorityCount: number
    topScenario: InternalScenarioKey | null
    topFamily: ScenarioFamilyKey | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
