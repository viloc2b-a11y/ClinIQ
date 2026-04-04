/**
 * Module 2 — counter offer, fallback action, and rationale per fee.
 */

import { classifyFee } from "./negotiation-classifier"
import { deriveStrategy, type FeeNegotiationStrategy } from "./negotiation-strategy"
import type {
  FeeFamily,
  NegotiationFeeInput,
  NegotiationZone,
} from "./negotiation-types"

export interface NegotiationCounterDecision {
  fee_family: FeeFamily
  strategy: FeeNegotiationStrategy
  zone: NegotiationZone
  sponsor_offer: number | null
  floor_price: number
  target_price: number
  counter_offer: number
  fallback_action: string
  rationale: string[]
}

function zoneFor(fee: NegotiationFeeInput): NegotiationZone {
  return fee.strategic_tag ?? classifyFee(fee)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildRationale(fee: NegotiationFeeInput, decision: Omit<NegotiationCounterDecision, "rationale">): string[] {
  const out: string[] = []
  const cam = fee.cash_adjusted_margin
  const offer = fee.sponsor_offer

  out.push(`Zone ${decision.zone}.`)
  out.push(`Strategy ${decision.strategy}.`)

  if (offer == null) {
    out.push("Sponsor offer unknown; counter set to target_price.")
  } else if (offer < fee.floor_price) {
    out.push("Offer below floor; counter raised to target_price.")
  } else if (offer < fee.target_price) {
    out.push("Offer between floor and target; counter holds target_price.")
  } else {
    out.push("Offer at or above target; accept offer as baseline for tradeoff or terms.")
  }

  if (cam <= 0) {
    out.push("Cash-adjusted margin not positive.")
  } else if (cam < 0.25) {
    out.push("Cash-adjusted margin under 25%.")
  } else {
    out.push("Cash-adjusted margin at or above 25%.")
  }

  return out
}

function counterAndFallback(fee: NegotiationFeeInput): {
  counter_offer: number
  fallback_action: string
} {
  const offer = fee.sponsor_offer
  const target = fee.target_price

  if (offer == null) {
    return {
      counter_offer: round2(target),
      fallback_action: "anchor_target_unknown_offer",
    }
  }

  if (offer < fee.floor_price) {
    return {
      counter_offer: round2(target),
      fallback_action: "do_not_accept_below_floor",
    }
  }

  if (offer >= fee.floor_price && offer < fee.target_price) {
    return {
      counter_offer: round2(target),
      fallback_action: "hold_line_or_trade_elsewhere",
    }
  }

  return {
    counter_offer: round2(offer),
    fallback_action: "use_as_tradeoff_or_push_terms",
  }
}

export function buildCounterDecision(fee: NegotiationFeeInput): NegotiationCounterDecision {
  const zone = zoneFor(fee)
  const strategy = deriveStrategy(fee)
  const { counter_offer, fallback_action } = counterAndFallback(fee)

  const decision: NegotiationCounterDecision = {
    fee_family: fee.fee_family,
    strategy,
    zone,
    sponsor_offer: fee.sponsor_offer,
    floor_price: fee.floor_price,
    target_price: fee.target_price,
    counter_offer,
    fallback_action,
    rationale: [],
  }

  decision.rationale = buildRationale(fee, decision)
  return decision
}

export function buildCounterDecisions(
  fees: NegotiationFeeInput[],
): NegotiationCounterDecision[] {
  return fees.map((f) => buildCounterDecision(f))
}
