import type {
  ArAgingBucket,
  ArAgingRow,
  InvoiceArStatus,
  InvoiceBalanceRow,
  InvoiceRiskLevel,
  InvoiceRiskRow,
  PaymentAllocation,
  PostedInvoice,
  SponsorPayment,
  SponsorRiskRollup,
} from "./types"

export type BuildInvoiceRiskViewParams = {
  invoices: PostedInvoice[]
  balances: InvoiceBalanceRow[]
  aging: ArAgingRow[]
  asOfDate: string
  /** Days since last allocation payment to flag stale partial pay; default 14. */
  stalePaymentDaysThreshold?: number
  allocations?: PaymentAllocation[]
  payments?: SponsorPayment[]
}

function datePart(iso: string): string {
  const t = iso.trim()
  const i = t.indexOf("T")
  return i >= 0 ? t.slice(0, i) : t.slice(0, 10)
}

function daysBetween(earlier: string, later: string): number {
  const a = Date.UTC(
    Number(earlier.slice(0, 4)),
    Number(earlier.slice(5, 7)) - 1,
    Number(earlier.slice(8, 10)),
  )
  const b = Date.UTC(
    Number(later.slice(0, 4)),
    Number(later.slice(5, 7)) - 1,
    Number(later.slice(8, 10)),
  )
  return Math.floor((b - a) / 86400000)
}

function agingBucketFromDaysPastDue(daysPastDue: number): ArAgingBucket {
  if (daysPastDue <= 0) return "current"
  if (daysPastDue <= 30) return "1_30"
  if (daysPastDue <= 60) return "31_60"
  if (daysPastDue <= 90) return "61_90"
  return "91_plus"
}

function isAging31Plus(bucket: ArAgingBucket): boolean {
  return bucket === "31_60" || bucket === "61_90" || bucket === "91_plus"
}

function invoiceMap(invoices: PostedInvoice[]): Map<string, PostedInvoice> {
  const m = new Map<string, PostedInvoice>()
  for (const inv of invoices) m.set(inv.invoiceId, inv)
  return m
}

function agingMap(aging: ArAgingRow[]): Map<string, ArAgingRow> {
  const m = new Map<string, ArAgingRow>()
  for (const row of aging) m.set(row.invoiceId, row)
  return m
}

function lastPaymentDateForInvoice(
  invoiceId: string,
  allocations: PaymentAllocation[],
  payments: SponsorPayment[],
): string | undefined {
  const payDates = new Map(
    payments.map((p) => [p.paymentId, datePart(p.paymentDate)] as const),
  )
  let best: string | undefined
  for (const a of allocations) {
    if (a.invoiceId !== invoiceId) continue
    const d = payDates.get(a.paymentId)
    if (d == null) continue
    if (best == null || d > best) best = d
  }
  return best
}

function computeDaysSinceLastPayment(
  invoiceId: string,
  asOf: string,
  allocations: PaymentAllocation[] | undefined,
  payments: SponsorPayment[] | undefined,
): number | undefined {
  if (!allocations?.length || !payments?.length) return undefined
  const last = lastPaymentDateForInvoice(invoiceId, allocations, payments)
  if (last == null) return undefined
  return daysBetween(last, asOf)
}

function riskLevelRank(level: InvoiceRiskLevel): number {
  if (level === "high") return 0
  if (level === "medium") return 1
  return 2
}

function classifyRisk(
  status: InvoiceArStatus,
  agingBucket: ArAgingBucket,
  daysPastDue: number,
  daysSinceLastPayment: number | undefined,
  staleThreshold: number,
): { level: InvoiceRiskLevel; reasons: string[] } {
  const aging31Plus = isAging31Plus(agingBucket)
  const stalePartial =
    status.partiallyPaid &&
    daysSinceLastPayment != null &&
    daysSinceLastPayment > staleThreshold

  const reasons: string[] = []
  if (status.shortPaid) reasons.push("short_paid")
  if (status.overdue) reasons.push("overdue")
  if (aging31Plus) reasons.push("aging_bucket_31_plus")
  if (stalePartial) reasons.push("partially_paid_stale")

  const highOverdueAged = status.overdue && aging31Plus
  const highShortOverdue = status.shortPaid && status.overdue

  if (highOverdueAged || highShortOverdue) {
    return { level: "high", reasons: [...reasons].sort() }
  }

  /** Overdue in the 1–30 day band (not yet HIGH-tier aging). */
  const mediumOverdue1To30 =
    status.overdue && daysPastDue > 0 && daysPastDue <= 30 && !aging31Plus

  const mediumPartialStale = stalePartial

  if (mediumOverdue1To30 || mediumPartialStale) {
    return { level: "medium", reasons: [...reasons].sort() }
  }

  return { level: "low", reasons: [...reasons].sort() }
}

/**
 * Read-layer: joins posted invoices, AR balance rows, and aging; assigns deterministic risk tier.
 * Does not recompute AR balances or status (pass `balances` from `buildInvoiceBalanceView`).
 */
export function buildInvoiceRiskView(
  params: BuildInvoiceRiskViewParams,
): InvoiceRiskRow[] {
  const asOf = datePart(params.asOfDate)
  const staleThreshold = params.stalePaymentDaysThreshold ?? 14
  const invById = invoiceMap(params.invoices)
  const agingById = agingMap(params.aging)

  const rows: InvoiceRiskRow[] = []

  for (const b of params.balances) {
    const inv = invById.get(b.invoiceId)
    if (inv == null) continue

    const ag = agingById.get(b.invoiceId)
    const due = datePart(b.dueDate)
    const daysPastDue =
      ag != null ? ag.daysPastDue : daysBetween(due, asOf)
    const agingBucket =
      ag != null ? ag.bucket : agingBucketFromDaysPastDue(daysPastDue)

    const daysSinceLastPayment = computeDaysSinceLastPayment(
      b.invoiceId,
      asOf,
      params.allocations,
      params.payments,
    )

    const status: InvoiceArStatus = {
      invoiceId: b.invoiceId,
      invoiceTotal: b.invoiceTotal,
      appliedPayments: b.appliedPayments,
      writeOffs: b.writeOffs,
      invoiceOpenBalance: b.invoiceOpenBalance,
      paid: b.paid,
      partiallyPaid: b.partiallyPaid,
      shortPaid: b.shortPaid,
      writtenOff: b.writtenOff,
      overdue: b.overdue,
    }

    let { level, reasons } = classifyRisk(
      status,
      agingBucket,
      daysPastDue,
      daysSinceLastPayment,
      staleThreshold,
    )

    if (b.invoiceOpenBalance === 0) {
      level = "low"
      reasons = []
    }

    rows.push({
      invoiceId: b.invoiceId,
      sponsorId: b.sponsorId,
      studyId: b.studyId,
      invoiceDate: datePart(inv.postedAt),
      dueDate: due,
      invoiceTotal: b.invoiceTotal,
      appliedPayments: b.appliedPayments,
      writeOffs: b.writeOffs,
      openBalance: b.invoiceOpenBalance,
      status,
      agingBucket,
      daysPastDue,
      daysSinceLastPayment,
      riskLevel: level,
      riskReasons: reasons,
    })
  }

  rows.sort((a, b) => {
    const lr = riskLevelRank(a.riskLevel) - riskLevelRank(b.riskLevel)
    if (lr !== 0) return lr
    if (b.openBalance !== a.openBalance) return b.openBalance - a.openBalance
    return a.invoiceId.localeCompare(b.invoiceId)
  })

  return rows
}

/**
 * Aggregates open balance and counts by risk tier across `InvoiceRiskRow[]`.
 */
export function buildSponsorRiskRollup(riskRows: InvoiceRiskRow[]): SponsorRiskRollup {
  let totalOpenBalance = 0
  let highRiskAmount = 0
  let mediumRiskAmount = 0
  const invoiceCountByRiskLevel: Record<InvoiceRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
  }

  for (const r of riskRows) {
    totalOpenBalance += r.openBalance
    invoiceCountByRiskLevel[r.riskLevel] += 1
    if (r.riskLevel === "high") highRiskAmount += r.openBalance
    if (r.riskLevel === "medium") mediumRiskAmount += r.openBalance
  }

  return {
    totalOpenBalance,
    highRiskAmount,
    mediumRiskAmount,
    invoiceCountByRiskLevel,
  }
}
