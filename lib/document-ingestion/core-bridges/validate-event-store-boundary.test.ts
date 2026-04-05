import { describe, expect, it } from "vitest"

import {
  demoInvoiceRows,
  demoSoaImportRows,
} from "./fixtures/soa-event-store-write-input-demo"
import { runSoaToExpectedBillables } from "./run-soa-to-expected-billables"
import { toDraftEventLogRows } from "./to-draft-event-log-rows"
import { toEventLogSchemaCandidate } from "./to-event-log-schema-candidate"
import { toEventStoreBoundaryInput } from "./to-event-store-boundary-input"
import { toEventStoreHandoffPayload } from "./to-event-store-handoff-payload"
import { toEventStoreWriteInput } from "./to-event-store-write-input"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
import { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"
import { runRevenueProtectionReview } from "../matching/run-revenue-protection-review"
import { validateEventStoreBoundary } from "./validate-event-store-boundary"

describe("validateEventStoreBoundary", () => {
  it("valid boundary rows from handoff → boundary pipeline pass", async () => {
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
    const handoff = toEventStoreHandoffPayload({
      documentId: intake.documentId,
      rows: writeInput.rows,
    })
    const boundary = toEventStoreBoundaryInput({ payload: handoff })
    const v = validateEventStoreBoundary({ rows: boundary.rows })

    expect(v.validRows).toBeGreaterThan(0)
    expect(v.invalidRows).toBe(0)
    expect(v.errors).toEqual([])
  })

  it("missing required field (title) fails", async () => {
    const intake = toCoreSoaIntakePayload({
      documentId: "v-doc",
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
    const boundary = toEventStoreBoundaryInput({
      payload: toEventStoreHandoffPayload({
        documentId: intake.documentId,
        rows: writeInput.rows,
      }),
    })
    const bad = structuredClone(boundary.rows[0]!) as Record<string, unknown>
    delete bad.title
    const v = validateEventStoreBoundary({ rows: [bad] })
    expect(v.validRows).toBe(0)
    expect(v.invalidRows).toBe(1)
    expect(v.errors[0]!.reasons.some((r) => r.includes("title"))).toBe(true)
  })

  it("invalid priority fails", async () => {
    const intake = toCoreSoaIntakePayload({
      documentId: "v-doc",
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
    const boundary = toEventStoreBoundaryInput({
      payload: toEventStoreHandoffPayload({
        documentId: intake.documentId,
        rows: writeInput.rows,
      }),
    })
    const bad = structuredClone(boundary.rows[0]!) as Record<string, unknown>
    bad.priority = 99
    const v = validateEventStoreBoundary({ rows: [bad] })
    expect(v.validRows).toBe(0)
    expect(v.invalidRows).toBe(1)
    expect(v.errors[0]!.reasons.some((r) => r.includes("priority"))).toBe(true)
  })

  it("missing traceability sourceActionId fails", async () => {
    const intake = toCoreSoaIntakePayload({
      documentId: "v-doc",
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
    const boundary = toEventStoreBoundaryInput({
      payload: toEventStoreHandoffPayload({
        documentId: intake.documentId,
        rows: writeInput.rows,
      }),
    })
    const bad = structuredClone(boundary.rows[0]!) as Record<string, unknown>
    const meta = bad.metadata as Record<string, unknown>
    const de = { ...(meta.documentEngine as Record<string, unknown>) }
    delete de.sourceActionId
    bad.metadata = { ...meta, documentEngine: de }
    const v = validateEventStoreBoundary({ rows: [bad] })
    expect(v.validRows).toBe(0)
    expect(v.invalidRows).toBe(1)
    expect(v.errors[0]!.reasons.some((r) => r.includes("sourceActionId"))).toBe(true)
  })
})
