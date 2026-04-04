/**
 * Module 4 v1 — orchestration artifacts (internal vs external).
 * Inputs: `NegotiationEngineInput` from Module 3 only (no compare/counter math here).
 */

import type { BudgetDecision } from "../budget-gap/budget-decision"
import type { NegotiationEngineInput } from "../budget-gap/negotiation-input"
import type {
  CounterofferLine,
  NegotiationStrategy,
  PaymentTermRecommendation,
  SponsorEmailDraft,
} from "./types"

/** v2-ready hook surface; v1 ignores empty/undefined. */
export type SponsorNegotiationHooks = {
  /** Appended to `internalPlan.internalNotes` when present. */
  internalNotesAppend?: string[]
}

export type ExternalNegotiationSummary = {
  headline: string
  keyPoints: string[]
  /** Echo from Module 3 summary + decision — for sponsor email adapter only (no new math). */
  totalInternal: number
  totalSponsor: number
  totalGap: number
  negativeCashFlowRisk: boolean
  decision: string
}

export type ExternalNegotiationPackage = {
  counterofferLines: CounterofferLine[]
  paymentTerms: PaymentTermRecommendation[]
  summary: ExternalNegotiationSummary
  studyId?: string
  studyName?: string
  siteName?: string
  strategy: NegotiationStrategy
}

export type InternalNegotiationPlan = {
  decision: BudgetDecision
  strategy: NegotiationStrategy
  selectedLineCodes: string[]
  topTargets: string[]
  risks: string[]
  justificationPoints: string[]
  paymentLeverage: {
    recommendations: PaymentTermRecommendation[]
    priority: "low" | "medium" | "high"
  }
  internalNotes?: string[]
}

export type Module4Artifacts = {
  internalPlan: InternalNegotiationPlan
  externalPackage: ExternalNegotiationPackage
  emailDraft: SponsorEmailDraft
}

export type BuildModule4ArtifactsParams = {
  input: NegotiationEngineInput
  /** Defaults to `"balanced"` when omitted. */
  strategy?: NegotiationStrategy
  sponsorNegotiationHooks?: SponsorNegotiationHooks
}
