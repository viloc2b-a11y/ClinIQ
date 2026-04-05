import { describe, expect, it } from "vitest"

import {
  demoInvoiceRows,
  demoSoaImportRows,
} from "./fixtures/soa-event-log-demo"
import { runSoaToExpectedBillables } from "./run-soa-to-expected-billables"
import { toDraftEventLogRows } from "./to-draft-event-log-rows"
import { toEventLogSchemaCandidate } from "./to-event-log-schema-candidate"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
import { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"
import { runRevenueProtectionReview } from "../matching/run-revenue-protection-review"

describe("SoA event-log demo pipeline", () => {
  it("runs full path to event-log schema candidates", async () => {
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

    expect(intake.summary.totalRows).toBeGreaterThan(0)
    expect(structured.summary.totalActivities).toBeGreaterThan(0)
    expect(soaResult.summary.expectedBillableCount).toBeGreaterThan(0)
    expect(review.summary.reviewActionCount).toBeGreaterThan(0)
    expect(draftEvents.summary.totalRows).toBeGreaterThan(0)
    expect(eventCandidates.summary.totalCandidateRows).toBeGreaterThan(0)
  })
})
