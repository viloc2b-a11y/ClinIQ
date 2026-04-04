export type BudgetLineSource =
  | "internal-model"
  | "sponsor-budget"
  | "merged"
  | "derived"

export type GapStatus = "loss" | "breakeven" | "profitable" | "missing"

export type InternalBudgetLine = {
  id: string
  category: string
  lineCode: string
  label: string
  visitName: string
  quantity: number
  unit: string
  internalUnitCost: number
  internalTotal: number
  notes: string
  source: BudgetLineSource
}

export type SponsorBudgetLine = {
  id: string
  category: string
  lineCode: string
  label: string
  visitName: string
  quantity: number
  unit: string
  sponsorUnitOffer: number
  sponsorTotalOffer: number
  notes: string
  source: BudgetLineSource
}

export type BudgetGapLine = {
  id: string
  category: string
  lineCode: string
  label: string
  visitName: string
  quantity: number
  unit: string
  internalUnitCost: number
  internalTotal: number
  sponsorUnitOffer: number
  sponsorTotalOffer: number
  gapAmount: number
  gapPercent: number
  status: GapStatus
  notes: string
  source: BudgetLineSource
}

export type MissingInvoiceable = {
  id: string
  category: string
  lineCode: string
  label: string
  visitName: string
  quantity: number
  unit: string
  internalUnitCost: number
  internalTotal: number
  gapAmount: number
  gapPercent: number
  status: "missing"
  notes: string
  source: BudgetLineSource
}

export type BudgetGapSummary = {
  totalInternalRevenue: number
  totalSponsorRevenue: number
  totalGap: number
  totalGapPerPatient: number | null
  projectedStudyGap: number | null
  recommendedRevenueTargetAt20Margin: number
  negativeCashFlowRisk: boolean
  primaryAlerts: string[]
}

export type BudgetStudyMeta = {
  studyId?: string
  studyName?: string
  siteName?: string
  /** Patients represented in the budget lines (e.g. expected randomized). */
  patientsInBudget?: number
  /** Full study enrollment target for projection. */
  plannedEnrollment?: number
}

export type CompareBudgetInput = {
  internalLines: InternalBudgetLine[]
  sponsorLines: SponsorBudgetLine[]
  studyMeta: BudgetStudyMeta
}

export type CompareBudgetResult = {
  gapLines: BudgetGapLine[]
  missingInvoiceables: MissingInvoiceable[]
  summary: BudgetGapSummary
}

/** Alias for consumers (e.g. negotiation bridge) that refer to “budget gap result”. */
export type BudgetGapResult = CompareBudgetResult
