/**
 * Module 5 — post-award ledger (execution → billables → variance / leakage).
 */
export { generateBillablesFromEvent } from "./billables-from-events"
export { generateExpectedBillablesFromBudget } from "./expected-billables"
export type { GenerateExpectedParams } from "./expected-billables"
export { buildLedger } from "./ledger"
export { detectRevenueLeakage } from "./leakage"
export type {
  BillableInstance,
  EventLog,
  ExpectedBillable,
  LedgerEntry,
  LedgerEntryStatus,
  RevenueLeakageReport,
} from "./types"
