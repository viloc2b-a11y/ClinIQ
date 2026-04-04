/**
 * ClinIQ Negotiation Engine v1 — deterministic full run (TypeScript only).
 */

import {
  classifyGlobalNegotiation,
  computeMustWinDeficitFromOffers,
  computeTotalGapFromOffers,
} from "@/lib/cliniq-core/negotiation/negotiation-classifier"
import {
  getFeeNegotiationProfile,
  type FeeNegotiationProfile,
} from "@/lib/cliniq-core/negotiation/fee-negotiation-profiles"
import {
  getExternalJustification,
  type ProtocolContext,
} from "@/lib/cliniq-core/negotiation/justification-templates"

export type { ProtocolContext }

export type SponsorOfferLine = {
  fee_code: string
  fee_name: string
  offered_amount: number
}

export type SiteTargetLine = {
  fee_code: string
  target_price: number
  floor_price: number
  real_cost?: number
}

export type ExternalCounterOfferLine = {
  fee_code: string
  fee_name: string
  sponsorOffered: number
  ourProposed: number
  external_justification: string
}

export type PaymentTermsRecommendation = {
  netTerms: string
  holdbackMax: string
  startupPayment: string
  invoiceablesPayment: string
  closeoutHoldback: string
  notes?: string
}

export type NegotiationResult = {
  internal: {
    strategy: "strong" | "cross_line" | "balanced"
    strongModeActivated: boolean
    crossLineStrategyUsed: boolean
    totalGapFromSponsorOffer: number
    mustWinDeficit: number
    internal_recommendation: string
    internal_note: string
  }
  external: {
    counterOffer: ExternalCounterOfferLine[]
    recommendedPaymentTerms: PaymentTermsRecommendation
    external_summary: string
  }
  totalProposedRevenue: number
  finalRecommendation: string
}

type InternalPricingDecision = {
  proposedAmount: number
  strategy: "hold" | "increase" | "tradeoff"
}

type SiteTargetMap = Map<string, SiteTargetLine>

export function runFullNegotiation(params: {
  studyId: string
  sponsorOffer: { fees: SponsorOfferLine[] }
  siteTargets: SiteTargetLine[]
  protocolContext?: ProtocolContext
}): NegotiationResult {
  void params.studyId

  const { sponsorOffer, siteTargets, protocolContext } = params

  const targetMap = buildSiteTargetMap(siteTargets)

  const totalGap = computeTotalGapFromOffers(sponsorOffer.fees, targetMap)
  const mustWinDeficit = computeMustWinDeficitFromOffers(
    sponsorOffer.fees,
    targetMap,
  )
  const {
    strategy,
    strongMode,
    crossLineStrategyUsed,
    extraConcessionOnTradeoff,
  } = classifyGlobalNegotiation({ totalGapFromSponsorOffer: totalGap, mustWinDeficit })

  const counterOffer: ExternalCounterOfferLine[] = []

  for (const fee of sponsorOffer.fees) {
    const target = targetMap.get(fee.fee_code)
    if (!target) continue

    const profile = getResolvedNegotiationProfile(fee.fee_code)

    const decision = determineProposedPrice({
      profile,
      offered: fee.offered_amount,
      target: target.target_price,
      floor: target.floor_price,
      strongMode,
      extraConcessionOnTradeoff,
    })

    counterOffer.push({
      fee_code: fee.fee_code,
      fee_name: fee.fee_name,
      sponsorOffered: round2(fee.offered_amount),
      ourProposed: round2(decision.proposedAmount),
      external_justification: getExternalJustification(
        fee.fee_code,
        protocolContext,
      ),
    })
  }

  const recommendedPaymentTerms = applyGlobalPaymentStrategy({
    strongMode,
    strategy,
    totalGap,
  })

  const internal_recommendation = generateInternalRecommendation({
    strongMode,
    mustWinDeficit,
    crossLineStrategyUsed,
  })

  const internal_note = generateInternalNote(crossLineStrategyUsed)

  return {
    internal: {
      strategy,
      strongModeActivated: strongMode,
      crossLineStrategyUsed,
      totalGapFromSponsorOffer: round2(totalGap),
      mustWinDeficit: round2(mustWinDeficit),
      internal_recommendation,
      internal_note,
    },
    external: {
      counterOffer,
      recommendedPaymentTerms,
      external_summary:
        "We have aligned the budget to reflect site operational requirements while maintaining efficiency across cost categories.",
    },
    totalProposedRevenue: round2(calculateTotalProposedRevenue(counterOffer)),
    finalRecommendation: internal_recommendation,
  }
}

function buildSiteTargetMap(siteTargets: SiteTargetLine[]): SiteTargetMap {
  const map = new Map<string, SiteTargetLine>()
  for (const target of siteTargets) {
    map.set(target.fee_code, target)
  }
  return map
}

function determineProposedPrice(params: {
  profile: FeeNegotiationProfile
  offered: number
  target: number
  floor: number
  strongMode: boolean
  extraConcessionOnTradeoff: boolean
}): InternalPricingDecision {
  const { profile, offered, target, floor, strongMode, extraConcessionOnTradeoff } =
    params

  switch (profile.negotiation_class) {
    case "must_win":
      return determineMustWinPrice({ offered, target, floor })

    case "defend":
      return determineDefendablePrice({
        offered,
        target,
        floor,
        strongMode,
        maxDiscountPct: profile.max_discount_pct,
      })

    case "tradeable":
      return determineTradeoffPrice({
        offered,
        target,
        floor,
        maxDiscountPct: profile.max_discount_pct,
        extraConcession: extraConcessionOnTradeoff,
      })
  }
}

function determineMustWinPrice(params: {
  offered: number
  target: number
  floor: number
}): InternalPricingDecision {
  const { offered, target, floor } = params

  if (offered < target * 0.9) {
    return {
      proposedAmount: Math.max(target, floor),
      strategy: "increase",
    }
  }

  return {
    proposedAmount: Math.max(offered * 0.95, floor),
    strategy: "hold",
  }
}

function determineDefendablePrice(params: {
  offered: number
  target: number
  floor: number
  strongMode: boolean
  maxDiscountPct: number
}): InternalPricingDecision {
  const { offered, target, floor, strongMode, maxDiscountPct } = params

  const concessionPct = strongMode ? 0 : maxDiscountPct
  const candidate = target * (1 - concessionPct / 100)

  return {
    proposedAmount: Math.max(candidate, floor, offered),
    strategy: "hold",
  }
}

function determineTradeoffPrice(params: {
  offered: number
  target: number
  floor: number
  maxDiscountPct: number
  extraConcession: boolean
}): InternalPricingDecision {
  const { offered, target, floor, maxDiscountPct, extraConcession } = params

  let concessionPct = maxDiscountPct

  if (extraConcession) {
    concessionPct = Math.min(35, maxDiscountPct * 1.4)
  }

  return {
    proposedAmount: Math.max(
      target * (1 - concessionPct / 100),
      floor,
      offered,
    ),
    strategy: "tradeoff",
  }
}

function applyGlobalPaymentStrategy(params: {
  strongMode: boolean
  strategy: "strong" | "cross_line" | "balanced"
  totalGap: number
}): PaymentTermsRecommendation {
  const { strongMode, strategy, totalGap } = params

  const gapNote =
    totalGap > 8000
      ? "Cash flow alignment requested due to overall budget gap."
      : undefined

  if (strongMode) {
    return {
      netTerms: "Net-30 mensual",
      holdbackMax: "≤5%",
      startupPayment: "75% upfront",
      invoiceablesPayment: "Mensual",
      closeoutHoldback: "Liberación completa al final",
      notes: gapNote,
    }
  }

  if (strategy === "cross_line") {
    return {
      netTerms: "Net-30 mensual",
      holdbackMax: "≤8%",
      startupPayment: "50% al firmar + 50% al SIV",
      invoiceablesPayment: "Mensual",
      closeoutHoldback: "Liberación completa al final",
      notes: gapNote,
    }
  }

  return {
    netTerms: "Net-30 mensual",
    holdbackMax: "≤10%",
    startupPayment: "50% al firmar + 50% al SIV",
    invoiceablesPayment: "Mensual",
    closeoutHoldback: "Liberación completa al final",
    notes: gapNote,
  }
}

function generateInternalRecommendation(params: {
  strongMode: boolean
  mustWinDeficit: number
  crossLineStrategyUsed: boolean
}): string {
  const { strongMode, mustWinDeficit, crossLineStrategyUsed } = params

  if (strongMode) {
    return "Modo fuerte activado. Insistir en fees Must Win y términos de pago favorables."
  }

  if (crossLineStrategyUsed && mustWinDeficit > 0) {
    return "Se utilizó estrategia cross-line para proteger fees críticos."
  }

  if (mustWinDeficit > 3000) {
    return "Déficit relevante en fees Must Win. Priorizar Startup, Screen Failure y net-30."
  }

  return "Contraoferta equilibrada."
}

function generateInternalNote(crossLineStrategyUsed: boolean): string {
  if (crossLineStrategyUsed) {
    return "Tactical concessions were applied on lower-priority cost lines to protect critical startup and screening economics."
  }

  return "Pricing strategy remains balanced across all cost categories."
}

function calculateTotalProposedRevenue(
  counterOffer: ExternalCounterOfferLine[],
): number {
  return counterOffer.reduce((sum, line) => sum + line.ourProposed, 0)
}

function getResolvedNegotiationProfile(feeCode: string): FeeNegotiationProfile {
  return getFeeNegotiationProfile(feeCode)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
