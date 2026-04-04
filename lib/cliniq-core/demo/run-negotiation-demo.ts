/**
 * Demo: full revenue pipeline → site budget review, sponsor email, suggested counteroffer (CLI).
 */

import { analyzeSoABudgetGap } from "../analysis/soa-budget-gap"
import { buildNegotiationActions } from "../analysis/negotiation-engine"
import { buildRevenueDecision } from "../analysis/revenue-decision"
import { projectRevenue, type SiteCostProfile } from "../analysis/revenue-projection"
import { summarizeRevenueCoverage } from "../analysis/revenue-coverage-summary"
import { buildCounteroffer } from "../output/counteroffer-builder"
import { buildNegotiationEmail } from "../output/negotiation-email"

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

export function runNegotiationDemo(): void {
  const soa = MOCK_SOA
  const budget = MOCK_BUDGET

  const gap = analyzeSoABudgetGap({ soa, budget })
  const projection = projectRevenue({ soa, budget, siteCostProfile: DEMO_SITE_COST_PROFILE })
  const coverage = summarizeRevenueCoverage({ projection })
  const { actions: negotiationActions } = buildNegotiationActions({ coverageSummary: coverage })

  const decision = buildRevenueDecision({
    gap,
    projection,
    coverage,
    negotiation: negotiationActions,
  })

  const email = buildNegotiationEmail({
    sponsorName: "ABC Pharma",
    studyName: "STUDY-001",
    siteName: "Vilo Research Group",
    decision,
    actions: negotiationActions,
  })

  const counteroffer = buildCounteroffer({
    studyName: "STUDY-001",
    actions: negotiationActions,
  })

  const headlineOneLine = decision.headline.replace(/\r?\n/g, " ").trim()

  console.log("=== SITE BUDGET REVIEW ===")
  console.log(`Decision: ${decision.decision}`)
  console.log(`Headline: ${headlineOneLine}`)
  console.log(`Revenue Opportunity: $${Math.round(decision.totalRevenueOpportunity)}`)
  console.log(`Estimated Revenue At Risk: $${Math.round(decision.revenueAtRisk)}`)
  console.log(`Coverage: ${decision.coveragePercent}%`)
  console.log("")
  console.log("=== EMAIL SUBJECT ===")
  console.log(email.subject)
  console.log("")
  console.log("=== EMAIL BODY ===")
  console.log(email.body)
  console.log("")
  console.log("=== SUGGESTED COUNTEROFFER ===")
  console.log(`Suggested Counteroffer Total: $${Math.round(counteroffer.totalProposedValue)}`)
  console.log(
    "These figures are negotiation anchors and may be higher than the estimated current revenue gap.",
  )
  for (let i = 0; i < counteroffer.rows.length; i++) {
    const r = counteroffer.rows[i]
    console.log(`${i + 1}. ${r.activity} | ${r.visit} | $${Math.round(r.proposedFee)}`)
  }
}

runNegotiationDemo()
