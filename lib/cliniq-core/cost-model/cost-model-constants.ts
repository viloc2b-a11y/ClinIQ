import type { RoleRates, StudyType } from "./cost-model-types"

export const DEFAULT_ROLE_RATES: RoleRates = {
  crc_hourly: 45,
  pi_hourly: 125,
  nurse_hourly: 35,
  regulatory_hourly: 30,
  overhead_hourly: 30,
  min_overhead_hourly: 25,
}

export const STUDY_TYPE_MULTIPLIERS: Record<StudyType, number> = {
  metabolic_obesity: 1.1,
  gi: 1.3,
  vaccines: 0.8,
  cns_neurology: 1.6,
  oncology: 2.0,
  generic: 1.0,
}

export const COMPLEXITY_CONFIG = {
  low: { hours_multiplier: 1.0, risk_multiplier: 1.0 },
  medium: { hours_multiplier: 1.4, risk_multiplier: 1.3 },
  high: { hours_multiplier: 2.2, risk_multiplier: 1.8 },
} as const

export const NON_VISIT_EFFORT_PCT_DEFAULT = 0.6

export const NON_VISIT_TOTAL_RANGE = { low: 0.35, high: 0.5 } as const
