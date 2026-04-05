import {
  type ActionCenterIngestSyncResult,
  syncActionCenterFromIngestPipeline,
} from "../action-center/sync-action-center-from-ingest"
import { buildClaimItemsFromLedger, buildInvoicePackage } from "../claims/build-claims"
import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import { generateBillablesFromEvent } from "../post-award-ledger/billables-from-events"
import { buildLedgerRowsFromBillables } from "../post-award-ledger/billable-to-ledger"
import type { QuantifiedRevenueLeakageReport } from "../post-award-ledger/quantify-leakage"
import { quantifyRevenueLeakage } from "../post-award-ledger/quantify-leakage"
import type { BillableInstance, EventLog, ExpectedBillable } from "../post-award-ledger/types"

export type { ActionCenterIngestSyncResult, ActionCenterSyncMetadata } from "../action-center/sync-action-center-from-ingest"

/** Result of a successful `ingestEvent` (Supabase row shape is driver-specific). */
export type IngestEventResult = {
  event: Record<string, unknown>
  billables: BillableInstance[]
  ledgerRows: ClaimsLedgerRow[]
  claimItems: ClaimItem[]
  invoice: InvoicePackage
  leakage: QuantifiedRevenueLeakageReport
  /** Present for `visit_completed` after sync runs; success includes count metadata. */
  actionCenterSync?: ActionCenterIngestSyncResult
}

export interface IngestEventInput {
  studyId: string
  subjectId: string
  visitName: string
  eventType: string
  eventDate: string
}

const DEFAULT_SPONSOR_ID = "SP-DEFAULT"

/**
 * Maps ingest payload → engine lineCode without changing core billables logic.
 * v1: expected rows whose visitName matches the event; tie-break by lineCode (asc).
 * If none match and exactly one expected row exists, use that lineCode.
 */
export function resolveLineCodeForIngest(
  event: IngestEventInput,
  expectedBillables: ExpectedBillable[],
): string {
  const matches = expectedBillables.filter((e) => e.visitName === event.visitName)
  if (matches.length > 0) {
    return [...matches].sort((a, b) => a.lineCode.localeCompare(b.lineCode))[0]
      .lineCode
  }
  if (expectedBillables.length === 1) {
    return expectedBillables[0].lineCode
  }
  return ""
}

function emptyInvoicePackage(
  event: IngestEventInput,
  sponsorId: string,
): InvoicePackage {
  const day = event.eventDate.slice(0, 10)
  return {
    schemaVersion: "1.0",
    studyId: event.studyId,
    sponsorId,
    invoicePeriodStart: day,
    invoicePeriodEnd: day,
    generatedAt: new Date().toISOString(),
    lines: [],
    subtotal: 0,
    lineCount: 0,
    hasBlockingIssues: true,
  }
}

/**
 * Event/visit ingestion: persists `event_log`, runs billables → ledger → claims → invoice → leakage.
 *
 * **Contract (v1):** Action Center write-through is **additive**. If the DB insert and core pipeline
 * succeed, this function resolves with the same return shape as before, plus optional `actionCenterSync`.
 * When `actionCenterSync` is present and `ok: false`, the event row and financial artifacts were still
 * produced; clients should treat that as a sync warning, not a failed ingest. Core failures (e.g. insert)
 * still throw unchanged.
 */
export async function ingestEvent(params: {
  supabase: any
  event: IngestEventInput
  expectedBillables: ExpectedBillable[]
  sponsorId?: string
}) {
  const { supabase, event, expectedBillables } = params
  const sponsorId = params.sponsorId ?? DEFAULT_SPONSOR_ID

  const { data: inserted, error } = await supabase
    .from("event_log")
    .insert({
      study_id: event.studyId,
      subject_id: event.subjectId,
      visit_name: event.visitName,
      event_type: event.eventType,
      event_date: event.eventDate,
    })
    .select()
    .single()

  if (error) {
    throw new Error("Failed to insert event_log: " + error.message)
  }

  const lineCode = resolveLineCodeForIngest(event, expectedBillables)

  const engineEvent: EventLog = {
    id: inserted.id as string,
    studyId: event.studyId,
    occurredAt: event.eventDate,
    eventType: event.eventType,
    lineCode,
    quantity: 1,
  }

  const billable = generateBillablesFromEvent(engineEvent, expectedBillables)
  const billables = billable ? [billable] : []

  const periodDay = event.eventDate.slice(0, 10)
  const ledgerRows = buildLedgerRowsFromBillables(billables, {
    sponsorId,
    subjectId: event.subjectId,
    visitName: event.visitName,
    invoicePeriodStart: periodDay,
    invoicePeriodEnd: periodDay,
  })

  const claimItems = buildClaimItemsFromLedger(ledgerRows)

  const invoicePackages = buildInvoicePackage({ claimItems })
  const invoice: InvoicePackage =
    invoicePackages[0] ?? emptyInvoicePackage(event, sponsorId)

  const leakage = quantifyRevenueLeakage(expectedBillables, invoice)

  const packagesForLeakage =
    invoicePackages.length > 0 ? invoicePackages : [invoice]

  /** `visit_completed` → {@link runActionCenterSyncFromRuntime} via syncActionCenterFromIngestPipeline. */
  const actionCenterSync = await syncActionCenterFromIngestPipeline({
    eventType: event.eventType,
    expectedBillables,
    ledgerRows,
    claimItems,
    invoicePackages: packagesForLeakage,
  })

  return {
    event: inserted as Record<string, unknown>,
    billables,
    ledgerRows,
    claimItems,
    invoice,
    leakage,
    actionCenterSync,
  }
}
