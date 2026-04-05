/**
 * Document Engine v1 — public surface for core-ready bridges (SoA / budget / invoice + package).
 */

export { toCoreSoaImportRows } from "./to-core-soa-import-rows"
export { toCoreBudgetReviewRows } from "./to-core-budget-review-rows"
export { toCoreInvoiceReviewRows } from "./to-core-invoice-review-rows"
export { runCoreBridgePackage } from "./run-core-bridge-package"

export { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
export { toCoreBudgetReviewPayload } from "./to-core-budget-review-payload"
export { toCoreInvoiceReviewPayload } from "./to-core-invoice-review-payload"
export { runCorePayloadPackage } from "./run-core-payload-package"

export { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"
export { classifyCoreSoaActivities } from "./classify-core-soa-activities"
export { buildInitialExpectedBillables } from "./build-initial-expected-billables"
