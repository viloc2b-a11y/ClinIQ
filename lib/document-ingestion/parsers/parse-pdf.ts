/**
 * Document Engine v1 — minimal PDF text/table → ParsedDocument contract.
 * Not a real PDF parser: no OCR, no layout, no external libraries.
 */

import { cleanString, normalizeCurrency, normalizeVisitName } from "../normalize-records"
import type {
  BudgetLineRecord,
  ParsedDocument,
  ParsedDocumentRecord,
  SoaActivityRecord,
  VisitScheduleRecord,
} from "../types"
import { PARSED_DOCUMENT_SCHEMA_VERSION } from "../types"

export type ParsePdfInput = {
  fileName?: string
  rawText?: string
  tables?: Record<string, unknown>[][]
}

const PARSER_ID = "cliniq-parse-pdf-v1"

export const PDF_LIMITED_WARNING = "PDF parsing is limited. Results may be incomplete."
export const PDF_NO_CONTENT_WARNING = "No PDF content provided."
export const PDF_NO_STRUCTURED_WARNING = "No structured data detected."

function djb2Hex(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

function hasNonEmptyText(rawText: string | undefined): boolean {
  if (rawText === undefined || rawText === null) return false
  return rawText.split("\n").some((l) => cleanString(l) !== null)
}

function hasNonEmptyTables(tables: Record<string, unknown>[][] | undefined): boolean {
  if (tables === undefined || tables.length === 0) return false
  return tables.some((t) => t.length > 0)
}

function normalizeLines(rawText: string): string[] {
  return rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

function rowToLine(row: Record<string, unknown>): string {
  return Object.keys(row)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => {
      const v = cleanString(row[k])
      const nk = normalizeHeaderKeyForPdf(k)
      return v ? `${nk}: ${v}` : nk
    })
    .filter((p) => p.length > 0)
    .join(" | ")
}

function normalizeHeaderKeyForPdf(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function hasVisitScheduleSignal(lower: string): boolean {
  return lower.includes("visit") || lower.includes("schedule")
}

/** Pull first `$123` / `$1,234.56` token; whole-line currency often fails when text prefixes exist. */
function extractCurrencyFromLine(line: string): number | null {
  const m = line.match(/\$\s*[\d,]+(?:\.\d+)?/)
  if (m) return normalizeCurrency(m[0])
  return normalizeCurrency(line)
}

function hasBudgetSignal(line: string): boolean {
  if (line.includes("$")) return true
  if (extractCurrencyFromLine(line) !== null) {
    if (/\$\s*\d/.test(line)) return true
    if (/\d,\d{3}\b/.test(line)) return true
    if (/\.\d{2}\b/.test(line)) return true
  }
  return false
}

function hasSoaSignal(lower: string): boolean {
  return (
    lower.includes("procedure") ||
    lower.includes("assessment") ||
    (lower.includes("activity") && !lower.includes("inactivity"))
  )
}

function budgetLabelFromLine(line: string): string {
  const withoutMoney = line.replace(/\$[\d,.]+\s*/g, "").trim()
  const trimmed = withoutMoney.replace(/[-–—]\s*$/u, "").trim()
  const c = cleanString(trimmed)
  return c ?? cleanString(line) ?? "Line"
}

function classifyLineKind(
  line: string,
): "visit_schedule" | "budget_line" | "soa_activity" | null {
  const lower = line.toLowerCase()
  if (hasVisitScheduleSignal(lower)) return "visit_schedule"
  if (hasBudgetSignal(line)) return "budget_line"
  if (hasSoaSignal(lower)) return "soa_activity"
  return null
}

type LineSource = { kind: "text"; line: string; index1Based: number } | { kind: "table"; line: string; tableIndex0: number; rowIndex1Based: number }

function lineToRecord(src: LineSource, seq: number): ParsedDocumentRecord | null {
  const kind = classifyLineKind(src.line)
  if (kind === null) return null

  const baseProvenance =
    src.kind === "text"
      ? { rowIndex1Based: src.index1Based, columnKeys: ["pdf_text_line"] as string[] }
      : {
          rowIndex1Based: src.rowIndex1Based,
          columnKeys: [`pdf_table_${src.tableIndex0}`],
        }

  const idKey = `${kind}:${src.line}:${seq}`
  const recordId = `pdf-v1:${djb2Hex(idKey)}`

  if (kind === "visit_schedule") {
    const rec: VisitScheduleRecord = {
      kind: "visit_schedule",
      recordId,
      provenance: baseProvenance,
      visitName: normalizeVisitName(src.line) ?? cleanString(src.line) ?? undefined,
      visitNumber: { value: null, confidence: "low" },
    }
    return rec
  }

  if (kind === "budget_line") {
    const amount = extractCurrencyFromLine(src.line)
    const rec: BudgetLineRecord = {
      kind: "budget_line",
      recordId,
      provenance: baseProvenance,
      label: budgetLabelFromLine(src.line),
      expectedAmount: { value: amount, confidence: "low" },
    }
    return rec
  }

  const rec: SoaActivityRecord = {
    kind: "soa_activity",
    recordId,
    provenance: baseProvenance,
    activityLabel: cleanString(src.line) ?? "",
    quantity: { value: null, confidence: "low" },
    unitAmount: { value: null, confidence: "low" },
  }
  return rec
}

function collectSources(input: ParsePdfInput): LineSource[] {
  const out: LineSource[] = []
  if (hasNonEmptyText(input.rawText)) {
    const lines = normalizeLines(input.rawText!)
    let i = 0
    for (const line of lines) {
      i += 1
      out.push({ kind: "text", line, index1Based: i })
    }
  }
  if (input.tables) {
    let ti = 0
    for (const table of input.tables) {
      let ri = 0
      for (const row of table) {
        ri += 1
        const line = rowToLine(row)
        if (cleanString(line) === null) continue
        out.push({ kind: "table", line, tableIndex0: ti, rowIndex1Based: ri })
      }
      ti += 1
    }
  }
  return out
}

/**
 * Heuristic mapping of plain PDF text lines and optional tables into {@link ParsedDocument} records.
 * Confidence is never `high` for numeric fields from this path.
 */
export function parsePdf(input: ParsePdfInput): ParsedDocument {
  const warnings: string[] = [PDF_LIMITED_WARNING]

  const hasText = hasNonEmptyText(input.rawText)
  const hasTables = hasNonEmptyTables(input.tables)

  if (!hasText && !hasTables) {
    warnings.push(PDF_NO_CONTENT_WARNING)
    return {
      schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
      sourceType: "pdf",
      documentRole: "unknown",
      fileName: input.fileName,
      parsedAt: new Date().toISOString(),
      parserId: PARSER_ID,
      records: [],
      warnings,
    }
  }

  const sources = collectSources(input)
  const records: ParsedDocumentRecord[] = []
  let seq = 0
  for (const src of sources) {
    seq += 1
    const rec = lineToRecord(src, seq)
    if (rec) records.push(rec)
  }

  if (records.length === 0) {
    warnings.push(PDF_NO_STRUCTURED_WARNING)
  }

  return {
    schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
    sourceType: "pdf",
    documentRole: "unknown",
    fileName: input.fileName,
    parsedAt: new Date().toISOString(),
    parserId: PARSER_ID,
    records,
    warnings,
  }
}
