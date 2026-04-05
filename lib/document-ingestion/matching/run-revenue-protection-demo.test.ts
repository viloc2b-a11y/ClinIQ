/**
 * Integration-style check: demo fixtures through full revenue-protection orchestrator.
 */
import { describe, expect, it } from "vitest"

import { demoExpectedRows, demoInvoiceRows } from "./fixtures/revenue-protection-demo"
import { runRevenueProtectionReview } from "./run-revenue-protection-review"

describe("runRevenueProtectionReview (demo fixtures)", () => {
  it("runs end-to-end with demo data", async () => {
    const result = await runRevenueProtectionReview({
      expectedRows: demoExpectedRows,
      invoiceRows: demoInvoiceRows,
    })
    expect(result.summary.totalExpected).toBeGreaterThan(0)
    expect(result.summary.totalInvoice).toBeGreaterThan(0)
    expect(result.summary.leakageSignalCount).toBeGreaterThan(0)
    expect(result.summary.reviewActionCount).toBeGreaterThan(0)
  })
})
