/**
 * Module 4 — Negotiation package assembly (pre-award only).
 *
 * Does not use event_log, agents, or DB writes. Consumes only Module 3 gap
 * outputs (via NegotiationEngineInput). See NEGOTIATION_ENGINE.md.
 */
import type { BudgetDecision } from "./budget-decision"
import { buildNegotiationStrategy, type NegotiationStrategyBucket } from "./negotiation-strategy"
import {
  buildScenarioSet,
  type NegotiationScenarioResult,
} from "./negotiation-scenarios"
import type { NegotiationEngineInput } from "./negotiation-input"
import {
  applyEscalationToTargets,
  type EscalatedNegotiationTarget,
} from "./pricing-escalation"

const GENERIC_SPONSOR_JUSTIFICATION =
  "Adjustment needed to align workload, documentation, and compliance requirements."

export type NegotiationPackage = {
  sponsorView: Array<{
    label: string
    category: string
    requestedTotal: number
    requestedIncrease: number
    justification: string
  }>
  internalView: {
    decision: BudgetDecision
    targets: EscalatedNegotiationTarget[]
    strategy: NegotiationStrategyBucket
    scenarios: NegotiationScenarioResult[]
    justificationPoints: string[]
  }
}

export function buildNegotiationPackage(
  payload: NegotiationEngineInput,
): NegotiationPackage {
  const strategy = buildNegotiationStrategy(payload.topNegotiationTargets)
  const targets = applyEscalationToTargets(payload.topNegotiationTargets)
  const scenarios = buildScenarioSet(targets)

  const sponsorView = targets.map((t) => ({
    label: t.label,
    category: t.category,
    requestedTotal: t.recommendedTotal,
    requestedIncrease: t.increaseAmount,
    justification:
      t.notes && t.notes.trim().length > 0
        ? t.notes.trim()
        : GENERIC_SPONSOR_JUSTIFICATION,
  }))

  return {
    sponsorView,
    internalView: {
      decision: payload.decision,
      targets,
      strategy,
      scenarios,
      justificationPoints: [...payload.justificationPoints],
    },
  }
}
