/**
 * Module 6 v1 — post-invoice AR / cash application (deterministic, no UI).
 * Consumes InvoicePackage as pre-cash obligation truth.
 */

export type PostedInvoiceLine = {
  invoiceLineId: string
  invoiceId: string
  claimItemId: string
  studyId: string
  sponsorId: string
  eventDate: string
  lineCode: string
  label: string
  amount: number
}

export type PostedInvoice = {
  schemaVersion: "1.0"
  invoiceId: string
  studyId: string
  sponsorId: string
  invoicePeriodStart: string
  invoicePeriodEnd: string
  postedAt: string
  /** Due date for overdue / aging (ISO date string YYYY-MM-DD). */
  dueDate: string
  /**
   * When true, unresolved balance after payments is treated as short-paid for status
   * even if asOfDate is not past due (e.g. settlement closed without full pay).
   */
  settlementFinalized?: boolean
  lines: PostedInvoiceLine[]
  invoiceTotal: number
  lineCount: number
}

export type SponsorPayment = {
  paymentId: string
  sponsorId: string
  amount: number
  /** ISO date (YYYY-MM-DD or full ISO). */
  paymentDate: string
  reference?: string
}

export type PaymentAllocation = {
  allocationId: string
  paymentId: string
  invoiceId: string
  /**
   * When omitted, amount is applied FIFO across lines by eventDate (then claimItemId).
   */
  invoiceLineId?: string
  amount: number
}

export type BalanceAdjustmentType = "write_off"

export type BalanceAdjustment = {
  adjustmentId: string
  type: BalanceAdjustmentType
  invoiceId: string
  /** When omitted, write-off applies FIFO across lines (same order as header allocations). */
  invoiceLineId?: string
  amount: number
  reason?: string
  createdAt: string
}

/** Derived invoice AR status (header-level; refreshable from ledger inputs). */
export type InvoiceArStatus = {
  invoiceId: string
  invoiceTotal: number
  appliedPayments: number
  writeOffs: number
  invoiceOpenBalance: number
  /** openBalance === 0 and writeOffs === 0 (cash/settlement closed without write-off). */
  paid: boolean
  /** applied > 0, open > 0, and not short_paid (e.g. partial pay before due and not finalized short). */
  partiallyPaid: boolean
  /** Underpaid with no write-off, after due or settlement finalized. */
  shortPaid: boolean
  /** Closed with write-off contributing; not full cash to invoiceTotal. */
  writtenOff: boolean
  /** openBalance > 0 and asOfDate > dueDate. */
  overdue: boolean
}

export type InvoiceBalanceRow = InvoiceArStatus & {
  sponsorId: string
  studyId: string
  dueDate: string
  postedAt: string
  invoicePeriodStart: string
  invoicePeriodEnd: string
}

export type PostedInvoiceLineBalance = {
  invoiceLineId: string
  invoiceId: string
  claimItemId: string
  lineAmount: number
  appliedPayments: number
  writeOffs: number
  lineOpenBalance: number
}

export type SponsorArRollupRow = {
  sponsorId: string
  outstandingAr: number
  invoiceCount: number
  openInvoiceIds: string[]
}

export type UnappliedCashRow = {
  paymentId: string
  sponsorId: string
  paymentAmount: number
  allocatedAmount: number
  paymentUnappliedBalance: number
  paymentDate: string
  reference?: string
}

export type ArAgingBucket = "current" | "1_30" | "31_60" | "61_90" | "91_plus"

export type ArAgingRow = {
  invoiceId: string
  sponsorId: string
  studyId: string
  dueDate: string
  invoiceOpenBalance: number
  bucket: ArAgingBucket
  daysPastDue: number
}

/** Collections / revenue risk read-layer (deterministic; no AR math). */
export type InvoiceRiskLevel = "low" | "medium" | "high"

export type InvoiceRiskRow = {
  invoiceId: string
  sponsorId: string
  studyId: string
  /** Post / issue date (date part of PostedInvoice.postedAt). */
  invoiceDate: string
  dueDate: string

  invoiceTotal: number
  appliedPayments: number
  writeOffs: number
  openBalance: number

  status: InvoiceArStatus
  agingBucket: ArAgingBucket

  daysPastDue: number
  daysSinceLastPayment?: number

  riskLevel: InvoiceRiskLevel
  riskReasons: string[]
}

/** Portfolio totals from `buildSponsorRiskRollup` (all sponsors combined). */
export type SponsorRiskRollup = {
  totalOpenBalance: number
  highRiskAmount: number
  mediumRiskAmount: number
  invoiceCountByRiskLevel: Record<InvoiceRiskLevel, number>
}

/** Operational collections queue on top of `InvoiceRiskRow` (read-only). */
export type CollectionsAction =
  | "contact_now"
  | "review_short_pay"
  | "follow_up_this_week"
  | "monitor"

export type CollectionsActionRow = {
  invoiceId: string
  sponsorId: string
  studyId: string
  riskLevel: InvoiceRiskLevel
  riskReasons: string[]
  openBalance: number
  daysPastDue: number
  recommendedAction: CollectionsAction
  priorityRank: number
}

export type BuildCollectionsActionQueueParams = {
  riskRows: InvoiceRiskRow[]
}

/** Single read-only snapshot for ops (aggregates risk + collections queue outputs). */
export type ArCommandSummary = {
  asOfDate: string
  totalOutstandingAr: number
  totalHighRiskAr: number
  totalMediumRiskAr: number
  totalLowRiskAr: number
  overdueInvoiceCount: number
  shortPaidInvoiceCount: number
  invoicesRequiringActionNow: number
  topPriorityInvoices: CollectionsActionRow[]
}

export type BuildArCommandSummaryParams = {
  asOfDate: string
  riskRows: InvoiceRiskRow[]
  queueRows: CollectionsActionRow[]
  topN?: number
}
