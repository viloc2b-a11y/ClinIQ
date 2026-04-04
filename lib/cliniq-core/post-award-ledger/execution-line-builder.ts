/**
 * Deterministic bridge: ClaimsLedgerRow → ExecutionBillableLine (invoice policy stays in claims).
 */

import type { ClaimsLedgerRow } from "../claims/types"
import type {
  ApprovalStatus,
  BlockingCode,
  DisputeStatus,
  EvidenceStatus,
  ExecutionBillableLine,
  ExecutionStatus,
} from "./execution-lines"

function nonEmpty(s: string | undefined): string | undefined {
  const t = s?.trim()
  return t && t.length > 0 ? t : undefined
}

function messageForCode(
  code: BlockingCode,
  row: ClaimsLedgerRow,
): string {
  switch (code) {
    case "NO_DOC":
      return "Missing support documentation"
    case "NOT_APPROVED":
      return "Pending approval"
    case "DISPUTED":
      return nonEmpty(row.disputeReason) ?? "Marked as disputed"
    case "NON_MATCH":
      return nonEmpty(row.nonMatchingReason) ?? "Non-matching ledger row"
    case "ZERO_AMOUNT":
      return "Non-positive amount"
    case "OVERDUE_REVIEW":
      return "Marked overdue for review"
  }
}

export function buildExecutionLineFromClaimsLedgerRow(
  row: ClaimsLedgerRow,
): ExecutionBillableLine {
  const amount = Number.isFinite(row.amount) ? row.amount : 0
  const quantityRaw = row.quantity
  const quantity =
    quantityRaw !== undefined && Number.isFinite(quantityRaw) ? quantityRaw : 1

  let unitPrice = 0
  const up = row.unitPrice
  if (up !== undefined && Number.isFinite(up)) {
    unitPrice = up
  } else if (quantity > 0 && Number.isFinite(row.amount)) {
    unitPrice = amount / quantity
  }

  const evidenceStatus: EvidenceStatus =
    row.supportDocumentationComplete === false ? "missing" : "complete"

  const approvalStatus: ApprovalStatus =
    row.approved === true ? "approved" : "pending"

  const disputeStatus: DisputeStatus =
    row.disputed === true || row.nonMatching === true ? "open" : "none"

  const disputeReason =
    nonEmpty(row.disputeReason) ?? nonEmpty(row.nonMatchingReason)

  const blockingCodes: BlockingCode[] = []
  if (amount <= 0) blockingCodes.push("ZERO_AMOUNT")
  if (row.disputed === true) blockingCodes.push("DISPUTED")
  if (row.nonMatching === true) blockingCodes.push("NON_MATCH")
  if (row.markedOverdue === true) blockingCodes.push("OVERDUE_REVIEW")
  if (row.approved !== true) blockingCodes.push("NOT_APPROVED")
  if (row.supportDocumentationComplete === false) blockingCodes.push("NO_DOC")

  const blockingMessages = blockingCodes.map((c) => messageForCode(c, row))

  let status: ExecutionStatus
  if (disputeStatus === "open") {
    status = "disputed"
  } else if (blockingCodes.length > 0) {
    status = "blocked"
  } else {
    status = "invoiceable"
  }

  const autoInvoiceEligible =
    blockingCodes.length === 0 &&
    approvalStatus === "approved" &&
    evidenceStatus === "complete" &&
    disputeStatus === "none" &&
    amount > 0

  return {
    billableInstanceId: row.billableInstanceId ?? "",
    eventLogId: row.eventLogId ?? "",
    studyId: row.studyId,
    siteId: row.siteId,
    sponsorId: row.sponsorId,
    visitName: row.visitName,
    activityId: row.activityId,
    lineCode: row.lineCode,
    feeCode: row.feeCode,
    quantity,
    unitPrice,
    amount,
    status,
    blockingCodes,
    blockingMessages,
    evidenceStatus,
    approvalStatus,
    disputeStatus,
    disputeReason,
    autoInvoiceEligible,
    eventDate: row.eventDate,
    subjectId: row.subjectId,
    label: row.label,
    supportNote: row.supportNote,
    invoicePeriodStart: row.invoicePeriodStart,
    invoicePeriodEnd: row.invoicePeriodEnd,
  }
}

export function buildExecutionLinesFromClaimsLedger(
  rows: ClaimsLedgerRow[],
): ExecutionBillableLine[] {
  return rows.map((r) => buildExecutionLineFromClaimsLedgerRow(r))
}
