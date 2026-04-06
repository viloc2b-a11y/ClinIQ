import type { ScenarioDraftResult } from "../scenario-drafts/types"
import { buildReviewPack } from "./build-review-pack"
import { groupDraftsIntoReviewPacks } from "./group-drafts-into-review-packs"
import type { ScenarioDraftReviewPackResult } from "./types"

export function buildScenarioDraftReviewPacks(
  draftResult: ScenarioDraftResult,
): ScenarioDraftReviewPackResult {
  const warnings: ScenarioDraftReviewPackResult["warnings"] = []

  const grouped = groupDraftsIntoReviewPacks(draftResult.data.drafts)

  const reviewPacks = grouped
    .map((group) =>
      buildReviewPack({
        familyKey: group.familyKey,
        structureIntent: group.structureIntent,
        drafts: group.drafts,
      }),
    )
    .sort((a, b) => {
      if (a.familyKey === null && b.familyKey !== null) return 1
      if (a.familyKey !== null && b.familyKey === null) return -1
      if (a.familyKey !== b.familyKey) {
        return (a.familyKey ?? "").localeCompare(b.familyKey ?? "")
      }
      if (a.structureIntent !== b.structureIntent) {
        return a.structureIntent.localeCompare(b.structureIntent)
      }
      return a.code.localeCompare(b.code)
    })

  if (draftResult.data.drafts.length === 0) {
    warnings.push({
      code: "NO_REVIEW_PACKS",
      message: "No scenario draft review packs generated because no drafts were provided.",
      severity: "info",
    })
  }

  const packsWithNullFamily = reviewPacks.filter((pack) => pack.familyKey === null).length

  if (packsWithNullFamily > 0) {
    warnings.push({
      code: "REVIEW_PACKS_WITH_NULL_FAMILY",
      message: "Some review packs contain drafts without family assignment.",
      severity: "warning",
    })
  }

  return {
    data: {
      reviewPacks,
    },
    summary: {
      totalReviewPacks: reviewPacks.length,
      totalDrafts: draftResult.data.drafts.length,
      packsWithNullFamily,
      edgeCasePackCount: reviewPacks.filter((pack) => pack.structureIntent === "edge_case_expansion")
        .length,
      familyDepthPackCount: reviewPacks.filter(
        (pack) => pack.structureIntent === "family_depth_expansion",
      ).length,
      distributionRebalancePackCount: reviewPacks.filter(
        (pack) => pack.structureIntent === "distribution_rebalance",
      ).length,
      firstReviewPackCode: reviewPacks[0]?.code ?? null,
    },
    warnings,
  }
}
