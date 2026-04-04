/**
 * ClinIQ Fee Template Engine v1 — types + RPC helpers + shared mapping (Postgres is source of truth for writes).
 */
export { BILLABLE_SUBJECT_DEDUPE_NIL } from "./types"
export {
  sameBillableSourceKey,
  subjectDedupeKey,
  type BillableSourceKey,
} from "./billable-dedupe"
export { createBillableFromEvent } from "./create-billable-from-event"
export {
  EVENT_TO_FEE_CODE,
  mapClinicalEventTypeToFeeCode,
  type MappedClinicalEventType,
} from "./event-mapping"
export { computeInvoiceDueDateIso } from "./invoice-due"
export { promoteEarnedToInvoiceable } from "./promote-invoiceable"
export {
  CORE_V1_CLINICAL_FEE_CODES,
  STARTER_FEES_EXTENDED,
  ALL_STARTER_TEMPLATE_FEE_CODES,
  STARTER_FEES_EXTENDED_CODES,
  feeCodesUnique,
  type StarterFeeDefinition,
  type CoreV1ClinicalFeeCode,
} from "./starter-fees"
export {
  FEE_ENGINE_BEHAVIORS,
  DEFAULT_RATE_STRATEGIES,
  KNOWN_TRIGGER_TYPES,
  KNOWN_TRIGGER_SOURCES,
  type FeeEngineBehavior,
  type DefaultRateStrategy,
  type KnownTriggerType,
  type KnownTriggerSource,
} from "./fee-taxonomy"
export type {
  BillableInstanceRow,
  BillableInstanceStatus,
  CreateBillableFromEventRpcParams,
  InvoicePackageItemRow,
  InvoicePackageRow,
  SiteFeeTemplateItemRow,
  SiteFeeTemplateRow,
  StudyFeeTemplateRow,
  StudyFeeTemplateSnapshot,
  StudyFeeTemplateSnapshotItem,
} from "./types"
