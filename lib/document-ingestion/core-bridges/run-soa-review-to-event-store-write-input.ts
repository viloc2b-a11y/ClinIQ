/**
 * Document Engine v1 — thin orchestrator: classified SoA activities + invoices → event-store write-input (no persistence).
 */

import { buildInitialExpectedBillables } from "./build-initial-expected-billables"
import { toDraftEventLogRows } from "./to-draft-event-log-rows"
import { toEventLogSchemaCandidate } from "./to-event-log-schema-candidate"
import { toEventStoreWriteInput } from "./to-event-store-write-input"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
import { runRevenueProtectionReview } from "../matching/run-revenue-protection-review"

export type ClassifiedSoaActivity = {
  activityId: string
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  sourceRecordIndex: number
  confidence: string | null
  needsReview: boolean
  classificationStatus: "classified" | "needs_review"
  classificationReasons: string[]
}

export type InvoiceRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  needsReview: boolean
  reviewReasons: string[]
}

function mergeWarningsInOrder(batches: readonly string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const batch of batches) {
    for (const w of batch) {
      if (!seen.has(w)) {
        seen.add(w)
        out.push(w)
      }
    }
  }
  return out
}

export async function runSoaReviewToEventStoreWriteInput(input: {
  documentId: string | null
  activities: ClassifiedSoaActivity[]
  invoiceRows: InvoiceRow[]
}): Promise<{
  expectedBillables: ReturnType<typeof buildInitialExpectedBillables>
  expectedRows: ReturnType<typeof toRevenueProtectionExpectedRows>
  revenueProtection: Awaited<ReturnType<typeof runRevenueProtectionReview>>
  draftEvents: ReturnType<typeof toDraftEventLogRows>
  eventCandidates: ReturnType<typeof toEventLogSchemaCandidate>
  writeInput: ReturnType<typeof toEventStoreWriteInput>
  summary: {
    totalActivities: number
    totalExpectedBillables: number
    totalExpectedRows: number
    totalInvoiceRows: number
    leakageSignalCount: number
    reviewActionCount: number
    draftEventCount: number
    eventCandidateCount: number
    writeInputCount: number
    priority1WriteInputCount: number
  }
  warnings: string[]
}> {
  const { documentId, activities, invoiceRows } = input

  const expectedBillables = buildInitialExpectedBillables({
    documentId,
    activities,
  })

  const expectedRows = toRevenueProtectionExpectedRows({
    documentId,
    rows: expectedBillables.rows,
  })

  const revenueProtection = await runRevenueProtectionReview({
    expectedRows: expectedRows.expectedRows,
    invoiceRows,
  })

  const draftEvents = toDraftEventLogRows({
    documentId,
    actions: revenueProtection.actions.actions,
  })

  const eventCandidates = toEventLogSchemaCandidate({
    documentId,
    rows: draftEvents.rows,
  })

  const writeInput = toEventStoreWriteInput({
    documentId,
    rows: eventCandidates.rows,
  })

  const warnings = mergeWarningsInOrder([
    expectedBillables.warnings,
    expectedRows.warnings,
    revenueProtection.warnings,
    draftEvents.warnings,
    eventCandidates.warnings,
    writeInput.warnings,
  ])

  return {
    expectedBillables,
    expectedRows,
    revenueProtection,
    draftEvents,
    eventCandidates,
    writeInput,
    summary: {
      totalActivities: activities.length,
      totalExpectedBillables: expectedBillables.summary.totalRows,
      totalExpectedRows: expectedRows.summary.totalExpectedRows,
      totalInvoiceRows: invoiceRows.length,
      leakageSignalCount: revenueProtection.summary.leakageSignalCount,
      reviewActionCount: revenueProtection.summary.reviewActionCount,
      draftEventCount: draftEvents.summary.totalRows,
      eventCandidateCount: eventCandidates.summary.totalCandidateRows,
      writeInputCount: writeInput.summary.totalWriteRows,
      priority1WriteInputCount: writeInput.summary.priority1Count,
    },
    warnings,
  }
}
