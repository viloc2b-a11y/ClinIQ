/**
 * Map Module 1 `SiteCostModelOutput` → Module 2 `NegotiationEngineInput`.
 */

import type { FeeFamily, SiteCostModelOutput } from "../cost-model/cost-model-types"
import type { NegotiationEngineInput, NegotiationFeeInput } from "./negotiation-types"

const FEE_FAMILY_LABELS = {
  startup: "Startup",
  screening_visit: "Screening visit",
  randomization_visit: "Randomization visit",
  followup_visit: "Follow-up visit",
  screen_failure: "Screen failure",
  pharmacy: "Pharmacy",
  imaging: "Imaging",
  lab_local: "Local lab",
  lab_central: "Central lab",
  shipping: "Shipping",
  retention: "Retention",
  closeout: "Closeout",
} as const satisfies Record<FeeFamily, string>

export type MapCostModelToNegotiationParams = {
  costOutput: SiteCostModelOutput
  /** Revenue basis used when Module 1 deal metrics were computed. */
  projectedRevenue: number
  sponsorOfferByFeeFamily?: Partial<Record<FeeFamily, number | null>>
  feeNotesByFeeFamily?: Partial<Record<FeeFamily, string>>
  studyId?: string
  siteId?: string
}

function mapFees(
  cost: SiteCostModelOutput,
  params: MapCostModelToNegotiationParams,
): NegotiationFeeInput[] {
  const { sponsorOfferByFeeFamily: offers, feeNotesByFeeFamily: notesMap } =
    params
  const d = cost.deal_output
  const sae_burden = cost.sae_metrics.sae_burden_score
  const { non_visit_breakdown } = cost

  return cost.fee_outputs.map((row): NegotiationFeeInput => {
    const rawOffer = offers?.[row.fee_family]
    const sponsor_offer =
      rawOffer == null
        ? null
        : typeof rawOffer === "number" && Number.isFinite(rawOffer)
          ? rawOffer
          : null

    const n = notesMap?.[row.fee_family]
    const out: NegotiationFeeInput = {
      ...row,
      label: FEE_FAMILY_LABELS[row.fee_family],
      recommended_price: row.target_price,
      sponsor_offer,
      gross_margin: d.gross_modeled_margin,
      cash_adjusted_margin: d.cash_adjusted_margin,
      risk_score: d.risk_score,
      sae_burden,
      non_visit_breakdown,
    }
    if (n != null && n !== "") out.notes = n
    return out
  })
}

export function mapCostModelToNegotiationInput(
  params: MapCostModelToNegotiationParams,
): NegotiationEngineInput {
  const { costOutput, projectedRevenue, studyId, siteId } = params
  const { deal_output: d } = costOutput

  return {
    schemaVersion: "2.0-cost-model",
    generatedAt: new Date().toISOString(),
    ...(studyId !== undefined ? { studyId } : {}),
    ...(siteId !== undefined ? { siteId } : {}),
    fees: mapFees(costOutput, params),
    policy: {
      study_type_multiplier: costOutput.study_type_multiplier,
      complexity_hours_multiplier: costOutput.complexity_hours_multiplier,
      complexity_risk_multiplier: costOutput.complexity_risk_multiplier,
      non_visit_effort_pct: costOutput.non_visit_effort_pct,
      non_visit_breakdown: costOutput.non_visit_breakdown,
      sae_metrics: costOutput.sae_metrics,
      deal_risk_score: d.risk_score,
      deal_risk_flag: d.risk_flag,
      recommended_payment_terms: d.recommended_payment_terms,
    },
    deal: {
      projected_revenue: projectedRevenue,
      cash_adjusted_margin_at_offer: d.cash_adjusted_margin,
      gross_modeled_margin: d.gross_modeled_margin,
      startup_cash_burden: d.startup_cash_burden,
      holdback_impact_amount: d.holdback_impact_amount,
      holdback_impact_pct: d.holdback_impact_pct,
      cost_of_delay_30: d.cost_of_delay_30,
      cost_of_delay_60: d.cost_of_delay_60,
      cost_of_delay_90: d.cost_of_delay_90,
    },
  }
}
