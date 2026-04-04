import type { BudgetGapSummary } from "./types"

export type BudgetDecision = "reject" | "negotiate" | "accept"

/**
 * Deterministic go / no-go from summary only (no randomness, no I/O).
 *
 * - reject: shortfall exceeds 20% of internal modeled revenue, or operational risk flag is set
 * - negotiate: recoverable shortfall (0–20%) or thin / breakeven margin below the 10% accept band
 * - accept: blended margin ≥ 10% on compared lines and no forced reject
 */
export function determineBudgetDecision(
  summary: BudgetGapSummary,
): BudgetDecision {
  if (summary.negativeCashFlowRisk) return "reject"

  const internal = summary.totalInternalRevenue
  const gap = summary.totalGap

  if (internal > 0) {
    const rejectThreshold = -0.2 * internal
    if (gap < rejectThreshold) return "reject"
    const margin = gap / internal
    if (margin >= 0.1) return "accept"
    if (gap < 0) return "negotiate"
    return "negotiate"
  }

  if (gap < 0) return "reject"
  return "negotiate"
}
