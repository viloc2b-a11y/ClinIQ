/**
 * Leakage v2 — build traceable items from expected billables vs ledger / claims / invoices.
 * Pure: no input mutation, deterministic ordering and matching.
 */

import type { ClaimItem, ClaimsLedgerRow, InvoiceLine, InvoicePackage } from "../claims/types"
import type { LeakageTraceItem, LeakageTraceResult, LeakageTraceSummary } from "./leakage-types"
import type { ExpectedBillable } from "./types"

// ---------------------------------------------------------------------------
// Small normalization helpers (shape inconsistencies → comparable keys)
// ---------------------------------------------------------------------------

/** Trim whitespace; line codes compared after normalization. */
export function normalizeLineCode(lineCode: string): string {
  return lineCode.trim()
}

/** Visit label match key: trim + lowercase. */
export function normalizeVisitName(name: string): string {
  return name.trim().toLowerCase()
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Sum invoice line amounts for the given claim ids (deterministic walk order of lines). */
export function sumInvoiceAmountForExpected(
  claimIds: ReadonlySet<string>,
  lines: readonly InvoiceLine[],
): number {
  let s = 0
  for (const ln of lines) {
    if (claimIds.has(ln.claimItemId)) s += ln.amount
  }
  return roundMoney(s)
}

function studyMatchesExpected(eb: ExpectedBillable, studyId: string): boolean {
  const s = eb.studyId
  if (s !== undefined && s !== "") return s === studyId
  return true
}

export function findMatchingLedgerRows(
  eb: ExpectedBillable,
  ledgers: readonly ClaimsLedgerRow[],
): ClaimsLedgerRow[] {
  return ledgers.filter((row) => {
    if (!studyMatchesExpected(eb, row.studyId)) return false
    if (normalizeLineCode(row.lineCode) !== normalizeLineCode(eb.lineCode)) return false
    return normalizeVisitName(row.visitName ?? "") === normalizeVisitName(eb.visitName)
  })
}

export function findMatchingClaimItems(
  eb: ExpectedBillable,
  claims: readonly ClaimItem[],
  matchedLedgers: readonly ClaimsLedgerRow[],
): ClaimItem[] {
  return claims.filter((c) => claimMatchesExpected(eb, c, matchedLedgers))
}

function claimMatchesExpected(
  eb: ExpectedBillable,
  c: ClaimItem,
  matchedLedgers: readonly ClaimsLedgerRow[],
): boolean {
  if (!studyMatchesExpected(eb, c.studyId)) return false
  if (normalizeLineCode(c.lineCode) !== normalizeLineCode(eb.lineCode)) return false
  if (normalizeVisitName(c.visitName ?? "") !== normalizeVisitName(eb.visitName)) return false

  if (matchedLedgers.length === 0) return true

  const ledgerIds = new Set(
    matchedLedgers.flatMap((l) => [l.billableInstanceId, l.eventLogId].filter(Boolean) as string[]),
  )
  if (ledgerIds.size === 0) return true

  const cid = c.billableInstanceId ?? c.eventLogId
  if (cid && ledgerIds.has(cid)) return true

  return matchedLedgers.some(
    (l) =>
      (l.billableInstanceId && l.billableInstanceId === c.billableInstanceId) ||
      (l.eventLogId && l.eventLogId === c.eventLogId),
  )
}

// ---------------------------------------------------------------------------
// Reason inference (deterministic global passes: all claims, then all ledgers, then money)
// ---------------------------------------------------------------------------

type Reason =
  | "not_invoiced"
  | "partially_invoiced"
  | "claim_blocked"
  | "missing_documentation"
  | "requires_review"
  | "not_generated"
  | "unknown"

function claimNeedsReview(c: ClaimItem): boolean {
  return c.requiresReview
}

function claimBlockedByInvoiceStatus(c: ClaimItem): boolean {
  return c.status === "disputed" || c.status === "partial" || c.status === "overdue"
}

function claimNotApproved(c: ClaimItem): boolean {
  return !c.approved
}

function claimDocsIncomplete(c: ClaimItem): boolean {
  return !c.supportDocumentationComplete
}

/**
 * Highest-priority reason implied by this claim alone (same ordering as global passes).
 * Useful for unit tests and single-row diagnostics.
 */
export function inferReasonFromClaim(c: ClaimItem): Reason | null {
  if (claimNeedsReview(c)) return "requires_review"
  if (claimBlockedByInvoiceStatus(c)) return "claim_blocked"
  if (claimNotApproved(c)) return "claim_blocked"
  if (claimDocsIncomplete(c)) return "missing_documentation"
  return null
}

function inferReasonFromClaimsGlobal(matchedClaims: readonly ClaimItem[]): Reason | null {
  if (matchedClaims.some(claimNeedsReview)) return "requires_review"
  if (matchedClaims.some(claimBlockedByInvoiceStatus)) return "claim_blocked"
  if (matchedClaims.some(claimNotApproved)) return "claim_blocked"
  if (matchedClaims.some(claimDocsIncomplete)) return "missing_documentation"
  return null
}

function ledgerBlockedByFlags(l: ClaimsLedgerRow): boolean {
  return Boolean(l.disputed || l.nonMatching || l.markedOverdue)
}

function ledgerNotApproved(l: ClaimsLedgerRow): boolean {
  return !l.approved
}

function ledgerDocsIncomplete(l: ClaimsLedgerRow): boolean {
  return l.supportDocumentationComplete === false
}

function inferReasonFromLedgersGlobal(matchedLedgers: readonly ClaimsLedgerRow[]): Reason | null {
  if (matchedLedgers.some(ledgerBlockedByFlags)) return "claim_blocked"
  if (matchedLedgers.some(ledgerNotApproved)) return "claim_blocked"
  if (matchedLedgers.some(ledgerDocsIncomplete)) return "missing_documentation"
  return null
}

function inferReason(args: {
  matchedClaims: ClaimItem[]
  matchedLedgers: ClaimsLedgerRow[]
  invoicedAmount: number
  expectedAmount: number
}): Reason {
  const { matchedClaims, matchedLedgers, invoicedAmount, expectedAmount } = args
  const hasDownstream = matchedClaims.length > 0 || matchedLedgers.length > 0

  const fromClaims = inferReasonFromClaimsGlobal(matchedClaims)
  if (fromClaims) return fromClaims

  const fromLedgers = inferReasonFromLedgersGlobal(matchedLedgers)
  if (fromLedgers) return fromLedgers

  if (!hasDownstream) return "not_generated"
  if (invoicedAmount === 0) return "not_invoiced"
  if (invoicedAmount > 0 && invoicedAmount < expectedAmount) return "partially_invoiced"
  return "unknown"
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildLeakageTrace(params: {
  expectedBillables: ExpectedBillable[]
  ledgerRows?: any[]
  claimItems?: any[]
  invoicePackages?: any[]
}): LeakageTraceResult {
  const ledgers = (params.ledgerRows ?? []) as ClaimsLedgerRow[]
  const claims = (params.claimItems ?? []) as ClaimItem[]
  const packages = (params.invoicePackages ?? []) as InvoicePackage[]

  const invoiceLines: InvoiceLine[] = packages.flatMap((p) => p.lines ?? [])

  const items: LeakageTraceItem[] = []

  for (const eb of params.expectedBillables) {
    const trace = buildTraceForExpected(eb, ledgers, claims, invoiceLines)
    if (trace) {
      items.push(trace)
    }
  }

  items.sort(compareTraceItems)

  return {
    items,
    summary: summarize(items),
  }
}

/** Stable ordering: study → subject → visit → lineCode (localeCompare). */
function compareTraceItems(a: LeakageTraceItem, b: LeakageTraceItem): number {
  if (a.studyId !== b.studyId) return a.studyId.localeCompare(b.studyId)
  if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId)
  if (a.visitName !== b.visitName) return a.visitName.localeCompare(b.visitName)
  return a.lineCode.localeCompare(b.lineCode)
}

function summarize(items: LeakageTraceItem[]): LeakageTraceSummary {
  let totalExpectedAmount = 0
  let totalInvoicedAmount = 0
  let totalMissingAmount = 0
  let missingCount = 0
  let partialCount = 0
  let blockedCount = 0

  for (const it of items) {
    totalExpectedAmount += it.expectedAmount
    totalInvoicedAmount += it.invoicedAmount
    totalMissingAmount += it.missingAmount
    if (it.status === "missing") missingCount += 1
    else if (it.status === "partial") partialCount += 1
    else if (it.status === "not_invoice_ready") blockedCount += 1
  }

  return {
    totalExpectedAmount,
    totalInvoicedAmount,
    totalMissingAmount,
    itemCount: items.length,
    missingCount,
    partialCount,
    blockedCount,
  }
}

function inferActionHint(reason: Reason): LeakageTraceItem["actionHint"] {
  switch (reason) {
    case "requires_review":
    case "claim_blocked":
      return "resolve_blocking_issue"
    case "missing_documentation":
      return "collect_documentation"
    case "not_invoiced":
      return "prepare_invoice"
    case "not_generated":
      return "check_event_mapping"
    case "partially_invoiced":
      return "prepare_invoice"
    default:
      return "manual_review"
  }
}

function inferStatus(args: {
  reason: Reason
  invoicedAmount: number
  expectedAmount: number
}): LeakageTraceItem["status"] {
  const { reason, invoicedAmount, expectedAmount } = args

  if (
    reason === "requires_review" ||
    reason === "claim_blocked" ||
    reason === "missing_documentation"
  ) {
    return "not_invoice_ready"
  }
  if (invoicedAmount > 0 && invoicedAmount < expectedAmount) return "partial"
  if (invoicedAmount === 0 && expectedAmount > 0) return "missing"
  return "missing"
}

function pickSubjectId(ledgers: ClaimsLedgerRow[], claims: ClaimItem[]): string {
  const ids = new Set<string>()
  for (const l of ledgers) {
    if (l.subjectId) ids.add(l.subjectId)
  }
  for (const c of claims) {
    if (c.subjectId) ids.add(c.subjectId)
  }
  if (ids.size === 0) return ""
  return [...ids].sort((a, b) => a.localeCompare(b))[0]!
}

function pickSponsorId(ledgers: ClaimsLedgerRow[], claims: ClaimItem[]): string | undefined {
  const ids: string[] = []
  for (const l of ledgers) {
    if (l.sponsorId) ids.push(l.sponsorId)
  }
  for (const c of claims) {
    if (c.sponsorId) ids.push(c.sponsorId)
  }
  if (ids.length === 0) return undefined
  ids.sort((a, b) => a.localeCompare(b))
  return ids[0]
}

function pickTraceIds(ledgers: ClaimsLedgerRow[]): {
  eventLogId?: string
  billableInstanceId?: string
} {
  const events = new Set<string>()
  const bills = new Set<string>()
  for (const l of ledgers) {
    if (l.eventLogId) events.add(l.eventLogId)
    if (l.billableInstanceId) bills.add(l.billableInstanceId)
  }
  const ev = [...events].sort((a, b) => a.localeCompare(b))[0]
  const bi = [...bills].sort((a, b) => a.localeCompare(b))[0]
  return {
    eventLogId: ev,
    billableInstanceId: bi,
  }
}

function pickInvoicePeriod(claims: ClaimItem[]): {
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
} {
  const starts = claims.map((c) => c.invoicePeriodStart).filter(Boolean) as string[]
  const ends = claims.map((c) => c.invoicePeriodEnd).filter(Boolean) as string[]
  if (starts.length === 0 && ends.length === 0) return {}
  starts.sort((a, b) => a.localeCompare(b))
  ends.sort((a, b) => a.localeCompare(b))
  return {
    invoicePeriodStart: starts[0],
    invoicePeriodEnd: ends[ends.length - 1],
  }
}

function buildTraceForExpected(
  eb: ExpectedBillable,
  ledgers: ClaimsLedgerRow[],
  claims: ClaimItem[],
  invoiceLines: InvoiceLine[],
): LeakageTraceItem | null {
  const expectedAmount = roundMoney(Number(eb.expectedRevenue))

  const matchedLedgers = findMatchingLedgerRows(eb, ledgers)
  const matchedClaims = findMatchingClaimItems(eb, claims, matchedLedgers)

  const studyId =
    (eb.studyId && eb.studyId !== ""
      ? eb.studyId
      : matchedLedgers[0]?.studyId ?? matchedClaims[0]?.studyId) ?? ""

  const claimIdSet = new Set(matchedClaims.map((c) => c.id))
  const invoicedAmount = sumInvoiceAmountForExpected(claimIdSet, invoiceLines)
  const missingAmount = Math.max(0, roundMoney(expectedAmount - invoicedAmount))

  const reason = inferReason({
    matchedClaims,
    matchedLedgers,
    invoicedAmount,
    expectedAmount,
  })
  const status = inferStatus({
    reason,
    invoicedAmount,
    expectedAmount,
  })

  const emit = missingAmount > 0 || status === "not_invoice_ready"
  if (!emit) return null

  const actionHint = inferActionHint(reason)
  const subjectId = pickSubjectId(matchedLedgers, matchedClaims)
  const sponsorId = pickSponsorId(matchedLedgers, matchedClaims)
  const ids = pickTraceIds(matchedLedgers)
  const period = pickInvoicePeriod(matchedClaims)

  return {
    studyId: studyId || "",
    sponsorId,
    subjectId,
    visitName: eb.visitName,
    lineCode: eb.lineCode,
    eventLogId: ids.eventLogId,
    billableInstanceId: ids.billableInstanceId,
    expectedAmount,
    invoicedAmount,
    missingAmount,
    status,
    reason,
    actionHint,
    invoicePeriodStart: period.invoicePeriodStart,
    invoicePeriodEnd: period.invoicePeriodEnd,
  }
}
