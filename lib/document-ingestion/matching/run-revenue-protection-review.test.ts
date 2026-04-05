import { describe, expect, it } from "vitest"

import type { ExpectedRow, InvoiceRow } from "./match-expected-to-invoice"
import { runRevenueProtectionReview } from "./run-revenue-protection-review"

function e(partial: Partial<ExpectedRow> & Pick<ExpectedRow, "sourceRecordIndex">): ExpectedRow {
  return {
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    ...partial,
  }
}

function i(partial: Partial<InvoiceRow> & Pick<InvoiceRow, "sourceRecordIndex">): InvoiceRow {
  return {
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    ...partial,
  }
}

describe("runRevenueProtectionReview", () => {
  it("exact match only", async () => {
    const out = await runRevenueProtectionReview({
      expectedRows: [
        e({
          sourceRecordIndex: 0,
          visitName: "Day 1",
          activityName: "ECG",
          quantity: 1,
          unitPrice: 85,
          totalPrice: 85,
        }),
      ],
      invoiceRows: [
        i({
          sourceRecordIndex: 0,
          visitName: "Day 1",
          activityName: "ECG",
          quantity: 1,
          unitPrice: 85,
          totalPrice: 85,
        }),
      ],
    })
    expect(out.summary.matchedCount).toBe(1)
    expect(out.summary.partialMismatchCount).toBe(0)
    expect(out.summary.leakageSignalCount).toBe(0)
    expect(out.summary.reviewActionCount).toBe(0)
    expect(out.leakage.signals).toHaveLength(0)
    expect(out.actions.actions).toHaveLength(0)
  })

  it("missing invoice", async () => {
    const out = await runRevenueProtectionReview({
      expectedRows: [
        e({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "Lab",
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
        }),
      ],
      invoiceRows: [],
    })
    expect(out.matchResult.unmatchedExpected).toHaveLength(1)
    expect(out.leakage.signals.some((s) => s.signalType === "missing_invoice")).toBe(true)
    expect(out.actions.actions).toHaveLength(1)
    expect(out.actions.actions[0]!.priority).toBe(1)
    expect(out.summary.reviewActionCount).toBe(1)
    expect(out.summary.highPriorityActionCount).toBe(1)
  })

  it("unexpected invoice", async () => {
    const out = await runRevenueProtectionReview({
      expectedRows: [],
      invoiceRows: [
        i({
          sourceRecordIndex: 0,
          visitName: "Only",
          activityName: "Inv",
          quantity: 1,
          unitPrice: 1,
          totalPrice: 1,
        }),
      ],
    })
    expect(out.leakage.signals.some((s) => s.signalType === "unexpected_invoice")).toBe(true)
    expect(out.actions.actions).toHaveLength(1)
    expect(out.actions.actions[0]!.priority).toBe(2)
    expect(out.actions.actions[0]!.actionType).toBe("review_unexpected_invoice")
  })

  it("partial mismatch: unit price", async () => {
    const out = await runRevenueProtectionReview({
      expectedRows: [
        e({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "X",
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        }),
      ],
      invoiceRows: [
        i({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "X",
          quantity: 1,
          unitPrice: 110,
          totalPrice: 100,
        }),
      ],
    })
    expect(out.summary.partialMismatchCount).toBe(1)
    expect(out.leakage.signals.some((s) => s.signalType === "unit_price_mismatch")).toBe(true)
    expect(out.actions.actions).toHaveLength(1)
    expect(out.actions.actions[0]!.priority).toBe(1)
    expect(out.actions.actions[0]!.actionType).toBe("review_unit_price_mismatch")
  })

  it("mixed scenario", async () => {
    const out = await runRevenueProtectionReview({
      expectedRows: [
        e({ sourceRecordIndex: 0, visitName: "V1", activityName: "A1", quantity: 1, unitPrice: 10, totalPrice: 10 }),
        e({ sourceRecordIndex: 1, visitName: "V1", activityName: "A1", quantity: 2, unitPrice: 20, totalPrice: 40 }),
        e({ sourceRecordIndex: 2, visitName: "V2", activityName: "B", quantity: 1, unitPrice: 1, totalPrice: 1 }),
      ],
      invoiceRows: [
        i({ sourceRecordIndex: 0, visitName: "V1", activityName: "A1", quantity: 1, unitPrice: 10, totalPrice: 10 }),
        i({ sourceRecordIndex: 1, visitName: "V1", activityName: "A1", quantity: 2, unitPrice: 25, totalPrice: 40 }),
        i({ sourceRecordIndex: 2, visitName: "V3", activityName: "C", quantity: 1, unitPrice: 1, totalPrice: 1 }),
      ],
    })
    expect(out.summary.totalExpected).toBe(3)
    expect(out.summary.totalInvoice).toBe(3)
    expect(out.summary.matchedCount).toBe(1)
    expect(out.summary.partialMismatchCount).toBe(1)
    expect(out.matchResult.matched).toHaveLength(2)
    expect(out.matchResult.unmatchedExpected).toHaveLength(1)
    expect(out.matchResult.unmatchedInvoice).toHaveLength(1)
    expect(out.summary.leakageSignalCount).toBe(3)
    expect(out.summary.reviewActionCount).toBe(3)
    expect(out.summary.highPriorityActionCount).toBe(2)
    expect(out.leakage.signals.map((s) => s.signalType).sort()).toEqual(
      ["missing_invoice", "unexpected_invoice", "unit_price_mismatch"].sort(),
    )
  })

  it("warnings propagate deterministically", async () => {
    const out = await runRevenueProtectionReview({ expectedRows: [], invoiceRows: [] })
    expect(out.warnings.length).toBeGreaterThan(0)
    const a = out.warnings.join("\n")
    const b = (await runRevenueProtectionReview({ expectedRows: [], invoiceRows: [] })).warnings.join("\n")
    expect(a).toBe(b)
    expect(out.warnings).toContain("No expected rows were provided for matching.")
    expect(out.warnings).toContain("No invoice rows were provided for matching.")
  })
})
