import { describe, expect, it } from "vitest"

import type { ClassifiedCoreSoaActivity } from "./classify-core-soa-activities"
import { runSoaReviewToDraftEvents } from "./run-soa-review-to-draft-events"
import type { InvoiceRow } from "../matching/match-expected-to-invoice"

function classified(
  partial: Partial<ClassifiedCoreSoaActivity> & Pick<ClassifiedCoreSoaActivity, "activityId">,
): ClassifiedCoreSoaActivity {
  return {
    visitName: "V1",
    activityName: "Lab",
    quantity: 1,
    unitPrice: 50,
    totalPrice: 50,
    sourceRecordIndex: 0,
    confidence: "high",
    needsReview: false,
    classificationStatus: "classified",
    classificationReasons: [],
    ...partial,
  }
}

function inv(partial: Partial<InvoiceRow> & Pick<InvoiceRow, "sourceRecordIndex">): InvoiceRow {
  return {
    visitName: "V1",
    activityName: "Lab",
    quantity: 1,
    unitPrice: 50,
    totalPrice: 50,
    notes: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
    ...partial,
  }
}

describe("runSoaReviewToDraftEvents", () => {
  it("exact match: no signals, actions, or draft rows", async () => {
    const out = await runSoaReviewToDraftEvents({
      documentId: "d1",
      activities: [classified({ activityId: "act::0", sourceRecordIndex: 0 })],
      invoiceRows: [inv({ sourceRecordIndex: 0 })],
    })
    expect(out.summary.leakageSignalCount).toBe(0)
    expect(out.summary.reviewActionCount).toBe(0)
    expect(out.summary.draftEventCount).toBe(0)
    expect(out.draftEvents.rows).toEqual([])
  })

  it("missing invoice: one signal, action, draft row, priority1 draft count", async () => {
    const out = await runSoaReviewToDraftEvents({
      documentId: null,
      activities: [classified({ activityId: "act::0", sourceRecordIndex: 0 })],
      invoiceRows: [],
    })
    expect(out.revenueProtection.leakage.signals[0].signalType).toBe("missing_invoice")
    expect(out.summary.reviewActionCount).toBe(1)
    expect(out.summary.draftEventCount).toBe(1)
    expect(out.summary.priority1DraftEventCount).toBe(1)
    expect(out.draftEvents.rows[0].actionType).toBe("review_missing_invoice")
  })

  it("unexpected invoice: one signal, action, draft row", async () => {
    const out = await runSoaReviewToDraftEvents({
      documentId: null,
      activities: [],
      invoiceRows: [
        inv({
          sourceRecordIndex: 0,
          visitName: "Solo",
          activityName: "InvoiceOnly",
          unitPrice: 10,
          totalPrice: 10,
        }),
      ],
    })
    expect(out.revenueProtection.leakage.signals[0].signalType).toBe("unexpected_invoice")
    expect(out.summary.reviewActionCount).toBe(1)
    expect(out.summary.draftEventCount).toBe(1)
    expect(out.draftEvents.rows[0].actionType).toBe("review_unexpected_invoice")
  })

  it("partial unit price mismatch: unit_price_mismatch signal, one draft row", async () => {
    const out = await runSoaReviewToDraftEvents({
      documentId: null,
      activities: [
        classified({
          activityId: "act::0",
          sourceRecordIndex: 0,
          visitName: "V2",
          activityName: "Scan",
          quantity: 1,
          unitPrice: 80,
          totalPrice: 80,
        }),
      ],
      invoiceRows: [
        inv({
          sourceRecordIndex: 0,
          visitName: "V2",
          activityName: "Scan",
          quantity: 1,
          unitPrice: 99,
          totalPrice: 80,
        }),
      ],
    })
    expect(out.revenueProtection.summary.partialMismatchCount).toBe(1)
    expect(
      out.revenueProtection.leakage.signals.some((s) => s.signalType === "unit_price_mismatch"),
    ).toBe(true)
    expect(out.summary.draftEventCount).toBeGreaterThanOrEqual(1)
    expect(
      out.draftEvents.rows.some((r) => r.actionType === "review_unit_price_mismatch"),
    ).toBe(true)
  })

  it("mixed: exact + partial + unmatched expected + unmatched invoice", async () => {
    const out = await runSoaReviewToDraftEvents({
      documentId: "mix",
      activities: [
        classified({
          activityId: "a0",
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "Lab",
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
        }),
        classified({
          activityId: "a1",
          sourceRecordIndex: 1,
          visitName: "V2",
          activityName: "Scan",
          quantity: 1,
          unitPrice: 80,
          totalPrice: 80,
        }),
        classified({
          activityId: "a2",
          sourceRecordIndex: 2,
          visitName: "V3",
          activityName: "OrphanExp",
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        }),
      ],
      invoiceRows: [
        inv({ sourceRecordIndex: 0, visitName: "V1", activityName: "Lab" }),
        inv({
          sourceRecordIndex: 1,
          visitName: "V2",
          activityName: "Scan",
          unitPrice: 99,
          totalPrice: 80,
        }),
        inv({
          sourceRecordIndex: 2,
          visitName: "V4",
          activityName: "OrphanInv",
          unitPrice: 5,
          totalPrice: 5,
        }),
      ],
    })
    expect(out.summary.totalActivities).toBe(3)
    expect(out.summary.totalExpectedBillables).toBe(3)
    expect(out.summary.totalExpectedRows).toBe(3)
    expect(out.summary.totalInvoiceRows).toBe(3)
    expect(out.summary.leakageSignalCount).toBe(3)
    expect(out.summary.reviewActionCount).toBe(3)
    expect(out.summary.draftEventCount).toBe(3)
    expect(out.summary.priority1DraftEventCount).toBe(2)
    expect(out.draftEvents.rows).toHaveLength(3)
  })

  it("warnings merge: expected billables first, draft last", async () => {
    const out = await runSoaReviewToDraftEvents({
      documentId: null,
      activities: [],
      invoiceRows: [],
    })
    expect(out.warnings[0]).toBe("No classified SoA activities provided.")
    expect(out.warnings[1]).toBe("No initial expected billables provided.")
    expect(out.warnings).toContain("No review actions provided for draft event log rows.")
    expect(new Set(out.warnings).size).toBe(out.warnings.length)
  })
})
