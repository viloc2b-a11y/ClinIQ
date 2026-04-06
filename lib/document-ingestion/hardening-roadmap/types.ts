import type { InternalScenarioKey } from "../scenarios/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"

export type HardeningRoadmapScenario = {
  scenarioKey: InternalScenarioKey
  familyKey: ScenarioFamilyKey
  score: number
  priority: "high" | "medium" | "low"
  reasons: string[]
  phase: 1 | 2 | 3
}

export type HardeningRoadmapFamily = {
  familyKey: ScenarioFamilyKey
  score: number
  priority: "high" | "medium" | "low"
  phase: 1 | 2 | 3
  scenarios: HardeningRoadmapScenario[]
  totalScenarios: number
}

export type HardeningRoadmapResult = {
  data: {
    families: HardeningRoadmapFamily[]
    scenarios: HardeningRoadmapScenario[]
  }
  summary: {
    totalFamilies: number
    totalScenarios: number
    phase1Families: number
    phase2Families: number
    phase3Families: number
    phase1Scenarios: number
    phase2Scenarios: number
    phase3Scenarios: number
    firstFamily: ScenarioFamilyKey | null
    firstScenario: InternalScenarioKey | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
