/**
 * Demo: SoA → gap analysis → revenue projection → coverage summary → negotiation actions.
 */

import { analyzeSoABudgetGap } from "../analysis/soa-budget-gap"
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

export function runRevenueAnalysisDemo(): void {
  const soa = MOCK_SOA
  const budget = MOCK_BUDGET

  const gap = analyzeSoABudgetGap({ soa, budget })
  const projection = projectRevenue({ soa, budget, siteCostProfile: DEMO_SITE_COST_PROFILE })
  const coverageSummary = summarizeRevenueCoverage({ projection })
  const negotiation = buildNegotiationActions({ coverageSummary })

  console.log("")
  console.log("=".repeat(60))
  console.log("SECTION 1: GAP")
  console.log("=".repeat(60))
  if (gap.missingInBudget.length === 0) {
    console.log("Missing activities: none")
  } else {
    console.log("Missing activities (billable SoA, no budget line):")
    for (const { activity, estimatedValue } of gap.missingInBudget) {
      console.log(`  • ${activity.name} (${activity.visit}) — est. gap $${estimatedValue}`)
    }
  }
  console.log(`Revenue loss (estimated): $${gap.potentialRevenueLoss}`)
  console.log("")

  console.log("=".repeat(60))
  console.log("SECTION 2: PROJECTION")
  console.log("=".repeat(60))
  const { matchedRevenue, uncoveredRevenue, totalProjectedRevenue } = projection.summary
  console.log(`Matched revenue:   $${matchedRevenue}`)
  console.log(`Uncovered revenue: $${uncoveredRevenue}`)
  console.log(`Total projected:   $${totalProjectedRevenue}`)
  console.log("")

  console.log("=".repeat(60))
  console.log("SECTION 3: COVERAGE")
  console.log("=".repeat(60))
  console.log(`Coverage:   ${coverageSummary.coverage.coveragePercent}%`)
  console.log(`Uncovered:  ${coverageSummary.coverage.uncoveredPercent}%`)
  console.log("")
  console.log(coverageSummary.summaryText)
  console.log("")

  console.log("=".repeat(60))
  console.log("SECTION 4: NEGOTIATION")
  console.log("=".repeat(60))
  if (negotiation.actions.length === 0) {
    console.log("No negotiation actions (no uncovered priority items).")
  } else {
    for (const a of negotiation.actions) {
      console.log(
        `  Priority ${a.priority} — ${a.activityName} (${a.visit}) | impact $${a.impact} | urgency ${a.urgency}`,
      )
    }
    console.log("")
    console.log(
      `Summary: ${negotiation.summary.totalItems} item(s), ${negotiation.summary.highPriorityCount} high urgency, total impact $${negotiation.summary.totalImpact}`,
    )
  }
  console.log("")
  console.log("=".repeat(60))
  console.log("")
}

runRevenueAnalysisDemo()
