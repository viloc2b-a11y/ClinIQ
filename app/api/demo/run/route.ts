import { NextResponse } from "next/server"

import { analyzeSoABudgetGap } from "@/lib/cliniq-core/analysis/soa-budget-gap"
import { buildNegotiationActions } from "@/lib/cliniq-core/analysis/negotiation-engine"
import { buildRevenueDecision } from "@/lib/cliniq-core/analysis/revenue-decision"
import { projectRevenue, type SiteCostProfile } from "@/lib/cliniq-core/analysis/revenue-projection"
import { summarizeRevenueCoverage } from "@/lib/cliniq-core/analysis/revenue-coverage-summary"
import { buildCounteroffer } from "@/lib/cliniq-core/output/counteroffer-builder"
import { buildNegotiationEmail } from "@/lib/cliniq-core/output/negotiation-email"

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

function formatDemoOutput(): string {
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

  const lines: string[] = []
  lines.push("=== CLINIQ FINANCIAL DEMO (Node/TS) ===")
  lines.push("")
  lines.push("=== STUDY REVENUE DECISION ===")
  lines.push(`Decision: ${decision.decision}`)
  lines.push(`Headline: ${headlineOneLine}`)
  lines.push(`Revenue Opportunity: $${Math.round(decision.totalRevenueOpportunity)}`)
  lines.push(`Estimated Revenue At Risk: $${Math.round(decision.revenueAtRisk)}`)
  lines.push(`Coverage: ${decision.coveragePercent}%`)
  lines.push("")
  lines.push("=== EMAIL SUBJECT ===")
  lines.push(email.subject)
  lines.push("")
  lines.push("=== EMAIL BODY ===")
  lines.push(email.body)
  lines.push("")
  lines.push("=== SUGGESTED COUNTEROFFER ===")
  lines.push(`Suggested Counteroffer Total: $${Math.round(counteroffer.totalProposedValue)}`)
  for (let i = 0; i < counteroffer.rows.length; i++) {
    const r = counteroffer.rows[i]
    lines.push(`${i + 1}. ${r.activity} | ${r.visit} | $${Math.round(r.proposedFee)}`)
  }
  lines.push("")
  lines.push("=== NOTES ===")
  lines.push("This demo runs fully in Node/Next.js with no Python runtime.")

  return lines.join("\n")
}

export async function GET() {
  try {
    const output = formatDemoOutput()
    return NextResponse.json({ success: true, output })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown demo error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}