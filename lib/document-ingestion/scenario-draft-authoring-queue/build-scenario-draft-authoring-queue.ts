import type { ScenarioDraftReviewPackResult } from "../scenario-draft-review-packs/types"
import { buildAuthoringQueueItems } from "./build-authoring-queue-items"
import { buildAuthoringQueuePack } from "./build-authoring-queue-pack"
import { sortReviewPacksForAuthoring } from "./sort-review-packs-for-authoring"
import type { ScenarioDraftAuthoringQueueResult } from "./types"

export function buildScenarioDraftAuthoringQueue(
  reviewPackResult: ScenarioDraftReviewPackResult,
): ScenarioDraftAuthoringQueueResult {
  const warnings: ScenarioDraftAuthoringQueueResult["warnings"] = []

  const sortedReviewPacks = sortReviewPacksForAuthoring(reviewPackResult.data.reviewPacks)

  const queuePacks = sortedReviewPacks.map((reviewPack, index) =>
    buildAuthoringQueuePack(reviewPack, index + 1),
  )

  const queueItems = buildAuthoringQueueItems(sortedReviewPacks)

  if (reviewPackResult.data.reviewPacks.length === 0) {
    warnings.push({
      code: "NO_AUTHORING_QUEUE",
      message: "No authoring queue generated because no review packs were provided.",
      severity: "info",
    })
  }

  const packsWithNullFamily = queuePacks.filter((pack) => pack.familyKey === null).length

  if (packsWithNullFamily > 0) {
    warnings.push({
      code: "AUTHORING_QUEUE_WITH_NULL_FAMILY_PACKS",
      message: "Some authoring queue packs do not have a family assignment.",
      severity: "warning",
    })
  }

  return {
    data: {
      queuePacks,
      queueItems,
    },
    summary: {
      totalQueuePacks: queuePacks.length,
      totalQueueItems: queueItems.length,
      firstQueuePackCode: queuePacks[0]?.reviewPackCode ?? null,
      firstQueueItemCode: queueItems[0]?.globalQueueCode ?? null,
      packsWithNullFamily,
      edgeCaseQueuePackCount: queuePacks.filter((pack) => pack.structureIntent === "edge_case_expansion")
        .length,
      familyDepthQueuePackCount: queuePacks.filter(
        (pack) => pack.structureIntent === "family_depth_expansion",
      ).length,
      distributionRebalanceQueuePackCount: queuePacks.filter(
        (pack) => pack.structureIntent === "distribution_rebalance",
      ).length,
    },
    warnings,
  }
}
