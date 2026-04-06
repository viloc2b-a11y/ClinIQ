import { describe, expect, it } from "vitest"

import type { HardeningGapResult } from "../hardening-gaps/types"
import type { HardeningRecommendationResult } from "../hardening-recommendations/types"
import { buildHardeningExecutionPlan } from "./build-hardening-execution-plan"

function emptyGaps(): HardeningGapResult {
  return {
    data: { tagCoverage: [], familyCoverageGaps: [], gaps: [] },
    summary: {
      totalTags: 0,
      weakTagCount: 0,
      missingTagCount: 0,
      familiesWithHighGap: 0,
      familiesWithMediumGap: 0,
      familiesWithLowGap: 0,
      topGapCode: null,
    },
    warnings: [],
  }
}

describe("buildHardeningExecutionPlan", () => {
  it("returns contract-shaped result with sequential order", () => {
    const gaps: HardeningGapResult = {
      ...emptyGaps(),
      data: {
        ...emptyGaps().data,
        familyCoverageGaps: [
          {
            familyKey: "sheet_selection",
            totalScenarios: 0,
            highPriorityScenarios: 0,
            roadmapPhase: null,
            gapLevel: "high",
            reasons: [],
          },
        ],
      },
    }
    const recommendations: HardeningRecommendationResult = {
      data: {
        recommendations: [
          {
            code: "RECO_FAMILY_HIGH_SHEET_SELECTION",
            type: "expand_family",
            priority: "high",
            message: "m",
            target: { familyKey: "sheet_selection" },
            suggestedActions: [],
          },
          {
            code: "RECO_TAG_MISSING_Z",
            type: "expand_tag",
            priority: "high",
            message: "m",
            target: { tag: "z" },
            suggestedActions: [],
          },
        ],
      },
      summary: {
        totalRecommendations: 2,
        highPriority: 2,
        mediumPriority: 0,
        lowPriority: 0,
        topRecommendationCode: "x",
      },
      warnings: [],
    }

    const result = buildHardeningExecutionPlan({ recommendations, gaps })
    expect(result.data.planItems).toHaveLength(2)
    expect(result.data.planItems[0]?.order).toBe(1)
    expect(result.data.planItems[1]?.order).toBe(2)
    expect(result.summary.totalPlanItems).toBe(2)
    expect(result.summary.totalPlannedScenarios).toBe(3 + 2)
    expect(result.summary.firstPlanItemCode).toBe(result.data.planItems[0]?.code ?? null)
    expect(
      result.summary.highPriorityItems + result.summary.mediumPriorityItems + result.summary.lowPriorityItems,
    ).toBe(2)
  })

  it("sorts by priority then type then plannedScenarioCount desc then code", () => {
    const gaps: HardeningGapResult = {
      ...emptyGaps(),
      data: {
        ...emptyGaps().data,
        familyCoverageGaps: [
          {
            familyKey: "boundary_detection",
            totalScenarios: 0,
            highPriorityScenarios: 0,
            roadmapPhase: null,
            gapLevel: "high",
            reasons: [],
          },
        ],
      },
    }
    const recommendations: HardeningRecommendationResult = {
      data: {
        recommendations: [
          {
            code: "RECO_TAG_B",
            type: "expand_tag",
            priority: "high",
            message: "m",
            target: { tag: "b" },
            suggestedActions: [],
          },
          {
            code: "RECO_FAMILY_A",
            type: "expand_family",
            priority: "high",
            message: "m",
            target: { familyKey: "sheet_selection" },
            suggestedActions: [],
          },
        ],
      },
      summary: {
        totalRecommendations: 2,
        highPriority: 2,
        mediumPriority: 0,
        lowPriority: 0,
        topRecommendationCode: null,
      },
      warnings: [],
    }

    const items = buildHardeningExecutionPlan({ recommendations, gaps }).data.planItems
    expect(items[0]?.type).toBe("create_scenarios_for_family")
    expect(items[1]?.type).toBe("create_scenarios_for_tag")
  })

  it("emits NO_PLAN_ITEMS when recommendations list is empty", () => {
    const recommendations: HardeningRecommendationResult = {
      data: { recommendations: [] },
      summary: {
        totalRecommendations: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        topRecommendationCode: null,
      },
      warnings: [],
    }
    const result = buildHardeningExecutionPlan({ recommendations, gaps: emptyGaps() })
    expect(result.data.planItems).toHaveLength(0)
    expect(result.warnings.some((w) => w.code === "NO_PLAN_ITEMS")).toBe(true)
    expect(result.summary.firstPlanItemCode).toBeNull()
  })

  it("does not mutate recommendations or gaps", () => {
    const gaps = emptyGaps()
    const recommendations: HardeningRecommendationResult = {
      data: {
        recommendations: [
          {
            code: "R1",
            type: "expand_tag",
            priority: "medium",
            message: "m",
            target: { tag: "t" },
            suggestedActions: [],
          },
        ],
      },
      summary: {
        totalRecommendations: 1,
        highPriority: 0,
        mediumPriority: 1,
        lowPriority: 0,
        topRecommendationCode: null,
      },
      warnings: [],
    }
    const gSnap = structuredClone(gaps)
    const rSnap = structuredClone(recommendations)
    buildHardeningExecutionPlan({ recommendations, gaps })
    expect(gaps).toEqual(gSnap)
    expect(recommendations).toEqual(rSnap)
  })

  it("is deterministic", () => {
    const gaps: HardeningGapResult = {
      ...emptyGaps(),
      data: {
        ...emptyGaps().data,
        familyCoverageGaps: [
          {
            familyKey: "happy_path",
            totalScenarios: 1,
            highPriorityScenarios: 0,
            roadmapPhase: null,
            gapLevel: "high",
            reasons: [],
          },
        ],
      },
    }
    const recommendations: HardeningRecommendationResult = {
      data: {
        recommendations: [
          {
            code: "RECO_FAMILY_HIGH_HAPPY_PATH",
            type: "expand_family",
            priority: "high",
            message: "m",
            target: { familyKey: "happy_path" },
            suggestedActions: [],
          },
        ],
      },
      summary: {
        totalRecommendations: 1,
        highPriority: 1,
        mediumPriority: 0,
        lowPriority: 0,
        topRecommendationCode: null,
      },
      warnings: [],
    }
    const a = buildHardeningExecutionPlan({ recommendations, gaps })
    const b = buildHardeningExecutionPlan({ recommendations, gaps })
    expect(a).toEqual(b)
  })
})
