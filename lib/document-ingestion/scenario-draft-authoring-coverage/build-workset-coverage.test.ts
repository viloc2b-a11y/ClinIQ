import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringWorkset } from "../scenario-draft-authoring-worksets/types"
import { buildWorksetCoverage } from "./build-workset-coverage"

function queueItem(
  familyKey: "happy_path" | "row_structure" | null,
  intent: "edge_case_expansion" | "family_depth_expansion" | "distribution_rebalance",
) {
  return {
    queuePosition: 1,
    globalQueueCode: "G",
    reviewPackCode: "P",
    reviewPackPosition: 1,
    reviewPackDraftPosition: 1,
    familyKey,
    structureIntent: intent,
    draft: {
      code: "D",
      order: 1,
      sourceBlueprintCode: "B",
      proposedScenarioKey: "s",
      familyKey,
      targetTags: [] as string[],
      structureIntent: intent,
      status: "draft_pending_definition" as const,
      metadata: { title: "T", description: "D" },
      placeholderStructureNotes: [] as string[],
      rationale: [] as string[],
    },
  }
}

describe("buildWorksetCoverage", () => {
  const workset: ScenarioDraftAuthoringWorkset = {
    worksetCode: "AUTHORING_WORKSET_0001",
    worksetPosition: 1,
    startQueuePosition: 1,
    endQueuePosition: 3,
    items: [
      queueItem(null, "distribution_rebalance"),
      queueItem("row_structure", "edge_case_expansion"),
      queueItem("happy_path", "family_depth_expansion"),
    ],
    summary: {
      totalItems: 3,
      firstQueueItemCode: "FIRST",
      lastQueueItemCode: "LAST",
      uniqueReviewPackCount: 1,
      nullFamilyItemCount: 1,
    },
  }

  it("matches contract with sorted unique families and intents", () => {
    const cov = buildWorksetCoverage(workset)
    expect(cov.worksetCode).toBe("AUTHORING_WORKSET_0001")
    expect(cov.worksetPosition).toBe(1)
    expect(cov.totalItems).toBe(3)
    expect(cov.firstQueueItemCode).toBe("FIRST")
    expect(cov.lastQueueItemCode).toBe("LAST")
    expect(cov.familyKeys).toEqual(["happy_path", "row_structure", null])
    expect(cov.structureIntents).toEqual([
      "edge_case_expansion",
      "family_depth_expansion",
      "distribution_rebalance",
    ])
  })

  it("does not mutate workset", () => {
    const snap = structuredClone(workset)
    buildWorksetCoverage(workset)
    expect(workset).toEqual(snap)
  })
})
