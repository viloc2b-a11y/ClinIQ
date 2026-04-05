import { describe, expect, it } from "vitest"

import {
  buildMatchKey,
  matchExpectedToInvoice,
  safeNormText,
  type ExpectedRow,
  type InvoiceRow,
} from "./match-expected-to-invoice"

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

describe("matchExpectedToInvoice", () => {
  it("exact match", () => {
    const out = matchExpectedToInvoice({
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
    expect(out.matched).toHaveLength(1)
    expect(out.matched[0]!.status).toBe("matched")
    expect(out.matched[0]!.differences).toEqual([])
    expect(out.matched[0]!.matchKey).toBe("day 1::ecg")
    expect(out.summary.matchedCount).toBe(1)
    expect(out.summary.partialMismatchCount).toBe(0)
  })

  it("same key but quantity mismatch", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [e({ sourceRecordIndex: 0, visitName: "V1", activityName: "Lab", quantity: 2, unitPrice: 50, totalPrice: 100 })],
      invoiceRows: [i({ sourceRecordIndex: 0, visitName: "V1", activityName: "Lab", quantity: 3, unitPrice: 50, totalPrice: 100 })],
    })
    expect(out.matched[0]!.status).toBe("partial_mismatch")
    expect(out.matched[0]!.differences).toEqual(["Quantity mismatch"])
    expect(out.matched[0]!.quantityMatch).toBe(false)
    expect(out.summary.matchedCount).toBe(0)
    expect(out.summary.partialMismatchCount).toBe(1)
  })

  it("same key but unit price mismatch", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [e({ sourceRecordIndex: 0, visitName: "V1", activityName: "X", quantity: 1, unitPrice: 100, totalPrice: 100 })],
      invoiceRows: [i({ sourceRecordIndex: 0, visitName: "V1", activityName: "X", quantity: 1, unitPrice: 105, totalPrice: 100 })],
    })
    expect(out.matched[0]!.differences).toContain("Unit price mismatch")
    expect(out.matched[0]!.unitPriceMatch).toBe(false)
  })

  it("same key but total mismatch", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [e({ sourceRecordIndex: 0, visitName: "V1", activityName: "X", quantity: 2, unitPrice: 50, totalPrice: 100 })],
      invoiceRows: [i({ sourceRecordIndex: 0, visitName: "V1", activityName: "X", quantity: 2, unitPrice: 50, totalPrice: 99 })],
    })
    expect(out.matched[0]!.differences).toContain("Total price mismatch")
    expect(out.matched[0]!.totalPriceMatch).toBe(false)
  })

  it("unmatched expected row", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [e({ sourceRecordIndex: 0, visitName: "Only", activityName: "Exp", quantity: 1, unitPrice: 1, totalPrice: 1 })],
      invoiceRows: [],
    })
    expect(out.unmatchedExpected).toHaveLength(1)
    expect(out.unmatchedExpected[0]!).toEqual({
      expectedIndex: 0,
      reason: "No invoice match found",
      matchKey: "only::exp",
    })
    expect(out.matched).toHaveLength(0)
  })

  it("unmatched invoice row", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [],
      invoiceRows: [i({ sourceRecordIndex: 0, visitName: "Only", activityName: "Inv", quantity: 1, unitPrice: 1, totalPrice: 1 })],
    })
    expect(out.unmatchedInvoice).toHaveLength(1)
    expect(out.unmatchedInvoice[0]!).toEqual({
      invoiceIndex: 0,
      reason: "No expected match found",
      matchKey: "only::inv",
    })
  })

  it("multiple rows with deterministic pairing order", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [
        e({ sourceRecordIndex: 10, visitName: "A", activityName: "B", quantity: 1, unitPrice: 1, totalPrice: 1 }),
        e({ sourceRecordIndex: 11, visitName: "A", activityName: "B", quantity: 2, unitPrice: 2, totalPrice: 4 }),
        e({ sourceRecordIndex: 12, visitName: "Z", activityName: "Z", quantity: 1, unitPrice: 1, totalPrice: 1 }),
      ],
      invoiceRows: [
        i({ sourceRecordIndex: 20, visitName: "A", activityName: "B", quantity: 1, unitPrice: 1, totalPrice: 1 }),
        i({ sourceRecordIndex: 21, visitName: "A", activityName: "B", quantity: 2, unitPrice: 2, totalPrice: 4 }),
        i({ sourceRecordIndex: 22, visitName: "Z", activityName: "Z", quantity: 1, unitPrice: 1, totalPrice: 1 }),
      ],
    })
    expect(out.matched.map((m) => [m.expectedIndex, m.invoiceIndex])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ])
    expect(out.matched[0]!.matchKey).toBe("a::b")
    expect(out.matched[2]!.matchKey).toBe("z::z")
  })

  it("missing visit/activity creates weak keys but remains deterministic", () => {
    expect(safeNormText("  Day   1  ")).toBe("day 1")
    expect(buildMatchKey({ visitName: "SCREENING", activityName: "  Lab " })).toBe("screening::lab")
    const key = buildMatchKey(e({ sourceRecordIndex: 0, visitName: null, activityName: null }))
    expect(key).toBe("::")
    const out = matchExpectedToInvoice({
      expectedRows: [
        e({ sourceRecordIndex: 0, visitName: null, activityName: null, quantity: 1, unitPrice: 10, totalPrice: 10 }),
      ],
      invoiceRows: [
        i({ sourceRecordIndex: 0, visitName: null, activityName: null, quantity: 1, unitPrice: 10, totalPrice: 10 }),
      ],
    })
    expect(out.matched).toHaveLength(1)
    expect(out.matched[0]!.matchKey).toBe("::")
    expect(out.matched[0]!.status).toBe("matched")
    expect(out.warnings).toContain(
      "Many expected and invoice rows use empty visit/activity match keys; pairings may be ambiguous.",
    )
  })

  it("empty expectedRows", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [],
      invoiceRows: [i({ sourceRecordIndex: 0, visitName: "V", activityName: "A", quantity: 1, unitPrice: 1, totalPrice: 1 })],
    })
    expect(out.warnings).toContain("No expected rows were provided for matching.")
    expect(out.summary.totalExpected).toBe(0)
    expect(out.unmatchedInvoice).toHaveLength(1)
  })

  it("empty invoiceRows", () => {
    const out = matchExpectedToInvoice({
      expectedRows: [e({ sourceRecordIndex: 0, visitName: "V", activityName: "A", quantity: 1, unitPrice: 1, totalPrice: 1 })],
      invoiceRows: [],
    })
    expect(out.warnings).toContain("No invoice rows were provided for matching.")
    expect(out.summary.totalInvoice).toBe(0)
    expect(out.unmatchedExpected).toHaveLength(1)
  })
})
