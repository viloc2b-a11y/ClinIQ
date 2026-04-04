/**
 * Module 2 — per-fee negotiation posture (strong / balanced / cross_line).
 */

import { classifyFee } from "./negotiation-classifier"
import type { NegotiationFeeInput, NegotiationZone } from "./negotiation-types"

export type FeeNegotiationStrategy = "strong" | "balanced" | "cross_line"

function zoneFor(fee: NegotiationFeeInput): NegotiationZone {
  return fee.strategic_tag ?? classifyFee(fee)
}

/**
 * Per-fee strategy (not global). Evaluates cross_line first, then strong, then balanced; otherwise balanced.
 */
export function deriveStrategy(fee: NegotiationFeeInput): FeeNegotiationStrategy {
  const zone = zoneFor(fee)
  const offer = fee.sponsor_offer
  const { floor_price: floor, target_price: target, cash_adjusted_margin: cam } =
    fee

  if (
    zone === "must_win" ||
    (offer != null && offer < floor) ||
    cam <= 0
  ) {
    return "cross_line"
  }

  if (
    zone === "tradeoff" &&
    offer != null &&
    offer >= target &&
    cam >= 0.25
  ) {
    return "strong"
  }

  if (
    zone === "defendable" ||
    (offer != null && offer >= floor && offer < target) ||
    (cam > 0 && cam < 0.25)
  ) {
    return "balanced"
  }

  return "balanced"
}
