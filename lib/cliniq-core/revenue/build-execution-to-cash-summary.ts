import type { ClaimItemsFromRecordsResult } from "../claims/build-claim-items-from-records"
import type { InvoicePackagesResult } from "../invoicing/build-invoice-packages"
import type { RevenueLeakageResult } from "./compute-revenue-leakage"

/**
 * STEP 81 — Single consolidated snapshot shape for admin / UI (deterministic fields only).
 */
export type ExecutionToCashSummary = {
  claims: Pick<ClaimItemsFromRecordsResult, "summary">
  invoices: Pick<InvoicePackagesResult, "summary">
  leakage: Pick<RevenueLeakageResult, "summary">
}

export function buildExecutionToCashSummary(input: {
  claims: ClaimItemsFromRecordsResult
  invoices: InvoicePackagesResult
  leakage: RevenueLeakageResult
}): ExecutionToCashSummary {
  return {
    claims: { summary: input.claims.summary },
    invoices: { summary: input.invoices.summary },
    leakage: { summary: input.leakage.summary },
  }
}
