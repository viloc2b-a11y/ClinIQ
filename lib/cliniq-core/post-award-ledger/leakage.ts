import type { LedgerEntry, RevenueLeakageReport } from "./types"

/**
 * Compares ledger expected vs actual rows and totals under-realization (leakage).
 */
export function detectRevenueLeakage(ledger: LedgerEntry[]): RevenueLeakageReport {
  let totalExpectedRevenue = 0
  let totalActualRevenue = 0
  let leakageAmount = 0
  let overageAmount = 0
  const fullyMissingBillables: LedgerEntry[] = []
  const partialBillables: LedgerEntry[] = []

  for (const e of ledger) {
    totalExpectedRevenue += e.expectedRevenue
    totalActualRevenue += e.actualRevenue

    const shortfall = e.expectedRevenue - e.actualRevenue
    if (shortfall > 0) leakageAmount += shortfall

    const excess = e.actualRevenue - e.expectedRevenue
    if (excess > 0) overageAmount += excess

    if (e.expectedRevenue > 0 && e.actualRevenue === 0) {
      fullyMissingBillables.push(e)
    }
    if (
      e.expectedRevenue > 0 &&
      e.actualRevenue > 0 &&
      e.actualRevenue < e.expectedRevenue
    ) {
      partialBillables.push(e)
    }
  }

  return {
    totalExpectedRevenue,
    totalActualRevenue,
    leakageAmount,
    overageAmount,
    fullyMissingBillables,
    partialBillables,
  }
}
