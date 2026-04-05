import { describe, expect, it } from "vitest"

import type { CoreInvoiceReviewRow } from "./to-core-invoice-review-rows"
import { toCoreInvoiceReviewPayload } from "./to-core-invoice-review-payload"

const defaultFlags = {
  missingVisit: false,
  missingActivity: false,
  missingPricing: false,
  inconsistentTotals: false,
}

function row(
  partial: Partial<CoreInvoiceReviewRow> & Pick<CoreInvoiceReviewRow, "sourceRecordIndex">,
): CoreInvoiceReviewRow {
  const base: Omit<CoreInvoiceReviewRow, "sourceRecordIndex"> = {
    visitName: null,
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

describe("toCoreInvoiceReviewPayload", () => {
  it("empty input: documentId null when omitted, zero rows, warning emitted", () => {
    const out = toCoreInvoiceReviewPayload({ rows: [] })
    expect(out.documentId).toBeNull()
    expect(out.rows).toEqual([])
    expect(out.readyRows).toEqual([])
    expect(out.rowsNeedingReview).toEqual([])
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.readyCount).toBe(0)
    expect(out.summary.needsReviewCount).toBe(0)
    expect(out.warnings).toEqual(["No invoice review rows provided."])
  })

  it("all ready rows: partition and needsReviewCount = 0", () => {
    const rows = [
      row({
        sourceRecordIndex: 0,
        visitName: "V1",
        activityName: "A",
        reviewStatus: "ready",
      }),
      row({
        sourceRecordIndex: 1,
        visitName: "V2",
        activityName: "B",
        reviewStatus: "ready",
      }),
    ]
    const out = toCoreInvoiceReviewPayload({ documentId: "d1", rows })
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
    const out = toCoreInvoiceReviewPayload({ rows })
    expect(out.readyRows).toHaveLength(2)
    expect(out.rowsNeedingReview).toHaveLength(1)
    expect(out.summary.totalRows).toBe(3)
    expect(out.summary.readyCount).toBe(2)
    expect(out.summary.needsReviewCount).toBe(1)
    expect(out.warnings).toEqual(["Some invoice review rows require review."])
  })

  it("derived missing visit / activity / pricing / inconsistent totals counts", () => {
    const rows: CoreInvoiceReviewRow[] = [
      row({ sourceRecordIndex: 0, visitName: null, activityName: "A" }),
      row({
        sourceRecordIndex: 1,
        visitName: "V",
        activityName: "A",
        reviewWarnings: ["Missing visitName"],
      }),
      row({ sourceRecordIndex: 2, visitName: "V", activityName: null }),
      row({
        sourceRecordIndex: 3,
        visitName: "V",
        activityName: "A",
        reviewWarnings: ["Missing activityName"],
      }),
      row({
        sourceRecordIndex: 4,
        visitName: "V",
        activityName: "A",
        flags: { missingVisit: true, missingActivity: false, missingPricing: false, inconsistentTotals: false },
      }),
      row({
        sourceRecordIndex: 5,
        visitName: "V",
        activityName: "A",
        flags: { missingVisit: false, missingActivity: true, missingPricing: false, inconsistentTotals: false },
      }),
      row({
        sourceRecordIndex: 6,
        visitName: "V",
        activityName: "A",
        flags: { missingVisit: false, missingActivity: false, missingPricing: true, inconsistentTotals: false },
      }),
      row({
        sourceRecordIndex: 7,
        visitName: "V",
        activityName: "A",
        reviewWarnings: ["Missing pricing"],
      }),
      row({
        sourceRecordIndex: 8,
        visitName: "V",
        activityName: "A",
        flags: { missingVisit: false, missingActivity: false, missingPricing: false, inconsistentTotals: true },
      }),
      row({
        sourceRecordIndex: 9,
        visitName: "V",
        activityName: "A",
        reviewWarnings: ["Inconsistent totals"],
      }),
    ]
    const out = toCoreInvoiceReviewPayload({ rows })
    expect(out.summary.missingVisitNameCount).toBe(3)
    expect(out.summary.missingActivityNameCount).toBe(3)
    expect(out.summary.missingPricingCount).toBe(2)
    expect(out.summary.inconsistentTotalsCount).toBe(2)
  })

  it("lowConfidenceCount from confidence and warnings", () => {
    const rows: CoreInvoiceReviewRow[] = [
      row({ sourceRecordIndex: 0, confidence: "low" }),
      row({ sourceRecordIndex: 1, confidence: "high" }),
      row({
        sourceRecordIndex: 2,
        confidence: "high",
        reviewWarnings: ["Low confidence source"],
      }),
    ]
    const out = toCoreInvoiceReviewPayload({ rows })
    expect(out.summary.lowConfidenceCount).toBe(2)
  })

  it("documentId passes through when provided", () => {
    const out = toCoreInvoiceReviewPayload({
      documentId: "doc-inv",
      rows: [row({ sourceRecordIndex: 0 })],
    })
    expect(out.documentId).toBe("doc-inv")
  })
})
