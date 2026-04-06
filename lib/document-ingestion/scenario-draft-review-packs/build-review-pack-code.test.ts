import { describe, expect, it } from "vitest"

import { buildReviewPackCode } from "./build-review-pack-code"

describe("buildReviewPackCode", () => {
  it("builds stable uppercase code for family and intent", () => {
    expect(
      buildReviewPackCode({
        familyKey: "happy_path",
        structureIntent: "edge_case_expansion",
      }),
    ).toBe("REVIEW_PACK_HAPPY_PATH_EDGE_CASE_EXPANSION")
  })

  it("maps null family to unassigned token", () => {
    expect(
      buildReviewPackCode({
        familyKey: null,
        structureIntent: "family_depth_expansion",
      }),
    ).toBe("REVIEW_PACK_UNASSIGNED_FAMILY_DEPTH_EXPANSION")
  })

  it("normalizes odd characters in family key", () => {
    expect(
      buildReviewPackCode({
        familyKey: "sheet-selection",
        structureIntent: "distribution_rebalance",
      }),
    ).toBe("REVIEW_PACK_SHEET_SELECTION_DISTRIBUTION_REBALANCE")
  })

  it("output is uppercase", () => {
    const code = buildReviewPackCode({
      familyKey: "row_structure",
      structureIntent: "edge_case_expansion",
    })
    expect(code).toBe(code.toUpperCase())
  })
})
