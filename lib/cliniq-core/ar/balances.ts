import type {
  BalanceAdjustment,
  InvoiceArStatus,
  PaymentAllocation,
  PostedInvoice,
  PostedInvoiceLineBalance,
  SponsorPayment,
} from "./types"

function sortedLines(invoice: PostedInvoice): PostedInvoice["lines"] {
  return [...invoice.lines].sort((a, b) => {
    const d = a.eventDate.localeCompare(b.eventDate)
    if (d !== 0) return d
    return a.claimItemId.localeCompare(b.claimItemId)
  })
}

function allocationSortKey(a: PaymentAllocation): string {
  return `${a.paymentId}\x1f${a.allocationId}`
}

/**
 * Distributes header-level amounts FIFO across lines by remaining capacity.
 */
function fifoDistribute(
  lines: PostedInvoice["lines"],
  amount: number,
  remainingCapacity: Map<string, number>,
): Map<string, number> {
  const delta = new Map<string, number>()
  let left = amount
  for (const line of lines) {
    if (left <= 0) break
    const cap = remainingCapacity.get(line.invoiceLineId) ?? 0
    const take = Math.min(left, Math.max(0, cap))
    if (take > 0) {
      delta.set(line.invoiceLineId, (delta.get(line.invoiceLineId) ?? 0) + take)
      remainingCapacity.set(line.invoiceLineId, cap - take)
      left -= take
    }
  }
  return delta
}

export type ArLedgerInput = {
  invoices: PostedInvoice[]
  payments: SponsorPayment[]
  allocations: PaymentAllocation[]
  adjustments: BalanceAdjustment[]
}

/**
 * Invoice-level applied payments and write-offs (raw sums for that invoice).
 */
export function sumAllocationsForInvoice(
  allocations: PaymentAllocation[],
  invoiceId: string,
): number {
  return allocations
    .filter((a) => a.invoiceId === invoiceId)
    .reduce((s, a) => s + a.amount, 0)
}

export function sumWriteOffsForInvoice(
  adjustments: BalanceAdjustment[],
  invoiceId: string,
): number {
  return adjustments
    .filter((a) => a.invoiceId === invoiceId && a.type === "write_off")
    .reduce((s, a) => s + a.amount, 0)
}

export function allocatedAmountForPayment(
  allocations: PaymentAllocation[],
  paymentId: string,
): number {
  return allocations
    .filter((a) => a.paymentId === paymentId)
    .reduce((s, a) => s + a.amount, 0)
}

export function paymentUnappliedBalance(
  payment: SponsorPayment,
  allocations: PaymentAllocation[],
): number {
  return payment.amount - allocatedAmountForPayment(allocations, payment.paymentId)
}

/**
 * Per-line applied payments and write-offs: explicit line targets + FIFO for header-only rows.
 */
export function computeLinePaymentAndWriteOffMaps(
  invoice: PostedInvoice,
  allocations: PaymentAllocation[],
  adjustments: BalanceAdjustment[],
): { applied: Map<string, number>; writeOff: Map<string, number> } {
  const order = sortedLines(invoice)
  const lineIds = order.map((l) => l.invoiceLineId)
  const applied = new Map<string, number>(lineIds.map((id) => [id, 0]))
  const writeOff = new Map<string, number>(lineIds.map((id) => [id, 0]))

  const invAllocs = allocations
    .filter((a) => a.invoiceId === invoice.invoiceId)
    .sort((a, b) => allocationSortKey(a).localeCompare(allocationSortKey(b)))

  const explicit = invAllocs.filter((a) => a.invoiceLineId != null && a.invoiceLineId !== "")
  const header = invAllocs.filter((a) => a.invoiceLineId == null || a.invoiceLineId === "")

  for (const a of explicit) {
    const lid = a.invoiceLineId as string
    applied.set(lid, (applied.get(lid) ?? 0) + a.amount)
  }

  const capacityAfterPay = (): Map<string, number> => {
    const m = new Map<string, number>()
    for (const line of order) {
      const lineAmt = line.amount
      const already = applied.get(line.invoiceLineId) ?? 0
      m.set(line.invoiceLineId, Math.max(0, lineAmt - already))
    }
    return m
  }

  for (const a of header) {
    const cap = capacityAfterPay()
    const dist = fifoDistribute(order, a.amount, cap)
    for (const [lid, add] of dist) {
      applied.set(lid, (applied.get(lid) ?? 0) + add)
    }
  }

  const invAdj = adjustments
    .filter((x) => x.invoiceId === invoice.invoiceId && x.type === "write_off")
    .sort((a, b) => `${a.createdAt}\x1f${a.adjustmentId}`.localeCompare(`${b.createdAt}\x1f${b.adjustmentId}`))

  const explicitWo = invAdj.filter((x) => x.invoiceLineId != null && x.invoiceLineId !== "")
  const headerWo = invAdj.filter((x) => x.invoiceLineId == null || x.invoiceLineId === "")

  for (const x of explicitWo) {
    const lid = x.invoiceLineId as string
    writeOff.set(lid, (writeOff.get(lid) ?? 0) + x.amount)
  }

  const capacityAfterWo = (): Map<string, number> => {
    const m = new Map<string, number>()
    for (const line of order) {
      const lineAmt = line.amount
      const pay = applied.get(line.invoiceLineId) ?? 0
      const wo = writeOff.get(line.invoiceLineId) ?? 0
      m.set(line.invoiceLineId, Math.max(0, lineAmt - pay - wo))
    }
    return m
  }

  for (const x of headerWo) {
    const cap = capacityAfterWo()
    const dist = fifoDistribute(order, x.amount, cap)
    for (const [lid, add] of dist) {
      writeOff.set(lid, (writeOff.get(lid) ?? 0) + add)
    }
  }

  return { applied, writeOff }
}

export function computePostedInvoiceLineBalances(
  invoice: PostedInvoice,
  allocations: PaymentAllocation[],
  adjustments: BalanceAdjustment[],
): PostedInvoiceLineBalance[] {
  const { applied, writeOff } = computeLinePaymentAndWriteOffMaps(
    invoice,
    allocations,
    adjustments,
  )
  return invoice.lines.map((l) => {
    const ap = applied.get(l.invoiceLineId) ?? 0
    const wo = writeOff.get(l.invoiceLineId) ?? 0
    return {
      invoiceLineId: l.invoiceLineId,
      invoiceId: l.invoiceId,
      claimItemId: l.claimItemId,
      lineAmount: l.amount,
      appliedPayments: ap,
      writeOffs: wo,
      lineOpenBalance: l.amount - ap - wo,
    }
  })
}

export function computeInvoiceArStatus(
  invoice: PostedInvoice,
  allocations: PaymentAllocation[],
  adjustments: BalanceAdjustment[],
  asOfDate: string,
): InvoiceArStatus {
  const appliedPayments = sumAllocationsForInvoice(allocations, invoice.invoiceId)
  const writeOffs = sumWriteOffsForInvoice(adjustments, invoice.invoiceId)
  const invoiceOpenBalance = invoice.invoiceTotal - appliedPayments - writeOffs

  const asOf = datePart(asOfDate)
  const due = datePart(invoice.dueDate)
  const pastDue = asOf > due

  const overdue = invoiceOpenBalance > 0 && pastDue

  const shortPaid =
    appliedPayments > 0 &&
    invoiceOpenBalance > 0 &&
    writeOffs === 0 &&
    (pastDue || invoice.settlementFinalized === true)

  const partiallyPaid =
    appliedPayments > 0 && invoiceOpenBalance > 0 && !shortPaid

  const paid = invoiceOpenBalance === 0 && writeOffs === 0

  const writtenOff =
    invoiceOpenBalance === 0 &&
    writeOffs > 0 &&
    appliedPayments < invoice.invoiceTotal

  return {
    invoiceId: invoice.invoiceId,
    invoiceTotal: invoice.invoiceTotal,
    appliedPayments,
    writeOffs,
    invoiceOpenBalance,
    paid,
    partiallyPaid,
    shortPaid,
    writtenOff,
    overdue,
  }
}

function datePart(iso: string): string {
  const t = iso.trim()
  const i = t.indexOf("T")
  return i >= 0 ? t.slice(0, i) : t.slice(0, 10)
}

export function computeAllInvoiceStatuses(
  input: ArLedgerInput,
  asOfDate: string,
): Map<string, InvoiceArStatus> {
  const map = new Map<string, InvoiceArStatus>()
  for (const inv of input.invoices) {
    map.set(
      inv.invoiceId,
      computeInvoiceArStatus(inv, input.allocations, input.adjustments, asOfDate),
    )
  }
  return map
}
