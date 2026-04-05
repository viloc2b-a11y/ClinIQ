/**
 * STEP 82 — Revenue Protection Score: captured vs at-risk (deterministic, no ML).
 * Accepts STEP 81 {@link InvoicePackagesResult} / {@link RevenueLeakageResult} summary slices only.
 */

import type { InvoicePackagesResult } from "../invoicing/build-invoice-packages"
import type { RevenueLeakageResult } from "./compute-revenue-leakage"

/** Reads `summary.totalAmount` / `summary.totalValue`; full STEP 81 summaries remain valid. */
export type ComputeRevenueProtectionScoreInput = {
  invoices: { summary: Partial<InvoicePackagesResult["summary"]> }
  leakage: { summary: Partial<RevenueLeakageResult["summary"]> }
}

export type RevenueProtectionScoreResult = {
  score: number
  components: {
    capturedRevenue: number
    revenueAtRisk: number
    totalRevenueOpportunity: number
  }
  summary: {
    score: number
  }
  warnings: string[]
}

export function computeRevenueProtectionScore(
  input: ComputeRevenueProtectionScoreInput,
): RevenueProtectionScoreResult {
  const captured = input.invoices.summary.totalAmount ?? 0
  const atRisk = input.leakage.summary.totalValue ?? 0
  const total = captured + atRisk

  const score = total === 0 ? 100 : Math.round((captured / total) * 100)

  return {
    score,
    components: {
      capturedRevenue: captured,
      revenueAtRisk: atRisk,
      totalRevenueOpportunity: total,
    },
    summary: {
      score,
    },
    warnings: score < 80 ? ["Low revenue protection score"] : [],
  }
}
