import { describe, expect, it } from "vitest"

import type { InvoicePackage } from "../claims/types"
import type { ExpectedBillable } from "./types"
import {
  quantifyRevenueLeakage,
  quantifyRevenueLeakageWithTrace,
} from "./quantify-leakage"

function sampleExpected(): ExpectedBillable[] {
  return [
    {
      id: "e1",
      budgetLineId: "b1",
      studyId: "S-1",
      lineCode: "V1",
      label: "Visit",
      category: "Visit",
      visitName: "V1",
      unit: "ea",
      expectedQuantity: 1,
      unitPrice: 100,
      expectedRevenue: 100,
    },
  ]
}

function sampleInvoice(): InvoicePackage {
  return {
    schemaVersion: "1.0",
    studyId: "S-1",
    sponsorId: "SP",
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-01-31",
    generatedAt: "2026-02-01T00:00:00.000Z",
    lines: [
      {
        id: "ln-1",
        studyId: "S-1",
        sponsorId: "SP",
        subjectId: "SUB-1",
        visitName: "V1",
        eventDate: "2026-01-10T12:00:00.000Z",
        lineCode: "V1",
        label: "Visit",
        amount: 100,
        status: "ready",
        claimItemId: "c1",
      },
    ],
    subtotal: 100,
    lineCount: 1,
    hasBlockingIssues: false,
  }
}

describe("quantifyRevenueLeakageWithTrace", () => {
  it("report matches standalone quantifyRevenueLeakage (byte-for-byte shape)", () => {
    const expected = sampleExpected()
    const invoice = sampleInvoice()
    const standalone = quantifyRevenueLeakage(expected, invoice)
    const { report, trace } = quantifyRevenueLeakageWithTrace(expected, invoice)
    expect(report).toEqual(standalone)
    expect(trace).toHaveProperty("items")
    expect(trace).toHaveProperty("summary")
    expect(Array.isArray(trace.items)).toBe(true)
  })

  it("accepts optional ledger/claim inputs without changing report", () => {
    const expected = sampleExpected()
    const invoice = sampleInvoice()
    const base = quantifyRevenueLeakage(expected, invoice)
    const { report } = quantifyRevenueLeakageWithTrace(expected, invoice, {
      ledgerRows: [],
      claimItems: [],
    })
    expect(report).toEqual(base)
  })
})
