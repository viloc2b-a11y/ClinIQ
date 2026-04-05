import { describe, expect, it } from "vitest"

import {
  classifyMatchResultsIntoLeakageSignals,
  type MatchResult,
} from "./classify-match-results-into-leakage-signals"

function emptySummary(): MatchResult["summary"] {
  return {
    totalExpected: 0,
    totalInvoice: 0,
    matchedCount: 0,
    partialMismatchCount: 0,
    unmatchedExpectedCount: 0,
    unmatchedInvoiceCount: 0,
  }
}

describe("classifyMatchResultsIntoLeakageSignals", () => {
  it("unmatched expected -> missing_invoice high", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [],
        unmatchedExpected: [{ expectedIndex: 2, reason: "No invoice match found", matchKey: "a::b" }],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals).toHaveLength(1)
    expect(out.signals[0]!).toMatchObject({
      signalType: "missing_invoice",
      severity: "high",
      expectedIndex: 2,
      invoiceIndex: null,
      matchKey: "a::b",
      reasons: ["No invoice match found"],
      sourceStatus: "unmatched_expected",
    })
  })

  it("unmatched invoice -> unexpected_invoice medium", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [],
        unmatchedExpected: [],
        unmatchedInvoice: [{ invoiceIndex: 1, reason: "No expected match found", matchKey: "x::y" }],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals[0]!).toMatchObject({
      signalType: "unexpected_invoice",
      severity: "medium",
      expectedIndex: null,
      invoiceIndex: 1,
      reasons: ["No expected match found"],
      sourceStatus: "unmatched_invoice",
    })
  })

  it("partial mismatch quantity -> quantity_mismatch medium", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "k",
            quantityMatch: false,
            unitPriceMatch: true,
            totalPriceMatch: true,
            status: "partial_mismatch",
            differences: ["Quantity mismatch"],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals[0]!).toMatchObject({
      signalType: "quantity_mismatch",
      severity: "medium",
      expectedIndex: 0,
      invoiceIndex: 0,
      reasons: ["Quantity mismatch"],
      sourceStatus: "partial_mismatch",
    })
  })

  it("partial mismatch unit price -> unit_price_mismatch high", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "k",
            quantityMatch: true,
            unitPriceMatch: false,
            totalPriceMatch: true,
            status: "partial_mismatch",
            differences: ["Unit price mismatch"],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals[0]!).toMatchObject({
      signalType: "unit_price_mismatch",
      severity: "high",
      reasons: ["Unit price mismatch"],
    })
  })

  it("partial mismatch total price -> total_price_mismatch high", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "k",
            quantityMatch: true,
            unitPriceMatch: true,
            totalPriceMatch: false,
            status: "partial_mismatch",
            differences: ["Total price mismatch"],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals[0]!).toMatchObject({
      signalType: "total_price_mismatch",
      severity: "high",
      reasons: ["Total price mismatch"],
    })
  })

  it("partial mismatch missing comparable -> incomplete_comparison low", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "k",
            quantityMatch: false,
            unitPriceMatch: true,
            totalPriceMatch: true,
            status: "partial_mismatch",
            differences: ["Missing comparable unitPrice"],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals[0]!).toMatchObject({
      signalType: "incomplete_comparison",
      severity: "low",
      reasons: ["Missing comparable unitPrice"],
    })
  })

  it("one partial mismatch with multiple differences emits multiple signals", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "k",
            quantityMatch: false,
            unitPriceMatch: false,
            totalPriceMatch: false,
            status: "partial_mismatch",
            differences: ["Quantity mismatch", "Unit price mismatch"],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals).toHaveLength(2)
    expect(out.signals.map((s) => s.signalType)).toEqual(["quantity_mismatch", "unit_price_mismatch"])
  })

  it("fully matched rows emit no signals", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "a::b",
            quantityMatch: true,
            unitPriceMatch: true,
            totalPriceMatch: true,
            status: "matched",
            differences: [],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.signals).toHaveLength(0)
    expect(out.warnings).toContain("No leakage signals detected.")
  })

  it("summary counts by type and severity", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "k1",
            quantityMatch: false,
            unitPriceMatch: false,
            totalPriceMatch: true,
            status: "partial_mismatch",
            differences: ["Quantity mismatch", "Unit price mismatch"],
          },
        ],
        unmatchedExpected: [{ expectedIndex: 1, reason: "No invoice match found", matchKey: "k2" }],
        unmatchedInvoice: [{ invoiceIndex: 2, reason: "No expected match found", matchKey: "k3" }],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.summary.totalSignals).toBe(4)
    expect(out.summary.byType).toEqual({
      missing_invoice: 1,
      quantity_mismatch: 1,
      unexpected_invoice: 1,
      unit_price_mismatch: 1,
    })
    expect(out.summary.bySeverity).toEqual({
      high: 2,
      low: 0,
      medium: 2,
    })
    expect(out.summary.highSeverityCount).toBe(2)
    expect(out.summary.mediumSeverityCount).toBe(2)
    expect(out.summary.lowSeverityCount).toBe(0)
  })

  it("warnings propagate from match result", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [],
        unmatchedExpected: [{ expectedIndex: 0, reason: "No invoice match found", matchKey: "a::b" }],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: ["Upstream matcher warning."],
      },
    })
    expect(out.warnings[0]).toBe("Upstream matcher warning.")
    expect(out.signals).toHaveLength(1)
    expect(out.warnings).not.toContain("No leakage signals detected.")
  })

  it("no signals -> warning added", () => {
    const out = classifyMatchResultsIntoLeakageSignals({
      matchResult: {
        matched: [
          {
            expectedIndex: 0,
            invoiceIndex: 0,
            matchKey: "a::b",
            quantityMatch: true,
            unitPriceMatch: true,
            totalPriceMatch: true,
            status: "matched",
            differences: [],
          },
        ],
        unmatchedExpected: [],
        unmatchedInvoice: [],
        summary: emptySummary(),
        warnings: [],
      },
    })
    expect(out.warnings).toEqual(["No leakage signals detected."])
  })
})
