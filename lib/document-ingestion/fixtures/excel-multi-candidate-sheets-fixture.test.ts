import { describe, expect, it } from "vitest"

import { buildExcelMultiCandidateSheetsFixture } from "./excel-multi-candidate-sheets-fixture"

describe("buildExcelMultiCandidateSheetsFixture", () => {
  it("builds multi candidate sheets fixture", () => {
    const result = buildExcelMultiCandidateSheetsFixture()

    expect(result.type).toBe("excel_multi_candidate_sheets")
    expect(result.fileName).toBe("multi-candidate-sheets.xlsx")
  })
})
