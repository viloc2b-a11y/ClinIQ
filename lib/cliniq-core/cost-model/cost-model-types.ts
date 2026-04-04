export type StudyType =
  | "metabolic_obesity"
  | "gi"
  | "vaccines"
  | "cns_neurology"
  | "oncology"
  | "generic"

export type ProtocolComplexity = "low" | "medium" | "high"

export type FeeFamily =
  | "startup"
  | "screening_visit"
  | "randomization_visit"
  | "followup_visit"
  | "screen_failure"
  | "pharmacy"
  | "imaging"
  | "lab_local"
  | "lab_central"
  | "shipping"
  | "retention"
  | "closeout"

export type RoleRates = {
  crc_hourly: number
  pi_hourly: number
  nurse_hourly: number
  regulatory_hourly: number
  overhead_hourly: number
  min_overhead_hourly: number
}

export type FeeFamilyBaseInputs = {
  fee_family: FeeFamily
  crc_hours: number
  pi_hours: number
  nurse_hours: number
  regulatory_hours: number
  materials_cost: number
  facility_cost?: number
}

export type ComplexityInputs = {
  duration_months: number
  visit_count: number
  procedures_per_visit: number
  endpoints_score: 0 | 1 | 2
  population_score: 0 | 1 | 2
  substudies_score: 0 | 1 | 2
}

export type PaymentTermsInputs = {
  net_days: number
  holdback_pct: number
  startup_payment_amount: number
  holdback_months_retained: number
  cost_of_capital_annual: number
}

export type CostModelFeeOutput = {
  fee_family: FeeFamily
  real_cost: number
  target_price: number
  floor_price: number
}

export type PaymentTermsRecommendation = {
  max_net_terms_days: number
  max_holdback_pct: number
  recommended_startup_payment: string
}

export type CostModelDealOutput = {
  startup_cash_burden: number
  cost_of_delay_30: number
  cost_of_delay_60: number
  cost_of_delay_90: number
  holdback_impact_amount: number
  holdback_impact_pct: number
  gross_modeled_margin: number
  cash_adjusted_margin: number
  risk_score: number
  risk_flag: "green" | "yellow" | "red"
  recommended_payment_terms: PaymentTermsRecommendation
}

export type SAEComplexityLevel = "low" | "medium" | "high"

export type NonVisitBreakdown = {
  total_non_visit_hours: number
  sae_hours: number
  query_hours: number
  sae_pct: number
  query_pct: number
}

export type SAEBurdenMetrics = {
  sae_hours_per_patient: number
  query_hours_per_patient: number
  query_to_sae_ratio: number
  sae_burden_score: number
  burden_level: "low" | "medium" | "high"
}

export type SiteCostModelOutput = {
  fee_outputs: CostModelFeeOutput[]
  deal_output: CostModelDealOutput
  study_type_multiplier: number
  complexity_hours_multiplier: number
  complexity_risk_multiplier: number
  non_visit_effort_pct: number
  non_visit_breakdown: NonVisitBreakdown
  sae_metrics: SAEBurdenMetrics
}
