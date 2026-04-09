import { describe, expect, it } from "vitest"
import { mapParsedLinesToBudgetGapInput } from "./map-to-budget-gap-lines"
import type { ParsedBudgetLine } from "./parsed-budget-line"

const baseLine = (over: Partial<ParsedBudgetLine>): ParsedBudgetLine => ({
  lineId: "x1",
  sourceType: "excel",
  category: "Visit",
  itemDescription: "Screening",
  unitType: "visit",
  quantity: 2,
  unitPrice: 100,
  totalPrice: 200,
  visitName: "V1",
  notes: null,
  confidence: "high",
  warnings: [],
  ...over,
})

describe("mapParsedLinesToBudgetGapInput", () => {
  it("sponsor_budget fills sponsorLines only", () => {
    const { internalLines, sponsorLines } = mapParsedLinesToBudgetGapInput(
      [baseLine({})],
      "sponsor_budget",
    )
    expect(internalLines).toHaveLength(0)
    expect(sponsorLines).toHaveLength(1)
    expect(sponsorLines[0].sponsorTotalOffer).toBe(200)
  })

  it("site_internal_budget fills internalLines only", () => {
    const { internalLines, sponsorLines } = mapParsedLinesToBudgetGapInput(
      [baseLine({})],
      "site_internal_budget",
    )
    expect(internalLines).toHaveLength(1)
    expect(sponsorLines).toHaveLength(0)
    expect(internalLines[0].internalTotal).toBe(200)
  })

  it("contract_financial maps to internalLines", () => {
    const { internalLines, sponsorLines } = mapParsedLinesToBudgetGapInput(
      [baseLine({})],
      "contract_financial",
    )
    expect(internalLines).toHaveLength(1)
    expect(sponsorLines).toHaveLength(0)
  })
})
