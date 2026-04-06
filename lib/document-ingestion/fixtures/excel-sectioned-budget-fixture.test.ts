import { describe, expect, it } from "vitest"

import { buildExcelSectionedBudgetFixture } from "./excel-sectioned-budget-fixture"

describe("buildExcelSectionedBudgetFixture", () => {
  it("builds sectioned budget fixture", () => {
    const result = buildExcelSectionedBudgetFixture()

    expect(result.type).toBe("excel_sectioned_budget")
    expect(result.fileName).toBe("sectioned-budget.xlsx")
  })
})
