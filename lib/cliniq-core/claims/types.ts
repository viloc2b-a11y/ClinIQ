/**
 * Claims / invoice output layer — claim-ready and invoice-ready structures.
 * Operational ledger rows are row-level (traceable); distinct from Module 5 aggregated ledger.
 */

import type { ExecutionBillableLine } from "../post-award-ledger/execution-lines"

export type InvoiceStatus =
  | "ready"
  | "invoiced"
  | "partial"
  | "overdue"
  | "disputed"

/**
 * Row-level execution / billing facts used to build claim items.
 * Typically produced from Module 5 billables + site metadata (without changing Module 5).
 */
export type ClaimsLedgerRow = {
  studyId: string
  siteId?: string
  sponsorId?: string
  subjectId?: string
  visitName?: string
  /** Protocol / SoA activity reference when known */
  activityId?: string
  /** ISO 8601 date (date part used for aging) */
  eventDate: string
  lineCode: string
  /** Fee template code when distinct from budget lineCode */
  feeCode?: string
  label: string
  /** Billable units for this row when known (Module 5 execution bridge) */
  quantity?: number
  /** Explicit unit price when known */
  unitPrice?: number
  amount: number
  supportNote?: string
  /** Site / finance approval */
  approved: boolean
  /** When false, treated as missing support documentation */
  supportDocumentationComplete?: boolean
  disputed?: boolean
  disputeReason?: string
  /** Sponsor or internal mismatch vs expectation */
  nonMatching?: boolean
  nonMatchingReason?: string
  /** Force overdue status (e.g. past invoice window) */
  markedOverdue?: boolean
  billableInstanceId?: string
  eventLogId?: string
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
}

export type ClaimItem = {
  id: string
  studyId: string
  sponsorId?: string
  subjectId?: string
  visitName?: string
  eventDate: string
  lineCode: string
  label: string
  amount: number
  supportNote?: string
  status: InvoiceStatus
  requiresReview: boolean
  exceptionReason?: string
  billableInstanceId?: string
  eventLogId?: string
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
  approved: boolean
  supportDocumentationComplete: boolean
}

export type InvoiceLine = {
  id: string
  studyId: string
  sponsorId?: string
  subjectId?: string
  visitName?: string
  eventDate: string
  lineCode: string
  label: string
  amount: number
  supportNote?: string
  status: InvoiceStatus
  claimItemId: string
}

export type InvoicePackage = {
  schemaVersion: "1.0"
  studyId: string
  sponsorId: string
  invoicePeriodStart: string
  invoicePeriodEnd: string
  generatedAt: string
  lines: InvoiceLine[]
  subtotal: number
  lineCount: number
  hasBlockingIssues: boolean
}

export type ClaimPackage = {
  schemaVersion: "1.0"
  generatedAt: string
  studyIds: string[]
  allClaimItems: ClaimItem[]
  invoiceReadyItems: ClaimItem[]
  reviewNeededItems: ClaimItem[]
  claimExceptions: ClaimException[]
}

export type ClaimException = {
  id: string
  claimItemId: string
  studyId: string
  sponsorId?: string
  lineCode: string
  label: string
  exceptionReason: string
  requiresReview: boolean
  amount?: number
}

export type AgingEntry = {
  id: string
  studyId: string
  sponsorId?: string
  subjectId?: string
  lineCode: string
  label: string
  amount: number
  status: InvoiceStatus
  eventDate: string
  daysOutstanding: number
  supportNote?: string
  requiresReview: boolean
}

export type BuildInvoicePackageInput = {
  /**
   * When provided and non-empty, used as-is (highest precedence).
   * Otherwise `buildInvoicePackage` derives via `buildClaimItemsCanonical`.
   */
  claimItems?: ClaimItem[]
  /** Primary derived input when `claimItems` is absent or empty. */
  executionLines?: ExecutionBillableLine[]
  /** Converted through `buildExecutionLinesFromClaimsLedger` then execution-line claims mapping. */
  ledgerRows?: ClaimsLedgerRow[]
  /** Defaults to now */
  generatedAt?: string
}

export type DetectClaimExceptionsInput = {
  claimItems: ClaimItem[]
}

export type BuildAgingReportInput = {
  claimItems: ClaimItem[]
  /** ISO date; aging computed from eventDate to this date */
  asOf: string
  /** Days after which a review item is highlighted as aging (default 14) */
  reviewAgingDays?: number
}
