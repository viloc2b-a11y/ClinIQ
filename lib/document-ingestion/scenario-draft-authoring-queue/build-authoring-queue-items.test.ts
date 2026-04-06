import { describe, expect, it } from "vitest"

import type { ScenarioDraft } from "../scenario-drafts/types"
import type { ScenarioDraftReviewPack } from "../scenario-draft-review-packs/types"
import { buildAuthoringQueueItems } from "./build-authoring-queue-items"
import { buildGlobalQueueCode } from "./build-global-queue-code"

function d(overrides: Partial<ScenarioDraft>): ScenarioDraft {
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

describe("buildAuthoringQueueItems", () => {
  const packA: ScenarioDraftReviewPack = {
    code: "PACK_A",
    familyKey: "happy_path",
    structureIntent: "edge_case_expansion",
    drafts: [
      d({ code: "D_A2", order: 2, proposedScenarioKey: "z" }),
      d({ code: "D_A1", order: 1, proposedScenarioKey: "a" }),
    ],
    summary: { totalDrafts: 2, firstDraftCode: "D_A1", nullFamilyCount: 0 },
  }

  const packB: ScenarioDraftReviewPack = {
    code: "PACK_B",
    familyKey: "row_structure",
    structureIntent: "edge_case_expansion",
    drafts: [d({ code: "D_B1", order: 1 })],
    summary: { totalDrafts: 1, firstDraftCode: "D_B1", nullFamilyCount: 0 },
  }

  it("expands packs in order with global queuePosition and per-pack draft positions", () => {
    const items = buildAuthoringQueueItems([packA, packB])
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.queuePosition)).toEqual([1, 2, 3])
    expect(items.map((i) => i.reviewPackPosition)).toEqual([1, 1, 2])
    expect(items.map((i) => i.reviewPackDraftPosition)).toEqual([1, 2, 1])
    expect(items[0]?.draft.code).toBe("D_A1")
    expect(items[1]?.draft.code).toBe("D_A2")
    expect(items[2]?.draft.code).toBe("D_B1")
  })

  it("globalQueueCode matches buildGlobalQueueCode", () => {
    const items = buildAuthoringQueueItems([packB])
    expect(items[0]?.globalQueueCode).toBe(
      buildGlobalQueueCode({
        queuePosition: 1,
        reviewPackCode: "PACK_B",
        draftCode: "D_B1",
      }),
    )
  })

  it("does not mutate review packs", () => {
    const packs = structuredClone([packA])
    const snap = structuredClone(packs)
    buildAuthoringQueueItems(packs)
    expect(packs).toEqual(snap)
  })
})
