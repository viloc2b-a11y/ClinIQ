/**
 * Document Engine v1 — stable public surface for core bridges and the SoA → event-store write-input lane.
 */

/* Core row bridges + package */
export { toCoreSoaImportRows } from "./to-core-soa-import-rows"
export { toCoreBudgetReviewRows } from "./to-core-budget-review-rows"
export { toCoreInvoiceReviewRows } from "./to-core-invoice-review-rows"
export { runCoreBridgePackage } from "./run-core-bridge-package"

/* Payload builders + package */
export { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
export { toCoreBudgetReviewPayload } from "./to-core-budget-review-payload"
export { toCoreInvoiceReviewPayload } from "./to-core-invoice-review-payload"
export { runCorePayloadPackage } from "./run-core-payload-package"

/* SoA lane */
export { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"
export { classifyCoreSoaActivities } from "./classify-core-soa-activities"
export { buildInitialExpectedBillables } from "./build-initial-expected-billables"
export { runSoaToExpectedBillables } from "./run-soa-to-expected-billables"

/* Revenue protection bridge */
export { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
export { runSoaRevenueProtectionReview } from "./run-soa-revenue-protection-review"

/* Draft events + event-log + write-input */
export { runSoaReviewToEventStoreWriteInput } from "./run-soa-review-to-event-store-write-input"
export { runSoaReviewToDraftEvents } from "./run-soa-review-to-draft-events"
export { toDraftEventLogRows } from "./to-draft-event-log-rows"
export { toEventLogSchemaCandidate } from "./to-event-log-schema-candidate"
export { toEventStoreWriteInput } from "./to-event-store-write-input"
export { toEventStoreHandoffPayload } from "./to-event-store-handoff-payload"
export { toEventStoreBoundaryInput } from "./to-event-store-boundary-input"
export { validateEventStoreBoundary } from "./validate-event-store-boundary"
export { boundaryRowClientRef, runEventStoreDryWrite } from "./run-event-store-dry-write"
export { runEventStoreControlledWrite } from "./run-event-store-controlled-write"
export { verifyActionCenterWrite } from "./verify-action-center-write"

/* Deterministic demo fixtures (SoA + invoice) */
export { demoInvoiceRows, demoSoaImportRows } from "./fixtures/soa-event-log-demo"
