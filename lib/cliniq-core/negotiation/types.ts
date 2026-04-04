/**
 * Module 4 — negotiation engine (pre-award). Structured in-memory outputs only.
 * Input contract: NegotiationEngineInput from Module 3 (not modified here).
 */

import type { NegotiationEngineInput } from "../budget-gap/negotiation-input"

export type NegotiationPriority = "high" | "medium" | "low"

export type NegotiationStrategy = "conservative" | "balanced" | "firm"

export type CounterofferLine = {
  lineCode: string
  label: string
  category: string
  visitName: string
  sponsorOffer: number
  internalCost: number
  recommendedCounteroffer: number
  gapAmount: number
  priority: NegotiationPriority
  rationale: string
  supportingFacts: string[]
  riskFlag: boolean
}

export type NegotiationJustification = {
  rationale: string
  supportingFacts: string[]
}

export type PaymentTermRecommendation = {
  recommendedTermChange: string
  rationale: string
  riskFlag: boolean
}

export type NegotiationPackage = {
  schemaVersion: "1.0"
  strategy: NegotiationStrategy
  generatedAt: string
  studyId?: string
  studyName?: string
  siteName?: string
  counterofferLines: CounterofferLine[]
  justifications: NegotiationJustification[]
  paymentTerms: PaymentTermRecommendation[]
  summarySnapshot: {
    totalInternal: number
    totalSponsor: number
    totalGap: number
    negativeCashFlowRisk: boolean
    decision: string
  }
}

export type SponsorEmailDraft = {
  subject: string
  opening: string
  rationaleParagraph: string
  adjustmentBullets: string[]
  paymentTermParagraph: string
  closing: string
  fullText: string
}

export type BuildNegotiationPackageParams = {
  input: NegotiationEngineInput
  strategy: NegotiationStrategy
}
