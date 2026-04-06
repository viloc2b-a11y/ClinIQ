import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringQueueResult } from "../scenario-draft-authoring-queue/types"
import { SCENARIO_DRAFT_AUTHORING_WORKSET_SIZE } from "./constants"
import { buildScenarioDraftAuthoringWorksets } from "./build-scenario-draft-authoring-worksets"

function draft(pos: number, familyKey: "happy_path" | null = "happy_path") {
  return {
    code: `D${pos}`,
    order: pos,
    sourceBlueprintCode: "B",
    proposedScenarioKey: `s${pos}`,
    familyKey,
    targetTags: [] as string[],
    structureIntent: "edge_case_expansion" as const,
    status: "draft_pending_definition" as const,
    metadata: { title: "T", description: "D" },
    placeholderStructureNotes: [] as string[],
    rationale: [] as string[],
  }
}

function queueItem(pos: number, familyKey: "happy_path" | null = "happy_path") {
  return {
    queuePosition: pos,
    globalQueueCode: `AUTHORING_QUEUE_${String(pos).padStart(4, "0")}_P_D${pos}`,
    reviewPackCode: "PACK",
    reviewPackPosition: 1,
    reviewPackDraftPosition: 1,
    familyKey,
    structureIntent: "edge_case_expansion" as const,
    draft: draft(pos, familyKey),
  }
}

function emptyQueue(): ScenarioDraftAuthoringQueueResult {
  return {
    data: { queuePacks: [], queueItems: [] },
    summary: {
      totalQueuePacks: 0,
      totalQueueItems: 0,
      firstQueuePackCode: null,
      firstQueueItemCode: null,
      packsWithNullFamily: 0,
      edgeCaseQueuePackCount: 0,
      familyDepthQueuePackCount: 0,
      distributionRebalanceQueuePackCount: 0,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringWorksets", () => {
  it("chunks by configured size and computes summary", () => {
    const items = Array.from({ length: 12 }, (_, i) => queueItem(i + 1))
    const queueResult: ScenarioDraftAuthoringQueueResult = {
      data: { queuePacks: [], queueItems: items },
      summary: {
        totalQueuePacks: 0,
        totalQueueItems: 12,
        firstQueuePackCode: null,
        firstQueueItemCode: null,
        packsWithNullFamily: 0,
        edgeCaseQueuePackCount: 0,
        familyDepthQueuePackCount: 0,
        distributionRebalanceQueuePackCount: 0,
      },
      warnings: [],
    }

    const result = buildScenarioDraftAuthoringWorksets(queueResult)
    expect(result.data.worksets).toHaveLength(3)
    expect(result.summary.totalWorksets).toBe(3)
    expect(result.summary.totalQueueItems).toBe(12)
    expect(result.summary.configuredWorksetSize).toBe(SCENARIO_DRAFT_AUTHORING_WORKSET_SIZE)
    expect(result.summary.maxWorksetSizeObserved).toBe(5)
    expect(result.summary.minWorksetSizeObserved).toBe(2)
    expect(result.summary.firstWorksetCode).toBe("AUTHORING_WORKSET_0001")
    expect(result.summary.lastWorksetCode).toBe("AUTHORING_WORKSET_0003")
  })

  it("warns on empty queue", () => {
    const result = buildScenarioDraftAuthoringWorksets(emptyQueue())
    expect(result.warnings.some((w) => w.code === "NO_AUTHORING_WORKSETS")).toBe(true)
    expect(result.data.worksets).toHaveLength(0)
    expect(result.summary.maxWorksetSizeObserved).toBe(0)
    expect(result.summary.minWorksetSizeObserved).toBe(0)
  })

  it("warns when any workset has null-family items", () => {
    const items = [
      queueItem(1, "happy_path"),
      queueItem(2, null),
    ]
    const queueResult: ScenarioDraftAuthoringQueueResult = {
      data: { queuePacks: [], queueItems: items },
      summary: {
        totalQueuePacks: 0,
        totalQueueItems: 2,
        firstQueuePackCode: null,
        firstQueueItemCode: null,
        packsWithNullFamily: 0,
        edgeCaseQueuePackCount: 0,
        familyDepthQueuePackCount: 0,
        distributionRebalanceQueuePackCount: 0,
      },
      warnings: [],
    }
    const result = buildScenarioDraftAuthoringWorksets(queueResult)
    expect(
      result.warnings.some((w) => w.code === "AUTHORING_WORKSETS_WITH_NULL_FAMILY_ITEMS"),
    ).toBe(true)
    expect(result.summary.worksetsWithNullFamilyItems).toBeGreaterThan(0)
  })

  it("does not mutate queue result", () => {
    const items = [queueItem(1)]
    const queueResult: ScenarioDraftAuthoringQueueResult = {
      data: { queuePacks: [], queueItems: items },
      summary: {
        totalQueuePacks: 0,
        totalQueueItems: 1,
        firstQueuePackCode: null,
        firstQueueItemCode: null,
        packsWithNullFamily: 0,
        edgeCaseQueuePackCount: 0,
        familyDepthQueuePackCount: 0,
        distributionRebalanceQueuePackCount: 0,
      },
      warnings: [],
    }
    const snap = structuredClone(queueResult)
    buildScenarioDraftAuthoringWorksets(queueResult)
    expect(queueResult).toEqual(snap)
  })

  it("is deterministic", () => {
    const items = [queueItem(1), queueItem(2)]
    const queueResult: ScenarioDraftAuthoringQueueResult = {
      data: { queuePacks: [], queueItems: items },
      summary: {
        totalQueuePacks: 0,
        totalQueueItems: 2,
        firstQueuePackCode: null,
        firstQueueItemCode: null,
        packsWithNullFamily: 0,
        edgeCaseQueuePackCount: 0,
        familyDepthQueuePackCount: 0,
        distributionRebalanceQueuePackCount: 0,
      },
      warnings: [],
    }
    expect(buildScenarioDraftAuthoringWorksets(queueResult)).toEqual(
      buildScenarioDraftAuthoringWorksets(queueResult),
    )
  })
})
