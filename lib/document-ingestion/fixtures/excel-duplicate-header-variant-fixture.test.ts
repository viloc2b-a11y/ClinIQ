import { describe, expect, it } from "vitest"

import { buildExcelDuplicateHeaderVariantFixture } from "./excel-duplicate-header-variant-fixture"

describe("buildExcelDuplicateHeaderVariantFixture", () => {
  it("builds duplicate header variant fixture", () => {
    const result = buildExcelDuplicateHeaderVariantFixture()

    expect(result.type).toBe("excel_duplicate_header_variant")
    expect(result.fileName).toBe("duplicate-header-variant.xlsx")
  })
})
