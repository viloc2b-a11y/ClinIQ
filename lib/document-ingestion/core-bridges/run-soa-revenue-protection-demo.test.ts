import { describe, expect, it } from "vitest"

import {
  demoInvoiceRows,
  demoSoaImportRows,
} from "./fixtures/soa-revenue-protection-demo"
import { runSoaToExpectedBillables } from "./run-soa-to-expected-billables"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
import { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"
import { runRevenueProtectionReview } from "../matching/run-revenue-protection-review"

describe("SoA revenue protection demo pipeline", () => {
  it("runs full SoA → expected rows → revenue protection on demo fixtures", async () => {
    const intake = toCoreSoaIntakePayload({
      documentId: "demo-soa-revenue-doc",
      rows: demoSoaImportRows,
    })
    const structured = toCoreSoaStructuredInput({
      documentId: intake.documentId,
      rows: intake.rows,
    })
    const soaResult = await runSoaToExpectedBillables({
      documentId: structured.documentId,
      activities: structured.activities,
    })
    const expectedRows = toRevenueProtectionExpectedRows({
      documentId: soaResult.expectedBillables.documentId,
      rows: soaResult.expectedBillables.rows,
    })
    const review = await runRevenueProtectionReview({
      expectedRows: expectedRows.expectedRows,
      invoiceRows: demoInvoiceRows,
    })

    expect(intake.summary.totalRows).toBeGreaterThan(0)
    expect(structured.summary.totalActivities).toBeGreaterThan(0)
    expect(soaResult.summary.expectedBillableCount).toBeGreaterThan(0)
    expect(review.summary.leakageSignalCount).toBeGreaterThan(0)
    expect(review.summary.reviewActionCount).toBeGreaterThan(0)
  })
})
