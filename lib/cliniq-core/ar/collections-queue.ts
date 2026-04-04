import type {
  BuildCollectionsActionQueueParams,
  CollectionsAction,
  CollectionsActionRow,
  InvoiceRiskLevel,
  InvoiceRiskRow,
} from "./types"

function riskLevelRank(level: InvoiceRiskLevel): number {
  if (level === "high") return 0
  if (level === "medium") return 1
  return 2
}

function recommendedAction(row: InvoiceRiskRow): CollectionsAction {
  if (row.riskLevel === "high") {
    if (row.riskReasons.includes("short_paid")) return "review_short_pay"
    if (row.riskReasons.includes("overdue")) return "contact_now"
    return "contact_now"
  }
  if (row.riskLevel === "medium") return "follow_up_this_week"
  return "monitor"
}

/**
 * Deterministic prioritized action queue from risk rows (no AR/risk recomputation).
 */
export function buildCollectionsActionQueue(
  params: BuildCollectionsActionQueueParams,
): CollectionsActionRow[] {
  const sorted = [...params.riskRows].sort((a, b) => {
    const lr = riskLevelRank(a.riskLevel) - riskLevelRank(b.riskLevel)
    if (lr !== 0) return lr
    if (b.openBalance !== a.openBalance) return b.openBalance - a.openBalance
    if (b.daysPastDue !== a.daysPastDue) return b.daysPastDue - a.daysPastDue
    return a.invoiceId.localeCompare(b.invoiceId)
  })

  return sorted.map((r, i) => ({
    invoiceId: r.invoiceId,
    sponsorId: r.sponsorId,
    studyId: r.studyId,
    riskLevel: r.riskLevel,
    riskReasons: [...r.riskReasons],
    openBalance: r.openBalance,
    daysPastDue: r.daysPastDue,
    recommendedAction: recommendedAction(r),
    priorityRank: i + 1,
  }))
}
