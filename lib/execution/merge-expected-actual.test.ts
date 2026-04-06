import { describe, expect, it } from "vitest"

import { mergeExpectedAndActual } from "./merge-expected-actual"

describe("mergeExpectedAndActual", () => {
  it("merges matching line_code and fee_code", () => {
    const out = mergeExpectedAndActual(
      [{ line_code: "ECG", expected_quantity: 2, expected_revenue: 200 }],
      [{ fee_code: "ECG", actual_quantity: 1, actual_amount: 100 }],
    )
    expect(out).toEqual([
      {
        line_code: "ECG",
        expected_quantity: 2,
        expected_revenue: 200,
        actual_quantity: 1,
        actual_amount: 100,
        quantity_gap: 1,
        revenue_gap: 100,
      },
    ])
  })

  it("includes actual-only fee codes", () => {
    const out = mergeExpectedAndActual([], [{ fee_code: "X", actual_quantity: 1, actual_amount: 50 }])
    expect(out[0]?.line_code).toBe("X")
    expect(out[0]?.revenue_gap).toBe(-50)
  })
})
