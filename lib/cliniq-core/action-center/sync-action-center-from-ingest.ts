import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import type { ExpectedBillable } from "../post-award-ledger/types"
import { runActionCenterSyncFromRuntime } from "./run-action-center-sync-from-runtime"

export function isVisitCompletedEventType(eventType: string): boolean {
  return eventType.trim().toLowerCase() === "visit_completed"
}

/** Counts returned on successful Action Center write-through (additive ingest metadata). */
export type ActionCenterSyncMetadata = {
  insertedCount: number
  updatedCount: number
  unchangedCount: number
}

export type ActionCenterIngestSyncResult =
  | ({ ok: true } & ActionCenterSyncMetadata)
  | { ok: false; error: string }

/**
 * **v1 failure policy:** Never throws. Surfaces write-through errors as `{ ok: false, error }` so the
 * caller’s main ingest path can still return success with `actionCenterSync` as diagnostic metadata.
 *
 * After visit ingestion produces ledger/claims/invoice slices, refresh persisted Action Center
 * via {@link runActionCenterSyncFromRuntime} (leakage → build → merge → upsert). Omitted optional
 * inputs are left unset so write-through uses its existing defaults.
 */
export async function syncActionCenterFromIngestPipeline(params: {
  eventType: string
  expectedBillables: ExpectedBillable[]
  ledgerRows?: ClaimsLedgerRow[]
  claimItems?: ClaimItem[]
  invoicePackages?: InvoicePackage[]
}): Promise<ActionCenterIngestSyncResult | undefined> {
  if (!isVisitCompletedEventType(params.eventType)) {
    return undefined
  }

  try {
    const r = await runActionCenterSyncFromRuntime({
      expectedBillables: params.expectedBillables,
      ledgerRows: params.ledgerRows,
      claimItems: params.claimItems,
      invoicePackages: params.invoicePackages,
    })
    return {
      ok: true,
      insertedCount: r.insertedCount,
      updatedCount: r.updatedCount,
      unchangedCount: r.unchangedCount,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: message }
  }
}
