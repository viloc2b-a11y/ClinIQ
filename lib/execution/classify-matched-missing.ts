import type { ExpectedVsActualLine } from "./merge-expected-actual"

/** Shortfall on quantity or revenue vs expected → missing; otherwise matched. */
export function classifyMatchedAndMissing(lines: ExpectedVsActualLine[]): {
  matched: ExpectedVsActualLine[]
  missing: ExpectedVsActualLine[]
} {
  const missing = lines.filter((l) => l.quantity_gap > 0 || l.revenue_gap > 0)
  const matched = lines.filter((l) => l.quantity_gap <= 0 && l.revenue_gap <= 0)
  return { matched, missing }
}

export function leakageTotals(missing: ExpectedVsActualLine[]): {
  missing_revenue: number
  missing_line_count: number
} {
  const missing_revenue = missing.reduce((s, l) => s + Math.max(0, l.revenue_gap), 0)
  return { missing_revenue, missing_line_count: missing.length }
}
