import { describe, expect, it } from "vitest"

import type { ScenarioDraftReviewPackResult } from "../scenario-draft-review-packs/types"
import { buildScenarioDraftAuthoringQueue } from "./build-scenario-draft-authoring-queue"

function emptyReviewPacks(): ScenarioDraftReviewPackResult {
  return {
    data: { reviewPacks: [] },
    summary: {
      totalReviewPacks: 0,
      totalDrafts: 0,
      packsWithNullFamily: 0,
      edgeCasePackCount: 0,
      familyDepthPackCount: 0,
      distributionRebalancePackCount: 0,
      firstReviewPackCode: null,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringQueue", () => {
  it("matches result contract and summary fields", () => {
    const reviewPackResult: ScenarioDraftReviewPackResult = {
      data: {
        reviewPacks: [
          {
            code: "REVIEW_PACK_HAPPY_PATH_EDGE_CASE_EXPANSION",
            familyKey: "happy_path",
            structureIntent: "edge_case_expansion",
            drafts: [
              {
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
              },
            ],
            summary: { totalDrafts: 1, firstDraftCode: "DRAFT_1", nullFamilyCount: 0 },
          },
        ],
      },
      summary: {
        totalReviewPacks: 1,
        totalDrafts: 1,
        packsWithNullFamily: 0,
        edgeCasePackCount: 1,
        familyDepthPackCount: 0,
        distributionRebalancePackCount: 0,
        firstReviewPackCode: null,
      },
      warnings: [],
    }

    const result = buildScenarioDraftAuthoringQueue(reviewPackResult)
    expect(result.data.queuePacks).toHaveLength(1)
    expect(result.data.queueItems).toHaveLength(1)
    expect(result.summary.totalQueuePacks).toBe(1)
    expect(result.summary.totalQueueItems).toBe(1)
    expect(result.summary.firstQueuePackCode).toBe("REVIEW_PACK_HAPPY_PATH_EDGE_CASE_EXPANSION")
    expect(result.summary.firstQueueItemCode).toBe(result.data.queueItems[0]?.globalQueueCode ?? null)
    expect(result.summary.edgeCaseQueuePackCount).toBe(1)
  })

  it("warns when no review packs", () => {
    const result = buildScenarioDraftAuthoringQueue(emptyReviewPacks())
    expect(result.warnings.some((w) => w.code === "NO_AUTHORING_QUEUE")).toBe(true)
  })

  it("warns when null-family packs exist", () => {
    const reviewPackResult: ScenarioDraftReviewPackResult = {
      data: {
        reviewPacks: [
          {
            code: "REVIEW_PACK_UNASSIGNED_DISTRIBUTION_REBALANCE",
            familyKey: null,
            structureIntent: "distribution_rebalance",
            drafts: [
              {
                code: "DRAFT_N",
                order: 1,
                sourceBlueprintCode: "B",
                proposedScenarioKey: "scenario_n_1",
                familyKey: null,
                targetTags: [],
                structureIntent: "distribution_rebalance",
                status: "draft_pending_definition",
                metadata: { title: "T", description: "D" },
                placeholderStructureNotes: [],
                rationale: [],
              },
            ],
            summary: { totalDrafts: 1, firstDraftCode: "DRAFT_N", nullFamilyCount: 1 },
          },
        ],
      },
      summary: {
        totalReviewPacks: 1,
        totalDrafts: 1,
        packsWithNullFamily: 1,
        edgeCasePackCount: 0,
        familyDepthPackCount: 0,
        distributionRebalancePackCount: 1,
        firstReviewPackCode: null,
      },
      warnings: [],
    }
    const result = buildScenarioDraftAuthoringQueue(reviewPackResult)
    expect(result.warnings.some((w) => w.code === "AUTHORING_QUEUE_WITH_NULL_FAMILY_PACKS")).toBe(
      true,
    )
    expect(result.summary.packsWithNullFamily).toBe(1)
  })

  it("does not mutate review pack result", () => {
    const reviewPackResult: ScenarioDraftReviewPackResult = {
      data: {
        reviewPacks: [
          {
            code: "P1",
            familyKey: "visit_schedule",
            structureIntent: "edge_case_expansion",
            drafts: [
              {
                code: "D1",
                order: 1,
                sourceBlueprintCode: "B",
                proposedScenarioKey: "s",
                familyKey: "visit_schedule",
                targetTags: [],
                structureIntent: "edge_case_expansion",
                status: "draft_pending_definition",
                metadata: { title: "T", description: "D" },
                placeholderStructureNotes: [],
                rationale: [],
              },
            ],
            summary: { totalDrafts: 1, firstDraftCode: "D1", nullFamilyCount: 0 },
          },
        ],
      },
      summary: {
        totalReviewPacks: 1,
        totalDrafts: 1,
        packsWithNullFamily: 0,
        edgeCasePackCount: 1,
        familyDepthPackCount: 0,
        distributionRebalancePackCount: 0,
        firstReviewPackCode: null,
      },
      warnings: [],
    }
    const snap = structuredClone(reviewPackResult)
    buildScenarioDraftAuthoringQueue(reviewPackResult)
    expect(reviewPackResult).toEqual(snap)
  })

  it("is deterministic", () => {
    const reviewPackResult: ScenarioDraftReviewPackResult = {
      data: {
        reviewPacks: [
          {
            code: "PX",
            familyKey: "boundary_detection",
            structureIntent: "family_depth_expansion",
            drafts: [
              {
                code: "DX",
                order: 1,
                sourceBlueprintCode: "B",
                proposedScenarioKey: "scenario_x",
                familyKey: "boundary_detection",
                targetTags: [],
                structureIntent: "family_depth_expansion",
                status: "draft_pending_definition",
                metadata: { title: "T", description: "D" },
                placeholderStructureNotes: [],
                rationale: [],
              },
            ],
            summary: { totalDrafts: 1, firstDraftCode: "DX", nullFamilyCount: 0 },
          },
        ],
      },
      summary: {
        totalReviewPacks: 1,
        totalDrafts: 1,
        packsWithNullFamily: 0,
        edgeCasePackCount: 0,
        familyDepthPackCount: 1,
        distributionRebalancePackCount: 0,
        firstReviewPackCode: null,
      },
      warnings: [],
    }
    expect(buildScenarioDraftAuthoringQueue(reviewPackResult)).toEqual(
      buildScenarioDraftAuthoringQueue(reviewPackResult),
    )
  })
})
