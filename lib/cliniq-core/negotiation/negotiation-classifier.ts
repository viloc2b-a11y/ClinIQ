/**
 * Module 1 — global gap/strategy helpers for `runFullNegotiation`.
 * Module 2 — per-fee zone classification for `NegotiationFeeInput`.
 */

import { isMustWinFee } from "./fee-negotiation-profiles"
import type { NegotiationFeeInput, NegotiationZone } from "./negotiation-types"

export type { NegotiationZone }

/** Aligns with site cost model: `burden_level === "high"` when score > 4. */
const SAE_BURDEN_HIGH_THRESHOLD = 4
const CASH_ADJUSTED_MARGIN_DEFENDABLE_BELOW = 0.12
const RISK_SCORE_DEFENDABLE_AT_LEAST = 70

/**
 * Deterministic Module 2 zone: must_win → defendable → tradeoff.
 */
export function classifyFee(fee: NegotiationFeeInput): NegotiationZone {
  const offer = fee.sponsor_offer
  const belowFloor = offer != null && offer < fee.floor_price
  const belowTarget = offer != null && offer < fee.target_price

  if (
    belowFloor ||
    fee.cash_adjusted_margin <= 0 ||
    (fee.sae_burden > SAE_BURDEN_HIGH_THRESHOLD && belowTarget)
  ) {
    return "must_win"
  }

  if (
    belowTarget ||
    fee.cash_adjusted_margin < CASH_ADJUSTED_MARGIN_DEFENDABLE_BELOW ||
    fee.risk_score >= RISK_SCORE_DEFENDABLE_AT_LEAST
  ) {
    return "defendable"
  }

  return "tradeoff"
}

/** Copies each fee and sets `strategic_tag` from `classifyFee`. */
export function classifyAllFees(fees: NegotiationFeeInput[]): NegotiationFeeInput[] {
  return fees.map((fee) => ({
    ...fee,
    strategic_tag: classifyFee(fee),
  }))
}

// --- Module 1 (fee-code / sponsor line) global classification ---

export type GlobalNegotiationStrategy = "strong" | "cross_line" | "balanced"

/** Sum of (target_price − offered_amount) per matched fee line (can be negative if offer exceeds target). */
export function computeTotalGapFromOffers(
  fees: ReadonlyArray<{ fee_code: string; offered_amount: number }>,
  targets: Map<string, { target_price: number }>,
): number {
  let total = 0
  for (const fee of fees) {
    const t = targets.get(fee.fee_code)
    if (!t) continue
    total += t.target_price - fee.offered_amount
  }
  return total
}

/**
 * Shortfall on must-win fee codes where sponsor offer is below 90% of target.
 */
export function computeMustWinDeficitFromOffers(
  fees: ReadonlyArray<{ fee_code: string; offered_amount: number }>,
  targets: Map<string, { target_price: number }>,
  isMustWin: (feeCode: string) => boolean = isMustWinFee,
): number {
  let deficit = 0
  for (const fee of fees) {
    const t = targets.get(fee.fee_code)
    if (!t || !isMustWin(fee.fee_code)) continue
    if (fee.offered_amount < t.target_price * 0.9) {
      deficit += t.target_price - fee.offered_amount
    }
  }
  return deficit
}

export type GlobalNegotiationClassification = {
  strategy: GlobalNegotiationStrategy
  strongMode: boolean
  crossLineStrategyUsed: boolean
  /** Extra tradeoff discount only in cross-line mode (not from strong mode alone). */
  extraConcessionOnTradeoff: boolean
}

/**
 * Derive global negotiation posture from gap and must-win deficit (deterministic v1 rules).
 */
export function classifyGlobalNegotiation(params: {
  totalGapFromSponsorOffer: number
  mustWinDeficit: number
}): GlobalNegotiationClassification {
  const { totalGapFromSponsorOffer: totalGap, mustWinDeficit } = params
  const strongMode = totalGap > 10_000
  const crossLineStrategyUsed = mustWinDeficit > 2_500 || strongMode
  const strategy: GlobalNegotiationStrategy = strongMode
    ? "strong"
    : crossLineStrategyUsed
      ? "cross_line"
      : "balanced"
  const extraConcessionOnTradeoff = mustWinDeficit > 2_500 && !strongMode

  return {
    strategy,
    strongMode,
    crossLineStrategyUsed,
    extraConcessionOnTradeoff,
  }
}
