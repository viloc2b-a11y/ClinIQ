import { describe, expect, it } from "vitest"

import type { PreBudgetRow } from "../adapters/to-pre-budget-rows"
import type { PreInvoiceRow } from "../adapters/to-pre-invoice-rows"
import type { PreSoaRow } from "../adapters/to-pre-soa-rows"
import { runCoreBridgePackage } from "./run-core-bridge-package"

const soa = (r: Partial<PreSoaRow> & Pick<PreSoaRow, "sourceRecordIndex">): PreSoaRow => ({
  visitName: null,
  activityName: null,
  quantity: null,
  unitPrice: null,
  totalPrice: null,
  notes: null,
  confidence: null,
  needsReview: false,
  reviewReasons: [],
  ...r,
})

const defaultInvoiceFlags = {
  missingVisit: false,
  missingActivity: false,
  missingPricing: false,
  inconsistentTotals: false,
}

const budget = (r: Partial<PreBudgetRow> & Pick<PreBudgetRow, "sourceRecordIndex">): PreBudgetRow => {
  const base: PreBudgetRow = {
    sourceRecordIndex: r.sourceRecordIndex,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    flags: { missingPricing: false, inconsistentTotals: false },
  }
  return { ...base, ...r, flags: { ...base.flags, ...(r.flags ?? {}) } }
}

const invoice = (r: Partial<PreInvoiceRow> & Pick<PreInvoiceRow, "sourceRecordIndex">): PreInvoiceRow => {
  const base: PreInvoiceRow = {
    sourceRecordIndex: r.sourceRecordIndex,
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    flags: { ...defaultInvoiceFlags },
  }
  return { ...base, ...r, flags: { ...defaultInvoiceFlags, ...(r.flags ?? {}) } }
}

describe("runCoreBridgePackage", () => {
  it("all three inputs populated: outputs and summary counts", async () => {
    const out = await runCoreBridgePackage({
      preSoaRows: [soa({ sourceRecordIndex: 0, visitName: "V1", activityName: "A", needsReview: false })],
      preBudgetRows: [budget({ sourceRecordIndex: 0, activityName: "B", needsReview: false })],
      preInvoiceRows: [invoice({ sourceRecordIndex: 0, visitName: "V1", activityName: "C", needsReview: false })],
    })
    expect(out.soaImport.rows).toHaveLength(1)
    expect(out.budgetReview.rows).toHaveLength(1)
    expect(out.invoiceReview.rows).toHaveLength(1)
    expect(out.summary.totalSoaRows).toBe(1)
    expect(out.summary.totalBudgetRows).toBe(1)
    expect(out.summary.totalInvoiceRows).toBe(1)
    expect(out.summary.totalRows).toBe(3)
    expect(out.summary.totalNeedsReview).toBe(0)
    expect(out.warnings).toEqual([])
  })

  it("only preSoaRows: SoA populated; budget/invoice empty; empty warnings for those bridges", async () => {
    const out = await runCoreBridgePackage({
      preSoaRows: [soa({ sourceRecordIndex: 0, visitName: "V1", activityName: "X", needsReview: false })],
    })
    expect(out.soaImport.rows).toHaveLength(1)
    expect(out.budgetReview.rows).toHaveLength(0)
    expect(out.invoiceReview.rows).toHaveLength(0)
    expect(out.warnings).toEqual([
      "No pre-budget rows provided.",
      "No pre-invoice rows provided.",
    ])
  })

  it("only preBudgetRows", async () => {
    const out = await runCoreBridgePackage({
      preBudgetRows: [budget({ sourceRecordIndex: 0, activityName: "Line", needsReview: false })],
    })
    expect(out.soaImport.rows).toHaveLength(0)
    expect(out.budgetReview.rows).toHaveLength(1)
    expect(out.invoiceReview.rows).toHaveLength(0)
    expect(out.warnings).toEqual([
      "No pre-SoA rows provided.",
      "No pre-invoice rows provided.",
    ])
  })

  it("only preInvoiceRows", async () => {
    const out = await runCoreBridgePackage({
      preInvoiceRows: [invoice({ sourceRecordIndex: 0, visitName: "V1", activityName: "Inv", needsReview: false })],
    })
    expect(out.soaImport.rows).toHaveLength(0)
    expect(out.budgetReview.rows).toHaveLength(0)
    expect(out.invoiceReview.rows).toHaveLength(1)
    expect(out.warnings).toEqual([
      "No pre-SoA rows provided.",
      "No pre-budget rows provided.",
    ])
  })

  it("empty input: valid empty outputs, warnings, no crash", async () => {
    const out = await runCoreBridgePackage({})
    expect(out.soaImport.rows).toEqual([])
    expect(out.budgetReview.rows).toEqual([])
    expect(out.invoiceReview.rows).toEqual([])
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.totalNeedsReview).toBe(0)
    expect(out.warnings).toEqual([
      "No pre-SoA rows provided.",
      "No pre-budget rows provided.",
      "No pre-invoice rows provided.",
    ])
  })

  it("warnings merge deterministically (order + dedupe)", async () => {
    const a = await runCoreBridgePackage({})
    const b = await runCoreBridgePackage({})
    expect(a.warnings.join("|")).toBe(b.warnings.join("|"))
    expect(a.warnings).toEqual([
      "No pre-SoA rows provided.",
      "No pre-budget rows provided.",
      "No pre-invoice rows provided.",
    ])
  })
})
