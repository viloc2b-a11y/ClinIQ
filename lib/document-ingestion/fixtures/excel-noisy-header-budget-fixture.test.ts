import { describe, expect, it } from "vitest"

import { buildExcelNoisyHeaderBudgetFixture } from "./excel-noisy-header-budget-fixture"

describe("buildExcelNoisyHeaderBudgetFixture", () => {
  it("builds noisy header budget fixture", () => {
    const result = buildExcelNoisyHeaderBudgetFixture()

    expect(result.type).toBe("excel_noisy_header_budget")
    expect(result.fileName).toBe("noisy-header-budget.xlsx")
  })
})
