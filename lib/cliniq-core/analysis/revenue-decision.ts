/**
 * Executive revenue decision from gap, projection, coverage, and negotiation outputs (deterministic).
 */

import type { NegotiationAction } from "./negotiation-engine"
import type { RevenueProjectionResult } from "./revenue-projection"
import type { RevenueCoverageSummaryResult } from "./revenue-coverage-summary"
import type { SoABudgetGap } from "./soa-budget-gap"

/** Alias for coverage summary type (same as `RevenueCoverageSummaryResult`). */
export type RevenueCoverageSummary = RevenueCoverageSummaryResult

export type RevenueDecisionInput = {
  gap: SoABudgetGap
  projection: RevenueProjectionResult
  coverage: RevenueCoverageSummaryResult
  negotiation: NegotiationAction[]
}

export type RevenueDecision = {
  totalRevenueOpportunity: number
  revenueAtRisk: number
  coveragePercent: number

  decision: "SAFE" | "MODERATE_RISK" | "HIGH_RISK"

  headline: string

  topActions: {
    activity: string
    impact: number
    priority: number
  }[]
}

function decisionFromCoveragePercent(pct: number): RevenueDecision["decision"] {
  if (pct >= 80) return "SAFE"
  if (pct >= 50) return "MODERATE_RISK"
  return "HIGH_RISK"
}

export function buildRevenueDecision(input: RevenueDecisionInput): RevenueDecision {
  const { projection, coverage, negotiation } = input

  const totalRevenueOpportunity = projection.summary.totalProjectedRevenue
  const revenueAtRisk = projection.summary.uncoveredRevenue
  const coveragePercent = coverage.coverage.coveragePercent
  const uncoveredCount = projection.summary.uncoveredCount

  const decision = decisionFromCoveragePercent(coveragePercent)

  let headline: string
  if (decision === "SAFE") {
    headline = `Study budget coverage is strong at ${coveragePercent}%, with minimal revenue risk ($${revenueAtRisk}). No immediate negotiation required.`
  } else if (decision === "MODERATE_RISK") {
    headline = `Study budget shows moderate gaps with $${revenueAtRisk} in potential revenue loss (Coverage: ${coveragePercent}%). Targeted negotiation recommended.`
  } else {
    headline = `Study budget is missing ${uncoveredCount} billable procedures representing $${revenueAtRisk} in unrealized revenue (Coverage: ${coveragePercent}%). Immediate negotiation required.`
  }

  const topActions = [...negotiation]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.impact - a.impact
    })
    .slice(0, 3)
    .map((a) => ({
      activity: a.activityName,
      impact: a.impact,
      priority: a.priority,
    }))

  return {
    totalRevenueOpportunity,
    revenueAtRisk,
    coveragePercent,
    decision,
    headline,
    topActions,
  }
}
