import { describe, expect, it } from "vitest"

import { compareSponsorBudgetToInternalBudget } from "../budget-gap/compare"
import {
  buildNegotiationPackage,
  recommendCounterofferForLine,
  selectLinesForStrategy,
} from "./build-package"
import { negotiationPackageFromGapResult } from "./from-module3"
import {
  counterofferLinesToCsv,
  negotiationPackageToJson,
} from "./export-format"
import { generateEmailDraft } from "./email-draft"
import { recommendPaymentTerms } from "./payment-terms"
import { minimalEngineInput } from "./test-fixtures"

describe("Module 4 negotiation engine", () => {
  const input = minimalEngineInput()

  it("buildNegotiationPackage: firm includes at least as many lines as conservative", () => {
    const cons = buildNegotiationPackage({ input, strategy: "conservative" })
    const firm = buildNegotiationPackage({ input, strategy: "firm" })
    expect(firm.counterofferLines.length).toBeGreaterThanOrEqual(
      cons.counterofferLines.length,
    )
  })

  it("includes missing critical line (screen failure)", () => {
    const pkg = buildNegotiationPackage({ input, strategy: "conservative" })
    expect(pkg.counterofferLines.some((l) => l.lineCode === "SF")).toBe(true)
  })

  it("recommendPaymentTerms surfaces monthly cadence when gap negative", () => {
    const recs = recommendPaymentTerms(input)
    expect(recs.some((r) => r.recommendedTermChange.toLowerCase().includes("monthly"))).toBe(
      true,
    )
  })

  it("generateEmailDraft returns structured sections and fullText", () => {
    const pkg = buildNegotiationPackage({ input, strategy: "balanced" })
    const email = generateEmailDraft(pkg)
    expect(email.subject).toContain("Budget revision")
    expect(email.adjustmentBullets.length).toBe(pkg.counterofferLines.length)
    expect(email.fullText).toContain("Requested adjustments")
  })

  it("export helpers produce parseable output", () => {
    const pkg = buildNegotiationPackage({ input, strategy: "balanced" })
    const json = negotiationPackageToJson(pkg)
    expect(JSON.parse(json).strategy).toBe("balanced")
    const csv = counterofferLinesToCsv(pkg.counterofferLines)
    expect(csv.split("\n")[0]).toContain("lineCode")
  })

  it("recommendCounterofferForLine: missing → full internal", () => {
    const line = input.lines.find((l) => l.status === "missing")!
    const row = recommendCounterofferForLine(line, "conservative", input.summary)!
    expect(row.recommendedCounteroffer).toBe(line.internalTotal)
  })

  it("selectLinesForStrategy: conservative subset of firm", () => {
    const c = selectLinesForStrategy(input.lines, "conservative", input.summary)
    const f = selectLinesForStrategy(input.lines, "firm", input.summary)
    expect(c.length).toBeLessThanOrEqual(f.length)
  })

  it("negotiationPackageFromGapResult chains Module 3 compare → Module 4 package", () => {
    const result = compareSponsorBudgetToInternalBudget({
      internalLines: [
        {
          id: "i1",
          category: "Visit",
          lineCode: "L1",
          label: "Visit A",
          visitName: "V1",
          quantity: 1,
          unit: "ea",
          internalUnitCost: 100,
          internalTotal: 100,
          notes: "",
          source: "internal-model",
        },
      ],
      sponsorLines: [
        {
          id: "s1",
          category: "Visit",
          lineCode: "S1",
          label: "Visit A",
          visitName: "V1",
          quantity: 1,
          unit: "ea",
          sponsorUnitOffer: 80,
          sponsorTotalOffer: 80,
          notes: "",
          source: "sponsor-budget",
        },
      ],
      studyMeta: { studyId: "CHAIN-1" },
    })
    const pkg = negotiationPackageFromGapResult(
      result,
      { studyId: "CHAIN-1" },
      "balanced",
      { generatedAt: "2026-04-03T12:00:00.000Z" },
    )
    expect(pkg.studyId).toBe("CHAIN-1")
    expect(pkg.strategy).toBe("balanced")
    expect(pkg.counterofferLines.length).toBeGreaterThanOrEqual(1)
    expect(pkg.justifications.length).toBeGreaterThan(0)
    expect(pkg.paymentTerms.length).toBeGreaterThan(0)
  })
})
