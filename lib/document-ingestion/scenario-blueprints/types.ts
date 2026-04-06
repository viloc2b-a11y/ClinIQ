import type { ScenarioFamilyKey } from "../scenario-families/types"

export type ScenarioBlueprint = {
  code: string
  order: number
  sourcePlanItemCode: string
  familyKey: ScenarioFamilyKey | null
  proposedScenarioKey: string
  targetTags: string[]
  structureIntent: "edge_case_expansion" | "family_depth_expansion" | "distribution_rebalance"
  rationale: string[]
}

export type ScenarioBlueprintResult = {
  data: {
    blueprints: ScenarioBlueprint[]
  }
  summary: {
    totalBlueprints: number
    edgeCaseExpansionCount: number
    familyDepthExpansionCount: number
    distributionRebalanceCount: number
    firstBlueprintCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
