import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringQueueItem } from "../scenario-draft-authoring-queue/types"
import { buildAuthoringWorkset } from "./build-authoring-workset"

function item(
  overrides: Partial<ScenarioDraftAuthoringQueueItem> & Pick<ScenarioDraftAuthoringQueueItem, "queuePosition">,
): ScenarioDraftAuthoringQueueItem {
  return {
    globalQueueCode: `G${overrides.queuePosition}`,
    reviewPackCode: "PACK_A",
    reviewPackPosition: 1,
    reviewPackDraftPosition: 1,
    familyKey: "happy_path",
    structureIntent: "edge_case_expansion",
    draft: {
      code: "DR",
      order: 1,
      sourceBlueprintCode: "B",
      proposedScenarioKey: "s",
      familyKey: "happy_path",
      targetTags: [],
      structureIntent: "edge_case_expansion",
      status: "draft_pending_definition",
      metadata: { title: "T", description: "D" },
      placeholderStructureNotes: [],
      rationale: [],
    },
    ...overrides,
  }
}

describe("buildAuthoringWorkset", () => {
  it("matches contract and summary fields", () => {
    const items = [
      item({ queuePosition: 2, reviewPackCode: "P1", globalQueueCode: "GA" }),
      item({
        queuePosition: 3,
        reviewPackCode: "P2",
        familyKey: null,
        globalQueueCode: "GB",
        draft: {
          code: "D",
          order: 1,
          sourceBlueprintCode: "B",
          proposedScenarioKey: "s",
          familyKey: null,
          targetTags: [],
          structureIntent: "edge_case_expansion",
          status: "draft_pending_definition",
          metadata: { title: "T", description: "D" },
          placeholderStructureNotes: [],
          rationale: [],
        },
      }),
    ]
    const ws = buildAuthoringWorkset({ worksetPosition: 2, items })
    expect(ws.worksetCode).toBe("AUTHORING_WORKSET_0002")
    expect(ws.worksetPosition).toBe(2)
    expect(ws.startQueuePosition).toBe(2)
    expect(ws.endQueuePosition).toBe(3)
    expect(ws.items.map((i) => i.queuePosition)).toEqual([2, 3])
    expect(ws.summary.totalItems).toBe(2)
    expect(ws.summary.firstQueueItemCode).toBe("GA")
    expect(ws.summary.lastQueueItemCode).toBe("GB")
    expect(ws.summary.uniqueReviewPackCount).toBe(2)
    expect(ws.summary.nullFamilyItemCount).toBe(1)
  })
})
