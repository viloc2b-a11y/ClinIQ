import { describe, expect, it } from "vitest"

import type { ScenarioDraft } from "../scenario-drafts/types"
import { groupDraftsIntoReviewPacks } from "./group-drafts-into-review-packs"

function draft(overrides: Partial<ScenarioDraft>): ScenarioDraft {
  return {
    code: "DRAFT_DEFAULT",
    order: 1,
    sourceBlueprintCode: "B",
    proposedScenarioKey: "scenario_default_1",
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

describe("groupDraftsIntoReviewPacks", () => {
  it("groups by familyKey and structureIntent", () => {
    const drafts = [
      draft({ code: "D1", familyKey: "happy_path", structureIntent: "edge_case_expansion" }),
      draft({
        code: "D2",
        familyKey: "row_structure",
        structureIntent: "edge_case_expansion",
        proposedScenarioKey: "a",
      }),
      draft({
        code: "D3",
        familyKey: "happy_path",
        structureIntent: "edge_case_expansion",
        proposedScenarioKey: "b",
      }),
    ]
    const groups = groupDraftsIntoReviewPacks(drafts)
    expect(groups).toHaveLength(2)
    const happy = groups.find((g) => g.familyKey === "happy_path")
    expect(happy?.drafts).toHaveLength(2)
  })

  it("sorts drafts inside group by order then proposedScenarioKey then code", () => {
    const drafts = [
      draft({
        code: "D_B",
        order: 2,
        proposedScenarioKey: "scenario_z",
        familyKey: "visit_schedule",
      }),
      draft({
        code: "D_A",
        order: 1,
        proposedScenarioKey: "scenario_a",
        familyKey: "visit_schedule",
      }),
    ]
    const [group] = groupDraftsIntoReviewPacks(drafts)
    expect(group?.drafts.map((d) => d.code)).toEqual(["D_A", "D_B"])
  })

  it("preserves null family group", () => {
    const drafts = [
      draft({ code: "N1", familyKey: null, structureIntent: "distribution_rebalance" }),
    ]
    const [group] = groupDraftsIntoReviewPacks(drafts)
    expect(group?.familyKey).toBeNull()
    expect(group?.drafts).toHaveLength(1)
  })

  it("orders groups with null family last", () => {
    const drafts = [
      draft({ code: "N1", familyKey: null, structureIntent: "edge_case_expansion" }),
      draft({ code: "H1", familyKey: "happy_path", structureIntent: "edge_case_expansion" }),
    ]
    const groups = groupDraftsIntoReviewPacks(drafts)
    expect(groups[0]?.familyKey).toBe("happy_path")
    expect(groups[1]?.familyKey).toBeNull()
  })

  it("does not mutate input drafts array or draft objects", () => {
    const drafts = [draft({ code: "X1" })]
    const snap = structuredClone(drafts)
    groupDraftsIntoReviewPacks(drafts)
    expect(drafts).toEqual(snap)
  })
})
