import { describe, expect, it } from "vitest"

import type { ScenarioDraft } from "../scenario-drafts/types"
import { buildReviewPack } from "./build-review-pack"

function draft(overrides: Partial<ScenarioDraft>): ScenarioDraft {
  return {
    code: "DRAFT_1",
    order: 1,
    sourceBlueprintCode: "B",
    proposedScenarioKey: "scenario_x_1",
    familyKey: "header_variants",
    targetTags: [],
    structureIntent: "family_depth_expansion",
    status: "draft_pending_definition",
    metadata: { title: "T", description: "D" },
    placeholderStructureNotes: [],
    rationale: [],
    ...overrides,
  }
}

describe("buildReviewPack", () => {
  it("matches ScenarioDraftReviewPack contract", () => {
    const drafts = [
      draft({ code: "DRAFT_FIRST", order: 1 }),
      draft({ code: "DRAFT_SECOND", order: 2, proposedScenarioKey: "scenario_y_1" }),
    ]
    const pack = buildReviewPack({
      familyKey: "header_variants",
      structureIntent: "family_depth_expansion",
      drafts,
    })

    expect(pack.familyKey).toBe("header_variants")
    expect(pack.structureIntent).toBe("family_depth_expansion")
    expect(pack.drafts).toHaveLength(2)
    expect(pack.code).toContain("REVIEW_PACK_")
    expect(pack.summary.totalDrafts).toBe(2)
    expect(pack.summary.firstDraftCode).toBe("DRAFT_FIRST")
    expect(pack.summary.nullFamilyCount).toBe(0)
  })

  it("counts null family drafts in summary", () => {
    const drafts = [draft({ code: "D1", familyKey: null })]
    const pack = buildReviewPack({
      familyKey: null,
      structureIntent: "edge_case_expansion",
      drafts,
    })
    expect(pack.summary.nullFamilyCount).toBe(1)
  })

  it("preserves draft order in pack", () => {
    const drafts = [draft({ code: "A", order: 1 }), draft({ code: "B", order: 2 })]
    const pack = buildReviewPack({
      familyKey: "sheet_selection",
      structureIntent: "distribution_rebalance",
      drafts,
    })
    expect(pack.drafts.map((d) => d.code)).toEqual(["A", "B"])
  })
})
