import type { EscalatedNegotiationTarget } from "./pricing-escalation"

export type NegotiationScenario =
  | "full_accept"
  | "partial_70"
  | "partial_50"
  | "reject"

export type NegotiationScenarioResult = {
  scenario: NegotiationScenario
  recoveryFactor: number
  requestedIncreaseTotal: number
  recoveredRevenue: number
  remainingUnrecovered: number
}

const SCENARIO_FACTORS: Record<NegotiationScenario, number> = {
  full_accept: 1,
  partial_70: 0.7,
  partial_50: 0.5,
  reject: 0,
}

const SCENARIO_ORDER: NegotiationScenario[] = [
  "full_accept",
  "partial_70",
  "partial_50",
  "reject",
]

export function simulateNegotiationScenario(
  targets: EscalatedNegotiationTarget[],
  scenario: NegotiationScenario,
): NegotiationScenarioResult {
  const recoveryFactor = SCENARIO_FACTORS[scenario]
  const requestedIncreaseTotal = Math.round(
    targets.reduce((s, t) => s + t.increaseAmount, 0),
  )
  const recoveredRevenue = Math.round(
    requestedIncreaseTotal * recoveryFactor,
  )
  const remainingUnrecovered = Math.round(
    requestedIncreaseTotal - recoveredRevenue,
  )
  return {
    scenario,
    recoveryFactor,
    requestedIncreaseTotal,
    recoveredRevenue,
    remainingUnrecovered,
  }
}

export function buildScenarioSet(
  targets: EscalatedNegotiationTarget[],
): NegotiationScenarioResult[] {
  return SCENARIO_ORDER.map((scenario) =>
    simulateNegotiationScenario(targets, scenario),
  )
}
