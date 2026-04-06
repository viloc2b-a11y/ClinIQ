import { describe, expect, it } from "vitest"

import type { FamilyCoverageGap } from "../hardening-gaps/types"
import { buildFamilyRecommendations } from "./build-family-recommendations"

function gap(
  familyKey: FamilyCoverageGap["familyKey"],
  gapLevel: FamilyCoverageGap["gapLevel"],
): FamilyCoverageGap {
  return {
    familyKey,
    totalScenarios: gapLevel === "high" ? 0 : 2,
    highPriorityScenarios: 0,
    roadmapPhase: null,
    gapLevel,
    reasons: [],
  }
}

describe("buildFamilyRecommendations", () => {
  it("emits high priority for high family gap", () => {
    const rows = buildFamilyRecommendations([gap("sheet_selection", "high")])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.priority).toBe("high")
    expect(rows[0]?.code).toBe("RECO_FAMILY_HIGH_SHEET_SELECTION")
    expect(rows[0]?.target).toEqual({ familyKey: "sheet_selection" })
  })

  it("emits medium priority for medium family gap", () => {
    const rows = buildFamilyRecommendations([gap("happy_path", "medium")])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.priority).toBe("medium")
    expect(rows[0]?.code).toBe("RECO_FAMILY_MEDIUM_HAPPY_PATH")
  })

  it("ignores low gap families", () => {
    expect(buildFamilyRecommendations([gap("visit_schedule", "low")])).toHaveLength(0)
  })

  it("sorts by code deterministically", () => {
    const rows = buildFamilyRecommendations([
      gap("visit_schedule", "high"),
      gap("happy_path", "high"),
    ])
    expect(rows.map((r) => r.code)).toEqual([
      "RECO_FAMILY_HIGH_HAPPY_PATH",
      "RECO_FAMILY_HIGH_VISIT_SCHEDULE",
    ])
  })
})
