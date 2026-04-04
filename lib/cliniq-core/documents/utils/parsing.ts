import { lowerCaseSafe } from "./text"

const MONEY =
  /(?:^|\s)\$?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:$|[\s,;]|usd)/i

/** ISO YYYY-MM-DD */
const DATE_ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/

/** US-style M/D/YYYY or MM/DD/YYYY */
const DATE_US = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/

/**
 * First money-like token on the line (deterministic; no locale heuristics).
 */
export function extractMoney(line: string): number | undefined {
  const m = line.match(MONEY)
  if (!m) return undefined
  const n = Number(m[1].replace(/,/g, ""))
  return Number.isFinite(n) ? n : undefined
}

/**
 * First date on the line as normalized `YYYY-MM-DD` when parseable; otherwise undefined.
 */
export function extractDate(line: string): string | undefined {
  const iso = line.match(DATE_ISO)
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }
  const us = line.match(DATE_US)
  if (us) {
    const mm = us[1].padStart(2, "0")
    const dd = us[2].padStart(2, "0")
    const yyyy = us[3]
    return `${yyyy}-${mm}-${dd}`
  }
  return undefined
}

/**
 * Index of first line containing any keyword (case-insensitive). `-1` if none.
 */
export function findKeywordLine(lines: string[], keywords: string[]): number {
  const lowered = keywords.map((k) => lowerCaseSafe(k.trim())).filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    const ln = lowerCaseSafe(lines[i])
    for (const kw of lowered) {
      if (ln.includes(kw)) return i
    }
  }
  return -1
}
