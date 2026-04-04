/**
 * Module 2 — single entry for per-fee negotiation decisions.
 *
 * Logical pipeline (all enforced inside `buildCounterDecision`, no duplicated rules):
 * 1. Zone — `strategic_tag ?? classifyFee(fee)`
 * 2. Strategy — `deriveStrategy(fee)`
 * 3. Counter — offer vs floor/target → `counter_offer`, `fallback_action`, `rationale`
 */

import { buildCounterDecision } from "./negotiation-counter"
import type { FeeNegotiationStrategy } from "./negotiation-strategy"
import type {
  FeeFamily,
  NegotiationFeeInput,
  NegotiationZone,
} from "./negotiation-types"

export interface FeeNegotiationDecision {
  fee_family: FeeFamily
  label: string
  zone: NegotiationZone
  strategy: FeeNegotiationStrategy
  sponsor_offer: number | null
  floor_price: number
  target_price: number
  counter_offer: number
  fallback_action: string
  rationale: string[]
  notes?: string
}

export function buildFeeNegotiationDecision(
  fee: NegotiationFeeInput,
): FeeNegotiationDecision {
  const d = buildCounterDecision(fee)
  const decision: FeeNegotiationDecision = {
    fee_family: d.fee_family,
    label: fee.label,
    zone: d.zone,
    strategy: d.strategy,
    sponsor_offer: d.sponsor_offer,
    floor_price: d.floor_price,
    target_price: d.target_price,
    counter_offer: d.counter_offer,
    fallback_action: d.fallback_action,
    rationale: d.rationale,
  }
  if (fee.notes !== undefined && fee.notes !== "") {
    decision.notes = fee.notes
  }
  return decision
}

export function buildFeeNegotiationDecisions(
  fees: NegotiationFeeInput[],
): FeeNegotiationDecision[] {
  return fees.map((f) => buildFeeNegotiationDecision(f))
}
