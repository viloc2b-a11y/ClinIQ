import type { ScenarioDraftAuthoringWorkset } from "../scenario-draft-authoring-worksets/types"
import type { ScenarioDraftAuthoringCoverageWorkset } from "./types"

const STRUCTURE_INTENT_PRIORITY: Record<
  ScenarioDraftAuthoringCoverageWorkset["structureIntents"][number],
  number
> = {
  edge_case_expansion: 1,
  family_depth_expansion: 2,
  distribution_rebalance: 3,
}

export function buildWorksetCoverage(
  workset: ScenarioDraftAuthoringWorkset,
): ScenarioDraftAuthoringCoverageWorkset {
  const familyKeys = [...new Set(workset.items.map((item) => item.familyKey))].sort((a, b) => {
    if (a === null && b !== null) return 1
    if (a !== null && b === null) return -1
    return (a ?? "").localeCompare(b ?? "")
  })

  const structureIntents = [...new Set(workset.items.map((item) => item.structureIntent))].sort(
    (a, b) => STRUCTURE_INTENT_PRIORITY[a] - STRUCTURE_INTENT_PRIORITY[b],
  )

  return {
    worksetCode: workset.worksetCode,
    worksetPosition: workset.worksetPosition,
    totalItems: workset.summary.totalItems,
    familyKeys,
    structureIntents,
    firstQueueItemCode: workset.summary.firstQueueItemCode,
    lastQueueItemCode: workset.summary.lastQueueItemCode,
  }
}
