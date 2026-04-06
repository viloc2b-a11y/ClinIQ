import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringQueueItem } from "../scenario-draft-authoring-queue/types"
import { chunkAuthoringQueueItems } from "./chunk-authoring-queue-items"

function item(pos: number): ScenarioDraftAuthoringQueueItem {
  return {
    queuePosition: pos,
    globalQueueCode: `G${pos}`,
    reviewPackCode: "P",
    reviewPackPosition: 1,
    reviewPackDraftPosition: 1,
    familyKey: "happy_path",
    structureIntent: "edge_case_expansion",
    draft: {
      code: `D${pos}`,
      order: pos,
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
  }
}

describe("chunkAuthoringQueueItems", () => {
  it("preserves order and splits into fixed-size chunks with smaller last chunk", () => {
    const items = [1, 2, 3, 4, 5, 6, 7].map(item)
    const chunks = chunkAuthoringQueueItems(items, 3)
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(3)
    expect(chunks[1]).toHaveLength(3)
    expect(chunks[2]).toHaveLength(1)
    expect(chunks.flat().map((i) => i.queuePosition)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("returns empty for empty input", () => {
    expect(chunkAuthoringQueueItems([], 5)).toEqual([])
  })

  it("returns empty for non-positive chunk size", () => {
    expect(chunkAuthoringQueueItems([item(1)], 0)).toEqual([])
    expect(chunkAuthoringQueueItems([item(1)], -1)).toEqual([])
  })

  it("does not mutate input", () => {
    const items = [item(1), item(2)]
    const snap = structuredClone(items)
    chunkAuthoringQueueItems(items, 1)
    expect(items).toEqual(snap)
  })
})
