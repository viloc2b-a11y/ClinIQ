/**
 * Local demo: SoA import → … → revenue protection → draft events → candidates → event-store write-input.
 *
 *   npx tsx scripts/run-soa-event-store-write-input-demo.ts
 *   npm run demo:soa-event-store-write-input
 */

import {
  demoInvoiceRows,
  demoSoaImportRows,
} from "../lib/document-ingestion/core-bridges/fixtures/soa-event-store-write-input-demo"
import { runSoaToExpectedBillables } from "../lib/document-ingestion/core-bridges/run-soa-to-expected-billables"
import { toDraftEventLogRows } from "../lib/document-ingestion/core-bridges/to-draft-event-log-rows"
import { toEventLogSchemaCandidate } from "../lib/document-ingestion/core-bridges/to-event-log-schema-candidate"
import { toEventStoreBoundaryInput } from "../lib/document-ingestion/core-bridges/to-event-store-boundary-input"
import { toEventStoreHandoffPayload } from "../lib/document-ingestion/core-bridges/to-event-store-handoff-payload"
import { toEventStoreWriteInput } from "../lib/document-ingestion/core-bridges/to-event-store-write-input"
import { boundaryRowClientRef, runEventStoreDryWrite } from "../lib/document-ingestion/core-bridges/run-event-store-dry-write"
import {
  runEventStoreControlledWrite,
  type ControlledWriter,
} from "../lib/document-ingestion/core-bridges/run-event-store-controlled-write"
import { validateEventStoreBoundary } from "../lib/document-ingestion/core-bridges/validate-event-store-boundary"
import { toRevenueProtectionExpectedRows } from "../lib/document-ingestion/core-bridges/to-revenue-protection-expected-rows"
import { toCoreSoaIntakePayload } from "../lib/document-ingestion/core-bridges/to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "../lib/document-ingestion/core-bridges/to-core-soa-structured-input"
import { runRevenueProtectionReview } from "../lib/document-ingestion/matching/run-revenue-protection-review"

async function main(): Promise<void> {
  const intake = toCoreSoaIntakePayload({
    documentId: "demo-soa-write-input-doc",
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

  const writeInput = toEventStoreWriteInput({
    documentId: intake.documentId,
    rows: eventCandidates.rows,
  })

  console.log("SoA Event Store Write Input Demo")
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
  console.log("Event Candidates Summary")
  console.log(JSON.stringify(eventCandidates.summary, null, 2))
  console.log("")
  console.log("Write Input Summary")
  console.log(JSON.stringify(writeInput.summary, null, 2))
  console.log("")
  console.log("Write Input Rows")
  console.log(JSON.stringify(writeInput.rows, null, 2))

  const boundary = toEventStoreBoundaryInput({
    payload: toEventStoreHandoffPayload({
      documentId: intake.documentId,
      rows: writeInput.rows,
    }),
  })

  const validation = validateEventStoreBoundary({
    rows: boundary.rows,
  })

  console.log("")
  console.log("Boundary Validation")
  console.log(JSON.stringify(validation, null, 2))

  const dryWrite = await runEventStoreDryWrite({
    rows: boundary.rows,
  })

  console.log("")
  console.log("Dry Write Result")
  console.log(JSON.stringify(dryWrite, null, 2))

  const controlledWrite = await runEventStoreControlledWrite({
    rows: boundary.rows,
    allowWrite: false,
  })

  console.log("")
  console.log("Controlled Write Result")
  console.log(JSON.stringify(controlledWrite, null, 2))

  const mockWriter: ControlledWriter = async ({ rows }) => ({
    succeeded: rows.map((row, index) => ({
      index,
      clientRef: boundaryRowClientRef(row),
    })),
    failed: [],
    notes: ["Mock writer accepted all rows."],
  })

  const controlledWriteMock = await runEventStoreControlledWrite({
    rows: boundary.rows,
    allowWrite: true,
    writer: mockWriter,
  })

  console.log("")
  console.log("Controlled Write Mock Result")
  console.log(JSON.stringify(controlledWriteMock, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
