/**
 * Module 2 — operational integration: cost model + sponsor offers → engine input + per-fee decisions + rollups.
 */

import {
  buildFeeNegotiationDecisions,
  type FeeNegotiationDecision,
} from "./build-fee-negotiation-decisions"
import {
  mapCostModelToNegotiationInput,
  type MapCostModelToNegotiationParams,
} from "./negotiation-mapper"
import type { NegotiationEngineInput } from "./negotiation-types"

export interface Module2NegotiationReviewSummary {
  totalFees: number
  mustWinCount: number
  defendableCount: number
  tradeoffCount: number
  strongCount: number
  balancedCount: number
  crossLineCount: number
  unknownOfferCount: number
  knownOfferGapToTargetTotal: number
  knownOfferGapToFloorTotal: number
  headlines: string[]
}

export interface Module2NegotiationReview {
  engineInput: NegotiationEngineInput
  feeDecisions: FeeNegotiationDecision[]
  summary: Module2NegotiationReviewSummary
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildSummary(feeDecisions: FeeNegotiationDecision[]): Module2NegotiationReviewSummary {
  let mustWinCount = 0
  let defendableCount = 0
  let tradeoffCount = 0
  let strongCount = 0
  let balancedCount = 0
  let crossLineCount = 0
  let unknownOfferCount = 0
  let knownOfferGapToTargetTotal = 0
  let knownOfferGapToFloorTotal = 0

  for (const d of feeDecisions) {
    if (d.sponsor_offer === null) {
      unknownOfferCount += 1
    } else {
      const offer = d.sponsor_offer
      if (offer < d.target_price) {
        knownOfferGapToTargetTotal += d.target_price - offer
      }
      if (offer < d.floor_price) {
        knownOfferGapToFloorTotal += d.floor_price - offer
      }
    }

    switch (d.zone) {
      case "must_win":
        mustWinCount += 1
        break
      case "defendable":
        defendableCount += 1
        break
      case "tradeoff":
        tradeoffCount += 1
        break
    }

    switch (d.strategy) {
      case "strong":
        strongCount += 1
        break
      case "balanced":
        balancedCount += 1
        break
      case "cross_line":
        crossLineCount += 1
        break
    }
  }

  knownOfferGapToTargetTotal = round2(knownOfferGapToTargetTotal)
  knownOfferGapToFloorTotal = round2(knownOfferGapToFloorTotal)

  const headlines: string[] = []
  if (unknownOfferCount > 0) {
    headlines.push(`${unknownOfferCount} fee line(s) with unknown sponsor offer.`)
  }
  if (mustWinCount > 0) {
    headlines.push(`${mustWinCount} fee line(s) in must_win zone.`)
  }
  if (defendableCount > 0) {
    headlines.push(`${defendableCount} fee line(s) in defendable zone.`)
  }
  if (tradeoffCount > 0) {
    headlines.push(`${tradeoffCount} fee line(s) in tradeoff zone.`)
  }
  if (strongCount > 0) {
    headlines.push(`${strongCount} fee line(s) with strong strategy.`)
  }
  if (balancedCount > 0) {
    headlines.push(`${balancedCount} fee line(s) with balanced strategy.`)
  }
  if (crossLineCount > 0) {
    headlines.push(`${crossLineCount} fee line(s) with cross_line strategy.`)
  }
  if (knownOfferGapToTargetTotal > 0) {
    headlines.push(
      `Known offers aggregate ${knownOfferGapToTargetTotal} below target (sum of target minus offer where offer < target).`,
    )
  }
  if (knownOfferGapToFloorTotal > 0) {
    headlines.push(
      `Known offers aggregate ${knownOfferGapToFloorTotal} below floor (sum of floor minus offer where offer < floor).`,
    )
  }

  return {
    totalFees: feeDecisions.length,
    mustWinCount,
    defendableCount,
    tradeoffCount,
    strongCount,
    balancedCount,
    crossLineCount,
    unknownOfferCount,
    knownOfferGapToTargetTotal,
    knownOfferGapToFloorTotal,
    headlines,
  }
}

export function buildModule2NegotiationReview(
  params: MapCostModelToNegotiationParams,
): Module2NegotiationReview {
  const engineInput = mapCostModelToNegotiationInput(params)
  const feeDecisions = buildFeeNegotiationDecisions(engineInput.fees)
  const summary = buildSummary(feeDecisions)

  return {
    engineInput,
    feeDecisions,
    summary,
  }
}
