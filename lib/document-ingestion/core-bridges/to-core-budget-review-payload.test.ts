import { describe, expect, it } from "vitest"

import type { CoreBudgetReviewRow } from "./to-core-budget-review-rows"
import { toCoreBudgetReviewPayload } from "./to-core-budget-review-payload"

const defaultFlags = { missingPricing: false, inconsistentTotals: false }

function row(
  partial: Partial<CoreBudgetReviewRow> & Pick<CoreBudgetReviewRow, "sourceRecordIndex">,
): CoreBudgetReviewRow {
  const base: Omit<CoreBudgetReviewRow, "sourceRecordIndex"> = {
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    reviewStatus: "ready",
    reviewWarnings: [],
    flags: { ...defaultFlags },
  }
  return {
    ...base,
    ...partial,
    flags: { ...defaultFlags, ...(partial.flags ?? {}) },
  }
}

describe("toCoreBudgetReviewPayload", () => {
  it("empty input: documentId null when omitted, zero rows, warning emitted", () => {
    const out = toCoreBudgetReviewPayload({ rows: [] })
    expect(out.documentId).toBeNull()
    expect(out.rows).toEqual([])
    expect(out.readyRows).toEqual([])
    expect(out.rowsNeedingReview).toEqual([])
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.readyCount).toBe(0)
    expect(out.summary.needsReviewCount).toBe(0)
    expect(out.warnings).toEqual(["No budget review rows provided."])
  })

  it("all ready rows: partition and needsReviewCount = 0", () => {
    const rows = [
      row({ sourceRecordIndex: 0, activityName: "A", reviewStatus: "ready" }),
      row({ sourceRecordIndex: 1, activityName: "B", reviewStatus: "ready" }),
    ]
    const out = toCoreBudgetReviewPayload({ documentId: "d1", rows })
    expect(out.readyRows).toHaveLength(2)
    expect(out.rowsNeedingReview).toEqual([])
    expect(out.summary.totalRows).toBe(2)
    expect(out.summary.readyCount).toBe(2)
    expect(out.summary.needsReviewCount).toBe(0)
    expect(out.warnings).toEqual([])
  })

  it("mixed rows partition correctly", () => {
    const rows = [
      row({ sourceRecordIndex: 0, reviewStatus: "ready" }),
      row({ sourceRecordIndex: 1, reviewStatus: "needs_review" }),
      row({ sourceRecordIndex: 2, reviewStatus: "ready" }),
    ]
    const out = toCoreBudgetReviewPayload({ rows })
    expect(out.readyRows).toHaveLength(2)
    expect(out.rowsNeedingReview).toHaveLength(1)
    expect(out.summary.totalRows).toBe(3)
    expect(out.summary.readyCount).toBe(2)
    expect(out.summary.needsReviewCount).toBe(1)
    expect(out.warnings).toEqual(["Some budget review rows require review."])
  })

  it("derived missing activity / pricing / inconsistent totals counts", () => {
    const rows: CoreBudgetReviewRow[] = [
      row({ sourceRecordIndex: 0, activityName: null, unitPrice: 1, totalPrice: 1 }),
      row({
        sourceRecordIndex: 1,
        activityName: "Act",
        unitPrice: 1,
        totalPrice: 1,
        reviewWarnings: ["Missing activityName"],
      }),
      row({
        sourceRecordIndex: 2,
        activityName: "Act",
        flags: { missingPricing: true, inconsistentTotals: false },
      }),
      row({
        sourceRecordIndex: 3,
        activityName: "Act",
        flags: { missingPricing: false, inconsistentTotals: true },
      }),
      row({
        sourceRecordIndex: 4,
        activityName: "Act",
        flags: { missingPricing: false, inconsistentTotals: false },
        reviewWarnings: ["Missing pricing"],
      }),
      row({
        sourceRecordIndex: 5,
        activityName: "Act",
        flags: { missingPricing: false, inconsistentTotals: false },
        reviewWarnings: ["Inconsistent totals"],
      }),
    ]
    const out = toCoreBudgetReviewPayload({ rows })
    expect(out.summary.missingActivityNameCount).toBe(2)
    expect(out.summary.missingPricingCount).toBe(2)
    expect(out.summary.inconsistentTotalsCount).toBe(2)
  })

  it("lowConfidenceCount from confidence and warnings", () => {
    const rows: CoreBudgetReviewRow[] = [
      row({ sourceRecordIndex: 0, confidence: "low" }),
      row({ sourceRecordIndex: 1, confidence: "high" }),
      row({
        sourceRecordIndex: 2,
        confidence: "high",
        reviewWarnings: ["Low confidence source"],
      }),
    ]
    const out = toCoreBudgetReviewPayload({ rows })
    expect(out.summary.lowConfidenceCount).toBe(2)
  })

  it("documentId passes through when provided", () => {
    const out = toCoreBudgetReviewPayload({
      documentId: "doc-budget",
      rows: [row({ sourceRecordIndex: 0 })],
    })
    expect(out.documentId).toBe("doc-budget")
  })
})
