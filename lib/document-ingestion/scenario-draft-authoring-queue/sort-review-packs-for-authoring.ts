import type { ScenarioDraftReviewPack } from "../scenario-draft-review-packs/types"

const STRUCTURE_INTENT_PRIORITY: Record<
  ScenarioDraftReviewPack["structureIntent"],
  number
> = {
  edge_case_expansion: 1,
  family_depth_expansion: 2,
  distribution_rebalance: 3,
}

export function sortReviewPacksForAuthoring(
  reviewPacks: ScenarioDraftReviewPack[],
): ScenarioDraftReviewPack[] {
  return [...reviewPacks].sort((a, b) => {
    if (a.familyKey === null && b.familyKey !== null) return 1
    if (a.familyKey !== null && b.familyKey === null) return -1

    if (a.familyKey !== b.familyKey) {
      return (a.familyKey ?? "").localeCompare(b.familyKey ?? "")
    }

    const aPriority = STRUCTURE_INTENT_PRIORITY[a.structureIntent]
    const bPriority = STRUCTURE_INTENT_PRIORITY[b.structureIntent]

    if (aPriority !== bPriority) return aPriority - bPriority
    if (a.summary.totalDrafts !== b.summary.totalDrafts) {
      return b.summary.totalDrafts - a.summary.totalDrafts
    }

    return a.code.localeCompare(b.code)
  })
}
