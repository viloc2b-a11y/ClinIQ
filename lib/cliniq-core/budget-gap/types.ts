import type { Procedure } from "../cost-truth/cost-types"

export type BudgetLineSource =
  | "internal-model"
  | "sponsor-budget"
  | "merged"
  | "derived"

export type GapStatus =
  | "loss"
  | "breakeven"
  | "profitable"
  | "missing"
  | "internal_only"
  | "undervalued"
  | "present"
  | "pricing_rule_only"

/** Site coordinator policy for compare classification (optional; undefined = legacy loss/breakeven/profitable/missing). */
export type SiteNegotiationVariables = {
  /** Match keys (`budgetLineMatchKey`) that must have a sponsor row or status is `missing`. */
  required_match_keys?: string[]
  /** Match keys where no sponsor row is expected → `internal_only`. */
  internal_only_keys?: string[]
  /** Unmatched sponsor keys treated as `pricing_rule_only` (no primary alert). */
  ignore_unmatched_sponsor_keys?: string[]
  /** Minimum margin percent (e.g. 10 = 10%) for `present` vs `undervalued` when sponsor matched. */
  min_acceptable_margin_percent?: number
  /** Appended to summary alerts and line notes. */
  coordinator_notes?: string[]
}

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
  /**
   * When set alongside `roleCosts` + `siteCostProfile` in `generateExpectedBillablesFromBudget`,
   * enables Cost Truth pricing (procedure time × role rates + overhead + margin).
   */
  costTruthProcedure?: Procedure
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
  siteNegotiationVariables?: SiteNegotiationVariables
}

export type CompareBudgetResult = {
  gapLines: BudgetGapLine[]
  missingInvoiceables: MissingInvoiceable[]
  summary: BudgetGapSummary
}

/** Alias for consumers (e.g. negotiation bridge) that refer to “budget gap result”. */
export type BudgetGapResult = CompareBudgetResult
