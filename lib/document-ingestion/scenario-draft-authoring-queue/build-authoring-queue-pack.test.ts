import { describe, expect, it } from "vitest"

import type { ScenarioDraftReviewPack } from "../scenario-draft-review-packs/types"
import { buildAuthoringQueuePack } from "./build-authoring-queue-pack"

describe("buildAuthoringQueuePack", () => {
  const reviewPack: ScenarioDraftReviewPack = {
    code: "REVIEW_PACK_ROW_STRUCTURE_FAMILY_DEPTH_EXPANSION",
    familyKey: "row_structure",
    structureIntent: "family_depth_expansion",
    drafts: [],
    summary: {
      totalDrafts: 2,
      firstDraftCode: "DRAFT_FIRST",
      nullFamilyCount: 0,
    },
  }

  it("matches queue pack contract and position", () => {
    const qp = buildAuthoringQueuePack(reviewPack, 3)
    expect(qp).toEqual({
      reviewPackCode: reviewPack.code,
      reviewPackPosition: 3,
      familyKey: "row_structure",
      structureIntent: "family_depth_expansion",
      totalDrafts: 2,
      firstDraftCode: "DRAFT_FIRST",
    })
  })
})
