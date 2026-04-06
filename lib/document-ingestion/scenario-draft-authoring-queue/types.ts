import type { ScenarioDraft } from "../scenario-drafts/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"

export type ScenarioDraftAuthoringQueueItem = {
  queuePosition: number
  globalQueueCode: string
  reviewPackCode: string
  reviewPackPosition: number
  reviewPackDraftPosition: number
  familyKey: ScenarioFamilyKey | null
  structureIntent:
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
  draft: ScenarioDraft
}

export type ScenarioDraftAuthoringQueuePack = {
  reviewPackCode: string
  reviewPackPosition: number
  familyKey: ScenarioFamilyKey | null
  structureIntent:
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
  totalDrafts: number
  firstDraftCode: string | null
}

export type ScenarioDraftAuthoringQueueResult = {
  data: {
    queuePacks: ScenarioDraftAuthoringQueuePack[]
    queueItems: ScenarioDraftAuthoringQueueItem[]
  }
  summary: {
    totalQueuePacks: number
    totalQueueItems: number
    firstQueuePackCode: string | null
    firstQueueItemCode: string | null
    packsWithNullFamily: number
    edgeCaseQueuePackCount: number
    familyDepthQueuePackCount: number
    distributionRebalanceQueuePackCount: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
