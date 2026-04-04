import type { BudgetExtraction } from "../types"
import { lowerCaseSafe } from "../utils/text"

const SKIP_DESC =
  /^(total|subtotal|tax|amount|description|line\s*item)s?$/i

/** Substrings (lowercased line) that indicate narrative / admin, not fee rows. */
const ADMIN_LINE_SUBSTRINGS = [
  "payment terms",
  "invoice frequency",
  "invoices submitted",
  "payable within",
  "terms and conditions",
] as const

/** Net payment shorthand on a line — not a visit fee row. */
const ADMIN_NET_DAYS = /\bnet\s+(30|45|60)\b/i

function isAdministrativeLine(trimmed: string): boolean {
  const lower = lowerCaseSafe(trimmed)
  for (const s of ADMIN_LINE_SUBSTRINGS) {
    if (lower.includes(s)) return true
  }
  if (ADMIN_NET_DAYS.test(trimmed)) return true
  return false
}

/** `USD 1250` / `USD 1,250.00` at end of line (description before amount cluster). */
const USD_SUFFIX = /^(.+?)\s+USD\s+([\d,]+(?:\.\d{1,2})?)\s*$/i

/** `$1,250` / `$1250.00` / `1250.00` at end of line. */
const MONEY_SUFFIX = /^(.+?)\s+\$?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i

/** `Label: USD 1,250.00` */
const COLON_USD = /^(.+?):\s*USD\s+([\d,]+(?:\.\d{1,2})?)\s*$/i

/** `Label: $1,250.00` */
const COLON_DOLLAR = /^(.+?):\s*\$\s*([\d,]+(?:\.\d{1,2})?)\s*$/i

/** `1,250.00 USD` at end (currency after number). */
const NUMBER_THEN_USD = /^(.+?)\s+([\d,]+(?:\.\d{1,2})?)\s+USD\s*$/i

/** `USD 1250 Remainder` — amount column first; remainder is description. */
const USD_PREFIX_LINE = /^USD\s+([\d,]+(?:\.\d{1,2})?)\s+(.+?)\s*$/i

/** `$1250 Remainder` — amount column first. */
const DOLLAR_PREFIX_LINE = /^\$\s*([\d,]+(?:\.\d{1,2})?)\s+(.+?)\s*$/i

function stripLeadingBullet(line: string): string {
  return line.replace(/^\s*[-*•\d]+[.)]\s+/, "").trim()
}

function parseAmountToken(token: string): number | undefined {
  const cleaned = token.replace(/,/g, "").trim()
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function cleanDescription(raw: string): string {
  return raw.replace(/[.:]+$/g, "").trim()
}

function isGarbageDescription(desc: string): boolean {
  if (desc.length < 2) return true
  if (/^[^\w]+$/i.test(desc)) return true
  return false
}

function lineItemOrUndefined(
  descRaw: string,
  amountToken: string,
): { description: string; amount: number } | undefined {
  const desc = cleanDescription(descRaw)
  const amount = parseAmountToken(amountToken)
  if (amount === undefined || isGarbageDescription(desc) || SKIP_DESC.test(desc)) return undefined
  return { description: desc, amount }
}

function extractLineItemFromLine(line: string): { description: string; amount: number } | undefined {
  const trimmed = stripLeadingBullet(line)
  if (trimmed.length < 3) return undefined
  if (isAdministrativeLine(trimmed)) return undefined

  let m = trimmed.match(COLON_USD)
  if (m) {
    const item = lineItemOrUndefined(m[1], m[2])
    if (item) return item
  }

  m = trimmed.match(COLON_DOLLAR)
  if (m) {
    const item = lineItemOrUndefined(m[1], m[2])
    if (item) return item
  }

  m = trimmed.match(USD_PREFIX_LINE)
  if (m) {
    const item = lineItemOrUndefined(m[2], m[1])
    if (item) return item
  }

  m = trimmed.match(DOLLAR_PREFIX_LINE)
  if (m) {
    const item = lineItemOrUndefined(m[2], m[1])
    if (item) return item
  }

  m = trimmed.match(NUMBER_THEN_USD)
  if (m) {
    const item = lineItemOrUndefined(m[1], m[2])
    if (item) return item
  }

  m = trimmed.match(USD_SUFFIX)
  if (m) {
    const item = lineItemOrUndefined(m[1], m[2])
    if (item) return item
  }

  m = trimmed.match(MONEY_SUFFIX)
  if (m) {
    const item = lineItemOrUndefined(m[1], m[2])
    if (item) return item
  }

  return undefined
}

function dedupeLineItems(
  items: { description: string; amount: number }[],
): { description: string; amount: number }[] {
  const seen = new Set<string>()
  const out: { description: string; amount: number }[] = []
  for (const item of items) {
    const key = `${item.description}\x1e${item.amount}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/** Shared with contract extractor — Net X, payment/payable within X days. */
export function extractPaymentTerms(text: string): string | undefined {
  const lower = lowerCaseSafe(text)

  const net = lower.match(/\bnet\s+(\d+)(?:\s*days?)?\b/)
  if (net) return `Net ${net[1]} days`

  const payWithin = lower.match(/\bpayment\s+within\s+(\d+)(?:\s*days?)?\b/)
  if (payWithin) return `Payment within ${payWithin[1]} days`

  const payableWithin = lower.match(/\bpayable\s+within\s+(\d+)(?:\s*days?)?\b/)
  if (payableWithin) return `Payable within ${payableWithin[1]} days`

  return undefined
}

/** Deterministic first match in this order (substring search on lowercased full text). */
const FREQUENCY_PATTERNS: readonly { pattern: string; label: string }[] = [
  { pattern: "upon completion", label: "upon completion" },
  { pattern: "at close-out", label: "at close-out" },
  { pattern: "at closeout", label: "at close-out" },
  { pattern: "per visit", label: "per visit" },
  { pattern: "bi-weekly", label: "bi-weekly" },
  { pattern: "biweekly", label: "bi-weekly" },
  { pattern: "quarterly", label: "quarterly" },
  { pattern: "monthly", label: "monthly" },
  { pattern: "weekly", label: "weekly" },
] as const

function extractInvoiceFrequency(text: string): string | undefined {
  const lower = lowerCaseSafe(text)
  for (const { pattern, label } of FREQUENCY_PATTERNS) {
    if (lower.includes(pattern)) return label
  }
  return undefined
}

/**
 * Deterministic budget extraction: line-based amounts, keyword payment/frequency.
 */
export function extractBudgetFields(text: string): BudgetExtraction {
  const lines = text.split("\n")
  const rawItems: { description: string; amount: number }[] = []

  for (const line of lines) {
    const item = extractLineItemFromLine(line)
    if (item) rawItems.push(item)
  }

  const lineItems = dedupeLineItems(rawItems)

  return {
    lineItems,
    paymentTerms: extractPaymentTerms(text),
    invoiceFrequency: extractInvoiceFrequency(text),
  }
}
