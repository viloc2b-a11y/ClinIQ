import { describe, expect, it } from "vitest"

import type { ScenarioDraft } from "../scenario-drafts/types"
import type { ScenarioDraftReviewPack } from "../scenario-draft-review-packs/types"
import { sortReviewPacksForAuthoring } from "./sort-review-packs-for-authoring"

function d(overrides: Partial<ScenarioDraft> = {}): ScenarioDraft {
  return {
    code: "DRAFT_1",
    order: 1,
    sourceBlueprintCode: "B",
    proposedScenarioKey: "scenario_x_1",
    familyKey: "happy_path",
    targetTags: [],
    structureIntent: "edge_case_expansion",
    status: "draft_pending_definition",
    metadata: { title: "T", description: "D" },
    placeholderStructureNotes: [],
    rationale: [],
    ...overrides,
  }
}

function pack(p: Partial<ScenarioDraftReviewPack> & Pick<ScenarioDraftReviewPack, "code">): ScenarioDraftReviewPack {
  const drafts = p.drafts ?? [d()]
  const nullFamilyCount = drafts.filter((x) => x.familyKey === null).length
  return {
    familyKey: "happy_path",
    structureIntent: "edge_case_expansion",
    drafts,
    summary: {
      totalDrafts: drafts.length,
      firstDraftCode: drafts[0]?.code ?? null,
      nullFamilyCount,
    },
    ...p,
  }
}

describe("sortReviewPacksForAuthoring", () => {
  it("places null family last", () => {
    const sorted = sortReviewPacksForAuthoring([
      pack({ code: "P_NULL", familyKey: null, drafts: [d({ familyKey: null })] }),
      pack({ code: "P_HAPPY", familyKey: "happy_path" }),
    ])
    expect(sorted[0]?.familyKey).toBe("happy_path")
    expect(sorted[1]?.familyKey).toBeNull()
  })

  it("orders families deterministically", () => {
    const sorted = sortReviewPacksForAuthoring([
      pack({ code: "P_VISIT", familyKey: "visit_schedule" }),
      pack({ code: "P_HAPPY", familyKey: "happy_path" }),
    ])
    expect(sorted.map((x) => x.familyKey)).toEqual(["happy_path", "visit_schedule"])
  })

  it("orders intent edge then family_depth then distribution", () => {
    const sorted = sortReviewPacksForAuthoring([
      pack({ code: "P_DIST", structureIntent: "distribution_rebalance" }),
      pack({ code: "P_EDGE", structureIntent: "edge_case_expansion" }),
      pack({ code: "P_FAMILY", structureIntent: "family_depth_expansion" }),
    ])
    expect(sorted.map((x) => x.structureIntent)).toEqual([
      "edge_case_expansion",
      "family_depth_expansion",
      "distribution_rebalance",
    ])
  })

  it("prefers larger totalDrafts within same family and intent", () => {
    const sorted = sortReviewPacksForAuthoring([
      pack({
        code: "P_SMALL",
        drafts: [d({ code: "A" })],
        summary: { totalDrafts: 1, firstDraftCode: "A", nullFamilyCount: 0 },
      }),
      pack({
        code: "P_LARGE",
        drafts: [d({ code: "B" }), d({ code: "C", order: 2 })],
        summary: { totalDrafts: 2, firstDraftCode: "B", nullFamilyCount: 0 },
      }),
    ])
    expect(sorted[0]?.code).toBe("P_LARGE")
    expect(sorted[1]?.code).toBe("P_SMALL")
  })

  it("uses code as tie-breaker", () => {
    const sorted = sortReviewPacksForAuthoring([
      pack({ code: "P_BBB", summary: { totalDrafts: 2, firstDraftCode: "X", nullFamilyCount: 0 } }),
      pack({ code: "P_AAA", summary: { totalDrafts: 2, firstDraftCode: "Y", nullFamilyCount: 0 } }),
    ])
    expect(sorted[0]?.code).toBe("P_AAA")
  })

  it("does not mutate input", () => {
    const packs = [pack({ code: "P1" })]
    const snap = structuredClone(packs)
    sortReviewPacksForAuthoring(packs)
    expect(packs).toEqual(snap)
  })
})
