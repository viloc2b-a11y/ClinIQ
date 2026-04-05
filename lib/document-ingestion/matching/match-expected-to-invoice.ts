/**
 * Document Engine v1 — strict expected-vs-invoice pairing by match key (no claims engine).
 */

const PRICE_TOLERANCE = 0.01

export type ExpectedRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  needsReview: boolean
  reviewReasons: string[]
}

export type InvoiceRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  needsReview: boolean
  reviewReasons: string[]
}

export type MatchedPairResult = {
  expectedIndex: number
  invoiceIndex: number
  matchKey: string
  quantityMatch: boolean
  unitPriceMatch: boolean
  totalPriceMatch: boolean
  status: "matched" | "partial_mismatch"
  differences: string[]
}

export type UnmatchedExpectedEntry = {
  expectedIndex: number
  reason: string
  matchKey: string
}

export type UnmatchedInvoiceEntry = {
  invoiceIndex: number
  reason: string
  matchKey: string
}

export type MatchExpectedToInvoiceSummary = {
  totalExpected: number
  totalInvoice: number
  matchedCount: number
  partialMismatchCount: number
  unmatchedExpectedCount: number
  unmatchedInvoiceCount: number
}

export type MatchExpectedToInvoiceResult = {
  matched: MatchedPairResult[]
  unmatchedExpected: UnmatchedExpectedEntry[]
  unmatchedInvoice: UnmatchedInvoiceEntry[]
  summary: MatchExpectedToInvoiceSummary
  warnings: string[]
}

const EMPTY_EXPECTED_WARNING = "No expected rows were provided for matching."
const EMPTY_INVOICE_WARNING = "No invoice rows were provided for matching."

const WEAK_KEY_WARNING =
  "Many expected and invoice rows use empty visit/activity match keys; pairings may be ambiguous."

const NO_INVOICE_REASON = "No invoice match found"
const NO_EXPECTED_REASON = "No expected match found"

export function safeNormText(value: string | null): string {
  if (value === null) return ""
  const t = value.trim().toLowerCase().replace(/\s+/g, " ")
  return t
}

export function buildMatchKey(row: { visitName: string | null; activityName: string | null }): string {
  return `${safeNormText(row.visitName)}::${safeNormText(row.activityName)}`
}

export function numbersEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance
}

function isPresentNumber(n: number | null): boolean {
  return n !== null && Number.isFinite(n)
}

export function comparePair(
  expected: ExpectedRow,
  invoice: InvoiceRow,
  expectedIndex: number,
  invoiceIndex: number,
  matchKey: string,
): MatchedPairResult {
  const differences: string[] = []

  let quantityMatch = true
  const eq = expected.quantity
  const iq = invoice.quantity
  if (isPresentNumber(eq) && isPresentNumber(iq)) {
    if (eq !== iq) {
      quantityMatch = false
      differences.push("Quantity mismatch")
    }
  } else if (isPresentNumber(eq) !== isPresentNumber(iq)) {
    quantityMatch = false
    differences.push("Missing comparable quantity")
  }

  let unitPriceMatch = true
  const eu = expected.unitPrice
  const iu = invoice.unitPrice
  if (isPresentNumber(eu) && isPresentNumber(iu)) {
    if (!numbersEqual(eu, iu, PRICE_TOLERANCE)) {
      unitPriceMatch = false
      differences.push("Unit price mismatch")
    }
  } else if (isPresentNumber(eu) !== isPresentNumber(iu)) {
    unitPriceMatch = false
    differences.push("Missing comparable unitPrice")
  }

  let totalPriceMatch = true
  const et = expected.totalPrice
  const it = invoice.totalPrice
  if (isPresentNumber(et) && isPresentNumber(it)) {
    if (!numbersEqual(et, it, PRICE_TOLERANCE)) {
      totalPriceMatch = false
      differences.push("Total price mismatch")
    }
  } else if (isPresentNumber(et) !== isPresentNumber(it)) {
    totalPriceMatch = false
    differences.push("Missing comparable totalPrice")
  }

  const status: "matched" | "partial_mismatch" =
    differences.length === 0 ? "matched" : "partial_mismatch"

  return {
    expectedIndex,
    invoiceIndex,
    matchKey,
    quantityMatch,
    unitPriceMatch,
    totalPriceMatch,
    status,
    differences,
  }
}

function sortedUnionKeys(expectedByKey: Map<string, number[]>, invoiceByKey: Map<string, number[]>): string[] {
  const set = new Set<string>()
  for (const k of expectedByKey.keys()) set.add(k)
  for (const k of invoiceByKey.keys()) set.add(k)
  return [...set].sort((a, b) => a.localeCompare(b))
}

function buildIndexQueues(rows: ExpectedRow[] | InvoiceRow[]): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (let i = 0; i < rows.length; i++) {
    const key = buildMatchKey(rows[i]!)
    const list = map.get(key)
    if (list) list.push(i)
    else map.set(key, [i])
  }
  return map
}

/**
 * Pair expected and invoice rows by strict match key (FIFO within each key), then compare amounts.
 */
export function matchExpectedToInvoice(input: {
  expectedRows: ExpectedRow[]
  invoiceRows: InvoiceRow[]
}): MatchExpectedToInvoiceResult {
  const { expectedRows, invoiceRows } = input
  const warnings: string[] = []

  if (expectedRows.length === 0) {
    warnings.push(EMPTY_EXPECTED_WARNING)
  }
  if (invoiceRows.length === 0) {
    warnings.push(EMPTY_INVOICE_WARNING)
  }

  const expectedByKey = buildIndexQueues(expectedRows)
  const invoiceByKey = buildIndexQueues(invoiceRows)

  const matched: MatchedPairResult[] = []
  const unmatchedExpected: UnmatchedExpectedEntry[] = []
  const unmatchedInvoice: UnmatchedInvoiceEntry[] = []

  let weakKeyRowCount = 0
  for (const r of expectedRows) {
    if (buildMatchKey(r) === "::") weakKeyRowCount += 1
  }
  for (const r of invoiceRows) {
    if (buildMatchKey(r) === "::") weakKeyRowCount += 1
  }
  const totalRows = expectedRows.length + invoiceRows.length
  if (totalRows >= 2 && weakKeyRowCount * 2 > totalRows) {
    warnings.push(WEAK_KEY_WARNING)
  }

  const keys = sortedUnionKeys(expectedByKey, invoiceByKey)

  for (const key of keys) {
    const expIdxs = expectedByKey.get(key) ?? []
    const invIdxs = invoiceByKey.get(key) ?? []
    const n = Math.min(expIdxs.length, invIdxs.length)
    for (let k = 0; k < n; k++) {
      const ei = expIdxs[k]!
      const ii = invIdxs[k]!
      matched.push(
        comparePair(expectedRows[ei]!, invoiceRows[ii]!, ei, ii, key),
      )
    }
    for (let k = n; k < expIdxs.length; k++) {
      unmatchedExpected.push({
        expectedIndex: expIdxs[k]!,
        reason: NO_INVOICE_REASON,
        matchKey: key,
      })
    }
    for (let k = n; k < invIdxs.length; k++) {
      unmatchedInvoice.push({
        invoiceIndex: invIdxs[k]!,
        reason: NO_EXPECTED_REASON,
        matchKey: key,
      })
    }
  }

  const matchedCount = matched.filter((m) => m.status === "matched").length
  const partialMismatchCount = matched.filter((m) => m.status === "partial_mismatch").length

  return {
    matched,
    unmatchedExpected,
    unmatchedInvoice,
    summary: {
      totalExpected: expectedRows.length,
      totalInvoice: invoiceRows.length,
      matchedCount,
      partialMismatchCount,
      unmatchedExpectedCount: unmatchedExpected.length,
      unmatchedInvoiceCount: unmatchedInvoice.length,
    },
    warnings,
  }
}
