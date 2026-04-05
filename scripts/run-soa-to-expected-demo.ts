/**
 * Local demo: SoA import → intake → structured → classification → initial expected billables.
 *
 *   npx tsx scripts/run-soa-to-expected-demo.ts
 */

import { demoSoaImportRows } from "../lib/document-ingestion/core-bridges/fixtures/soa-to-expected-demo"
import { runSoaToExpectedBillables } from "../lib/document-ingestion/core-bridges/run-soa-to-expected-billables"
import { toCoreSoaIntakePayload } from "../lib/document-ingestion/core-bridges/to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "../lib/document-ingestion/core-bridges/to-core-soa-structured-input"

async function main(): Promise<void> {
  const intake = toCoreSoaIntakePayload({
    documentId: "demo-soa-doc",
    rows: demoSoaImportRows,
  })

  const structured = toCoreSoaStructuredInput({
    documentId: intake.documentId,
    rows: intake.rows,
  })

  const result = await runSoaToExpectedBillables({
    documentId: structured.documentId,
    activities: structured.activities,
  })

  console.log("SoA To Expected Billables Demo")
  console.log("")
  console.log("Intake Summary")
  console.log(JSON.stringify(intake.summary, null, 2))
  console.log("")
  console.log("Structured Summary")
  console.log(JSON.stringify(structured.summary, null, 2))
  console.log("")
  console.log("Expected Billables Summary")
  console.log(JSON.stringify(result.summary, null, 2))
  console.log("")
  console.log("Expected Billables Rows")
  console.log(JSON.stringify(result.expectedBillables.rows, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
