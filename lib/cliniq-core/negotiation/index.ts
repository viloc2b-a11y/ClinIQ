/**
 * Module 4 — pre-award negotiation engine. Pure transforms from Module 3 input.
 */
export {
  negotiationEngineInputFromGapResult,
  negotiationPackageFromGapResult,
} from "./from-module3"
export { NEGOTIATION_ENGINE_INPUT_SESSION_KEY } from "./handoff"
export {
  buildNegotiationPackage,
  recommendCounterofferForLine,
  selectLinesForStrategy,
} from "./build-package"
export {
  counterofferLinesToCsv,
  negotiationPackageToJson,
} from "./export-format"
export { generateEmailDraft } from "./email-draft"
export { buildDefensiveJustifications, supportingFactsForCategory } from "./justifications"
export { recommendPaymentTerms } from "./payment-terms"
export type {
  BuildNegotiationPackageParams,
  CounterofferLine,
  NegotiationJustification,
  NegotiationPackage,
  NegotiationPriority,
  NegotiationStrategy,
  PaymentTermRecommendation,
  SponsorEmailDraft,
} from "./types"
