/**
 * Module 5 — post-award ledger (execution → billables → variance / leakage).
 */
export {
  buildLedgerRowsFromBillables,
  type BillableToLedgerOptions,
} from "./billable-to-ledger"
export { generateBillablesFromEvent } from "./billables-from-events"
export { generateExpectedBillablesFromBudget } from "./expected-billables"
export type { GenerateExpectedParams } from "./expected-billables"
export { buildLedger } from "./ledger"
export {
  buildLeakageTrace,
  findMatchingClaimItems,
  findMatchingLedgerRows,
  inferReasonFromClaim,
  normalizeLineCode,
  normalizeVisitName,
  sumInvoiceAmountForExpected,
} from "./build-leakage-trace"
export { detectRevenueLeakage } from "./leakage"
export {
  buildExecutionLineFromClaimsLedgerRow,
  buildExecutionLinesFromClaimsLedger,
} from "./execution-line-builder"
export {
  BLOCKING_CODES,
  isExecutionLineBlocked,
} from "./execution-lines"
export type {
  ApprovalStatus,
  BlockingCode,
  DisputeStatus,
  EvidenceStatus,
  ExecutionBillableLine,
  ExecutionStatus,
} from "./execution-lines"
export type {
  BillableInstance,
  EventLog,
  ExpectedBillable,
  LedgerEntry,
  LedgerEntryStatus,
  RevenueLeakageReport,
} from "./types"
export type {
  LeakageTraceItem,
  LeakageTraceResult,
  LeakageTraceSummary,
} from "./leakage-types"
export {
  quantifyRevenueLeakage,
  quantifyRevenueLeakageWithTrace,
} from "./quantify-leakage"
export type {
  QuantifiedLineLeakage,
  QuantifiedRevenueLeakageReport,
  QuantifyRevenueLeakageWithTraceResult,
} from "./quantify-leakage"
