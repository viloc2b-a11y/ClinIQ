/**
 * Shared literals for the fee template engine (DB + TS). Extend as new starter rows are added.
 */

export const FEE_ENGINE_BEHAVIORS = [
  "operational_billable",
  "negotiation_only",
  "pricing_rule",
] as const

export type FeeEngineBehavior = (typeof FEE_ENGINE_BEHAVIORS)[number]

export const DEFAULT_RATE_STRATEGIES = [
  "range_based",
  "per_event_estimated",
  "cost_plus_markup",
  "percent_of_total",
  "annual_uplift",
] as const

export type DefaultRateStrategy = (typeof DEFAULT_RATE_STRATEGIES)[number]

/** trigger_type values used across core v1 + extended starter (non-exhaustive for future rows). */
export const KNOWN_TRIGGER_TYPES = [
  "contract",
  "visit",
  "screen_failure",
  "amendment",
  "regulatory",
  "setup",
  "training",
  "unscheduled_visit",
  "safety",
  "shipment",
  "pharmacy",
  "monthly_management",
  "monitoring",
  "query_resolution",
  "closeout",
  "budget_rule",
  "annual_review",
  "recruitment_campaign",
  "lab_processing",
  "patient_visit_completed",
  "central_submission",
  "device_issued",
  "annual_adjustment",
] as const

export type KnownTriggerType = (typeof KNOWN_TRIGGER_TYPES)[number]

export const KNOWN_TRIGGER_SOURCES = [
  "CTA",
  "visit_log",
  "screening_status",
  "amendment_log",
  "irb_log",
  "pharmacy_log",
  "siv_log",
  "regulatory_log",
  "sae_log",
  "shipment_log",
  "patient_mgmt_log",
  "monitoring_log",
  "edc_query_log",
  "closeout_log",
  "budget_engine",
  "tech_access_log",
  "recruitment_log",
  "lab_log",
  "imaging_log",
  "device_log",
] as const

export type KnownTriggerSource = (typeof KNOWN_TRIGGER_SOURCES)[number]
