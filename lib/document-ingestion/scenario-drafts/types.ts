import type { ScenarioFamilyKey } from "../scenario-families/types"

export type ScenarioDraftStatus = "draft_pending_definition"

export type ScenarioDraft = {
  code: string
  order: number
  sourceBlueprintCode: string
  proposedScenarioKey: string
  familyKey: ScenarioFamilyKey | null
  targetTags: string[]
  structureIntent:
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
  status: ScenarioDraftStatus
  metadata: {
    title: string
    description: string
  }
  placeholderStructureNotes: string[]
  rationale: string[]
}

export type ScenarioDraftResult = {
  data: {
    drafts: ScenarioDraft[]
  }
  summary: {
    totalDrafts: number
    nullFamilyCount: number
    edgeCaseExpansionCount: number
    familyDepthExpansionCount: number
    distributionRebalanceCount: number
    firstDraftCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
