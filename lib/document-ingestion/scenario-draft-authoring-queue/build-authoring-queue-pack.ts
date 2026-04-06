import type { ScenarioDraftReviewPack } from "../scenario-draft-review-packs/types"
import type { ScenarioDraftAuthoringQueuePack } from "./types"

export function buildAuthoringQueuePack(
  reviewPack: ScenarioDraftReviewPack,
  reviewPackPosition: number,
): ScenarioDraftAuthoringQueuePack {
  return {
    reviewPackCode: reviewPack.code,
    reviewPackPosition,
    familyKey: reviewPack.familyKey,
    structureIntent: reviewPack.structureIntent,
    totalDrafts: reviewPack.summary.totalDrafts,
    firstDraftCode: reviewPack.summary.firstDraftCode,
  }
}
