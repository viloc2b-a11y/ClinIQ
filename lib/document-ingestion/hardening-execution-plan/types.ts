import type { ScenarioFamilyKey } from "../scenario-families/types"

export type HardeningPlanItem = {
  code: string
  order: number
  type: "create_scenarios_for_tag" | "create_scenarios_for_family" | "rebalance_distribution"
  priority: "high" | "medium" | "low"
  target:
    | { tag: string }
    | { familyKey: ScenarioFamilyKey }
    | { distribution: "tag_coverage" }
  plannedScenarioCount: number
  suggestedFamilyKeys: ScenarioFamilyKey[]
  rationale: string[]
}

export type HardeningExecutionPlanResult = {
  data: {
    planItems: HardeningPlanItem[]
  }
  summary: {
    totalPlanItems: number
    totalPlannedScenarios: number
    highPriorityItems: number
    mediumPriorityItems: number
    lowPriorityItems: number
    firstPlanItemCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
