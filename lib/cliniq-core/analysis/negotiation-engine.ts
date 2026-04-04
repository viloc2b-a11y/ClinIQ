/**
 * Deterministic negotiation actions from revenue coverage priority items (no AI).
 */

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

export type NegotiationEngineInput = {
  coverageSummary: RevenueCoverageSummaryResult
}

export type NegotiationAction = {
  priority: number
  activityName: string
  visit: string
  impact: number
  urgency: "high" | "medium" | "low"
  negotiationText: string
}

export type NegotiationEngineResult = {
  actions: NegotiationAction[]
  summary: {
    totalItems: number
    highPriorityCount: number
    totalImpact: number
  }
}

function urgencyFromImpact(impact: number): "high" | "medium" | "low" {
  if (impact >= 1000) return "high"
  if (impact >= 500) return "medium"
  return "low"
}

export function buildNegotiationActions(input: NegotiationEngineInput): NegotiationEngineResult {
  const { priorityItems } = input.coverageSummary

  const actions: NegotiationAction[] = priorityItems.map((item, index) => ({
    priority: index,
    activityName: item.activityName,
    visit: item.visit,
    impact: item.impact,
    urgency: urgencyFromImpact(item.impact),
    negotiationText: `For the ${item.visit} visit, the procedure ${item.activityName} is currently not budgeted despite being required per protocol. This represents an estimated revenue gap of $${item.impact}. We recommend adding this item to the budget to ensure full cost recovery and protocol compliance.`,
  }))

  const totalImpact = actions.reduce((sum, a) => sum + a.impact, 0)
  const highPriorityCount = actions.filter((a) => a.urgency === "high").length

  return {
    actions,
    summary: {
      totalItems: actions.length,
      highPriorityCount,
      totalImpact,
    },
  }
}
