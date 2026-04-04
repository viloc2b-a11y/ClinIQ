/**
 * Negotiation package:
 * - Module 2 — site cost model → per-fee zones, strategy, counters (`NegotiationEngineInput` v2.0-cost-model).
 * - Module 4 — budget-gap payload → packages / CSV / email (`NegotiationStrategy` = conservative | balanced | firm).
 */

// --- Module 2 (cost model) ---
export { mapCostModelToNegotiationInput } from "./negotiation-mapper"
export type { MapCostModelToNegotiationParams } from "./negotiation-mapper"
export {
  buildModule2NegotiationReview,
} from "./build-module2-negotiation-review"
export type {
  Module2NegotiationReview,
  Module2NegotiationReviewSummary,
} from "./build-module2-negotiation-review"
export {
  buildModule2NegotiationReviewFromOfferRecord,
  buildModule2NegotiationReviewFromOfferRows,
} from "./build-module2-negotiation-review-from-raw-offer"
export type { Module2NegotiationReviewFromRawOfferResult } from "./build-module2-negotiation-review-from-raw-offer"
export { ingestSponsorOfferXlsx } from "./ingest-sponsor-offer-xlsx"
export type {
  IngestSponsorOfferXlsxParams,
  IngestSponsorOfferXlsxResult,
  ParsedExcelSponsorOfferRow,
  SponsorOfferXlsxColumns,
} from "./ingest-sponsor-offer-xlsx"
export { ingestSponsorOfferPdf } from "./ingest-sponsor-offer-pdf"
export type {
  IngestSponsorOfferPdfParams,
  IngestSponsorOfferPdfResult,
  ParsedPdfSponsorOfferRow,
} from "./ingest-sponsor-offer-pdf"
export { ingestSponsorOffer } from "./ingest-sponsor-offer"
export type {
  IngestSponsorOfferParams,
  IngestSponsorOfferResult,
} from "./ingest-sponsor-offer"
export {
  MODULE2_REVIEW_JSON_SCHEMA_VERSION,
  buildModule2NegotiationReviewJsonDocument,
  serializeModule2NegotiationReviewJson,
  writeModule2NegotiationReviewJson,
} from "./export-module2-review-json"
export type { Module2NegotiationReviewJsonDocument } from "./export-module2-review-json"
export {
  module2FeeDecisionsToCsv,
  writeModule2NegotiationReviewCsv,
} from "./export-module2-review-csv"
export type { Module2ReviewCsvColumn } from "./export-module2-review-csv"
export {
  normalizeSponsorOfferRecord,
  normalizeSponsorOfferRows,
} from "./normalize-sponsor-offer-input"
export type {
  NormalizeSponsorOfferResult,
  RawSponsorOfferRow,
} from "./normalize-sponsor-offer-input"
export { classifyFee, classifyAllFees } from "./negotiation-classifier"
export { deriveStrategy } from "./negotiation-strategy"
export type { FeeNegotiationStrategy } from "./negotiation-strategy"
export { buildCounterDecision, buildCounterDecisions } from "./negotiation-counter"
export {
  buildFeeNegotiationDecision,
  buildFeeNegotiationDecisions,
} from "./build-fee-negotiation-decisions"
export type { FeeNegotiationDecision } from "./build-fee-negotiation-decisions"
export type {
  NegotiationEngineInput,
  NegotiationFeeInput,
  NegotiationZone,
} from "./negotiation-types"

// --- Module 4 (budget gap) ---
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
