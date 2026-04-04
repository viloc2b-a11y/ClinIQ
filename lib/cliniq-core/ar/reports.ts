import type {
  ArAgingBucket,
  ArAgingRow,
  InvoiceBalanceRow,
  SponsorArRollupRow,
  UnappliedCashRow,
} from "./types"
import type { ArLedgerInput } from "./balances"
import {
  allocatedAmountForPayment,
  computeInvoiceArStatus,
  sumAllocationsForInvoice,
  sumWriteOffsForInvoice,
} from "./balances"

function datePart(iso: string): string {
  const t = iso.trim()
  const i = t.indexOf("T")
  return i >= 0 ? t.slice(0, i) : t.slice(0, 10)
}

function daysBetween(due: string, asOf: string): number {
  const a = Date.UTC(
    Number(due.slice(0, 4)),
    Number(due.slice(5, 7)) - 1,
    Number(due.slice(8, 10)),
  )
  const b = Date.UTC(
    Number(asOf.slice(0, 4)),
    Number(asOf.slice(5, 7)) - 1,
    Number(asOf.slice(8, 10)),
  )
  return Math.floor((b - a) / 86400000)
}

function agingBucket(daysPastDue: number): ArAgingBucket {
  if (daysPastDue <= 0) return "current"
  if (daysPastDue <= 30) return "1_30"
  if (daysPastDue <= 60) return "31_60"
  if (daysPastDue <= 90) return "61_90"
  return "91_plus"
}

/**
 * One row per posted invoice with balances and deterministic flags.
 */
export function buildInvoiceBalanceView(
  input: ArLedgerInput,
  asOfDate: string,
): InvoiceBalanceRow[] {
  return input.invoices.map((inv) => {
    const st = computeInvoiceArStatus(inv, input.allocations, input.adjustments, asOfDate)
    return {
      ...st,
      sponsorId: inv.sponsorId,
      studyId: inv.studyId,
      dueDate: inv.dueDate,
      postedAt: inv.postedAt,
      invoicePeriodStart: inv.invoicePeriodStart,
      invoicePeriodEnd: inv.invoicePeriodEnd,
    }
  })
}

/**
 * Sponsor-level outstanding AR (sum of positive open balances).
 */
export function buildSponsorArRollup(
  input: ArLedgerInput,
  asOfDate: string,
): SponsorArRollupRow[] {
  const bySponsor = new Map<
    string,
    { outstanding: number; ids: Set<string> }
  >()

  for (const inv of input.invoices) {
    const st = computeInvoiceArStatus(inv, input.allocations, input.adjustments, asOfDate)
    const open = Math.max(0, st.invoiceOpenBalance)
    if (open <= 0) continue
    const cur = bySponsor.get(inv.sponsorId) ?? {
      outstanding: 0,
      ids: new Set<string>(),
    }
    cur.outstanding += open
    cur.ids.add(inv.invoiceId)
    bySponsor.set(inv.sponsorId, cur)
  }

  return [...bySponsor.entries()]
    .map(([sponsorId, v]) => ({
      sponsorId,
      outstandingAr: v.outstanding,
      invoiceCount: v.ids.size,
      openInvoiceIds: [...v.ids].sort(),
    }))
    .sort((a, b) => a.sponsorId.localeCompare(b.sponsorId))
}

/**
 * Per-payment unapplied cash (payment amount minus sum of allocations).
 */
export function buildUnappliedCashView(
  input: ArLedgerInput,
): UnappliedCashRow[] {
  return input.payments.map((p) => {
    const allocated = allocatedAmountForPayment(input.allocations, p.paymentId)
    return {
      paymentId: p.paymentId,
      sponsorId: p.sponsorId,
      paymentAmount: p.amount,
      allocatedAmount: allocated,
      paymentUnappliedBalance: p.amount - allocated,
      paymentDate: p.paymentDate,
      reference: p.reference,
    }
  })
}

export type InvoiceBalanceDetailRow = InvoiceBalanceRow & {
  lineCount: number
  /** Sum of line amounts (sanity vs invoiceTotal). */
  linesSum: number
}

/**
 * Invoice balance view with optional line-sum check.
 */
export function buildInvoiceBalanceDetailView(
  input: ArLedgerInput,
  asOfDate: string,
): InvoiceBalanceDetailRow[] {
  return buildInvoiceBalanceView(input, asOfDate).map((row) => {
    const inv = input.invoices.find((i) => i.invoiceId === row.invoiceId)
    const linesSum = inv?.lines.reduce((s, l) => s + l.amount, 0) ?? 0
    return {
      ...row,
      lineCount: inv?.lineCount ?? 0,
      linesSum,
    }
  })
}

/**
 * AR aging by invoice due date (open balance only).
 */
export function buildArAgingByDueDate(
  input: ArLedgerInput,
  asOfDate: string,
): ArAgingRow[] {
  const asOf = datePart(asOfDate)
  const rows: ArAgingRow[] = []

  for (const inv of input.invoices) {
    const applied = sumAllocationsForInvoice(input.allocations, inv.invoiceId)
    const wo = sumWriteOffsForInvoice(input.adjustments, inv.invoiceId)
    const invoiceOpenBalance = inv.invoiceTotal - applied - wo
    if (invoiceOpenBalance <= 0) continue

    const due = datePart(inv.dueDate)
    const daysPastDue = daysBetween(due, asOf)
    rows.push({
      invoiceId: inv.invoiceId,
      sponsorId: inv.sponsorId,
      studyId: inv.studyId,
      dueDate: due,
      invoiceOpenBalance,
      bucket: agingBucket(daysPastDue),
      daysPastDue,
    })
  }

  return rows.sort((a, b) => {
    const d = b.daysPastDue - a.daysPastDue
    if (d !== 0) return d
    return a.invoiceId.localeCompare(b.invoiceId)
  })
}
