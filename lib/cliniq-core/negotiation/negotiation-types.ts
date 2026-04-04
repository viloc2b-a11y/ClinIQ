/**
 * Module 2 — Site Cost Model → Negotiation integration contract.
 * Distinct from Module 3 `NegotiationEngineInput` in `budget-gap/negotiation-input.ts`.
 */

import type {
  CostModelDealOutput,
  CostModelFeeOutput,
  FeeFamily,
  NonVisitBreakdown,
  SAEBurdenMetrics,
  SiteCostModelOutput,
} from "../cost-model/cost-model-types"

export type { FeeFamily }

/** Module 2 per-fee negotiation posture (distinct from template `NegotiationClass` fee codes). */
export type NegotiationZone = "must_win" | "defendable" | "tradeoff"

/**
 * Per-fee negotiation row: Module 1 fee output plus display/risk context.
 * Deal-level margin and risk are repeated on each line for line-scoped UX.
 */
export type NegotiationFeeInput = CostModelFeeOutput & {
  label: string
  /** Modeled counteroffer anchor; Module 1 sources this from `target_price`. */
  recommended_price: number
  sponsor_offer: number | null
  gross_margin: CostModelDealOutput["gross_modeled_margin"]
  cash_adjusted_margin: CostModelDealOutput["cash_adjusted_margin"]
  risk_score: CostModelDealOutput["risk_score"]
  sae_burden: SAEBurdenMetrics["sae_burden_score"]
  non_visit_breakdown: NonVisitBreakdown
  notes?: string
  /** Set by `classifyAllFees` / Module 2 classifier; omitted before classification. */
  strategic_tag?: NegotiationZone
}

export type NegotiationPolicy = Pick<
  SiteCostModelOutput,
  | "study_type_multiplier"
  | "complexity_hours_multiplier"
  | "complexity_risk_multiplier"
  | "non_visit_effort_pct"
  | "non_visit_breakdown"
  | "sae_metrics"
> & {
  deal_risk_score: CostModelDealOutput["risk_score"]
  deal_risk_flag: CostModelDealOutput["risk_flag"]
  recommended_payment_terms: CostModelDealOutput["recommended_payment_terms"]
}

export type NegotiationDealSnapshot = Pick<
  CostModelDealOutput,
  | "gross_modeled_margin"
  | "startup_cash_burden"
  | "holdback_impact_amount"
  | "holdback_impact_pct"
  | "cost_of_delay_30"
  | "cost_of_delay_60"
  | "cost_of_delay_90"
> & {
  projected_revenue: number
  cash_adjusted_margin_at_offer: CostModelDealOutput["cash_adjusted_margin"]
}

/** Module 2 negotiation prep payload (cost model source of truth). */
export type NegotiationEngineInput = {
  schemaVersion: "2.0-cost-model"
  generatedAt: string
  studyId?: string
  siteId?: string
  fees: NegotiationFeeInput[]
  policy: NegotiationPolicy
  deal: NegotiationDealSnapshot
}
