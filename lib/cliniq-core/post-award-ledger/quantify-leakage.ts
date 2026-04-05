import type { InvoicePackage } from "../claims/types"
import { buildLeakageTrace } from "./build-leakage-trace"
import type { LeakageTraceResult } from "./leakage-types"
import type { ExpectedBillable } from "./types"

export type LeakageStatus = "ok" | "warning" | "critical"

export type QuantifiedLineLeakage = {
  lineCode: string
  label: string
  expected: number
  invoiced: number
  leakage: number
  leakagePct: number
  status: LeakageStatus
}

export type QuantifiedRevenueLeakageReport = {
  studyId: string
  invoicePeriodStart: string
  invoicePeriodEnd: string
  totalExpected: number
  totalInvoiced: number
  totalLeakage: number
  leakagePct: number
  status: LeakageStatus
  lineBreakdown: QuantifiedLineLeakage[]
  topLeakers: QuantifiedLineLeakage[]
}

function statusFromLeakagePct(pct: number): LeakageStatus {
  if (pct >= 0.25) return "critical"
  if (pct >= 0.1) return "warning"
  return "ok"
}

export function quantifyRevenueLeakage(
  expectedBillables: ExpectedBillable[],
  invoice: InvoicePackage,
): QuantifiedRevenueLeakageReport {
  // v1: comparison aggregated by lineCode only.
  // Suitable for small-site demos. Does not distinguish invoice-only lines without expected rows.
  const expectedByCode = new Map<string, { label: string; expected: number }>()
  for (const row of expectedBillables) {
    const cur = expectedByCode.get(row.lineCode)
    if (cur) {
      cur.expected += row.expectedRevenue
    } else {
      expectedByCode.set(row.lineCode, {
        label: row.label,
        expected: row.expectedRevenue,
      })
    }
  }

  const invoicedByCode = new Map<string, number>()
  for (const line of invoice.lines) {
    const prev = invoicedByCode.get(line.lineCode) ?? 0
    invoicedByCode.set(line.lineCode, prev + line.amount)
  }

  const lineBreakdown: QuantifiedLineLeakage[] = []
  for (const lineCode of [...expectedByCode.keys()].sort((a, b) => a.localeCompare(b))) {
    const exp = expectedByCode.get(lineCode)!
    const invoiced = invoicedByCode.get(lineCode) ?? 0
    const leakage = Math.max(0, exp.expected - invoiced)
    const leakagePct = exp.expected > 0 ? leakage / exp.expected : 0
    lineBreakdown.push({
      lineCode,
      label: exp.label,
      expected: exp.expected,
      invoiced,
      leakage,
      leakagePct,
      status: statusFromLeakagePct(leakagePct),
    })
  }

  const totalExpected = lineBreakdown.reduce((s, r) => s + r.expected, 0)
  const totalInvoiced = lineBreakdown.reduce((s, r) => s + r.invoiced, 0)
  const totalLeakage = Math.max(0, totalExpected - totalInvoiced)
  const leakagePct = totalExpected > 0 ? totalLeakage / totalExpected : 0

  const topLeakers = [...lineBreakdown]
    .sort((a, b) => {
      if (b.leakage !== a.leakage) return b.leakage - a.leakage
      return a.lineCode.localeCompare(b.lineCode)
    })
    .slice(0, 3)

  return {
    studyId: invoice.studyId,
    invoicePeriodStart: invoice.invoicePeriodStart,
    invoicePeriodEnd: invoice.invoicePeriodEnd,
    totalExpected,
    totalInvoiced,
    totalLeakage,
    leakagePct,
    status: statusFromLeakagePct(leakagePct),
    lineBreakdown,
    topLeakers,
  }
}

export type QuantifyRevenueLeakageWithTraceResult = {
  /** Unchanged v1 aggregate-by-lineCode report (same as `quantifyRevenueLeakage`). */
  report: QuantifiedRevenueLeakageReport
  /** Item-level actionable trace; uses `buildLeakageTrace` with optional ledger/claims. */
  trace: LeakageTraceResult
}

/**
 * Runs existing `quantifyRevenueLeakage` unchanged, plus v2 trace from `buildLeakageTrace`.
 * Pass `ledgerRows` / `claimItems` / `invoicePackages` when available for richer matching;
 * otherwise trace uses `[invoice]` only (no claim linkage → mostly `not_generated` per expected row).
 */
export function quantifyRevenueLeakageWithTrace(
  expectedBillables: ExpectedBillable[],
  invoice: InvoicePackage,
  options?: {
    ledgerRows?: any[]
    claimItems?: any[]
    /** When omitted, defaults to `[invoice]` so invoice lines participate in trace. */
    invoicePackages?: any[]
  },
): QuantifyRevenueLeakageWithTraceResult {
  const report = quantifyRevenueLeakage(expectedBillables, invoice)
  const trace = buildLeakageTrace({
    expectedBillables,
    ledgerRows: options?.ledgerRows,
    claimItems: options?.claimItems,
    invoicePackages: options?.invoicePackages ?? [invoice],
  })
  return { report, trace }
}
