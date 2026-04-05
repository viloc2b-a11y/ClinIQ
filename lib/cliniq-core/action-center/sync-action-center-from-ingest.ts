import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import type { ExpectedBillable } from "../post-award-ledger/types"
import { runActionCenterSyncFromRuntime } from "./run-action-center-sync-from-runtime"

export function isVisitCompletedEventType(eventType: string): boolean {
  return eventType.trim().toLowerCase() === "visit_completed"
}

/**
 * Count metadata on successful write-through (STEP 5 optional result shape).
 * Present on `ingestEvent` as `actionCenterSync` together with `ok: true`.
 */
export type ActionCenterSyncMetadata = {
  insertedCount: number
  updatedCount: number
  unchangedCount: number
}

/** Alias for callers that only care about the count triple after a successful sync. */
export type ActionCenterSyncCounts = ActionCenterSyncMetadata

/** Discriminated result for ingest/API: `ok: false` is a **warning** when core ingest already succeeded (v1). */
export type ActionCenterIngestSyncResult =
  | ({ ok: true } & ActionCenterSyncMetadata)
  | { ok: false; error: string }

/**
 * **v1 failure policy (same semantics as the `ingestEvent` Action Center block):** never throws.
 * Write-through errors become `{ ok: false, error }` so callers keep a successful core ingest shape.
 *
 * Optional helper when not inlining {@link runActionCenterSyncFromRuntime}; ingest uses try/catch
 * around that function directly with identical behavior.
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
