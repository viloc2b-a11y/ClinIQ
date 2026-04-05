/**
 * STEP 84 — Card-shaped metrics for dashboard UI from report + prioritization outputs.
 */

import type { PrioritizeRevenueActionsResult } from "./prioritize-revenue-actions"
import type { RevenueReportResult } from "./build-revenue-report"

export type BuildRevenueDashboardCardsInput = {
  report: Pick<RevenueReportResult, "summary">
  prioritized: Pick<PrioritizeRevenueActionsResult, "prioritizedActions" | "summary">
}

export type RevenueDashboardCard = {
  id: string
  title: string
  value: number
  unit: string
}

export type BuildRevenueDashboardCardsResult = {
  data: {
    cards: RevenueDashboardCard[]
    topAction: PrioritizeRevenueActionsResult["prioritizedActions"][0] | null
  }
  summary: {
    totalCards: number
    score: number
  }
  warnings: string[]
}

export function buildRevenueDashboardCards({
  report,
  prioritized,
}: BuildRevenueDashboardCardsInput): BuildRevenueDashboardCardsResult {
  const cards: RevenueDashboardCard[] = [
    {
      id: "captured-revenue",
      title: "Captured Revenue",
      value: report.summary.captured,
      unit: "usd",
    },
    {
      id: "revenue-at-risk",
      title: "Revenue At Risk",
      value: report.summary.atRisk,
      unit: "usd",
    },
    {
      id: "protection-score",
      title: "Protection Score",
      value: report.summary.score,
      unit: "score",
    },
    {
      id: "recovery-rate",
      title: "Recovery Rate",
      value: report.summary.recoveryRate,
      unit: "percent",
    },
    {
      id: "priority-actions",
      title: "Priority Actions",
      value: prioritized.summary.total,
      unit: "count",
    },
    {
      id: "highest-value-action",
      title: "Highest Value Action",
      value: prioritized.summary.highestValue,
      unit: "usd",
    },
  ]

  return {
    data: {
      cards,
      topAction: prioritized.prioritizedActions[0] ?? null,
    },
    summary: {
      totalCards: cards.length,
      score: report.summary.score,
    },
    warnings: [],
  }
}
