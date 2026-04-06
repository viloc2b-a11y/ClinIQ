import { describe, expect, it } from "vitest"

import { classifyMatchedAndMissing, leakageTotals } from "./classify-matched-missing"
import { mergeExpectedAndActual } from "./merge-expected-actual"

describe("classifyMatchedAndMissing", () => {
  it("splits by gap", () => {
    const lines = mergeExpectedAndActual(
      [{ line_code: "A", expected_quantity: 1, expected_revenue: 100 }],
      [{ fee_code: "A", actual_quantity: 0, actual_amount: 0 }],
    )
    const { matched, missing } = classifyMatchedAndMissing(lines)
    expect(missing).toHaveLength(1)
    expect(matched).toHaveLength(0)
  })
})

describe("leakageTotals", () => {
  it("sums positive revenue gaps only", () => {
    const lines = mergeExpectedAndActual(
      [
        { line_code: "A", expected_quantity: 1, expected_revenue: 100 },
        { line_code: "B", expected_quantity: 1, expected_revenue: 50 },
      ],
      [
        { fee_code: "A", actual_quantity: 0, actual_amount: 0 },
        { fee_code: "B", actual_quantity: 1, actual_amount: 60 },
      ],
    )
    const { missing } = classifyMatchedAndMissing(lines)
    const t = leakageTotals(missing)
    expect(t.missing_line_count).toBe(1)
    expect(t.missing_revenue).toBe(100)
  })
})
