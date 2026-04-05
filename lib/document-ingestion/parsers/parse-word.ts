/**
 * Document Engine v1 — minimal Word text/sections → ParsedDocument contract.
 * Not a real DOC/DOCX parser: no binary I/O, no OCR, no external libraries.
 */

import { cleanString, normalizeCurrency, normalizeVisitName } from "../normalize-records"
import type {
  BudgetLineRecord,
  ContractClauseRecord,
  ParsedDocument,
  ParsedDocumentRecord,
  SoaActivityRecord,
  VisitScheduleRecord,
} from "../types"
import { PARSED_DOCUMENT_SCHEMA_VERSION } from "../types"

export type ParseWordInput = {
  fileName?: string
  rawText?: string
  sections?: string[]
}

const PARSER_ID = "cliniq-parse-word-v1"

export const WORD_LIMITED_WARNING = "Word parsing is limited. Results may be incomplete."
export const WORD_NO_CONTENT_WARNING = "No Word content provided."
export const WORD_NO_STRUCTURED_WARNING = "No structured data detected."

function djb2Hex(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

function hasNonEmptyText(rawText: string | undefined): boolean {
  if (rawText === undefined || rawText === null) return false
  return rawText.split(/\n/).some((l) => cleanString(l) !== null)
}

function hasNonEmptySections(sections: string[] | undefined): boolean {
  if (sections === undefined || sections.length === 0) return false
  return sections.some((s) => cleanString(s) !== null)
}

/** Blank-line paragraphs; if none, one block split by single newlines. */
function paragraphsFromRawText(rawText: string): string[] {
  const blocks = rawText
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
  if (blocks.length === 0) return []
  if (blocks.length === 1) {
    return blocks[0].split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  }
  return blocks.map((b) => b.replace(/\s+/g, " ").trim())
}

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

function hasVisitScheduleSignal(lower: string): boolean {
  return (
    lower.includes("visit") ||
    lower.includes("schedule") ||
    /\bday\s*1\b/.test(lower) ||
    lower.includes("screening")
  )
}

function hasSoaSignal(lower: string): boolean {
  return (
    lower.includes("procedure") ||
    lower.includes("assessment") ||
    (lower.includes("activity") && !lower.includes("inactivity"))
  )
}

function hasLegalContractSignal(lower: string): boolean {
  if (lower.includes("shall") || lower.includes("must")) return true
  if (lower.includes("agreement")) return true
  if (lower.includes("termination")) return true
  if (lower.includes("confidential")) return true
  if (/\bterms?\b/.test(lower)) return true
  return false
}

function hasPaymentLanguageSignal(lower: string): boolean {
  return lower.includes("payment") || lower.includes("invoice") || lower.includes("fee")
}

function inferClauseType(lower: string): ContractClauseRecord["clauseType"] {
  if (lower.includes("invoice")) return "invoice_timing"
  if (lower.includes("payment") || lower.includes("fee")) return "payment_terms"
  return "other"
}

function budgetLabelFromLine(line: string): string {
  const dollar = line.indexOf("$")
  if (dollar > 0) {
    const before = cleanString(line.slice(0, dollar).replace(/[-–—]\s*$/u, "").trim())
    if (before) return before
  }
  const withoutMoney = line.replace(/\$[\d,.]+\s*/g, "").trim()
  const trimmed = withoutMoney.replace(/[-–—]\s*$/u, "").trim()
  const c = cleanString(trimmed)
  return c ?? cleanString(line) ?? "Line"
}

type ParagraphSource = { text: string; index1Based: number }

function collectParagraphs(input: ParseWordInput): ParagraphSource[] {
  const out: ParagraphSource[] = []
  let idx = 0
  if (hasNonEmptyText(input.rawText)) {
    for (const p of paragraphsFromRawText(input.rawText!)) {
      idx += 1
      out.push({ text: p, index1Based: idx })
    }
  }
  if (input.sections) {
    for (const s of input.sections) {
      const t = cleanString(s)
      if (t === null) continue
      idx += 1
      out.push({ text: t, index1Based: idx })
    }
  }
  return out
}

function classifyParagraphKind(
  text: string,
): "budget_line" | "visit_schedule" | "soa_activity" | "contract_clause" | null {
  const lower = text.toLowerCase()
  if (hasBudgetSignal(text)) return "budget_line"
  if (hasVisitScheduleSignal(lower)) return "visit_schedule"
  if (hasSoaSignal(lower)) return "soa_activity"
  if (hasPaymentLanguageSignal(lower) || hasLegalContractSignal(lower)) return "contract_clause"
  return null
}

function paragraphToRecord(src: ParagraphSource, seq: number): ParsedDocumentRecord | null {
  const kind = classifyParagraphKind(src.text)
  if (kind === null) return null

  const provenance = {
    rowIndex1Based: src.index1Based,
    columnKeys: ["word_paragraph"] as string[],
  }
  const idKey = `${kind}:${src.text}:${seq}`
  const recordId = `word-v1:${djb2Hex(idKey)}`
  const lower = src.text.toLowerCase()

  if (kind === "budget_line") {
    const amount = extractCurrencyFromLine(src.text)
    const rec: BudgetLineRecord = {
      kind: "budget_line",
      recordId,
      provenance,
      label: budgetLabelFromLine(src.text),
      expectedAmount: { value: amount, confidence: "low" },
    }
    return rec
  }

  if (kind === "visit_schedule") {
    const rec: VisitScheduleRecord = {
      kind: "visit_schedule",
      recordId,
      provenance,
      visitName: normalizeVisitName(src.text) ?? cleanString(src.text) ?? undefined,
      visitNumber: { value: null, confidence: "low" },
    }
    return rec
  }

  if (kind === "soa_activity") {
    const rec: SoaActivityRecord = {
      kind: "soa_activity",
      recordId,
      provenance,
      activityLabel: cleanString(src.text) ?? "",
      quantity: { value: null, confidence: "low" },
      unitAmount: { value: null, confidence: "low" },
    }
    return rec
  }

  const excerpt = cleanString(src.text) ?? ""
  const rec: ContractClauseRecord = {
    kind: "contract_clause",
    recordId,
    provenance,
    clauseType: inferClauseType(lower),
    excerpt,
    booleanValue: { value: null, confidence: "low" },
  }
  return rec
}

/**
 * Heuristic mapping of Word-like plain text and section strings into {@link ParsedDocument} records.
 * Numeric field confidence is never `high`.
 */
export function parseWord(input: ParseWordInput): ParsedDocument {
  const warnings: string[] = [WORD_LIMITED_WARNING]

  const hasText = hasNonEmptyText(input.rawText)
  const hasSections = hasNonEmptySections(input.sections)

  if (!hasText && !hasSections) {
    warnings.push(WORD_NO_CONTENT_WARNING)
    return {
      schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
      sourceType: "word",
      documentRole: "unknown",
      fileName: input.fileName,
      parsedAt: new Date().toISOString(),
      parserId: PARSER_ID,
      records: [],
      warnings,
    }
  }

  const paragraphs = collectParagraphs(input)
  const records: ParsedDocumentRecord[] = []
  let seq = 0
  for (const p of paragraphs) {
    seq += 1
    const rec = paragraphToRecord(p, seq)
    if (rec) records.push(rec)
  }

  if (records.length === 0) {
    warnings.push(WORD_NO_STRUCTURED_WARNING)
  }

  return {
    schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
    sourceType: "word",
    documentRole: "unknown",
    fileName: input.fileName,
    parsedAt: new Date().toISOString(),
    parserId: PARSER_ID,
    records,
    warnings,
  }
}
