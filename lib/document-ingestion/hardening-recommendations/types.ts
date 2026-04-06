import type { ScenarioFamilyKey } from "../scenario-families/types"

export type RecommendationType = "expand_tag" | "expand_family" | "rebalance_distribution"

export type HardeningRecommendation = {
  code: string
  type: RecommendationType
  priority: "high" | "medium" | "low"
  message: string
  target:
    | { tag: string }
    | { familyKey: ScenarioFamilyKey }
    | { distribution: "tag_coverage" }
  suggestedActions: string[]
}

export type HardeningRecommendationResult = {
  data: {
    recommendations: HardeningRecommendation[]
  }
  summary: {
    totalRecommendations: number
    highPriority: number
    mediumPriority: number
    lowPriority: number
    topRecommendationCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
