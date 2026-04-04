import type {
  BuildAgingReportInput,
  BuildInvoicePackageInput,
  ClaimException,
  ClaimItem,
  ClaimPackage,
  ClaimsLedgerRow,
  DetectClaimExceptionsInput,
  InvoiceLine,
  InvoicePackage,
  InvoiceStatus,
  AgingEntry,
} from "./types"

let claimSeq = 0

function nextClaimId(): string {
  claimSeq += 1
  return `claim-${claimSeq}`
}

function mapLedgerRowToClaimItem(row: ClaimsLedgerRow, index: number): ClaimItem {
  const supportDocumentationComplete =
    row.supportDocumentationComplete !== false

  let status: InvoiceStatus
  let requiresReview = false
  let exceptionReason: string | undefined

  if (row.amount <= 0) {
    status = "partial"
    requiresReview = true
    exceptionReason = "Non-positive amount"
  } else if (row.disputed) {
    status = "disputed"
    requiresReview = true
    exceptionReason = row.disputeReason ?? "Disputed line"
  } else if (row.nonMatching) {
    status = "disputed"
    requiresReview = true
    exceptionReason = row.nonMatchingReason ?? "Non-matching line"
  } else if (row.markedOverdue) {
    status = "overdue"
    requiresReview = true
    exceptionReason = "Outstanding past invoice window"
  } else if (!row.approved) {
    status = "partial"
    requiresReview = true
    exceptionReason = "Pending approval"
  } else if (!supportDocumentationComplete) {
    status = "partial"
    requiresReview = true
    exceptionReason = "Missing support documentation"
  } else {
    status = "ready"
  }

  const id = row.billableInstanceId
    ? `claim-${row.billableInstanceId}`
    : row.eventLogId
      ? `claim-${row.eventLogId}-${row.lineCode}-${index}`
      : nextClaimId()

  return {
    id,
    studyId: row.studyId,
    sponsorId: row.sponsorId,
    subjectId: row.subjectId,
    visitName: row.visitName,
    eventDate: row.eventDate,
    lineCode: row.lineCode,
    label: row.label,
    amount: row.amount,
    supportNote: row.supportNote,
    status,
    requiresReview,
    exceptionReason,
    billableInstanceId: row.billableInstanceId,
    eventLogId: row.eventLogId,
    invoicePeriodStart: row.invoicePeriodStart,
    invoicePeriodEnd: row.invoicePeriodEnd,
    approved: row.approved,
    supportDocumentationComplete,
  }
}

/**
 * Build claim items from operational ledger rows (billable + site context).
 * Only rows with `approved === true` and positive amount are eligible for invoice;
 * engine still emits ClaimItems for all rows so exceptions can be detected.
 */
export function buildClaimItemsFromLedger(ledger: ClaimsLedgerRow[]): ClaimItem[] {
  return ledger.map((row, i) => mapLedgerRowToClaimItem(row, i))
}

export function isInvoiceReadyClaimItem(item: ClaimItem): boolean {
  return (
    item.approved &&
    item.supportDocumentationComplete &&
    item.amount > 0 &&
    item.status === "ready" &&
    !item.requiresReview
  )
}

export function buildInvoiceLinesFromClaimItems(
  items: ClaimItem[],
): InvoiceLine[] {
  return items.filter(isInvoiceReadyClaimItem).map((c) => ({
    id: `invln-${c.id}`,
    studyId: c.studyId,
    sponsorId: c.sponsorId,
    subjectId: c.subjectId,
    visitName: c.visitName,
    eventDate: c.eventDate,
    lineCode: c.lineCode,
    label: c.label,
    amount: c.amount,
    supportNote: c.supportNote,
    status: c.status,
    claimItemId: c.id,
  }))
}

function groupKey(c: ClaimItem): string {
  const s = c.sponsorId ?? "unknown-sponsor"
  const p0 = c.invoicePeriodStart ?? "default-start"
  const p1 = c.invoicePeriodEnd ?? "default-end"
  return `${s}::${c.studyId}::${p0}::${p1}`
}

/**
 * One invoice package per (sponsorId, studyId, invoice period); only invoice-ready lines.
 */
export function buildInvoicePackage(
  input: BuildInvoicePackageInput,
): InvoicePackage[] {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const lines = buildInvoiceLinesFromClaimItems(input.claimItems)
  const byGroup = new Map<string, InvoiceLine[]>()
  for (const line of lines) {
    const claim = input.claimItems.find((c) => c.id === line.claimItemId)
    if (!claim) continue
    const key = groupKey(claim)
    const arr = byGroup.get(key)
    if (arr) arr.push(line)
    else byGroup.set(key, [line])
  }

  const packages: InvoicePackage[] = []
  for (const [, groupLines] of byGroup) {
    const first = groupLines[0]
    const claim0 = input.claimItems.find((c) => c.id === first.claimItemId)!
    const invoicePeriodStart =
      claim0.invoicePeriodStart ?? first.eventDate.slice(0, 10)
    const invoicePeriodEnd =
      claim0.invoicePeriodEnd ?? first.eventDate.slice(0, 10)
    const subtotal = groupLines.reduce((s, l) => s + l.amount, 0)
    packages.push({
      schemaVersion: "1.0",
      studyId: first.studyId,
      sponsorId: claim0.sponsorId ?? "unknown-sponsor",
      invoicePeriodStart,
      invoicePeriodEnd,
      generatedAt,
      lines: groupLines.sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
      subtotal,
      lineCount: groupLines.length,
      hasBlockingIssues: false,
    })
  }

  packages.sort((a, b) =>
    `${a.sponsorId}-${a.studyId}`.localeCompare(`${b.sponsorId}-${b.studyId}`),
  )
  return packages
}

export function detectClaimExceptions(
  input: DetectClaimExceptionsInput,
): ClaimException[] {
  const out: ClaimException[] = []
  for (const c of input.claimItems) {
    if (
      c.requiresReview ||
      c.status === "disputed" ||
      c.status === "overdue" ||
      (c.status === "partial" && c.exceptionReason)
    ) {
      out.push({
        id: `exc-${c.id}`,
        claimItemId: c.id,
        studyId: c.studyId,
        sponsorId: c.sponsorId,
        lineCode: c.lineCode,
        label: c.label,
        exceptionReason:
          c.exceptionReason ??
          c.supportNote ??
          "Requires review",
        requiresReview: c.requiresReview || c.status !== "ready",
        amount: c.amount,
      })
    }
  }
  return out
}

function daysBetween(isoFrom: string, isoTo: string): number {
  const a = new Date(isoFrom.slice(0, 10)).getTime()
  const b = new Date(isoTo.slice(0, 10)).getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/**
 * Aging: overdue lines, plus review queue items past `reviewAgingDays`.
 */
export function buildAgingReport(input: BuildAgingReportInput): AgingEntry[] {
  const reviewDays = input.reviewAgingDays ?? 14
  const out: AgingEntry[] = []

  for (const c of input.claimItems) {
    const daysOutstanding = daysBetween(c.eventDate, input.asOf)
    const reviewStale =
      c.requiresReview &&
      daysOutstanding >= reviewDays &&
      c.status !== "invoiced" &&
      c.status !== "overdue"

    if (c.status === "overdue") {
      out.push({
        id: `age-${c.id}-overdue`,
        studyId: c.studyId,
        sponsorId: c.sponsorId,
        subjectId: c.subjectId,
        lineCode: c.lineCode,
        label: c.label,
        amount: c.amount,
        status: c.status,
        eventDate: c.eventDate,
        daysOutstanding,
        supportNote: c.supportNote,
        requiresReview: c.requiresReview,
      })
      continue
    }

    if (reviewStale) {
      out.push({
        id: `age-${c.id}-review`,
        studyId: c.studyId,
        sponsorId: c.sponsorId,
        subjectId: c.subjectId,
        lineCode: c.lineCode,
        label: c.label,
        amount: c.amount,
        status: c.status,
        eventDate: c.eventDate,
        daysOutstanding,
        supportNote: c.supportNote,
        requiresReview: true,
      })
    }
  }

  out.sort((a, b) => b.daysOutstanding - a.daysOutstanding)
  return out
}

export function buildClaimPackage(
  claimItems: ClaimItem[],
  generatedAt?: string,
): ClaimPackage {
  const at = generatedAt ?? new Date().toISOString()
  const studyIds = [...new Set(claimItems.map((c) => c.studyId))].sort()
  const invoiceReadyItems = claimItems.filter(isInvoiceReadyClaimItem)
  const reviewNeededItems = claimItems.filter((c) => !isInvoiceReadyClaimItem(c))
  return {
    schemaVersion: "1.0",
    generatedAt: at,
    studyIds,
    allClaimItems: claimItems,
    invoiceReadyItems,
    reviewNeededItems,
    claimExceptions: detectClaimExceptions({ claimItems }),
  }
}
