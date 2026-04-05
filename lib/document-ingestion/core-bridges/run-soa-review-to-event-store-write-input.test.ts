import { describe, expect, it } from "vitest"

import {
  type ClassifiedSoaActivity,
  type InvoiceRow,
  runSoaReviewToEventStoreWriteInput,
} from "./run-soa-review-to-event-store-write-input"

function classified(overrides: Partial<ClassifiedSoaActivity> & Pick<ClassifiedSoaActivity, "activityId" | "sourceRecordIndex">): ClassifiedSoaActivity {
  return {
    visitName: "Visit",
    activityName: "Activity",
    quantity: 1,
    unitPrice: 100,
    totalPrice: 100,
    confidence: "high",
    needsReview: false,
    classificationStatus: "classified",
    classificationReasons: [],
    ...overrides,
  }
}

function invoice(overrides: Partial<InvoiceRow> & Pick<InvoiceRow, "sourceRecordIndex">): InvoiceRow {
  return {
    visitName: "Visit",
    activityName: "Activity",
    quantity: 1,
    unitPrice: 100,
    totalPrice: 100,
    notes: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
    ...overrides,
  }
}

/** Same semantics as merge in run-soa-review-to-event-store-write-input.ts */
function mergeWarningsDeterministic(batches: readonly string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const batch of batches) {
    for (const w of batch) {
      if (!seen.has(w)) {
        seen.add(w)
        out.push(w)
      }
    }
  }
  return out
}

describe("runSoaReviewToEventStoreWriteInput", () => {
  it("exact match: no signals, actions, drafts, candidates, or write rows", async () => {
    const res = await runSoaReviewToEventStoreWriteInput({
      documentId: "doc",
      activities: [
        classified({
          activityId: "a0",
          sourceRecordIndex: 0,
          visitName: "Screening",
          activityName: "Consent",
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500,
        }),
      ],
      invoiceRows: [
        invoice({
          sourceRecordIndex: 0,
          visitName: "Screening",
          activityName: "Consent",
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500,
        }),
      ],
    })

    expect(res.summary.leakageSignalCount).toBe(0)
    expect(res.summary.reviewActionCount).toBe(0)
    expect(res.summary.draftEventCount).toBe(0)
    expect(res.summary.eventCandidateCount).toBe(0)
    expect(res.summary.writeInputCount).toBe(0)
    expect(res.summary.priority1WriteInputCount).toBe(0)
  })

  it("missing invoice: one signal through write-input, priority-1 write row", async () => {
    const res = await runSoaReviewToEventStoreWriteInput({
      documentId: "doc",
      activities: [
        classified({
          activityId: "a0",
          sourceRecordIndex: 0,
          visitName: "Day 1",
          activityName: "Physical Exam",
          quantity: 1,
          unitPrice: 120,
          totalPrice: 120,
        }),
      ],
      invoiceRows: [],
    })

    expect(res.revenueProtection.leakage.signals).toHaveLength(1)
    expect(res.revenueProtection.leakage.signals[0]!.signalType).toBe("missing_invoice")
    expect(res.summary.reviewActionCount).toBe(1)
    expect(res.summary.draftEventCount).toBe(1)
    expect(res.summary.eventCandidateCount).toBe(1)
    expect(res.summary.writeInputCount).toBe(1)
    expect(res.summary.priority1WriteInputCount).toBe(1)
  })

  it("unexpected invoice: one signal through write-input", async () => {
    const res = await runSoaReviewToEventStoreWriteInput({
      documentId: "doc",
      activities: [],
      invoiceRows: [
        invoice({
          sourceRecordIndex: 0,
          visitName: "Unscheduled",
          activityName: "Travel Reimbursement",
          quantity: 1,
          unitPrice: 350,
          totalPrice: 350,
        }),
      ],
    })

    expect(res.revenueProtection.leakage.signals).toHaveLength(1)
    expect(res.revenueProtection.leakage.signals[0]!.signalType).toBe("unexpected_invoice")
    expect(res.summary.reviewActionCount).toBe(1)
    expect(res.summary.draftEventCount).toBe(1)
    expect(res.summary.eventCandidateCount).toBe(1)
    expect(res.summary.writeInputCount).toBe(1)
  })

  it("partial unit price mismatch: one unit_price_mismatch through write-input", async () => {
    const res = await runSoaReviewToEventStoreWriteInput({
      documentId: "doc",
      activities: [
        classified({
          activityId: "a0",
          sourceRecordIndex: 0,
          visitName: "Day 7",
          activityName: "Lab Panel",
          quantity: 1,
          unitPrice: 85,
          totalPrice: 85,
        }),
      ],
      invoiceRows: [
        invoice({
          sourceRecordIndex: 0,
          visitName: "Day 7",
          activityName: "Lab Panel",
          quantity: 1,
          unitPrice: 99,
          totalPrice: 85,
        }),
      ],
    })

    expect(res.revenueProtection.leakage.signals).toHaveLength(1)
    expect(res.revenueProtection.leakage.signals[0]!.signalType).toBe("unit_price_mismatch")
    expect(res.summary.reviewActionCount).toBe(1)
    expect(res.summary.draftEventCount).toBe(1)
    expect(res.summary.eventCandidateCount).toBe(1)
    expect(res.summary.writeInputCount).toBe(1)
  })

  it("mixed: exact + partial + unmatched expected + unmatched invoice", async () => {
    const res = await runSoaReviewToEventStoreWriteInput({
      documentId: "doc-mixed",
      activities: [
        classified({
          activityId: "a0",
          sourceRecordIndex: 0,
          visitName: "Screening",
          activityName: "Consent",
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500,
        }),
        classified({
          activityId: "a1",
          sourceRecordIndex: 1,
          visitName: "Day 7",
          activityName: "Lab Panel",
          quantity: 1,
          unitPrice: 85,
          totalPrice: 85,
        }),
        classified({
          activityId: "a2",
          sourceRecordIndex: 2,
          visitName: "Day 1",
          activityName: "Physical Exam",
          quantity: 1,
          unitPrice: 120,
          totalPrice: 120,
        }),
      ],
      invoiceRows: [
        invoice({
          sourceRecordIndex: 0,
          visitName: "Screening",
          activityName: "Consent",
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500,
        }),
        invoice({
          sourceRecordIndex: 1,
          visitName: "Day 7",
          activityName: "Lab Panel",
          quantity: 1,
          unitPrice: 99,
          totalPrice: 85,
        }),
        invoice({
          sourceRecordIndex: 2,
          visitName: "Unscheduled",
          activityName: "Travel Reimbursement",
          quantity: 1,
          unitPrice: 350,
          totalPrice: 350,
        }),
      ],
    })

    const types = res.revenueProtection.leakage.signals.map((s) => s.signalType).sort()
    expect(types).toEqual(["missing_invoice", "unexpected_invoice", "unit_price_mismatch"])

    expect(res.summary.totalActivities).toBe(3)
    expect(res.summary.totalExpectedBillables).toBe(3)
    expect(res.summary.totalExpectedRows).toBe(3)
    expect(res.summary.totalInvoiceRows).toBe(3)
    expect(res.summary.leakageSignalCount).toBe(3)
    expect(res.summary.reviewActionCount).toBe(3)
    expect(res.summary.draftEventCount).toBe(3)
    expect(res.summary.eventCandidateCount).toBe(3)
    expect(res.summary.writeInputCount).toBe(3)
    expect(res.summary.priority1WriteInputCount).toBe(2)
  })

  it("warnings combine in order with deduplication", async () => {
    const res = await runSoaReviewToEventStoreWriteInput({
      documentId: "doc-w",
      activities: [
        classified({
          activityId: "a0",
          sourceRecordIndex: 0,
          visitName: "Only",
          activityName: "Expected",
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        }),
      ],
      invoiceRows: [],
    })

    const merged = mergeWarningsDeterministic([
      res.expectedBillables.warnings,
      res.expectedRows.warnings,
      res.revenueProtection.warnings,
      res.draftEvents.warnings,
      res.eventCandidates.warnings,
      res.writeInput.warnings,
    ])

    expect(res.warnings).toEqual(merged)
  })
})
