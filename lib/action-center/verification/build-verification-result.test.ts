import { describe, expect, it } from "vitest"

import { buildActionCenterVerificationResult } from "./build-verification-result"

describe("buildActionCenterVerificationResult", () => {
  it("builds matched and missing deterministically", () => {
    const result = buildActionCenterVerificationResult({
      expectedIds: ["a", "b", "c"],
      foundIds: ["b", "a"],
    })

    expect(result).toEqual({
      totalExpected: 3,
      found: 2,
      missing: ["c"],
      matched: ["a", "b"],
      warnings: ["Some expected action items were not found in Action Center."],
    })
  })

  it("returns empty warnings when all found", () => {
    const result = buildActionCenterVerificationResult({
      expectedIds: ["a"],
      foundIds: ["a"],
    })

    expect(result).toEqual({
      totalExpected: 1,
      found: 1,
      missing: [],
      matched: ["a"],
      warnings: [],
    })
  })
})
