import { describe, expect, it } from "vitest"

import type { PreBudgetRow } from "../adapters/to-pre-budget-rows"
import { toCoreBudgetReviewRows } from "./to-core-budget-review-rows"

function row(partial: Partial<PreBudgetRow> & Pick<PreBudgetRow, "sourceRecordIndex">): PreBudgetRow {
  return {
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    flags: { missingPricing: false, inconsistentTotals: false },
    ...partial,
  }
}

describe("toCoreBudgetReviewRows", () => {
  it("ready row maps to reviewStatus ready", () => {
    const out = toCoreBudgetReviewRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          activityName: "Startup",
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
          needsReview: false,
        }),
      ],
    })
    expect(out.rows[0]!.reviewStatus).toBe("ready")
    expect(out.rows[0]!.reviewWarnings).toEqual([])
  })

  it("row needing review maps to needs_review", () => {
    const out = toCoreBudgetReviewRows({
      rows: [row({ sourceRecordIndex: 0, needsReview: true, reviewReasons: ["Missing pricing"] })],
    })
    expect(out.rows[0]!.reviewStatus).toBe("needs_review")
  })

  it("reviewReasons propagate to reviewWarnings", () => {
    const out = toCoreBudgetReviewRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          needsReview: true,
          reviewReasons: ["Missing activityName", "Inconsistent totals"],
        }),
      ],
    })
    expect(out.rows[0]!.reviewWarnings).toEqual(["Missing activityName", "Inconsistent totals"])
  })

  it("flags pass through correctly", () => {
    const out = toCoreBudgetReviewRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          flags: { missingPricing: true, inconsistentTotals: true },
        }),
      ],
    })
    expect(out.rows[0]!.flags).toEqual({ missingPricing: true, inconsistentTotals: true })
  })

  it("summary counts correct", () => {
    const out = toCoreBudgetReviewRows({
      rows: [
        row({ sourceRecordIndex: 0, needsReview: false, flags: { missingPricing: false, inconsistentTotals: false } }),
        row({
          sourceRecordIndex: 1,
          needsReview: true,
          flags: { missingPricing: true, inconsistentTotals: false },
        }),
        row({
          sourceRecordIndex: 2,
          needsReview: true,
          flags: { missingPricing: false, inconsistentTotals: true },
        }),
      ],
    })
    expect(out.summary.totalInputRows).toBe(3)
    expect(out.summary.totalOutputRows).toBe(3)
    expect(out.summary.readyCount).toBe(1)
    expect(out.summary.needsReviewCount).toBe(2)
    expect(out.summary.missingPricingCount).toBe(1)
    expect(out.summary.inconsistentTotalsCount).toBe(1)
  })

  it("empty input returns warning", () => {
    const out = toCoreBudgetReviewRows({ rows: [] })
    expect(out.rows).toEqual([])
    expect(out.warnings).toEqual(["No pre-budget rows provided."])
    expect(out.summary.missingPricingCount).toBe(0)
    expect(out.summary.inconsistentTotalsCount).toBe(0)
  })
})
