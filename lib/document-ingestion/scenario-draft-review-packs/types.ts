import type { ScenarioDraft } from "../scenario-drafts/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"

export type ScenarioDraftReviewPack = {
  code: string
  familyKey: ScenarioFamilyKey | null
  structureIntent:
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
  drafts: ScenarioDraft[]
  summary: {
    totalDrafts: number
    firstDraftCode: string | null
    nullFamilyCount: number
  }
}

export type ScenarioDraftReviewPackResult = {
  data: {
    reviewPacks: ScenarioDraftReviewPack[]
  }
  summary: {
    totalReviewPacks: number
    totalDrafts: number
    packsWithNullFamily: number
    edgeCasePackCount: number
    familyDepthPackCount: number
    distributionRebalancePackCount: number
    firstReviewPackCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
