import type { SupabaseClient } from "@supabase/supabase-js"
import type { ActionCenterIngestSyncResult } from "../action-center/sync-action-center-from-ingest"
import { isVisitCompletedEventType } from "../action-center/sync-action-center-from-ingest"
import { runActionCenterSyncFromRuntime } from "../action-center/run-action-center-sync-from-runtime"
import { buildClaimItemsFromLedger, buildInvoicePackage } from "../claims/build-claims"
import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import { generateBillablesFromEvent } from "../post-award-ledger/billables-from-events"
import { buildLedgerRowsFromBillables } from "../post-award-ledger/billable-to-ledger"
import type { QuantifiedRevenueLeakageReport } from "../post-award-ledger/quantify-leakage"
import { quantifyRevenueLeakage } from "../post-award-ledger/quantify-leakage"
import type { BillableInstance, EventLog, ExpectedBillable } from "../post-award-ledger/types"

export type { ActionCenterIngestSyncResult, ActionCenterSyncCounts, ActionCenterSyncMetadata } from "../action-center/sync-action-center-from-ingest"

export type IngestEventResult = {
  event: Record<string, unknown>
  billables: BillableInstance[]
  ledgerRows: ClaimsLedgerRow[]
  claimItems: ClaimItem[]
  invoice: InvoicePackage
  leakage: QuantifiedRevenueLeakageReport
  actionCenterSync?: ActionCenterIngestSyncResult
}

export interface IngestEventInput {
  studyId: string
  subjectId: string
  visitName: string
  eventType: string
  eventDate: string
  /** Execution site (UUID); stored on event_log when provided */
  siteId?: string
}

const DEFAULT_SPONSOR_ID = "SP-DEFAULT"

export function resolveLineCodeForIngest(
  event: IngestEventInput,
  expectedBillables: ExpectedBillable[],
): string {
  const matches = expectedBillables.filter((e) => e.visitName === event.visitName)
  if (matches.length > 0) {
    return [...matches].sort((a, b) => a.lineCode.localeCompare(b.lineCode))[0].lineCode
  }
  if (expectedBillables.length === 1) {
    return expectedBillables[0].lineCode
  }
  return ""
}

function emptyInvoicePackage(event: IngestEventInput, sponsorId: string): InvoicePackage {
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
 * Contract (v1):
 * - Core failure (DB insert) -> throws
 * - Action Center sync failure -> non-fatal, returns actionCenterSync: { ok: false }
 */
export async function ingestEvent(params: {
  supabase: SupabaseClient
  event: IngestEventInput
  expectedBillables: ExpectedBillable[]
  sponsorId?: string
}): Promise<IngestEventResult> {
  const { supabase, event, expectedBillables } = params
  const sponsorId = params.sponsorId ?? DEFAULT_SPONSOR_ID

  const insertPayload: Record<string, unknown> = {
    study_id: event.studyId,
    study_key: event.studyId,
    subject_id: event.subjectId,
    visit_name: event.visitName,
    event_type: event.eventType,
    event_date: event.eventDate,
  }
  if (event.siteId?.trim()) {
    insertPayload.site_id = event.siteId.trim()
  }

  const { data: inserted, error } = await supabase.from("event_log").insert(insertPayload).select().single()

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
  const invoice: InvoicePackage = invoicePackages[0] ?? emptyInvoicePackage(event, sponsorId)
  const leakage = quantifyRevenueLeakage(expectedBillables, invoice)
  const packagesForLeakage = invoicePackages.length > 0 ? invoicePackages : [invoice]

  let actionCenterSync: ActionCenterIngestSyncResult | undefined
  if (isVisitCompletedEventType(event.eventType)) {
    try {
      const r = await runActionCenterSyncFromRuntime({
        expectedBillables,
        ...(ledgerRows.length > 0 ? { ledgerRows } : {}),
        ...(claimItems.length > 0 ? { claimItems } : {}),
        ...(packagesForLeakage.length > 0 ? { invoicePackages: packagesForLeakage } : {}),
      })
      actionCenterSync = {
        ok: true,
        insertedCount: r.insertedCount,
        updatedCount: r.updatedCount,
        unchangedCount: r.unchangedCount,
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      actionCenterSync = { ok: false, error: message }
    }
  }

  return { event: inserted as Record<string, unknown>, billables, ledgerRows, claimItems, invoice, leakage, actionCenterSync }
}
