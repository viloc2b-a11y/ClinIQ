import { describe, expect, it } from "vitest"

import { buildExcelSparseBudgetFixture } from "./excel-sparse-budget-fixture"

describe("buildExcelSparseBudgetFixture", () => {
  it("builds sparse budget fixture", () => {
    const result = buildExcelSparseBudgetFixture()

    expect(result.type).toBe("excel_sparse_budget")
    expect(result.fileName).toBe("sparse-budget.xlsx")
  })
})
