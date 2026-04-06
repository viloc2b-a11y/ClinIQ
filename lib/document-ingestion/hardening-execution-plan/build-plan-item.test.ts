import { describe, expect, it } from "vitest"

import type { FamilyCoverageGap } from "../hardening-gaps/types"
import type { HardeningRecommendation } from "../hardening-recommendations/types"
import { buildPlanItem } from "./build-plan-item"
import { suggestFamiliesForTag } from "./suggest-families-for-tag"

const familyGaps: FamilyCoverageGap[] = [
  {
    familyKey: "sheet_selection",
    totalScenarios: 0,
    highPriorityScenarios: 0,
    roadmapPhase: null,
    gapLevel: "high",
    reasons: [],
  },
  {
    familyKey: "happy_path",
    totalScenarios: 2,
    highPriorityScenarios: 0,
    roadmapPhase: null,
    gapLevel: "medium",
    reasons: [],
  },
]

describe("buildPlanItem", () => {
  it("maps expand_family with direct family target and count 3 for high", () => {
    const recommendation: HardeningRecommendation = {
      code: "RECO_FAMILY_HIGH_SHEET_SELECTION",
      type: "expand_family",
      priority: "high",
      message: "m",
      target: { familyKey: "sheet_selection" },
      suggestedActions: [],
    }
    const item = buildPlanItem({ recommendation, familyGaps })
    expect(item.type).toBe("create_scenarios_for_family")
    expect(item.code).toBe("PLAN_RECO_FAMILY_HIGH_SHEET_SELECTION")
    expect(item.plannedScenarioCount).toBe(3)
    expect(item.suggestedFamilyKeys).toEqual(["sheet_selection"])
    expect(item.target).toEqual({ familyKey: "sheet_selection" })
  })

  it("maps expand_tag with suggested families from gaps and count from rules", () => {
    const recommendation: HardeningRecommendation = {
      code: "RECO_TAG_MISSING_AMBIGUOUS",
      type: "expand_tag",
      priority: "high",
      message: "m",
      target: { tag: "ambiguous" },
      suggestedActions: [],
    }
    const item = buildPlanItem({ recommendation, familyGaps })
    expect(item.type).toBe("create_scenarios_for_tag")
    expect(item.plannedScenarioCount).toBe(2)
    expect(item.suggestedFamilyKeys).toEqual(suggestFamiliesForTag(familyGaps))
    expect(item.target).toEqual({ tag: "ambiguous" })
  })

  it("maps rebalance_distribution with top gap families and count 3", () => {
    const recommendation: HardeningRecommendation = {
      code: "RECO_DISTRIBUTION_TAG_IMBALANCE",
      type: "rebalance_distribution",
      priority: "medium",
      message: "m",
      target: { distribution: "tag_coverage" },
      suggestedActions: [],
    }
    const item = buildPlanItem({ recommendation, familyGaps })
    expect(item.type).toBe("rebalance_distribution")
    expect(item.plannedScenarioCount).toBe(3)
    expect(item.suggestedFamilyKeys).toEqual(suggestFamiliesForTag(familyGaps))
  })

  it("includes recommendation_source in rationale", () => {
    const recommendation: HardeningRecommendation = {
      code: "RECO_X",
      type: "expand_tag",
      priority: "medium",
      message: "m",
      target: { tag: "x" },
      suggestedActions: [],
    }
    const item = buildPlanItem({ recommendation, familyGaps: [] })
    expect(item.rationale.some((r) => r === "recommendation_source:RECO_X")).toBe(true)
  })
})
