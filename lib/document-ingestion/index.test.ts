import { describe, expect, it } from "vitest"

import {
  bridgeDocumentRecords,
  buildReviewActionsFromLeakageSignals,
  classifyMatchResultsIntoLeakageSignals,
  demoExpectedRows,
  demoInvoiceRows,
  matchExpectedToInvoice,
  parseDocument,
  runPreSoaIntake,
  runRevenueProtectionReview,
  toCanonicalHandoff,
  toPreBudgetRows,
  toPreInvoiceRows,
  toPreSoaRows,
} from "./index"

describe("document-ingestion index exports", () => {
  it("exports public orchestrators and matchers", () => {
    expect(typeof parseDocument).toBe("function")
    expect(typeof runPreSoaIntake).toBe("function")
    expect(typeof toCanonicalHandoff).toBe("function")
    expect(typeof bridgeDocumentRecords).toBe("function")
    expect(typeof toPreSoaRows).toBe("function")
    expect(typeof toPreBudgetRows).toBe("function")
    expect(typeof toPreInvoiceRows).toBe("function")
    expect(typeof matchExpectedToInvoice).toBe("function")
    expect(typeof classifyMatchResultsIntoLeakageSignals).toBe("function")
    expect(typeof buildReviewActionsFromLeakageSignals).toBe("function")
    expect(typeof runRevenueProtectionReview).toBe("function")
  })

  it("exports demo fixtures", () => {
    expect(Array.isArray(demoExpectedRows)).toBe(true)
    expect(Array.isArray(demoInvoiceRows)).toBe(true)
    expect(demoExpectedRows.length).toBeGreaterThan(0)
    expect(demoInvoiceRows.length).toBeGreaterThan(0)
  })

  it("importing from index runs revenue protection end-to-end with demo data", async () => {
    const result = await runRevenueProtectionReview({
      expectedRows: demoExpectedRows,
      invoiceRows: demoInvoiceRows,
    })
    expect(result.summary.reviewActionCount).toBeGreaterThan(0)
  })
})
