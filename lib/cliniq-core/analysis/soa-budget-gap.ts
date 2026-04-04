/**
 * Deterministic Schedule of Assessments vs budget gap detection (no ML).
 */

export type SoAActivity = {
  name: string
  visit: string
  isBillable: boolean
}

export type BudgetLineItem = {
  description: string
  amount: number
}

export type SoABudgetGapInput = {
  soa: SoAActivity[]
  budget: BudgetLineItem[]
}

export type SoABudgetGapRecommendation = {
  action: string
  impact: number
  negotiationText: string
}

export type SoABudgetGap = {
  missingInBudget: { activity: SoAActivity; estimatedValue: number }[]
  potentialRevenueLoss: number
  recommendations: SoABudgetGapRecommendation[]
}

function normalizedToken(s: string): string {
  return s.trim().toLowerCase()
}

function activityMatchesBudgetLine(activityName: string, budgetDescription: string): boolean {
  const a = normalizedToken(activityName)
  const b = normalizedToken(budgetDescription)
  if (a.length === 0 || b.length === 0) return false
  if (a === b) return true
  if (b.includes(a)) return true
  if (a.includes(b)) return true
  return false
}

function hasBudgetMatch(activity: SoAActivity, budget: BudgetLineItem[]): boolean {
  for (const line of budget) {
    if (activityMatchesBudgetLine(activity.name, line.description)) return true
  }
  return false
}

function compareActivities(a: SoAActivity, b: SoAActivity): number {
  const v = normalizedToken(a.visit).localeCompare(normalizedToken(b.visit))
  if (v !== 0) return v
  return normalizedToken(a.name).localeCompare(normalizedToken(b.name))
}

/**
 * Billable SoA activities with no matching budget line (substring / exact on normalized text).
 */
export function analyzeSoABudgetGap(input: SoABudgetGapInput): SoABudgetGap {
  if (input.budget.length === 0) {
    return {
      missingInBudget: [],
      potentialRevenueLoss: 0,
      recommendations: [],
    }
  }

  const totalBudget = input.budget.reduce((sum, line) => sum + line.amount, 0)
  const avgValue = totalBudget / input.budget.length
  const perMissingEstimated = Math.round(avgValue)

  const missingActivities = [...input.soa]
    .filter((act) => act.isBillable && !hasBudgetMatch(act, input.budget))
    .sort(compareActivities)

  const missingInBudget: SoABudgetGap["missingInBudget"] = missingActivities.map((activity) => ({
    activity,
    estimatedValue: perMissingEstimated,
  }))

  const potentialRevenueLoss = missingInBudget.reduce((sum, entry) => sum + entry.estimatedValue, 0)

  const recommendations: SoABudgetGapRecommendation[] = missingInBudget.map(
    ({ activity, estimatedValue }) => {
      const name = activity.name
      const visit = activity.visit
      return {
        action: `Add missing billable procedure: ${name}`,
        impact: estimatedValue,
        negotiationText: `The Schedule of Assessments includes ${name} as a billable procedure during the ${visit} visit, however it is not reflected in the current budget. We recommend adding this item to ensure appropriate reimbursement and alignment with protocol requirements.`,
      }
    },
  )

  return {
    missingInBudget,
    potentialRevenueLoss,
    recommendations,
  }
}
