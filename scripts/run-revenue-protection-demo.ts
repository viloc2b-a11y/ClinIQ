/**
 * Local demo: expected vs invoice → match → leakage signals → review actions.
 *
 *   npx tsx scripts/run-revenue-protection-demo.ts
 */

import { demoExpectedRows, demoInvoiceRows } from "../lib/document-ingestion/matching/fixtures/revenue-protection-demo"
import { runRevenueProtectionReview } from "../lib/document-ingestion/matching/run-revenue-protection-review"

async function main(): Promise<void> {
  const result = await runRevenueProtectionReview({
    expectedRows: demoExpectedRows,
    invoiceRows: demoInvoiceRows,
  })

  console.log("Revenue Protection Demo")
  console.log("")
  console.log("Summary")
  console.log(JSON.stringify(result.summary, null, 2))
  console.log("")
  console.log("Leakage Signals")
  console.log(JSON.stringify(result.leakage.signals, null, 2))
  console.log("")
  console.log("Review Actions")
  console.log(JSON.stringify(result.actions.actions, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
