import { describe, expect, it } from "vitest"

import { toPreInvoiceRows } from "./to-pre-invoice-rows"
import type { InvoiceCandidateRow } from "../bridge-document-records"

function inv(
  partial: Partial<InvoiceCandidateRow> & Pick<InvoiceCandidateRow, "sourceRecordIndex">,
): InvoiceCandidateRow {
  return {
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    ...partial,
  }
}

describe("toPreInvoiceRows", () => {
  it("clean invoice row", () => {
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: "Visit 3",
          activityName: "Monitoring",
          quantity: 4,
          unitPrice: 200,
          totalPrice: 800,
          confidence: "high",
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(false)
    expect(out.rows[0]!.reviewReasons).toEqual([])
    expect(out.rows[0]!.flags).toEqual({
      missingVisit: false,
      missingActivity: false,
      missingPricing: false,
      inconsistentTotals: false,
    })
    expect(out.warnings).toEqual([])
  })

  it("missing visit", () => {
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: null,
          activityName: "Labs",
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.flags.missingVisit).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing visitName"])
  })

  it("missing activity", () => {
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: "Day 1",
          activityName: null,
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.flags.missingActivity).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing activityName"])
  })

  it("missing pricing", () => {
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "Line item",
          quantity: 2,
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
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: "V2",
          activityName: "ECG",
          quantity: 2,
          unitPrice: 85,
          totalPrice: 100,
        }),
      ],
    })
    expect(out.rows[0]!.flags.inconsistentTotals).toBe(true)
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toContain("Inconsistent totals")
  })

  it("low confidence", () => {
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "CPT bundle",
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500,
          confidence: "low",
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Low confidence source"])
  })

  it("multiple rows summary and majority need-review warning", () => {
    const out = toPreInvoiceRows({
      invoiceCandidates: [
        inv({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "OK",
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        }),
        inv({
          sourceRecordIndex: 1,
          visitName: null,
          activityName: "A",
          quantity: 1,
          unitPrice: 1,
          totalPrice: 1,
        }),
        inv({
          sourceRecordIndex: 2,
          visitName: "V2",
          activityName: null,
          quantity: 1,
          unitPrice: 2,
          totalPrice: 2,
        }),
      ],
    })
    expect(out.summary.totalInputCandidates).toBe(3)
    expect(out.summary.totalRows).toBe(3)
    expect(out.summary.rowsNeedingReview).toBe(2)
    expect(out.summary.missingVisit).toBe(1)
    expect(out.summary.missingActivity).toBe(1)
    expect(out.summary.missingPricing).toBe(0)
    expect(out.summary.inconsistentTotals).toBe(0)
    expect(out.warnings).toContain("More than half of pre-invoice rows are flagged for review.")
  })

  it("empty input", () => {
    const out = toPreInvoiceRows({ invoiceCandidates: [] })
    expect(out.rows).toEqual([])
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.rowsNeedingReview).toBe(0)
    expect(out.warnings).toEqual(["No invoice line candidates were provided."])
  })
})
