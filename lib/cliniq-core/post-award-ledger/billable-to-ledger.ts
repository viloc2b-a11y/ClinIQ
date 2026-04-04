import type { BillableInstance } from "./types"
import type { ClaimsLedgerRow } from "../claims/types"

export interface BillableToLedgerOptions {
  sponsorId?: string
  subjectId?: string
  visitName?: string
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
}

export function buildLedgerRowsFromBillables(
  billables: BillableInstance[],
  options?: BillableToLedgerOptions,
): ClaimsLedgerRow[] {
  return billables.map(
    (billable) =>
      ({
        id: `ledger-${billable.id}`,
        studyId: billable.studyId,
        sponsorId: options?.sponsorId,
        subjectId: options?.subjectId,
        visitName: options?.visitName,
        eventDate: billable.occurredAt,
        lineCode: billable.lineCode,
        label: billable.label,
        amount: billable.totalAmount,
        status: "ready" as const,
        requiresReview: false,
        approved: true,
        supportDocumentationComplete: true,
        billableInstanceId: billable.id,
        eventLogId: billable.eventLogId,
        invoicePeriodStart: options?.invoicePeriodStart,
        invoicePeriodEnd: options?.invoicePeriodEnd,
      }) as ClaimsLedgerRow,
  )
}
