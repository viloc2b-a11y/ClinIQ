/**
 * Budget gap (Module 3) + pre-award negotiation (Module 4).
 * Negotiation exports are pure transforms only — no event system or DB I/O.
 * `budgetGapAnalysisToCsv` lives in `./export-format` (re-exported below).
 * @see NEGOTIATION_ENGINE.md
 */
export {
  compareSponsorBudgetToInternalBudget,
} from "./compare"
export {
  determineBudgetDecision,
  type BudgetDecision,
} from "./budget-decision"
export { generateCounterofferText } from "./counteroffer-text"
export {
  buildNegotiationPackage,
  type NegotiationPackage,
} from "./negotiation-package"
export {
  buildScenarioSet,
  simulateNegotiationScenario,
  type NegotiationScenario,
  type NegotiationScenarioResult,
} from "./negotiation-scenarios"
export {
  buildNegotiationStrategy,
  type NegotiationStrategyBucket,
} from "./negotiation-strategy"
export {
  applyEscalation,
  applyEscalationToTargets,
  getEscalationFactor,
  type EscalatedNegotiationTarget,
} from "./pricing-escalation"
export {
  budgetGapAnalysisToCsv,
  buildBudgetGapAnalysisExport,
  gapLinesToCsv,
} from "./export-format"
export type {
  BudgetGapAnalysisCsvColumn,
  BudgetGapAnalysisExport,
} from "./export-format"
export {
  BUDGET_GAP_ANALYSIS_JSON_SCHEMA_VERSION,
  buildBudgetGapAnalysisJsonDocument,
  serializeBudgetGapAnalysisJson,
} from "./export-budget-gap-json"
export type { BudgetGapAnalysisJsonDocument } from "./export-budget-gap-json"
export {
  CRITICAL_INVOICEABLE_CATEGORY_PATTERNS,
  isCriticalInvoiceableCategory,
} from "./critical-invoiceables"
export { applyBudgetLabelAliases } from "./label-aliases"
export {
  budgetGapResultToNegotiationEngineInput,
  buildJustificationPoints,
  buildTopNegotiationTargets,
  type NegotiationEngineGapLine,
  type NegotiationEngineInput,
  type NegotiationPriority,
  type NegotiationTarget,
  type NegotiationTargetKind,
} from "./negotiation-input"
export {
  budgetLineMatchKey,
  normalizeFieldForBudgetMatch,
  normalizeMatchToken,
} from "./normalize"
export type {
  BudgetGapLine,
  BudgetGapResult,
  BudgetGapSummary,
  BudgetLineSource,
  BudgetStudyMeta,
  CompareBudgetInput,
  CompareBudgetResult,
  GapStatus,
  InternalBudgetLine,
  MissingInvoiceable,
  SiteNegotiationVariables,
  SponsorBudgetLine,
} from "./types"
