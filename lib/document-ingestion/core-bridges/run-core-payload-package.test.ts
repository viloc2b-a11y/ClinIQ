import { describe, expect, it } from "vitest"

import { runCorePayloadPackage } from "./run-core-payload-package"
import type { CoreBudgetReviewRow } from "./to-core-budget-review-rows"
import type { CoreInvoiceReviewRow } from "./to-core-invoice-review-rows"
import type { CoreSoaImportRow } from "./to-core-soa-import-rows"

const soaReady = (i: number): CoreSoaImportRow => ({
  sourceRecordIndex: i,
  visitName: "V",
  activityName: "A",
  quantity: 1,
  unitPrice: 1,
  totalPrice: 1,
  notes: null,
  confidence: "high",
  importStatus: "ready",
  importWarnings: [],
})

const budgetReady = (i: number): CoreBudgetReviewRow => ({
  sourceRecordIndex: i,
  activityName: "B",
  quantity: 1,
  unitPrice: 2,
  totalPrice: 2,
  notes: null,
  confidence: "high",
  reviewStatus: "ready",
  reviewWarnings: [],
  flags: { missingPricing: false, inconsistentTotals: false },
})

const invoiceReady = (i: number): CoreInvoiceReviewRow => ({
  sourceRecordIndex: i,
  visitName: "V",
  activityName: "C",
  quantity: 1,
  unitPrice: 3,
  totalPrice: 3,
  notes: null,
  confidence: "high",
  reviewStatus: "ready",
  reviewWarnings: [],
  flags: {
    missingVisit: false,
    missingActivity: false,
    missingPricing: false,
    inconsistentTotals: false,
  },
})

describe("runCorePayloadPackage", () => {
  it("all three inputs populated: outputs and summary counts", async () => {
    const pkg = await runCorePayloadPackage({
      documentId: "doc-all",
      soaImportRows: [soaReady(0), soaReady(1)],
      budgetReviewRows: [budgetReady(0)],
      invoiceReviewRows: [invoiceReady(0), invoiceReady(1), invoiceReady(2)],
    })
    expect(pkg.soaIntake.rows).toHaveLength(2)
    expect(pkg.budgetReview.rows).toHaveLength(1)
    expect(pkg.invoiceReview.rows).toHaveLength(3)
    expect(pkg.summary.totalSoaRows).toBe(2)
    expect(pkg.summary.totalBudgetRows).toBe(1)
    expect(pkg.summary.totalInvoiceRows).toBe(3)
    expect(pkg.summary.totalRows).toBe(6)
    expect(pkg.summary.totalReadyRows).toBe(6)
    expect(pkg.summary.totalRowsNeedingReview).toBe(0)
    expect(pkg.warnings).toEqual([])
  })

  it("only soaImportRows: SoA populated; budget/invoice empty with empty warnings", async () => {
    const pkg = await runCorePayloadPackage({
      documentId: "doc-soa",
      soaImportRows: [soaReady(0)],
    })
    expect(pkg.soaIntake.summary.totalRows).toBe(1)
    expect(pkg.budgetReview.summary.totalRows).toBe(0)
    expect(pkg.invoiceReview.summary.totalRows).toBe(0)
    expect(pkg.budgetReview.warnings).toEqual(["No budget review rows provided."])
    expect(pkg.invoiceReview.warnings).toEqual(["No invoice review rows provided."])
    expect(pkg.warnings).toEqual([
      "No budget review rows provided.",
      "No invoice review rows provided.",
    ])
  })

  it("only budgetReviewRows", async () => {
    const pkg = await runCorePayloadPackage({
      budgetReviewRows: [budgetReady(0), budgetReady(1)],
    })
    expect(pkg.soaIntake.summary.totalRows).toBe(0)
    expect(pkg.budgetReview.summary.totalRows).toBe(2)
    expect(pkg.invoiceReview.summary.totalRows).toBe(0)
    expect(pkg.soaIntake.warnings).toEqual(["No SoA import rows provided."])
    expect(pkg.invoiceReview.warnings).toEqual(["No invoice review rows provided."])
    expect(pkg.warnings).toEqual([
      "No SoA import rows provided.",
      "No invoice review rows provided.",
    ])
  })

  it("only invoiceReviewRows", async () => {
    const pkg = await runCorePayloadPackage({
      invoiceReviewRows: [invoiceReady(0)],
    })
    expect(pkg.soaIntake.summary.totalRows).toBe(0)
    expect(pkg.budgetReview.summary.totalRows).toBe(0)
    expect(pkg.invoiceReview.summary.totalRows).toBe(1)
    expect(pkg.soaIntake.warnings).toEqual(["No SoA import rows provided."])
    expect(pkg.budgetReview.warnings).toEqual(["No budget review rows provided."])
    expect(pkg.warnings).toEqual([
      "No SoA import rows provided.",
      "No budget review rows provided.",
    ])
  })

  it("empty input: valid empty payloads, warnings, no crash", async () => {
    const pkg = await runCorePayloadPackage({})
    expect(pkg.soaIntake.rows).toEqual([])
    expect(pkg.budgetReview.rows).toEqual([])
    expect(pkg.invoiceReview.rows).toEqual([])
    expect(pkg.summary.totalRows).toBe(0)
    expect(pkg.summary.totalReadyRows).toBe(0)
    expect(pkg.summary.totalRowsNeedingReview).toBe(0)
    expect(pkg.warnings).toEqual([
      "No SoA import rows provided.",
      "No budget review rows provided.",
      "No invoice review rows provided.",
    ])
  })

  it("warnings merge SoA first, then budget, then invoice (deterministic)", async () => {
    const pkg = await runCorePayloadPackage({
      soaImportRows: [{ ...soaReady(0), importStatus: "needs_review", importWarnings: [] }],
      budgetReviewRows: [{ ...budgetReady(0), reviewStatus: "needs_review", reviewWarnings: [] }],
      invoiceReviewRows: [{ ...invoiceReady(0), reviewStatus: "needs_review", reviewWarnings: [] }],
    })
    expect(pkg.warnings).toEqual([
      "Some SoA intake rows require review.",
      "Some budget review rows require review.",
      "Some invoice review rows require review.",
    ])
  })

})
