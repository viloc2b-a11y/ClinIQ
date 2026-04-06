import type { ScenarioDraftReviewPack } from "../scenario-draft-review-packs/types"
import { buildGlobalQueueCode } from "./build-global-queue-code"
import { sortPackDraftsForAuthoring } from "./sort-pack-drafts-for-authoring"
import type { ScenarioDraftAuthoringQueueItem } from "./types"

export function buildAuthoringQueueItems(
  reviewPacks: ScenarioDraftReviewPack[],
): ScenarioDraftAuthoringQueueItem[] {
  const queueItems: ScenarioDraftAuthoringQueueItem[] = []
  let queuePosition = 1

  reviewPacks.forEach((reviewPack, packIndex) => {
    const sortedDrafts = sortPackDraftsForAuthoring(reviewPack.drafts)

    sortedDrafts.forEach((draft, draftIndex) => {
      queueItems.push({
        queuePosition,
        globalQueueCode: buildGlobalQueueCode({
          queuePosition,
          reviewPackCode: reviewPack.code,
          draftCode: draft.code,
        }),
        reviewPackCode: reviewPack.code,
        reviewPackPosition: packIndex + 1,
        reviewPackDraftPosition: draftIndex + 1,
        familyKey: reviewPack.familyKey,
        structureIntent: reviewPack.structureIntent,
        draft,
      })

      queuePosition += 1
    })
  })

  return queueItems
}
