import { describe, expect, it } from "vitest"

import type { ScenarioDraftResult } from "../scenario-drafts/types"
import { buildScenarioDraftReviewPacks } from "./build-scenario-draft-review-packs"

function draft(overrides: Partial<import("../scenario-drafts/types").ScenarioDraft>) {
  return {
    code: "DRAFT_1",
    order: 1,
    sourceBlueprintCode: "B1",
    proposedScenarioKey: "scenario_a_1",
    familyKey: "happy_path" as const,
    targetTags: [] as string[],
    structureIntent: "edge_case_expansion" as const,
    status: "draft_pending_definition" as const,
    metadata: { title: "T", description: "D" },
    placeholderStructureNotes: [] as string[],
    rationale: [] as string[],
    ...overrides,
  }
}

function emptyDraftResult(): ScenarioDraftResult {
  return {
    data: { drafts: [] },
    summary: {
      totalDrafts: 0,
      nullFamilyCount: 0,
      edgeCaseExpansionCount: 0,
      familyDepthExpansionCount: 0,
      distributionRebalanceCount: 0,
      firstDraftCode: null,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftReviewPacks", () => {
  it("matches result contract and aggregates summaries", () => {
    const draftResult: ScenarioDraftResult = {
      data: {
        drafts: [
          draft({
            code: "D2",
            order: 2,
            familyKey: "happy_path",
            structureIntent: "family_depth_expansion",
            proposedScenarioKey: "scenario_b",
          }),
          draft({
            code: "D1",
            order: 1,
            familyKey: "happy_path",
            structureIntent: "edge_case_expansion",
          }),
        ],
      },
      summary: {
        totalDrafts: 2,
        nullFamilyCount: 0,
        edgeCaseExpansionCount: 1,
        familyDepthExpansionCount: 1,
        distributionRebalanceCount: 0,
        firstDraftCode: null,
      },
      warnings: [],
    }

    const result = buildScenarioDraftReviewPacks(draftResult)
    expect(result.data.reviewPacks).toHaveLength(2)
    expect(result.summary.totalDrafts).toBe(2)
    expect(result.summary.totalReviewPacks).toBe(2)
    expect(result.summary.edgeCasePackCount + result.summary.familyDepthPackCount).toBe(2)
    expect(result.summary.firstReviewPackCode).toBe(result.data.reviewPacks[0]?.code ?? null)
  })

  it("warns when no drafts", () => {
    const result = buildScenarioDraftReviewPacks(emptyDraftResult())
    expect(result.warnings.some((w) => w.code === "NO_REVIEW_PACKS")).toBe(true)
    expect(result.data.reviewPacks).toHaveLength(0)
  })

  it("warns when a pack has null family", () => {
    const draftResult: ScenarioDraftResult = {
      data: {
        drafts: [
          draft({
            code: "DN",
            familyKey: null,
            structureIntent: "distribution_rebalance",
          }),
        ],
      },
      summary: {
        totalDrafts: 1,
        nullFamilyCount: 1,
        edgeCaseExpansionCount: 0,
        familyDepthExpansionCount: 0,
        distributionRebalanceCount: 1,
        firstDraftCode: null,
      },
      warnings: [],
    }
    const result = buildScenarioDraftReviewPacks(draftResult)
    expect(result.warnings.some((w) => w.code === "REVIEW_PACKS_WITH_NULL_FAMILY")).toBe(true)
    expect(result.summary.packsWithNullFamily).toBe(1)
  })

  it("does not mutate draft result", () => {
    const draftResult: ScenarioDraftResult = {
      data: {
        drafts: [draft({ code: "DX" })],
      },
      summary: {
        totalDrafts: 1,
        nullFamilyCount: 0,
        edgeCaseExpansionCount: 1,
        familyDepthExpansionCount: 0,
        distributionRebalanceCount: 0,
        firstDraftCode: null,
      },
      warnings: [],
    }
    const snap = structuredClone(draftResult)
    buildScenarioDraftReviewPacks(draftResult)
    expect(draftResult).toEqual(snap)
  })

  it("is deterministic", () => {
    const draftResult: ScenarioDraftResult = {
      data: {
        drafts: [
          draft({ code: "D1", familyKey: "boundary_detection", order: 1 }),
          draft({
            code: "D2",
            familyKey: "boundary_detection",
            structureIntent: "distribution_rebalance",
            order: 2,
          }),
        ],
      },
      summary: {
        totalDrafts: 2,
        nullFamilyCount: 0,
        edgeCaseExpansionCount: 1,
        familyDepthExpansionCount: 0,
        distributionRebalanceCount: 1,
        firstDraftCode: null,
      },
      warnings: [],
    }
    expect(buildScenarioDraftReviewPacks(draftResult)).toEqual(
      buildScenarioDraftReviewPacks(draftResult),
    )
  })
})
