import { buildExecutionLinesFromClaimsLedger } from "../post-award-ledger/execution-line-builder"
import type { ExecutionBillableLine } from "../post-award-ledger/execution-lines"
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

function mapExecutionLineToClaimItem(line: ExecutionBillableLine): ClaimItem {
  const status: InvoiceStatus =
    line.disputeStatus === "open"
      ? "disputed"
      : line.autoInvoiceEligible === true
        ? "ready"
        : "partial"

  const requiresReview =
    line.autoInvoiceEligible === false || line.disputeStatus === "open"

  let exceptionReason: string | undefined
  if (line.disputeStatus === "open") {
    const dr = line.disputeReason?.trim()
    exceptionReason = dr && dr.length > 0 ? dr : "Disputed"
  } else if (line.blockingMessages.length > 0) {
    exceptionReason = line.blockingMessages.join("; ")
  }

  const id = line.billableInstanceId
    ? `claim-${line.billableInstanceId}`
    : line.eventLogId
      ? `claim-${line.eventLogId}-${line.lineCode ?? line.feeCode ?? "line"}`
      : nextClaimId()

  const lineCode = line.lineCode ?? line.feeCode ?? ""
  const rawLabel = line.label?.trim()
  const label =
    rawLabel && rawLabel.length > 0
      ? rawLabel
      : (line.activityId ?? line.lineCode ?? line.feeCode ?? "—")

  const eventDate =
    line.eventDate !== undefined && line.eventDate.trim() !== ""
      ? line.eventDate.trim()
      : "1970-01-01T00:00:00.000Z"

  const supportDocumentationComplete = line.evidenceStatus === "complete"
  const approved = line.approvalStatus === "approved"

  return {
    id,
    studyId: line.studyId,
    sponsorId: line.sponsorId,
    subjectId: line.subjectId,
    visitName: line.visitName,
    eventDate,
    lineCode,
    label,
    amount: line.amount,
    supportNote: line.supportNote,
    status,
    requiresReview,
    exceptionReason,
    billableInstanceId:
      line.billableInstanceId.length > 0 ? line.billableInstanceId : undefined,
    eventLogId: line.eventLogId.length > 0 ? line.eventLogId : undefined,
    invoicePeriodStart: line.invoicePeriodStart,
    invoicePeriodEnd: line.invoicePeriodEnd,
    approved,
    supportDocumentationComplete,
  }
}

/**
 * Legacy policy path — to be deprecated. Re-derives invoice gating from raw `ClaimsLedgerRow`;
 * prefer `buildClaimItemsFromExecutionLines` after `buildExecutionLineFromClaimsLedgerRow`.
 */
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
 * Legacy compatibility path — not preferred for new callers.
 * Use `buildClaimItemsCanonical` or `buildClaimItemsFromExecutionLines` after
 * `buildExecutionLinesFromClaimsLedger`.
 */
export function buildClaimItemsFromLedger(ledger: ClaimsLedgerRow[]): ClaimItem[] {
  return ledger.map((row, i) => mapLedgerRowToClaimItem(row, i))
}

export function buildClaimItemsFromExecutionLines(
  lines: ExecutionBillableLine[],
): ClaimItem[] {
  return lines.map((line) => mapExecutionLineToClaimItem(line))
}

export type BuildClaimItemsCanonicalInput = {
  executionLines?: ExecutionBillableLine[]
  ledgerRows?: ClaimsLedgerRow[]
}

/**
 * Canonical policy path for claims: always resolves through `ExecutionBillableLine`
 * (directly or via `buildExecutionLinesFromClaimsLedger`). Does not use legacy
 * `buildClaimItemsFromLedger` / `mapLedgerRowToClaimItem`.
 */
export function buildClaimItemsCanonical(
  input: BuildClaimItemsCanonicalInput,
): ClaimItem[] {
  const exec = input.executionLines
  if (exec !== undefined && exec.length > 0) {
    return buildClaimItemsFromExecutionLines(exec)
  }
  const ledger = input.ledgerRows
  if (ledger !== undefined && ledger.length > 0) {
    const lines = buildExecutionLinesFromClaimsLedger(ledger)
    return buildClaimItemsFromExecutionLines(lines)
  }
  return []
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
  const claimItems =
    input.claimItems !== undefined && input.claimItems.length > 0
      ? input.claimItems
      : buildClaimItemsCanonical({
          executionLines: input.executionLines,
          ledgerRows: input.ledgerRows,
        })

  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const lines = buildInvoiceLinesFromClaimItems(claimItems)
  const byGroup = new Map<string, InvoiceLine[]>()
  for (const line of lines) {
    const claim = claimItems.find((c) => c.id === line.claimItemId)
    if (!claim) continue
    const key = groupKey(claim)
    const arr = byGroup.get(key)
    if (arr) arr.push(line)
    else byGroup.set(key, [line])
  }

  const allExceptions = detectClaimExceptions({ claimItems })

  const packages: InvoicePackage[] = []
  for (const [, groupLines] of byGroup) {
    const first = groupLines[0]
    const claim0 = claimItems.find((c) => c.id === first.claimItemId)!
    const invoicePeriodStart =
      claim0.invoicePeriodStart ?? first.eventDate.slice(0, 10)
    const invoicePeriodEnd =
      claim0.invoicePeriodEnd ?? first.eventDate.slice(0, 10)
    const subtotal = groupLines.reduce((s, l) => s + l.amount, 0)
    const pkgKey = groupKey(claim0)
    const cohort = claimItems.filter((c) => groupKey(c) === pkgKey)
    const cohortIds = new Set(cohort.map((c) => c.id))
    const itemBlocking = cohort.some(
      (c) =>
        c.requiresReview === true ||
        c.status === "partial" ||
        c.status === "disputed",
    )
    const exceptionBlocking = allExceptions.some((e) =>
      cohortIds.has(e.claimItemId),
    )
    const hasBlockingIssues = itemBlocking || exceptionBlocking
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
      hasBlockingIssues,
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
