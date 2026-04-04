import type { InvoiceExtraction } from "../types"
import { lowerCaseSafe } from "../utils/text"

/** Non-global exec so each pattern is stateless. */
function firstExec(text: string, re: RegExp): RegExpExecArray | null {
  const flags = re.flags.replace(/g/g, "")
  return new RegExp(re.source, flags).exec(text)
}

function cleanLineValue(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[.:;]+$/g, "").trim()
}

function cleanInvoiceNumber(s: string): string {
  return s.replace(/\s+/g, "").trim()
}

function parseMoneyToken(raw: string): number | undefined {
  const cleaned = raw.replace(/,/g, "").trim()
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function parseUsDateToIso(m: RegExpExecArray, g: number): string | undefined {
  const mm = Number.parseInt(m[g] ?? "", 10)
  const dd = Number.parseInt(m[g + 1] ?? "", 10)
  const yyyy = Number.parseInt(m[g + 2] ?? "", 10)
  if (
    !Number.isFinite(mm) ||
    !Number.isFinite(dd) ||
    !Number.isFinite(yyyy) ||
    mm < 1 ||
    mm > 12 ||
    dd < 1 ||
    dd > 31 ||
    yyyy < 1900 ||
    yyyy > 2100
  ) {
    return undefined
  }
  const t = new Date(Date.UTC(yyyy, mm - 1, dd))
  if (t.getUTCFullYear() !== yyyy || t.getUTCMonth() !== mm - 1 || t.getUTCDate() !== dd) return undefined
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
}

function extractInvoiceDate(text: string): string | undefined {
  const re = /Invoice\s+Date\s*:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i
  const m = firstExec(text, re)
  if (!m) return undefined
  return parseUsDateToIso(m, 1)
}

function extractDueDateExplicit(text: string): string | undefined {
  const re = /Due\s+Date\s*:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i
  const m = firstExec(text, re)
  if (!m) return undefined
  return parseUsDateToIso(m, 1)
}

function extractNetDays(text: string): number | undefined {
  const lower = lowerCaseSafe(text)
  const m = lower.match(/\bnet\s+(\d+)(?:\s*days?)?\b/)
  if (!m) return undefined
  const n = Number.parseInt(m[1] ?? "", 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function addDaysToIsoDate(iso: string, days: number): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return undefined
  const y = Number.parseInt(m[1], 10)
  const mo = Number.parseInt(m[2], 10)
  const d = Number.parseInt(m[3], 10)
  const t = new Date(Date.UTC(y, mo - 1, d))
  t.setUTCDate(t.getUTCDate() + days)
  const yy = t.getUTCFullYear()
  const mm = t.getUTCMonth() + 1
  const dd = t.getUTCDate()
  return `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
}

function resolveDueDate(text: string, invoiceDateIso: string | undefined): string | undefined {
  const explicit = extractDueDateExplicit(text)
  if (explicit) return explicit
  if (!invoiceDateIso) return undefined
  const net = extractNetDays(text)
  if (net === undefined) return undefined
  return addDaysToIsoDate(invoiceDateIso, net)
}

function earliestString(
  text: string,
  specs: readonly { re: RegExp; group: number; clean?: (s: string) => string }[],
): string | undefined {
  let bestIdx = Number.POSITIVE_INFINITY
  let best: string | undefined
  for (const { re, group, clean: cleanFn = cleanLineValue } of specs) {
    const m = firstExec(text, re)
    if (m?.[group] != null && m.index !== undefined) {
      const v = cleanFn(m[group])
      if (v && m.index < bestIdx) {
        bestIdx = m.index
        best = v
      }
    }
  }
  return best || undefined
}

function earliestAmount(
  text: string,
  specs: readonly { re: RegExp; group: number }[],
): number | undefined {
  let bestIdx = Number.POSITIVE_INFINITY
  let best: number | undefined
  for (const { re, group } of specs) {
    const m = firstExec(text, re)
    if (m?.[group] != null && m.index !== undefined) {
      const n = parseMoneyToken(m[group])
      if (n !== undefined && m.index < bestIdx) {
        bestIdx = m.index
        best = n
      }
    }
  }
  return best
}

/**
 * Deterministic invoice/remittance extraction from plain text.
 */
export function extractInvoiceFields(text: string): InvoiceExtraction {
  const invoiceNumber = earliestString(text, [
    { re: /Invoice\s+Number\s*:\s*([A-Za-z0-9\-]+)/i, group: 1, clean: cleanInvoiceNumber },
    { re: /Invoice\s*#\s*([A-Za-z0-9\-]+)/i, group: 1, clean: cleanInvoiceNumber },
    { re: /\b(Inv-[A-Za-z0-9]+)\b/i, group: 1, clean: cleanInvoiceNumber },
  ])

  const sponsor = earliestString(text, [
    { re: /Bill\s*To\s*:\s*(.+?)(?:\n|$)/i, group: 1 },
    { re: /Sponsor\s*:\s*(.+?)(?:\n|$)/i, group: 1 },
    { re: /Client\s*:\s*(.+?)(?:\n|$)/i, group: 1 },
  ])

  const invoiceDate = extractInvoiceDate(text)
  const dueDate = resolveDueDate(text, invoiceDate)

  const totalAmount = earliestAmount(text, [
    { re: /Total\s+Amount\s*:\s*(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{1,2})?)/i, group: 1 },
    { re: /\bTotal\s*:\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i, group: 1 },
  ])

  const paidAmount = earliestAmount(text, [
    { re: /Amount\s+Paid\s*:\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i, group: 1 },
    { re: /\bPaid\s*:\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i, group: 1 },
  ])

  const referenceNumber = earliestString(text, [
    { re: /Reference\s*:\s*(\S+)/i, group: 1, clean: cleanLineValue },
    { re: /Remittance\s+ID\s*:\s*(\S+)/i, group: 1, clean: cleanLineValue },
  ])

  return {
    invoiceNumber,
    sponsor,
    invoiceDate,
    dueDate,
    totalAmount,
    paidAmount,
    referenceNumber,
  }
}
