import { createHash } from "node:crypto"

function hashParts(parts: string[]): string {
  return createHash("sha256").update(parts.join("\x1e")).digest("hex").slice(0, 24)
}

export function stableInvoiceId(input: {
  studyId: string
  sponsorId: string
  invoicePeriodStart: string
  invoicePeriodEnd: string
  generatedAt: string
  subtotal: number
  lineClaimItemIdsSorted: string[]
}): string {
  const lineKey = input.lineClaimItemIdsSorted.join(",")
  return `inv_${hashParts([
    input.studyId,
    input.sponsorId,
    input.invoicePeriodStart,
    input.invoicePeriodEnd,
    input.generatedAt,
    String(input.subtotal),
    lineKey,
  ])}`
}

export function stableInvoiceLineId(invoiceId: string, claimItemId: string): string {
  return `invl_${hashParts([invoiceId, claimItemId])}`
}

export function stablePaymentId(input: {
  sponsorId: string
  paymentDate: string
  amount: number
  reference?: string
  sequence?: string
}): string {
  return `pay_${hashParts([
    input.sponsorId,
    input.paymentDate,
    String(input.amount),
    input.reference ?? "",
    input.sequence ?? "0",
  ])}`
}

export function stableAllocationId(input: {
  paymentId: string
  invoiceId: string
  invoiceLineId: string
  amount: number
  ordinal: number
}): string {
  return `alloc_${hashParts([
    input.paymentId,
    input.invoiceId,
    input.invoiceLineId,
    String(input.amount),
    String(input.ordinal),
  ])}`
}

export function stableAdjustmentId(input: {
  invoiceId: string
  invoiceLineId: string
  amount: number
  reason: string
  createdAt: string
  ordinal: number
}): string {
  return `adj_${hashParts([
    input.invoiceId,
    input.invoiceLineId,
    String(input.amount),
    input.reason,
    input.createdAt,
    String(input.ordinal),
  ])}`
}
