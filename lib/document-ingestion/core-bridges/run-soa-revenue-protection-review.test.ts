import { describe, expect, it } from "vitest"

import type { ClassifiedCoreSoaActivity } from "./classify-core-soa-activities"
import { runSoaRevenueProtectionReview } from "./run-soa-revenue-protection-review"
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

describe("runSoaRevenueProtectionReview", () => {
  it("exact match: one expected billable, one matched pair, no leakage signals or actions", async () => {
    const out = await runSoaRevenueProtectionReview({
      documentId: "d1",
      activities: [classified({ activityId: "act::0", sourceRecordIndex: 0 })],
      invoiceRows: [inv({ sourceRecordIndex: 0 })],
    })
    expect(out.summary.totalExpectedBillables).toBe(1)
    expect(out.summary.matchedCount).toBe(1)
    expect(out.summary.partialMismatchCount).toBe(0)
    expect(out.summary.leakageSignalCount).toBe(0)
    expect(out.summary.reviewActionCount).toBe(0)
    expect(out.expectedRows.expectedRows).toHaveLength(1)
  })

  it("missing invoice: one signal and one priority-1 review action", async () => {
    const out = await runSoaRevenueProtectionReview({
      documentId: null,
      activities: [classified({ activityId: "act::0", sourceRecordIndex: 0 })],
      invoiceRows: [],
    })
    expect(out.expectedRows.expectedRows).toHaveLength(1)
    expect(out.summary.leakageSignalCount).toBe(1)
    expect(out.revenueProtection.leakage.signals[0].signalType).toBe("missing_invoice")
    expect(out.summary.reviewActionCount).toBe(1)
    expect(out.revenueProtection.actions.actions[0].priority).toBe(1)
    expect(out.revenueProtection.actions.actions[0].actionType).toBe("review_missing_invoice")
  })

  it("unexpected invoice: zero activities, one invoice row", async () => {
    const out = await runSoaRevenueProtectionReview({
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
    expect(out.summary.totalExpectedBillables).toBe(0)
    expect(out.expectedRows.expectedRows).toHaveLength(0)
    expect(out.summary.leakageSignalCount).toBe(1)
    expect(out.revenueProtection.leakage.signals[0].signalType).toBe("unexpected_invoice")
    expect(out.summary.reviewActionCount).toBe(1)
    expect(out.revenueProtection.actions.actions[0].priority).toBe(2)
    expect(out.revenueProtection.actions.actions[0].actionType).toBe("review_unexpected_invoice")
  })

  it("partial mismatch: unit price mismatch signal and priority-1 action", async () => {
    const out = await runSoaRevenueProtectionReview({
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
    expect(out.summary.matchedCount).toBe(0)
    expect(out.summary.partialMismatchCount).toBe(1)
    expect(out.revenueProtection.leakage.signals.some((s) => s.signalType === "unit_price_mismatch")).toBe(
      true,
    )
    const priceAction = out.revenueProtection.actions.actions.find(
      (a) => a.actionType === "review_unit_price_mismatch",
    )
    expect(priceAction).toBeTruthy()
    expect(priceAction!.priority).toBe(1)
  })

  it("mixed: exact + partial + unmatched expected + unmatched invoice", async () => {
    const out = await runSoaRevenueProtectionReview({
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
    expect(out.summary.matchedCount).toBe(1)
    expect(out.summary.partialMismatchCount).toBe(1)
    expect(out.summary.leakageSignalCount).toBe(3)
    expect(out.summary.reviewActionCount).toBe(3)
    expect(out.summary.highPriorityActionCount).toBe(2)
  })

  it("warnings merge: expected billables before revenue-protection warnings", async () => {
    const out = await runSoaRevenueProtectionReview({
      documentId: null,
      activities: [],
      invoiceRows: [],
    })
    expect(out.warnings[0]).toBe("No classified SoA activities provided.")
    expect(out.warnings[1]).toBe("No initial expected billables provided.")
    expect(out.warnings).toContain("No expected rows were provided for matching.")
    expect(out.warnings).toContain("No invoice rows were provided for matching.")
    expect(new Set(out.warnings).size).toBe(out.warnings.length)
  })
})
