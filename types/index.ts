/**
 * Shared application types (DTOs, domain shapes, API contracts).
 * Add feature-specific types under `types/` or colocated in `features/<name>/`.
 */

export type {
  BudgetDecision,
  BudgetGapAnalysisExport,
  BudgetGapLine,
  BudgetGapResult,
  BudgetGapSummary,
  BudgetLineSource,
  BudgetStudyMeta,
  CompareBudgetInput,
  CompareBudgetResult,
  EscalatedNegotiationTarget,
  GapStatus,
  InternalBudgetLine,
  MissingInvoiceable,
  NegotiationEngineInput,
  NegotiationPackage as BudgetGapNegotiationPackage,
  NegotiationScenario,
  NegotiationScenarioResult,
  NegotiationStrategyBucket,
  NegotiationTarget,
  SponsorBudgetLine,
} from "@/lib/cliniq-core/budget-gap"
export type {
  CounterofferLine,
  NegotiationJustification,
  NegotiationPackage,
  NegotiationPriority,
  NegotiationStrategy,
  PaymentTermRecommendation,
  SponsorEmailDraft,
} from "@/lib/cliniq-core/negotiation"
