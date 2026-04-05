import { describe, expect, it } from "vitest"

import type { PreInvoiceRow } from "../adapters/to-pre-invoice-rows"
import { toCoreInvoiceReviewRows } from "./to-core-invoice-review-rows"

const defaultFlags = {
  missingVisit: false,
  missingActivity: false,
  missingPricing: false,
  inconsistentTotals: false,
}

function row(partial: Partial<PreInvoiceRow> & Pick<PreInvoiceRow, "sourceRecordIndex">): PreInvoiceRow {
  const base: PreInvoiceRow = {
    sourceRecordIndex: partial.sourceRecordIndex,
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    flags: { ...defaultFlags },
  }
  return {
    ...base,
    ...partial,
    flags: { ...defaultFlags, ...(partial.flags ?? {}) },
  }
}

describe("toCoreInvoiceReviewRows", () => {
  it("ready row maps to reviewStatus ready", () => {
    const out = toCoreInvoiceReviewRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "Monitoring",
          quantity: 4,
          unitPrice: 150,
          totalPrice: 600,
          needsReview: false,
        }),
      ],
    })
    expect(out.rows[0]!.reviewStatus).toBe("ready")
    expect(out.rows[0]!.reviewWarnings).toEqual([])
  })

  it("row needing review maps to needs_review", () => {
    const out = toCoreInvoiceReviewRows({
      rows: [row({ sourceRecordIndex: 0, needsReview: true, reviewReasons: ["Missing visitName"] })],
    })
    expect(out.rows[0]!.reviewStatus).toBe("needs_review")
  })

  it("reviewReasons propagate to reviewWarnings", () => {
    const out = toCoreInvoiceReviewRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          needsReview: true,
          reviewReasons: ["Missing visitName", "Unit price mismatch"],
        }),
      ],
    })
    expect(out.rows[0]!.reviewWarnings).toEqual(["Missing visitName", "Unit price mismatch"])
  })

  it("flags pass through correctly", () => {
    const out = toCoreInvoiceReviewRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          flags: {
            missingVisit: true,
            missingActivity: false,
            missingPricing: true,
            inconsistentTotals: true,
          },
        }),
      ],
    })
    expect(out.rows[0]!.flags).toEqual({
      missingVisit: true,
      missingActivity: false,
      missingPricing: true,
      inconsistentTotals: true,
    })
  })

  it("summary counts correct", () => {
    const out = toCoreInvoiceReviewRows({
      rows: [
        row({ sourceRecordIndex: 0, needsReview: false, flags: { ...defaultFlags } }),
        row({
          sourceRecordIndex: 1,
          needsReview: true,
          flags: { ...defaultFlags, missingVisit: true },
        }),
        row({
          sourceRecordIndex: 2,
          needsReview: true,
          flags: { ...defaultFlags, missingActivity: true, inconsistentTotals: true },
        }),
        row({
          sourceRecordIndex: 3,
          needsReview: false,
          flags: { ...defaultFlags, missingPricing: true },
        }),
      ],
    })
    expect(out.summary.totalInputRows).toBe(4)
    expect(out.summary.totalOutputRows).toBe(4)
    expect(out.summary.readyCount).toBe(2)
    expect(out.summary.needsReviewCount).toBe(2)
    expect(out.summary.missingVisitCount).toBe(1)
    expect(out.summary.missingActivityCount).toBe(1)
    expect(out.summary.missingPricingCount).toBe(1)
    expect(out.summary.inconsistentTotalsCount).toBe(1)
  })

  it("empty input returns warning", () => {
    const out = toCoreInvoiceReviewRows({ rows: [] })
    expect(out.rows).toEqual([])
    expect(out.warnings).toEqual(["No pre-invoice rows provided."])
    expect(out.summary.missingVisitCount).toBe(0)
  })
})
