import { writeThroughActionCenter } from "./write-through-action-center"

/**
 * Delegates to {@link writeThroughActionCenter}; **rejects/throws** on write-through failure.
 * Callers that need a non-atomic ingest (v1) catch and surface metadata — see `ingestEvent`.
 */
export async function runActionCenterSyncFromRuntime(params: {
  expectedBillables: any[]
  ledgerRows?: any[]
  claimItems?: any[]
  invoicePackages?: any[]
}) {
  return writeThroughActionCenter({
    expectedBillables: params.expectedBillables,
    ledgerRows: params.ledgerRows,
    claimItems: params.claimItems,
    invoicePackages: params.invoicePackages,
  })
}
