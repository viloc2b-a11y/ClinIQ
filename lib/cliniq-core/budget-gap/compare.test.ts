import { describe, expect, it } from "vitest"

import { compareSponsorBudgetToInternalBudget } from "./compare"
import { budgetLineMatchKey } from "./normalize"
import type {
  InternalBudgetLine,
  SponsorBudgetLine,
} from "./types"

const meta = {
  studyName: "Test",
  patientsInBudget: 10,
  plannedEnrollment: 20,
}

function line(
  partial: Partial<InternalBudgetLine> & Pick<InternalBudgetLine, "id">,
): InternalBudgetLine {
  return {
    category: "Visit",
    lineCode: "X",
    label: "Line",
    visitName: "V1",
    quantity: 1,
    unit: "ea",
    internalUnitCost: 100,
    internalTotal: 100,
    notes: "",
    source: "internal-model",
    ...partial,
  }
}

function sponsor(
  partial: Partial<SponsorBudgetLine> & Pick<SponsorBudgetLine, "id">,
): SponsorBudgetLine {
  return {
    category: "Visit",
    lineCode: "S",
    label: "Line",
    visitName: "V1",
    quantity: 1,
    unit: "ea",
    sponsorUnitOffer: 100,
    sponsorTotalOffer: 100,
    notes: "",
    source: "sponsor-budget",
    ...partial,
  }
}

describe("compareSponsorBudgetToInternalBudget", () => {
  it("marks loss when sponsor total is below internal", () => {
    const internalLines = [line({ id: "i1", internalTotal: 500, internalUnitCost: 500 })]
    const sponsorLines = [
      sponsor({ id: "s1", sponsorTotalOffer: 400, sponsorUnitOffer: 400 }),
    ]
    const { gapLines, summary } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(gapLines[0].gapAmount).toBe(-100)
    expect(gapLines[0].status).toBe("loss")
    expect(summary.totalGap).toBe(-100)
  })

  it("treats ≥10% margin as profitable when gap is non-negative", () => {
    const internalLines = [line({ id: "i1", internalTotal: 100 })]
    const sponsorLines = [sponsor({ id: "s1", sponsorTotalOffer: 111 })]
    const { gapLines } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(gapLines[0].status).toBe("profitable")
  })

  it("treats 0–10% margin as breakeven", () => {
    const internalLines = [line({ id: "i1", internalTotal: 1000 })]
    const sponsorLines = [sponsor({ id: "s1", sponsorTotalOffer: 1050 })]
    const { gapLines } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(gapLines[0].status).toBe("breakeven")
  })

  it("matches sponsor alias SCR to internal Screening visit wording", () => {
    const internalLines = [
      line({
        id: "i1",
        category: "Visit",
        visitName: "Screening",
        label: "Screening visit",
        internalTotal: 200,
        internalUnitCost: 200,
      }),
    ]
    const sponsorLines = [
      sponsor({
        id: "s1",
        category: "Visit",
        visitName: "Screening",
        label: "SCR",
        sponsorTotalOffer: 200,
        sponsorUnitOffer: 200,
      }),
    ]
    const { gapLines } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(budgetLineMatchKey(internalLines[0])).toBe(
      budgetLineMatchKey(sponsorLines[0]),
    )
    expect(gapLines[0].sponsorTotalOffer).toBe(200)
    expect(gapLines[0].status).not.toBe("missing")
  })

  it("matches site activation / start-up startup aliases", () => {
    const internalLines = [
      line({
        id: "i1",
        category: "Startup",
        lineCode: "SU",
        visitName: "N/A",
        label: "Site activation & startup",
        quantity: 1,
        internalUnitCost: 50_000,
        internalTotal: 50_000,
      }),
    ]
    const sponsorLines = [
      sponsor({
        id: "s1",
        category: "Startup",
        visitName: "N/A",
        label: "start-up fee",
        quantity: 1,
        sponsorUnitOffer: 50_000,
        sponsorTotalOffer: 50_000,
      }),
    ]
    const { gapLines } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(gapLines[0].gapAmount).toBe(0)
    expect(gapLines[0].sponsorTotalOffer).toBe(50_000)
  })

  it("creates missingInvoiceable and missing status when critical line has no sponsor match", () => {
    const internalLines = [
      line({
        id: "i1",
        category: "Screen failure",
        lineCode: "SF",
        visitName: "Screening",
        label: "Screen failure fee",
        internalTotal: 3900,
        internalUnitCost: 650,
        quantity: 6,
      }),
    ]
    const sponsorLines: SponsorBudgetLine[] = []
    const { gapLines, missingInvoiceables } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(gapLines[0].status).toBe("missing")
    expect(missingInvoiceables).toHaveLength(1)
    expect(missingInvoiceables[0].lineCode).toBe("SF")
  })

  it("prepends alert when sponsor lines do not match any internal row", () => {
    const internalLines = [line({ id: "i1", label: "Alpha", internalTotal: 100 })]
    const sponsorLines = [
      sponsor({ id: "s1", label: "orphan sponsor line", sponsorTotalOffer: 50 }),
    ]
    const { summary } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    expect(summary.primaryAlerts[0]).toMatch(/did not match any internal budget row/i)
  })

  it("splits sponsor pool proportionally when multiple internals share the same match key", () => {
    const internalLines: InternalBudgetLine[] = [
      line({
        id: "i1",
        label: "Follow-up",
        visitName: "FU",
        internalTotal: 300,
        quantity: 1,
        internalUnitCost: 300,
      }),
      line({
        id: "i2",
        label: "Follow up",
        visitName: "FU",
        internalTotal: 100,
        quantity: 1,
        internalUnitCost: 100,
      }),
    ]
    const sponsorLines = [
      sponsor({
        id: "s1",
        label: "FU visit",
        visitName: "FU",
        sponsorTotalOffer: 400,
        sponsorUnitOffer: 400,
        quantity: 1,
      }),
    ]
    const { gapLines } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: meta,
    })
    const a = gapLines.find((g) => g.id === "gap-i1")
    const b = gapLines.find((g) => g.id === "gap-i2")
    expect(a?.sponsorTotalOffer).toBeCloseTo(300, 5)
    expect(b?.sponsorTotalOffer).toBeCloseTo(100, 5)
  })

  it("computes totalGapPerPatient and projectedStudyGap from study meta", () => {
    const internalLines = [line({ id: "i1", internalTotal: 1000 })]
    const sponsorLines = [sponsor({ id: "s1", sponsorTotalOffer: 800 })]
    const { summary } = compareSponsorBudgetToInternalBudget({
      internalLines,
      sponsorLines,
      studyMeta: { patientsInBudget: 10, plannedEnrollment: 25 },
    })
    expect(summary.totalGapPerPatient).toBe(-20)
    expect(summary.projectedStudyGap).toBe(-500)
  })
})
