import type { InvoicePackage } from "../claims/types"
import type { PostedInvoice, PostedInvoiceLine } from "./types"
import { stableInvoiceId, stableInvoiceLineId } from "./ids"

export type PostInvoiceOptions = {
  /** ISO date for AR aging / overdue; defaults to invoicePeriodEnd (date part). */
  dueDate?: string
  /** When the invoice was posted (ISO); defaults to package.generatedAt. */
  postedAt?: string
  /** Drives short_paid when true even if asOfDate is not past due. */
  settlementFinalized?: boolean
}

function datePart(iso: string): string {
  const t = iso.trim()
  const i = t.indexOf("T")
  return i >= 0 ? t.slice(0, i) : t.slice(0, 10)
}

/**
 * Creates a stable posted invoice from an InvoicePackage (Module 5 output).
 * Does not mutate upstream types.
 */
export function postInvoiceFromPackage(
  pkg: InvoicePackage,
  options: PostInvoiceOptions = {},
): PostedInvoice {
  const claimIds = [...new Set(pkg.lines.map((l) => l.claimItemId))].sort()
  const invoiceId = stableInvoiceId({
    studyId: pkg.studyId,
    sponsorId: pkg.sponsorId,
    invoicePeriodStart: pkg.invoicePeriodStart,
    invoicePeriodEnd: pkg.invoicePeriodEnd,
    generatedAt: pkg.generatedAt,
    subtotal: pkg.subtotal,
    lineClaimItemIdsSorted: claimIds,
  })

  const lines: PostedInvoiceLine[] = pkg.lines.map((l) => ({
    invoiceLineId: stableInvoiceLineId(invoiceId, `${l.claimItemId}\x1f${l.id}`),
    invoiceId,
    claimItemId: l.claimItemId,
    studyId: l.studyId,
    sponsorId: l.sponsorId ?? pkg.sponsorId,
    eventDate: l.eventDate,
    lineCode: l.lineCode,
    label: l.label,
    amount: l.amount,
  }))

  const postedAt = options.postedAt ?? pkg.generatedAt
  const dueDate = options.dueDate ?? datePart(pkg.invoicePeriodEnd)

  return {
    schemaVersion: "1.0",
    invoiceId,
    studyId: pkg.studyId,
    sponsorId: pkg.sponsorId,
    invoicePeriodStart: pkg.invoicePeriodStart,
    invoicePeriodEnd: pkg.invoicePeriodEnd,
    postedAt,
    dueDate,
    ...(options.settlementFinalized === true
      ? { settlementFinalized: true }
      : {}),
    lines,
    invoiceTotal: pkg.subtotal,
    lineCount: lines.length,
  }
}
