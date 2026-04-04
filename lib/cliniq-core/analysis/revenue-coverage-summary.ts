/**
 * Deterministic negotiation-ready summary of revenue coverage vs projection (no AI).
 */

export type RevenueProjectionResult = {
  matchedBillables: {
    activity: {
      name: string
      visit: string
      isBillable: boolean
    }
    budgetLine: {
      description: string
      amount: number
    }
    projectedRevenue: number
  }[]
  uncoveredBillables: {
    activity: {
      name: string
      visit: string
      isBillable: boolean
    }
    estimatedRevenue: number
  }[]
  summary: {
    matchedRevenue: number
    uncoveredRevenue: number
    totalProjectedRevenue: number
    matchedCount: number
    uncoveredCount: number
  }
  recommendations: {
    action: string
    impact: number
    negotiationText: string
  }[]
}

export type RevenueCoverageSummaryInput = {
  projection: RevenueProjectionResult
}

export type RevenueCoverageSummaryResult = {
  coverage: {
    matchedRevenue: number
    uncoveredRevenue: number
    totalProjectedRevenue: number
    coveragePercent: number
    uncoveredPercent: number
  }
  priorityItems: {
    activityName: string
    visit: string
    impact: number
  }[]
  summaryText: string
}

export function summarizeRevenueCoverage(
  input: RevenueCoverageSummaryInput,
): RevenueCoverageSummaryResult {
  const { projection } = input
  const { matchedRevenue, uncoveredRevenue, totalProjectedRevenue } = projection.summary

  let coveragePercent = 0
  let uncoveredPercent = 0
  if (totalProjectedRevenue > 0) {
    coveragePercent = Math.round((matchedRevenue / totalProjectedRevenue) * 100)
    uncoveredPercent = Math.round((uncoveredRevenue / totalProjectedRevenue) * 100)
  }

  const priorityItems = [...projection.uncoveredBillables]
    .map((u) => ({
      activityName: u.activity.name,
      visit: u.activity.visit,
      impact: u.estimatedRevenue,
    }))
    .sort((a, b) => {
      if (b.impact !== a.impact) return b.impact - a.impact
      const vv = a.visit.localeCompare(b.visit)
      if (vv !== 0) return vv
      return a.activityName.localeCompare(b.activityName)
    })

  const summaryText =
    totalProjectedRevenue === 0
      ? "No projected billable revenue is available to summarize."
      : `Current budget coverage captures ${matchedRevenue} out of ${totalProjectedRevenue} in expected billable revenue (${coveragePercent}% coverage). An estimated ${uncoveredRevenue} (${uncoveredPercent}%) remains uncovered and should be prioritized in negotiation.`

  return {
    coverage: {
      matchedRevenue,
      uncoveredRevenue,
      totalProjectedRevenue,
      coveragePercent,
      uncoveredPercent,
    },
    priorityItems,
    summaryText,
  }
}
