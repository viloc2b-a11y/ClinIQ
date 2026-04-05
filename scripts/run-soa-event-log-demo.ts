/**
 * Local demo: SoA import → … → revenue protection → draft events → event-log schema candidates.
 *
 *   npx tsx scripts/run-soa-event-log-demo.ts
 *   npm run demo:soa-event-log
 */

import {
  demoInvoiceRows,
  demoSoaImportRows,
} from "../lib/document-ingestion/core-bridges/fixtures/soa-event-log-demo"
import { runSoaToExpectedBillables } from "../lib/document-ingestion/core-bridges/run-soa-to-expected-billables"
import { toDraftEventLogRows } from "../lib/document-ingestion/core-bridges/to-draft-event-log-rows"
import { toEventLogSchemaCandidate } from "../lib/document-ingestion/core-bridges/to-event-log-schema-candidate"
import { toRevenueProtectionExpectedRows } from "../lib/document-ingestion/core-bridges/to-revenue-protection-expected-rows"
import { toCoreSoaIntakePayload } from "../lib/document-ingestion/core-bridges/to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "../lib/document-ingestion/core-bridges/to-core-soa-structured-input"
import { runRevenueProtectionReview } from "../lib/document-ingestion/matching/run-revenue-protection-review"

async function main(): Promise<void> {
  const intake = toCoreSoaIntakePayload({
    documentId: "demo-soa-event-log-doc",
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

  const draftEvents = toDraftEventLogRows({
    documentId: intake.documentId,
    actions: review.actions.actions,
  })

  const eventCandidates = toEventLogSchemaCandidate({
    documentId: intake.documentId,
    rows: draftEvents.rows,
  })

  console.log("SoA Event Log Demo")
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
  console.log("Draft Events Summary")
  console.log(JSON.stringify(draftEvents.summary, null, 2))
  console.log("")
  console.log("Event Log Candidate Summary")
  console.log(JSON.stringify(eventCandidates.summary, null, 2))
  console.log("")
  console.log("Event Log Candidate Rows")
  console.log(JSON.stringify(eventCandidates.rows, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
