/**
 * Smoke tests for Module 2 per-fee pipeline (classify → strategy → counter → assembly).
 */

import { describe, expect, it } from "vitest"

import { buildFeeNegotiationDecision, buildFeeNegotiationDecisions } from "../build-fee-negotiation-decisions"
import { classifyFee } from "../negotiation-classifier"
import { buildCounterDecision } from "../negotiation-counter"
import { deriveStrategy } from "../negotiation-strategy"
import type { NegotiationFeeInput } from "../negotiation-types"

const defaultNonVisit = {
  total_non_visit_hours: 12,
  sae_hours: 2,
  query_hours: 4,
  sae_pct: 0.33,
  query_pct: 0.67,
} as const

/** Realistic defaults; override only what each scenario needs. */
function mockFee(
  overrides: Partial<NegotiationFeeInput> &
    Pick<
      NegotiationFeeInput,
      "fee_family" | "real_cost" | "floor_price" | "target_price" | "sponsor_offer"
    >,
): NegotiationFeeInput {
  const { floor_price: floor, target_price: target } = overrides
  return {
    fee_family: overrides.fee_family,
    real_cost: overrides.real_cost,
    floor_price: floor,
    target_price: target,
    label: overrides.label ?? "Screening visit",
    recommended_price: overrides.recommended_price ?? target,
    sponsor_offer: overrides.sponsor_offer,
    gross_margin: overrides.gross_margin ?? 0.35,
    cash_adjusted_margin: overrides.cash_adjusted_margin ?? 0.28,
    risk_score: overrides.risk_score ?? 2.2,
    sae_burden: overrides.sae_burden ?? 2,
    non_visit_breakdown: overrides.non_visit_breakdown ?? { ...defaultNonVisit },
    notes: overrides.notes,
    strategic_tag: overrides.strategic_tag,
  }
}

describe("Module 2 fee negotiation smoke", () => {
  it("1) offer below floor → must_win, cross_line, counter = target_price", () => {
    const fee = mockFee({
      fee_family: "screening_visit",
      real_cost: 900,
      floor_price: 1000,
      target_price: 1500,
      sponsor_offer: 500,
      cash_adjusted_margin: 0.22,
      sae_burden: 2,
    })

    expect(classifyFee(fee)).toBe("must_win")
    expect(deriveStrategy(fee)).toBe("cross_line")

    const counter = buildCounterDecision(fee)
    expect(counter.zone).toBe("must_win")
    expect(counter.strategy).toBe("cross_line")
    expect(counter.counter_offer).toBe(1500)
    expect(counter.target_price).toBe(1500)

    const assembled = buildFeeNegotiationDecision(fee)
    expect(assembled.counter_offer).toBe(1500)
    expect(assembled.zone).toBe("must_win")
    expect(assembled.strategy).toBe("cross_line")
  })

  it("2) offer between floor and target → defendable, balanced, counter = target_price", () => {
    const fee = mockFee({
      fee_family: "followup_visit",
      real_cost: 700,
      floor_price: 1000,
      target_price: 1500,
      sponsor_offer: 1200,
      cash_adjusted_margin: 0.2,
      sae_burden: 2,
    })

    expect(classifyFee(fee)).toBe("defendable")
    expect(deriveStrategy(fee)).toBe("balanced")

    const counter = buildCounterDecision(fee)
    expect(counter.zone).toBe("defendable")
    expect(counter.strategy).toBe("balanced")
    expect(counter.counter_offer).toBe(1500)
  })

  it("3) offer above target + healthy cash-adjusted margin → tradeoff, strong, counter = sponsor_offer", () => {
    const fee = mockFee({
      fee_family: "randomization_visit",
      real_cost: 800,
      floor_price: 1000,
      target_price: 1500,
      sponsor_offer: 1600,
      cash_adjusted_margin: 0.3,
      sae_burden: 2,
      risk_score: 2,
    })

    expect(classifyFee(fee)).toBe("tradeoff")
    expect(deriveStrategy(fee)).toBe("strong")

    const counter = buildCounterDecision(fee)
    expect(counter.zone).toBe("tradeoff")
    expect(counter.strategy).toBe("strong")
    expect(counter.counter_offer).toBe(1600)
  })

  it("4) sponsor offer unknown (null) → counter = target_price, anchor_target_unknown_offer", () => {
    const fee = mockFee({
      fee_family: "startup",
      real_cost: 5000,
      floor_price: 8000,
      target_price: 12000,
      sponsor_offer: null,
      cash_adjusted_margin: 0.25,
      sae_burden: 2,
    })

    const counter = buildCounterDecision(fee)
    expect(counter.counter_offer).toBe(12000)
    expect(counter.fallback_action).toBe("anchor_target_unknown_offer")

    const assembled = buildFeeNegotiationDecision(fee)
    expect(assembled.counter_offer).toBe(12000)
    expect(assembled.fallback_action).toBe("anchor_target_unknown_offer")
  })

  it("5) high SAE burden and offer below target → zone must_win", () => {
    const fee = mockFee({
      fee_family: "screening_visit",
      real_cost: 600,
      floor_price: 800,
      target_price: 1500,
      sponsor_offer: 1000,
      cash_adjusted_margin: 0.2,
      sae_burden: 4.5,
    })

    expect(classifyFee(fee)).toBe("must_win")
    expect(buildCounterDecision(fee).zone).toBe("must_win")
    expect(buildFeeNegotiationDecision(fee).zone).toBe("must_win")
  })

  it("buildFeeNegotiationDecisions maps full array", () => {
    const fees = [
      mockFee({
        fee_family: "screening_visit",
        real_cost: 500,
        floor_price: 1000,
        target_price: 1400,
        sponsor_offer: 400,
      }),
      mockFee({
        fee_family: "startup",
        real_cost: 4000,
        floor_price: 7000,
        target_price: 10000,
        sponsor_offer: null,
      }),
    ]
    const rows = buildFeeNegotiationDecisions(fees)
    expect(rows).toHaveLength(2)
    expect(rows[0].fee_family).toBe("screening_visit")
    expect(rows[1].fallback_action).toBe("anchor_target_unknown_offer")
  })
})
