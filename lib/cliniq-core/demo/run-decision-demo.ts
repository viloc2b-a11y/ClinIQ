/**
 * Demo: full revenue pipeline → executive decision only (CLI).
 */

import { analyzeSoABudgetGap } from "../analysis/soa-budget-gap"
import { buildRevenueDecision } from "../analysis/revenue-decision"
import { buildNegotiationActions } from "../analysis/negotiation-engine"
import { projectRevenue, type SiteCostProfile } from "../analysis/revenue-projection"
import { summarizeRevenueCoverage } from "../analysis/revenue-coverage-summary"

const DEMO_SITE_COST_PROFILE: SiteCostProfile = {
  overheadMultiplier: 1.25,
  targetMarginPercent: 0.35,
  stretchMarginPercent: 0.6,
}

const MOCK_SOA = [
  { name: "Blood draw", visit: "Screening", isBillable: true },
  { name: "ECG", visit: "Screening", isBillable: true },
  { name: "MRI", visit: "Baseline", isBillable: true },
]

const MOCK_BUDGET = [
  { description: "Blood draw", amount: 200 },
  { description: "Visit fee", amount: 300 },
]

export function runDecisionDemo(): void {
  const soa = MOCK_SOA
  const budget = MOCK_BUDGET

  const gap = analyzeSoABudgetGap({ soa, budget })
  const projection = projectRevenue({ soa, budget, siteCostProfile: DEMO_SITE_COST_PROFILE })
  const coverage = summarizeRevenueCoverage({ projection })
  const { actions: negotiationActions } = buildNegotiationActions({ coverageSummary: coverage })

  const d = buildRevenueDecision({
    gap,
    projection,
    coverage,
    negotiation: negotiationActions,
  })

  const headlineLine = d.headline.replace(/\r?\n/g, " ").trim()

  console.log("=== STUDY REVENUE DECISION ===")
  console.log("")
  console.log(`Decision: ${d.decision}`)
  console.log("")
  console.log("Headline:")
  console.log(headlineLine)
  console.log("")
  console.log(`Revenue Opportunity: $${d.totalRevenueOpportunity}`)
  console.log(`Revenue At Risk: $${d.revenueAtRisk}`)
  console.log(`Coverage: ${d.coveragePercent}%`)
  console.log("")
  console.log("Top Actions:")
  if (d.topActions.length === 0) {
    console.log("None")
  } else {
    for (let i = 0; i < d.topActions.length; i++) {
      const row = d.topActions[i]
      console.log(`${i + 1}. ${row.activity} — $${row.impact}`)
    }
  }
}

runDecisionDemo()
