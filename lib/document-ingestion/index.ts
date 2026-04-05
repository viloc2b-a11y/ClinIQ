/**
 * Document Engine v1 — stable public surface (orchestrators, adapters, matching, demo fixtures).
 */

export { parseDocument } from "./parse-document"
export { runPreSoaIntake } from "./run-pre-soa-intake"

export { toCanonicalHandoff } from "./to-canonical-handoff"
export { bridgeDocumentRecords } from "./bridge-document-records"

export { toPreSoaRows } from "./adapters/to-pre-soa-rows"
export { toPreBudgetRows } from "./adapters/to-pre-budget-rows"
export { toPreInvoiceRows } from "./adapters/to-pre-invoice-rows"

export { matchExpectedToInvoice } from "./matching/match-expected-to-invoice"
export { classifyMatchResultsIntoLeakageSignals } from "./matching/classify-match-results-into-leakage-signals"
export { buildReviewActionsFromLeakageSignals } from "./matching/build-review-actions-from-leakage-signals"
export { runRevenueProtectionReview } from "./matching/run-revenue-protection-review"

export { demoExpectedRows, demoInvoiceRows } from "./matching/fixtures/revenue-protection-demo"
