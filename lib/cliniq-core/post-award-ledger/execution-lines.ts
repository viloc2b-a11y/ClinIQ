/**
 * Module 5 v1 — execution-truth line contract (foundational; no wiring to claims/ledger yet).
 */

export const BLOCKING_CODES = [
  "NO_DOC",
  "NOT_APPROVED",
  "DISPUTED",
  "NON_MATCH",
  "ZERO_AMOUNT",
  "OVERDUE_REVIEW",
] as const

export type BlockingCode = (typeof BLOCKING_CODES)[number]

export type ExecutionStatus =
  | "expected"
  | "earned"
  | "invoiceable"
  | "blocked"
  | "disputed"

export type EvidenceStatus = "complete" | "missing"

export type ApprovalStatus = "approved" | "pending"

export type DisputeStatus = "none" | "open" | "resolved"

export type ExecutionBillableLine = {
  billableInstanceId: string
  eventLogId: string
  studyId: string
  siteId?: string
  sponsorId?: string
  visitName?: string
  activityId?: string
  lineCode?: string
  feeCode?: string
  quantity: number
  unitPrice: number
  amount: number
  status: ExecutionStatus
  blockingCodes: BlockingCode[]
  blockingMessages: string[]
  evidenceStatus: EvidenceStatus
  approvalStatus: ApprovalStatus
  disputeStatus: DisputeStatus
  disputeReason?: string
  autoInvoiceEligible: boolean
  /** Mirrors `ClaimsLedgerRow` fields for claims / invoice output (optional when not from ledger). */
  eventDate?: string
  subjectId?: string
  label?: string
  supportNote?: string
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
}

export function isExecutionLineBlocked(line: ExecutionBillableLine): boolean {
  if (line.status === "blocked" || line.status === "disputed") return true
  if (line.blockingCodes.length > 0) return true
  if (line.autoInvoiceEligible === false) return true
  return false
}
