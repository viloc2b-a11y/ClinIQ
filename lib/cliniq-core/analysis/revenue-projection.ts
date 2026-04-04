/**
 * Deterministic revenue projection from SoA billables vs budget lines (no AI, no fuzzy logic).
 */

import { priceActivity, type SiteCostProfile } from "../pricing/pricing-engine"

export type { SiteCostProfile }

export type SoAActivity = {
  name: string
  visit: string
  isBillable: boolean
}

export type BudgetLineItem = {
  description: string
  amount: number
}

export type RevenueProjectionInput = {
  soa: SoAActivity[]
  budget: BudgetLineItem[]
  siteCostProfile: SiteCostProfile
}

export type RevenueProjectionResult = {
  matchedBillables: {
    activity: SoAActivity
    budgetLine: BudgetLineItem
    projectedRevenue: number
  }[]
  uncoveredBillables: {
    activity: SoAActivity
    estimatedRevenue: number
  }[]
  summary: {
    matchedRevenue: number
    uncoveredRevenue: number
    totalProjectedRevenue: number
    matchedCount: number
    uncoveredCount: number
    note?: string
  }
  recommendations: {
    action: string
    impact: number
    negotiationText: string
  }[]
}

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

function activityMatchesBudgetLine(activityNorm: string, budgetDescNorm: string): boolean {
  if (activityNorm.length === 0 || budgetDescNorm.length === 0) return false
  return budgetDescNorm.includes(activityNorm) || activityNorm.includes(budgetDescNorm)
}

function sortByVisitThenActivityName<T extends { activity: SoAActivity }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const v = a.activity.visit.localeCompare(b.activity.visit)
    if (v !== 0) return v
    return a.activity.name.localeCompare(b.activity.name)
  })
}

function emptyResult(): RevenueProjectionResult {
  return {
    matchedBillables: [],
    uncoveredBillables: [],
    summary: {
      matchedRevenue: 0,
      uncoveredRevenue: 0,
      totalProjectedRevenue: 0,
      matchedCount: 0,
      uncoveredCount: 0,
    },
    recommendations: [],
  }
}

/**
 * Projects revenue from billable SoA activities against budget lines.
 * Budget lines are considered in ascending order of normalized description when resolving matches.
 */
export function projectRevenue(input: RevenueProjectionInput): RevenueProjectionResult {
  const { soa, budget, siteCostProfile } = input
  if (budget.length === 0) {
    return emptyResult()
  }

  const sortedBudget = [...budget].sort((a, b) =>
    normalizeText(a.description).localeCompare(normalizeText(b.description)),
  )

  const billables = soa.filter((a) => a.isBillable)
  const sortedBillables = [...billables].sort((a, b) => {
    const v = a.visit.localeCompare(b.visit)
    if (v !== 0) return v
    return a.name.localeCompare(b.name)
  })

  const totalBudgetValue = budget.reduce((sum, item) => sum + item.amount, 0)

  const matchedRaw: RevenueProjectionResult["matchedBillables"] = []
  const uncoveredRaw: RevenueProjectionResult["uncoveredBillables"] = []

  for (const activity of sortedBillables) {
    const activityNorm = normalizeText(activity.name)
    let matchedLine: BudgetLineItem | undefined
    for (const line of sortedBudget) {
      const budgetNorm = normalizeText(line.description)
      if (activityMatchesBudgetLine(activityNorm, budgetNorm)) {
        matchedLine = line
        break
      }
    }
    if (matchedLine !== undefined) {
      matchedRaw.push({
        activity,
        budgetLine: matchedLine,
        projectedRevenue: matchedLine.amount,
      })
    } else {
      const pricing = priceActivity({
        activityName: activity.name,
        siteCostProfile,
      })
      uncoveredRaw.push({
        activity,
        estimatedRevenue: pricing.targetPrice,
      })
    }
  }

  const matchedBillables = sortByVisitThenActivityName(matchedRaw)
  const uncoveredBillables = sortByVisitThenActivityName(uncoveredRaw)

  const matchedRevenue = matchedBillables.reduce((s, m) => s + m.projectedRevenue, 0)
  const rawUncoveredRevenue = uncoveredBillables.reduce((s, u) => s + u.estimatedRevenue, 0)
  const uncoveredCap = totalBudgetValue * 2
  const uncoveredRevenue = Math.min(rawUncoveredRevenue, uncoveredCap)

  const recommendations = uncoveredBillables.map((u) => ({
    action: `Add uncovered billable activity: ${u.activity.name}`,
    impact: u.estimatedRevenue,
    negotiationText:
      `The Schedule of Assessments includes ${u.activity.name} during the ${u.activity.visit} visit as a billable activity, but it is not represented in the current budget. Based on site-adjusted pricing, we recommend adding this item at approximately $${u.estimatedRevenue} to capture the full expected study revenue.`,
  }))

  return {
    matchedBillables,
    uncoveredBillables,
    summary: {
      matchedRevenue,
      uncoveredRevenue,
      totalProjectedRevenue: matchedRevenue + uncoveredRevenue,
      matchedCount: matchedBillables.length,
      uncoveredCount: uncoveredBillables.length,
      note:
        rawUncoveredRevenue > uncoveredRevenue
          ? `Total uncovered revenue is capped at $${uncoveredRevenue} for conservative projection, while full negotiation value is approximately $${rawUncoveredRevenue} based on line-item pricing.`
          : undefined,
    },
    recommendations,
  }
}
