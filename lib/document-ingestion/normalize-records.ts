/**
 * Document Engine v1 — deterministic normalization before mapping to ParsedDocument records.
 */

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

function stripThousandsSeparators(s: string): string {
  return s.replace(/,/g, "")
}

/** Strips common currency markers for {@link normalizeCurrency} (not used alone in public API). */
function stripCurrencySymbols(s: string): string {
  let t = s.replace(/\$/g, "")
  t = t.replace(/\bUSD\b/gi, "")
  return collapseWhitespace(t).trim()
}

/** Removes `$` from numeric strings (shared with {@link normalizeNumber}). */
function stripDollarSign(s: string): string {
  return s.replace(/\$/g, "").trim()
}

const NON_NUMERIC_SENTINELS = new Set([
  "N/A",
  "NA",
  "N/A.",
  "-",
  "—",
  "–",
  "TBD",
  "TBC",
  "NONE",
])

function isNonNumericSentinel(normalizedUpper: string): boolean {
  return NON_NUMERIC_SENTINELS.has(normalizedUpper)
}

/** Matches a finite decimal after commas and `$` removed (no locale decimals). */
const STRICT_NUMERIC = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/

/**
 * Trims and collapses internal whitespace; safe for unknown input.
 * Returns null for empty or non-stringifiable values (except finite numbers → decimal string).
 */
export function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") {
    const c = collapseWhitespace(value)
    return c === "" ? null : c
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

/**
 * Human visit labels: same whitespace rules as {@link cleanString}; wording preserved.
 */
export function normalizeVisitName(value: unknown): string | null {
  return cleanString(value)
}

/**
 * Parses a finite number from a number or US-style string (`1,250`, `$1,200`, `45.50`).
 * Does not support comma-as-decimal locales.
 */
export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value !== "string") return null

  let s = value.trim()
  if (s === "") return null

  const sentinelCheck = s.replace(/\s+/g, " ").trim().toUpperCase()
  if (isNonNumericSentinel(sentinelCheck)) return null

  s = stripDollarSign(s)
  s = collapseWhitespace(s).trim()
  if (s === "") return null

  s = stripThousandsSeparators(s)
  if (s === "" || !STRICT_NUMERIC.test(s)) return null

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Currency-shaped strings: strips `$` and `USD`, then {@link normalizeNumber}.
 * Plain numbers pass through via {@link normalizeNumber}.
 */
export function normalizeCurrency(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value !== "string") return null

  let s = value.trim()
  if (s === "") return null

  const sentinelCheck = s.replace(/\s+/g, " ").trim().toUpperCase()
  if (isNonNumericSentinel(sentinelCheck)) return null

  s = stripCurrencySymbols(s)
  if (s === "") return null

  return normalizeNumber(s)
}
