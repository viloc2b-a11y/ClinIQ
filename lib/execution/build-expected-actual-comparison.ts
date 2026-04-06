import { computeRevenueLeakage } from "@/lib/cliniq-core/revenue/compute-revenue-leakage"

import { classifyMatchedAndMissing, leakageTotals } from "./classify-matched-missing"
import type { ExpectedVsActualLine } from "./merge-expected-actual"
import { mergeExpectedAndActual } from "./merge-expected-actual"

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v
  if (typeof v === "string" && v.trim() !== "") return Number(v)
  return 0
}

export type ExpectedActualComparison = {
  visitByLine: Map<string, string>
  lines: ExpectedVsActualLine[]
  matched: ExpectedVsActualLine[]
  missing: ExpectedVsActualLine[]
  leakage: ReturnType<typeof leakageTotals>
  revenueLeakage: ReturnType<typeof computeRevenueLeakage>
  summary: {
    matched_line_count: number
    missing_line_count: number
    total_line_count: number
  }
}

/**
 * Deterministic expected vs actual from `expected_billables` and `billable_instances` row shapes
 * (Supabase). Reused by API routes, server loaders, and Action Center sync.
 */
export function buildExpectedActualComparisonFromRawRows(
  studyKey: string,
  expRows: Record<string, unknown>[],
  biRows: Record<string, unknown>[],
): ExpectedActualComparison {
  const expMap = new Map<string, { q: number; r: number }>()
  const visitByLine = new Map<string, string>()
  for (const row of expRows) {
    const code = String(row.line_code ?? "")
    if (!code) continue
    if (!visitByLine.has(code)) {
      const vn = row.visit_name
      visitByLine.set(code, typeof vn === "string" && vn.trim() !== "" ? vn : "—")
    }
    const cur = expMap.get(code) ?? { q: 0, r: 0 }
    cur.q += num(row.expected_quantity)
    cur.r += num(row.expected_revenue)
    expMap.set(code, cur)
  }

  const actMap = new Map<string, { q: number; a: number }>()
  for (const row of biRows) {
    const code = String(row.fee_code ?? "")
    if (!code) continue
    const cur = actMap.get(code) ?? { q: 0, a: 0 }
    const qty = num(row.quantity)
    const amt = num(row.amount)
    cur.q += qty
    cur.a += amt * qty
    actMap.set(code, cur)
  }

  const expected = [...expMap.entries()].map(([line_code, v]) => ({
    line_code,
    expected_quantity: v.q,
    expected_revenue: v.r,
  }))

  const actual = [...actMap.entries()].map(([fee_code, v]) => ({
    fee_code,
    actual_quantity: v.q,
    actual_amount: v.a,
  }))

  const lines = mergeExpectedAndActual(expected, actual)
  const { matched, missing } = classifyMatchedAndMissing(lines)
  const leakage = leakageTotals(missing)

  const revenueLeakage = computeRevenueLeakage({
    actionItems: missing.map((m) => ({
      id: `${studyKey}::${m.line_code}`,
      leakageValue: Math.max(0, m.revenue_gap),
      reason: `quantity_gap=${m.quantity_gap};revenue_gap=${m.revenue_gap}`,
    })),
  })

  return {
    visitByLine,
    lines,
    matched,
    missing,
    leakage,
    revenueLeakage,
    summary: {
      matched_line_count: matched.length,
      missing_line_count: missing.length,
      total_line_count: lines.length,
    },
  }
}
