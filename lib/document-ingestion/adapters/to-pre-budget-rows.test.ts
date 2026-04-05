import { describe, expect, it } from "vitest"

import { toPreBudgetRows } from "./to-pre-budget-rows"
import type { BudgetCandidateRow } from "../bridge-document-records"

function b(partial: Partial<BudgetCandidateRow> & Pick<BudgetCandidateRow, "sourceRecordIndex">): BudgetCandidateRow {
  return {
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    ...partial,
  }
}

describe("toPreBudgetRows", () => {
  it("clean row (no review)", () => {
    const out = toPreBudgetRows({
      budgetCandidates: [
        b({
          sourceRecordIndex: 0,
          activityName: "Site startup",
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
          confidence: "high",
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(false)
    expect(out.rows[0]!.reviewReasons).toEqual([])
    expect(out.rows[0]!.flags).toEqual({ missingPricing: false, inconsistentTotals: false })
    expect(out.warnings).toEqual([])
  })

  it("missing activityName", () => {
    const out = toPreBudgetRows({
      budgetCandidates: [
        b({
          sourceRecordIndex: 0,
          activityName: null,
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing activityName"])
  })

  it("missing pricing", () => {
    const out = toPreBudgetRows({
      budgetCandidates: [
        b({
          sourceRecordIndex: 0,
          activityName: "Line A",
          quantity: 1,
          unitPrice: null,
          totalPrice: null,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.flags.missingPricing).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing pricing"])
  })

  it("inconsistent totals", () => {
    const out = toPreBudgetRows({
      budgetCandidates: [
        b({
          sourceRecordIndex: 0,
          activityName: "IRB",
          quantity: 2,
          unitPrice: 50,
          totalPrice: 99,
        }),
      ],
    })
    expect(out.rows[0]!.flags.inconsistentTotals).toBe(true)
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toContain("Inconsistent totals")
  })

  it("low confidence", () => {
    const out = toPreBudgetRows({
      budgetCandidates: [
        b({
          sourceRecordIndex: 0,
          activityName: "Monitoring",
          quantity: 1,
          unitPrice: 200,
          totalPrice: 200,
          confidence: "low",
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Low confidence source"])
  })

  it("multiple rows summary and majority inconsistent warning", () => {
    const out = toPreBudgetRows({
      budgetCandidates: [
        b({
          sourceRecordIndex: 0,
          activityName: "OK",
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        }),
        b({
          sourceRecordIndex: 1,
          activityName: "Bad1",
          quantity: 2,
          unitPrice: 10,
          totalPrice: 50,
        }),
        b({
          sourceRecordIndex: 2,
          activityName: "Bad2",
          quantity: 1,
          unitPrice: 5,
          totalPrice: 99,
        }),
      ],
    })
    expect(out.summary.totalInputCandidates).toBe(3)
    expect(out.summary.totalRows).toBe(3)
    expect(out.summary.rowsNeedingReview).toBe(2)
    expect(out.summary.missingActivityName).toBe(0)
    expect(out.summary.missingPricing).toBe(0)
    expect(out.summary.inconsistentTotals).toBe(2)
    expect(out.warnings).toContain(
      "More than half of pre-budget rows have inconsistent quantity × unit vs total.",
    )
  })

  it("empty input", () => {
    const out = toPreBudgetRows({ budgetCandidates: [] })
    expect(out.rows).toEqual([])
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.rowsNeedingReview).toBe(0)
    expect(out.warnings).toEqual(["No budget line candidates were provided."])
  })
})
