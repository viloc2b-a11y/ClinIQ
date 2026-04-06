import { describe, expect, it } from "vitest"

import { buildExpectedActualComparisonFromRawRows } from "./build-expected-actual-comparison"

describe("buildExpectedActualComparisonFromRawRows", () => {
  it("produces missing lines and revenue leakage summary", () => {
    const out = buildExpectedActualComparisonFromRawRows(
      "S1",
      [
        { line_code: "ECG", visit_name: "V1", expected_quantity: 1, expected_revenue: 100 },
      ] as Record<string, unknown>[],
      [] as Record<string, unknown>[],
    )
    expect(out.missing).toHaveLength(1)
    expect(out.matched).toHaveLength(0)
    expect(out.leakage.missing_line_count).toBe(1)
    expect(out.revenueLeakage.summary.totalValue).toBe(100)
  })
})
