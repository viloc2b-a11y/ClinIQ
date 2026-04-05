/**
 * Local demo: SoA import → intake → structured → expected billables → revenue-protection review.
 *
 *   npx tsx scripts/run-soa-revenue-protection-demo.ts
 *   npm run demo:soa-revenue-protection
 */

import {
  demoInvoiceRows,
  demoSoaImportRows,
} from "../lib/document-ingestion/core-bridges/fixtures/soa-revenue-protection-demo"
import { runSoaToExpectedBillables } from "../lib/document-ingestion/core-bridges/run-soa-to-expected-billables"
import { toRevenueProtectionExpectedRows } from "../lib/document-ingestion/core-bridges/to-revenue-protection-expected-rows"
import { toCoreSoaIntakePayload } from "../lib/document-ingestion/core-bridges/to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "../lib/document-ingestion/core-bridges/to-core-soa-structured-input"
import { runRevenueProtectionReview } from "../lib/document-ingestion/matching/run-revenue-protection-review"

async function main(): Promise<void> {
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

  console.log("SoA Revenue Protection Demo")
  console.log("")
  console.log("Intake Summary")
  console.log(JSON.stringify(intake.summary, null, 2))
  console.log("")
  console.log("Structured Summary")
  console.log(JSON.stringify(structured.summary, null, 2))
  console.log("")
  console.log("Expected Billables Summary")
  console.log(JSON.stringify(soaResult.summary, null, 2))
  console.log("")
  console.log("Revenue Protection Summary")
  console.log(JSON.stringify(review.summary, null, 2))
  console.log("")
  console.log("Leakage Signals")
  console.log(JSON.stringify(review.leakage.signals, null, 2))
  console.log("")
  console.log("Review Actions")
  console.log(JSON.stringify(review.actions.actions, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
