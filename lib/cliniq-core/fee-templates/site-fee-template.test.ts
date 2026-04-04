import { describe, expect, it } from "vitest"

import feeTemplate from "./site-fee-template.json"
import {
  findSiteFeeByCode,
  recommendedFeePriceWithComplexity,
} from "./site-fee-template.lookup"

describe("site-fee-template.json", () => {
  it("supports lookup by feeCode and complexity-adjusted recommended price", () => {
    const fee = feeTemplate.siteFeeTemplateEngine.fees.find(
      (f) => f.feeCode === "PP-SCR-001",
    )
    expect(fee).toBeDefined()
    const price =
      fee!.complexityAdjusted?.diabetes ?? fee!.pricing.recommended
    expect(price).toBe(520)
  })

  it("findSiteFeeByCode + recommendedFeePriceWithComplexity match user pattern", () => {
    const fee = findSiteFeeByCode("PP-SCR-001")
    expect(fee).toBeDefined()
    expect(recommendedFeePriceWithComplexity(fee!, "diabetes")).toBe(520)
    expect(recommendedFeePriceWithComplexity(fee!)).toBe(520)
  })

  it("falls back to pricing.recommended when no complexity row for area", () => {
    const fee = findSiteFeeByCode("PP-EOS-001")
    expect(fee).toBeDefined()
    expect(recommendedFeePriceWithComplexity(fee!, "diabetes")).toBe(320)
  })
})
