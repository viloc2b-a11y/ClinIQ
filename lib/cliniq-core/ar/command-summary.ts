import type { ArCommandSummary, BuildArCommandSummaryParams } from "./types"

/**
 * Deterministic AR / revenue-risk snapshot from existing risk rows and collections queue.
 */
export function buildArCommandSummary(
  params: BuildArCommandSummaryParams,
): ArCommandSummary {
  const topN = params.topN ?? 5
  let totalOutstandingAr = 0
  let totalHighRiskAr = 0
  let totalMediumRiskAr = 0
  let totalLowRiskAr = 0
  let overdueInvoiceCount = 0
  let shortPaidInvoiceCount = 0

  for (const r of params.riskRows) {
    totalOutstandingAr += r.openBalance
    if (r.riskLevel === "high") totalHighRiskAr += r.openBalance
    else if (r.riskLevel === "medium") totalMediumRiskAr += r.openBalance
    else totalLowRiskAr += r.openBalance
    if (r.riskReasons.includes("overdue")) overdueInvoiceCount += 1
    if (r.riskReasons.includes("short_paid")) shortPaidInvoiceCount += 1
  }

  const invoicesRequiringActionNow = params.queueRows.filter(
    (q) => q.recommendedAction !== "monitor",
  ).length

  const byRank = [...params.queueRows].sort(
    (a, b) => a.priorityRank - b.priorityRank,
  )
  const topPriorityInvoices = byRank.slice(0, topN)

  return {
    asOfDate: params.asOfDate,
    totalOutstandingAr,
    totalHighRiskAr,
    totalMediumRiskAr,
    totalLowRiskAr,
    overdueInvoiceCount,
    shortPaidInvoiceCount,
    invoicesRequiringActionNow,
    topPriorityInvoices,
  }
}
