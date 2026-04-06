import { describe, expect, it } from "vitest"

import type { FamilyCoverageGap } from "../hardening-gaps/types"
import { suggestFamiliesForTag } from "./suggest-families-for-tag"

function fg(
  familyKey: FamilyCoverageGap["familyKey"],
  gapLevel: FamilyCoverageGap["gapLevel"],
  totalScenarios: number,
): FamilyCoverageGap {
  return {
    familyKey,
    totalScenarios,
    highPriorityScenarios: 0,
    roadmapPhase: null,
    gapLevel,
    reasons: [],
  }
}

describe("suggestFamiliesForTag", () => {
  it("returns up to 3 family keys ordered by gap severity then totalScenarios then key", () => {
    const gaps: FamilyCoverageGap[] = [
      fg("visit_schedule", "low", 1),
      fg("happy_path", "high", 2),
      fg("sheet_selection", "high", 0),
      fg("row_structure", "medium", 0),
    ]
    expect(suggestFamiliesForTag(gaps)).toEqual([
      "sheet_selection",
      "happy_path",
      "row_structure",
    ])
  })

  it("returns empty array for empty input", () => {
    expect(suggestFamiliesForTag([])).toEqual([])
  })

  it("does not mutate family gaps", () => {
    const gaps = [fg("happy_path", "low", 0)]
    const snap = structuredClone(gaps)
    suggestFamiliesForTag(gaps)
    expect(gaps).toEqual(snap)
  })

  it("is stable for identical input", () => {
    const gaps = [
      fg("boundary_detection", "high", 0),
      fg("header_variants", "medium", 1),
    ]
    expect(suggestFamiliesForTag(gaps)).toEqual(suggestFamiliesForTag(gaps))
  })
})
