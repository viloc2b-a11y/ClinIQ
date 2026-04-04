/**
 * ClinIQ Module 1 — Site Cost Model v2 (financial decision layer for negotiation inputs).
 */

import {
  COMPLEXITY_CONFIG,
  DEFAULT_ROLE_RATES,
  NON_VISIT_EFFORT_PCT_DEFAULT,
  STUDY_TYPE_MULTIPLIERS,
} from "./cost-model-constants"
import type {
  ComplexityInputs,
  CostModelDealOutput,
  CostModelFeeOutput,
  FeeFamily,
  FeeFamilyBaseInputs,
  NonVisitBreakdown,
  PaymentTermsInputs,
  PaymentTermsRecommendation,
  ProtocolComplexity,
  SAEComplexityLevel,
  SAEBurdenMetrics,
  SiteCostModelOutput,
  StudyType,
} from "./cost-model-types"

const VISIT_BASED_FAMILIES: ReadonlySet<FeeFamily> = new Set([
  "screening_visit",
  "randomization_visit",
  "followup_visit",
  "screen_failure",
])

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

export const DEFAULT_FEE_FAMILY_LIBRARY: FeeFamilyBaseInputs[] = [
  {
    fee_family: "startup",
    crc_hours: 4,
    pi_hours: 2,
    nurse_hours: 0,
    regulatory_hours: 12,
    materials_cost: 1000,
    facility_cost: 0,
  },
  {
    fee_family: "screening_visit",
    crc_hours: 2.5,
    pi_hours: 0.5,
    nurse_hours: 1,
    regulatory_hours: 0.5,
    materials_cost: 50,
    facility_cost: 0,
  },
  {
    fee_family: "randomization_visit",
    crc_hours: 3.5,
    pi_hours: 1,
    nurse_hours: 1.5,
    regulatory_hours: 0.5,
    materials_cost: 100,
    facility_cost: 0,
  },
  {
    fee_family: "followup_visit",
    crc_hours: 1.5,
    pi_hours: 0.25,
    nurse_hours: 0.5,
    regulatory_hours: 0,
    materials_cost: 25,
    facility_cost: 0,
  },
  {
    fee_family: "screen_failure",
    crc_hours: 1.25,
    pi_hours: 0.25,
    nurse_hours: 0.5,
    regulatory_hours: 0,
    materials_cost: 35,
    facility_cost: 0,
  },
  {
    fee_family: "pharmacy",
    crc_hours: 0.5,
    pi_hours: 0,
    nurse_hours: 0,
    regulatory_hours: 0,
    materials_cost: 130,
    facility_cost: 0,
  },
  {
    fee_family: "imaging",
    crc_hours: 1,
    pi_hours: 0.25,
    nurse_hours: 2,
    regulatory_hours: 0,
    materials_cost: 110,
    facility_cost: 4500,
  },
  {
    fee_family: "lab_local",
    crc_hours: 0.25,
    pi_hours: 0,
    nurse_hours: 0.25,
    regulatory_hours: 0,
    materials_cost: 75,
    facility_cost: 0,
  },
  {
    fee_family: "lab_central",
    crc_hours: 0.25,
    pi_hours: 0,
    nurse_hours: 0.25,
    regulatory_hours: 0,
    materials_cost: 75,
    facility_cost: 43,
  },
  {
    fee_family: "shipping",
    crc_hours: 0.25,
    pi_hours: 0,
    nurse_hours: 0,
    regulatory_hours: 0,
    materials_cost: 43,
    facility_cost: 0,
  },
  {
    fee_family: "retention",
    crc_hours: 1,
    pi_hours: 0,
    nurse_hours: 0,
    regulatory_hours: 0,
    materials_cost: 62,
    facility_cost: 50,
  },
  {
    fee_family: "closeout",
    crc_hours: 12,
    pi_hours: 2,
    nurse_hours: 0,
    regulatory_hours: 8,
    materials_cost: 0,
    facility_cost: 0,
  },
]

function durationScore(durationMonths: number): 0 | 1 | 2 {
  if (durationMonths < 6) return 0
  if (durationMonths <= 18) return 1
  return 2
}

function visitCountScore(visitCount: number): 0 | 1 | 2 {
  if (visitCount <= 5) return 0
  if (visitCount <= 15) return 1
  return 2
}

function proceduresScore(proceduresPerVisit: number): 0 | 1 | 2 {
  if (proceduresPerVisit <= 1) return 0
  if (proceduresPerVisit === 2) return 1
  return 2
}

export function classifyProtocolComplexity(
  input: ComplexityInputs,
): ProtocolComplexity {
  const total =
    durationScore(input.duration_months) +
    visitCountScore(input.visit_count) +
    proceduresScore(input.procedures_per_visit) +
    input.endpoints_score +
    input.population_score +
    input.substudies_score

  if (total <= 3) return "low"
  if (total <= 7) return "medium"
  return "high"
}

function laborMaterialsFacility(
  row: FeeFamilyBaseInputs,
  rates: typeof DEFAULT_ROLE_RATES,
  overheadRate: number,
): number {
  const facility = row.facility_cost ?? 0
  const roleHours =
    row.crc_hours + row.pi_hours + row.nurse_hours + row.regulatory_hours
  return (
    row.crc_hours * rates.crc_hourly +
    row.pi_hours * rates.pi_hourly +
    row.nurse_hours * rates.nurse_hourly +
    row.regulatory_hours * rates.regulatory_hourly +
    row.materials_cost +
    facility +
    overheadRate * roleHours
  )
}

function computeFeeOutput(
  row: FeeFamilyBaseInputs,
  studyTypeMultiplier: number,
  complexityHoursMultiplier: number,
  rates: typeof DEFAULT_ROLE_RATES,
): CostModelFeeOutput {
  const baseWithOverhead = laborMaterialsFacility(row, rates, rates.overhead_hourly)
  const real_cost = round2(
    baseWithOverhead * studyTypeMultiplier * complexityHoursMultiplier,
  )
  const target_price = round2(real_cost * 1.45)

  const baseFloor = laborMaterialsFacility(row, rates, rates.min_overhead_hourly)
  const floor_price = round2(baseFloor * studyTypeMultiplier)

  return {
    fee_family: row.fee_family,
    real_cost,
    target_price,
    floor_price,
  }
}

function costOfDelay(
  revenue: number,
  days: number,
  costOfCapitalAnnual: number,
): number {
  return round2(revenue * (days / 365) * costOfCapitalAnnual)
}

function delayCostForNetDays(
  revenue: number,
  netDays: number,
  costOfCapitalAnnual: number,
  d30: number,
  d60: number,
  d90: number,
): number {
  if (netDays === 30) return d30
  if (netDays === 60) return d60
  if (netDays === 90) return d90
  return round2(revenue * (netDays / 365) * costOfCapitalAnnual)
}

function holdbackImpactAmount(
  revenue: number,
  holdbackPct: number,
  costOfCapitalAnnual: number,
  holdbackMonthsRetained: number,
): number {
  return round2(
    revenue *
      holdbackPct *
      (1 + (costOfCapitalAnnual * holdbackMonthsRetained) / 12),
  )
}

function riskScore(payment: PaymentTermsInputs): number {
  return (
    payment.net_days / 30 +
    payment.holdback_pct * 10 +
    (12000 - payment.startup_payment_amount) / 2000
  )
}

function riskFlag(score: number): "green" | "yellow" | "red" {
  if (score <= 2.0) return "green"
  if (score <= 2.5) return "yellow"
  return "red"
}

function recommendedPaymentTermsFromRisk(
  score: number,
): PaymentTermsRecommendation {
  if (score <= 2.0) {
    return {
      max_net_terms_days: 30,
      max_holdback_pct: 0.05,
      recommended_startup_payment: "1.0-1.5 patient advance",
    }
  }
  if (score <= 2.5) {
    return {
      max_net_terms_days: 45,
      max_holdback_pct: 0.07,
      recommended_startup_payment: "$10k+ startup",
    }
  }
  return {
    max_net_terms_days: 45,
    max_holdback_pct: 0.05,
    recommended_startup_payment: "$12.5k startup or 1.5 patient advance",
  }
}

function sumVisitRoleHours(families: FeeFamilyBaseInputs[]): number {
  let sum = 0
  for (const row of families) {
    if (!VISIT_BASED_FAMILIES.has(row.fee_family)) continue
    sum +=
      row.crc_hours +
      row.pi_hours +
      row.nurse_hours +
      row.regulatory_hours
  }
  return sum
}

/**
 * visit_hours * NON_VISIT_EFFORT_PCT_DEFAULT — retained for future deal-level use (not applied to fee lines in v1).
 */
export function computeNonVisitHoursFromLibrary(
  families: FeeFamilyBaseInputs[],
): number {
  return sumVisitRoleHours(families) * NON_VISIT_EFFORT_PCT_DEFAULT
}

export function getSAEFrequency(level: SAEComplexityLevel): number {
  if (level === "low") return 0.2
  if (level === "medium") return 0.5
  return 1.0
}

export function getSAEComplexityMultiplier(studyType: StudyType): number {
  switch (studyType) {
    case "gi":
      return 1.5
    case "oncology":
    case "cns_neurology":
      return 2.0
    default:
      return 1.0
  }
}

export function computeNonVisitBreakdown(params: {
  visit_hours: number
  saeLevel: SAEComplexityLevel
  studyType: StudyType
  substudyCount?: number
}): NonVisitBreakdown {
  const { visit_hours, saeLevel, studyType } = params
  const substudyCount = params.substudyCount ?? 0

  const total_non_visit_hours = round2(visit_hours * 0.6)

  let sae_pct = 0.3
  if (studyType === "oncology" || studyType === "cns_neurology") {
    sae_pct += 0.1
  }
  sae_pct += 0.05 * substudyCount
  sae_pct = Math.min(sae_pct, 0.45)
  const query_pct = 1 - sae_pct

  const effective_sae_factor =
    getSAEFrequency(saeLevel) * getSAEComplexityMultiplier(studyType)

  const sae_hours = round2(
    total_non_visit_hours * sae_pct * effective_sae_factor,
  )
  const query_hours = round2(total_non_visit_hours * query_pct)

  return {
    total_non_visit_hours,
    sae_hours,
    query_hours,
    sae_pct: round2(sae_pct),
    query_pct: round2(query_pct),
  }
}

export function computeSAEBurdenMetrics(params: {
  sae_hours: number
  query_hours: number
  avg_report_time_hours: number
  sae_cost_per_patient: number
  sae_rate_per_100_pm: number
}): SAEBurdenMetrics {
  const {
    sae_hours,
    query_hours,
    avg_report_time_hours,
    sae_cost_per_patient,
    sae_rate_per_100_pm,
  } = params

  const sae_burden_score = round2(
    sae_hours * 0.4 +
      sae_rate_per_100_pm * 0.3 +
      avg_report_time_hours * 0.2 +
      (sae_cost_per_patient * 0.1) / 100,
  )

  const query_to_sae_ratio =
    sae_hours > 0 ? round2(query_hours / sae_hours) : 0

  let burden_level: SAEBurdenMetrics["burden_level"]
  if (sae_burden_score < 2.5) burden_level = "low"
  else if (sae_burden_score <= 4.0) burden_level = "medium"
  else burden_level = "high"

  return {
    sae_hours_per_patient: round2(sae_hours),
    query_hours_per_patient: round2(query_hours),
    query_to_sae_ratio,
    sae_burden_score,
    burden_level,
  }
}

export function buildSiteCostModelOutput(params: {
  studyType: StudyType
  complexityInput: ComplexityInputs
  paymentTermsInput: PaymentTermsInputs
  feeFamilies?: FeeFamilyBaseInputs[]
  projectedRevenue: number
  /** Default `"medium"` when omitted (v1). */
  saeLevel?: SAEComplexityLevel
}): SiteCostModelOutput {
  const {
    studyType,
    complexityInput,
    paymentTermsInput,
    projectedRevenue: revenue,
  } = params

  const feeRows = params.feeFamilies ?? DEFAULT_FEE_FAMILY_LIBRARY
  const study_type_multiplier = STUDY_TYPE_MULTIPLIERS[studyType]
  const complexity = classifyProtocolComplexity(complexityInput)
  const complexity_hours_multiplier =
    COMPLEXITY_CONFIG[complexity].hours_multiplier
  const complexity_risk_multiplier =
    COMPLEXITY_CONFIG[complexity].risk_multiplier

  const rates = DEFAULT_ROLE_RATES

  const fee_outputs = feeRows.map((row) =>
    computeFeeOutput(
      row,
      study_type_multiplier,
      complexity_hours_multiplier,
      rates,
    ),
  )

  const total_real_cost = round2(
    fee_outputs.reduce((s, f) => s + f.real_cost, 0),
  )

  const startup_cash_burden = round2(
    4000 + 3000 + 2500 + 1500 - paymentTermsInput.startup_payment_amount,
  )

  const coc = paymentTermsInput.cost_of_capital_annual
  const cost_of_delay_30 = costOfDelay(revenue, 30, coc)
  const cost_of_delay_60 = costOfDelay(revenue, 60, coc)
  const cost_of_delay_90 = costOfDelay(revenue, 90, coc)

  const holdback_impact_amount = holdbackImpactAmount(
    revenue,
    paymentTermsInput.holdback_pct,
    coc,
    paymentTermsInput.holdback_months_retained,
  )

  const holdback_impact_pct =
    revenue > 0 ? round4(holdback_impact_amount / revenue) : 0

  const delayForTerms = delayCostForNetDays(
    revenue,
    paymentTermsInput.net_days,
    coc,
    cost_of_delay_30,
    cost_of_delay_60,
    cost_of_delay_90,
  )

  const gross_modeled_margin =
    revenue > 0
      ? round4((revenue - total_real_cost) / revenue)
      : 0

  const cash_adjusted_margin =
    revenue > 0
      ? round4(
          (revenue -
            total_real_cost -
            delayForTerms -
            holdback_impact_amount) /
            revenue,
        )
      : 0

  const rawRiskScore = riskScore(paymentTermsInput)
  const risk_score = round4(rawRiskScore)
  const risk_flag = riskFlag(rawRiskScore)
  const recommended_payment_terms =
    recommendedPaymentTermsFromRisk(rawRiskScore)

  const deal_output: CostModelDealOutput = {
    startup_cash_burden,
    cost_of_delay_30,
    cost_of_delay_60,
    cost_of_delay_90,
    holdback_impact_amount,
    holdback_impact_pct,
    gross_modeled_margin,
    cash_adjusted_margin,
    risk_score,
    risk_flag,
    recommended_payment_terms,
  }

  const visit_hours = sumVisitRoleHours(feeRows)
  const non_visit_breakdown = computeNonVisitBreakdown({
    visit_hours,
    saeLevel: params.saeLevel ?? "medium",
    studyType,
    substudyCount: complexityInput.substudies_score,
  })

  const sae_cost_per_patient = round2(
    non_visit_breakdown.sae_hours * rates.crc_hourly,
  )

  const sae_metrics = computeSAEBurdenMetrics({
    sae_hours: non_visit_breakdown.sae_hours,
    query_hours: non_visit_breakdown.query_hours,
    avg_report_time_hours: 24,
    sae_cost_per_patient,
    sae_rate_per_100_pm: 4,
  })

  return {
    fee_outputs,
    deal_output,
    study_type_multiplier,
    complexity_hours_multiplier,
    complexity_risk_multiplier,
    non_visit_effort_pct: NON_VISIT_EFFORT_PCT_DEFAULT,
    non_visit_breakdown,
    sae_metrics,
  }
}
