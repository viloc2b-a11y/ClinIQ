import type { QuantifiedRevenueLeakageReport } from "./quantify-leakage"

export type LeakageSummary = {
  studyId: string
  invoicePeriodStart: string
  invoicePeriodEnd: string
  expectedRevenue: number
  invoicedRevenue: number
  leakedRevenue: number
  leakageRatePct: number
  status: "ok" | "warning" | "critical"
  topLeakers: Array<{
    lineCode: string
    label: string
    leakage: number
  }>
}

/**
 * Executive-friendly view of a quantified leakage report (deterministic, no currency formatting).
 */
export function buildLeakageSummary(report: QuantifiedRevenueLeakageReport): LeakageSummary {
  const leakageRatePct = Math.round(report.leakagePct * 100 * 10) / 10
  return {
    studyId: report.studyId,
    invoicePeriodStart: report.invoicePeriodStart,
    invoicePeriodEnd: report.invoicePeriodEnd,
    expectedRevenue: report.totalExpected,
    invoicedRevenue: report.totalInvoiced,
    leakedRevenue: report.totalLeakage,
    leakageRatePct,
    status: report.status,
    topLeakers: report.topLeakers.slice(0, 3).map((t) => ({
      lineCode: t.lineCode,
      label: t.label,
      leakage: t.leakage,
    })),
  }
}
