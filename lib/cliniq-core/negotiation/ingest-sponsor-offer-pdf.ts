/**
 * Module 2 — PDF text extraction → heuristic line/amount parsing → normalize → review.
 * Secondary / untrusted path: digital PDFs only; no OCR; no layout tables.
 */

import { readFileSync } from "node:fs"

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

import type { FeeFamily, SiteCostModelOutput } from "../cost-model/cost-model-types"
import { buildModule2NegotiationReviewFromOfferRows } from "./build-module2-negotiation-review-from-raw-offer"
import type { Module2NegotiationReview } from "./build-module2-negotiation-review"
import type { RawSponsorOfferRow } from "./normalize-sponsor-offer-input"

export interface ParsedPdfSponsorOfferRow {
  key: string
  amount: number | null
  source: {
    page: number
    line?: number
  }
}

export interface IngestSponsorOfferPdfResult {
  parsedRows: ParsedPdfSponsorOfferRow[]
  normalizedOffers: Partial<Record<FeeFamily, number | null>>
  warnings: string[]
  unmatched: Array<{
    rawKey: string
    amount: number | null
  }>
  review: Module2NegotiationReview
}

export type IngestSponsorOfferPdfParams = {
  costOutput: SiteCostModelOutput
  projectedRevenue: number
  feeNotesByFeeFamily?: Partial<Record<FeeFamily, string>>
  studyId?: string
  siteId?: string
} & (
  | { filePath: string; fileBuffer?: undefined }
  | { fileBuffer: Buffer | Uint8Array | ArrayBuffer; filePath?: undefined }
)

/** Currency-like token: optional $, grouped or plain digits, optional decimals. */
const MONEY_TOKEN =
  /\$?\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?|\$?\s*\d+\.\d{2}/g

function loadBytes(params: IngestSponsorOfferPdfParams): Uint8Array {
  if ("filePath" in params && params.filePath !== undefined) {
    return new Uint8Array(readFileSync(params.filePath))
  }
  if ("fileBuffer" in params && params.fileBuffer !== undefined) {
    const b = params.fileBuffer
    if (b instanceof Uint8Array) return b
    if (b instanceof ArrayBuffer) return new Uint8Array(b)
    return new Uint8Array(b)
  }
  throw new Error("ingestSponsorOfferPdf: provide filePath or fileBuffer")
}

function parseMoneyString(raw: string, context: string, warnings: string[]): number | null {
  const cleaned = raw.replace(/[\$,]/g, "").replace(/\s+/g, "").replace(/^\$/, "")
  if (cleaned === "") {
    warnings.push(`${context}: amount token empty after strip; treated as null.`)
    return null
  }
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n)) {
    warnings.push(`${context}: unparseable amount "${raw}"; treated as null.`)
    return null
  }
  return n
}

function findLastMoneyOnLine(
  line: string,
): { key: string; rawAmount: string; index: number } | null {
  let last: RegExpExecArray | null = null
  MONEY_TOKEN.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MONEY_TOKEN.exec(line)) !== null) {
    last = m
  }
  if (!last) return null
  const rawAmount = last[0]
  const key = line.slice(0, last.index).trim()
  return { key, rawAmount, index: last.index }
}

type PageLine = { page: number; line: number; text: string }

function textContentToLines(pageNumber: number, items: unknown[]): PageLine[] {
  const out: PageLine[] = []
  let buf = ""
  let lineOnPage = 1

  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue
    const ti = item as { str: string; hasEOL?: boolean }
    buf += ti.str
    if (ti.hasEOL) {
      const t = buf.trim()
      if (t !== "") {
        out.push({ page: pageNumber, line: lineOnPage, text: t })
        lineOnPage += 1
      }
      buf = ""
    }
  }
  const tail = buf.trim()
  if (tail !== "") {
    out.push({ page: pageNumber, line: lineOnPage, text: tail })
  }
  return out
}

async function extractPageLines(data: Uint8Array): Promise<{
  lines: PageLine[]
  warnings: string[]
}> {
  const warnings: string[] = []
  const loadingTask = getDocument({
    data: data,
    useSystemFonts: true,
    disableFontFace: true,
  })
  const pdf = await loadingTask.promise

  try {
    const lines: PageLine[] = []
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      lines.push(...textContentToLines(p, content.items as unknown[]))
    }
    return { lines, warnings }
  } finally {
    await pdf.destroy()
  }
}

function emptyReviewBundle(
  params: IngestSponsorOfferPdfParams,
  extraWarnings: string[],
): IngestSponsorOfferPdfResult {
  const review = buildModule2NegotiationReviewFromOfferRows({
    costOutput: params.costOutput,
    projectedRevenue: params.projectedRevenue,
    rawSponsorOfferRows: [],
    feeNotesByFeeFamily: params.feeNotesByFeeFamily,
    studyId: params.studyId,
    siteId: params.siteId,
  })
  return {
    parsedRows: [],
    normalizedOffers: review.normalizedOffers,
    warnings: [...extraWarnings, ...review.warnings],
    unmatched: review.unmatched,
    review: review.review,
  }
}

/**
 * Extract text from a digital PDF, pick lines that look like "label … amount",
 * then run the same Module 2 path as Excel/CSV-style rows.
 */
export async function ingestSponsorOfferPdf(
  params: IngestSponsorOfferPdfParams,
): Promise<IngestSponsorOfferPdfResult> {
  const preamble = [
    "PDF ingestion uses text extraction only (no OCR). Treat rows as draft; confirm against the source PDF.",
  ]
  const warnings: string[] = [...preamble]

  let lines: PageLine[]
  try {
    const bytes = loadBytes(params)
    const extracted = await extractPageLines(bytes)
    lines = extracted.lines
    warnings.push(...extracted.warnings)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    warnings.push(`Failed to read or parse PDF: ${msg}`)
    return emptyReviewBundle(params, warnings)
  }

  if (lines.length === 0) {
    warnings.push("No text lines extracted from PDF.")
    return emptyReviewBundle(params, warnings)
  }

  const parsedRows: ParsedPdfSponsorOfferRow[] = []

  for (const { page, line, text } of lines) {
    if (text.trim() === "") continue

    const hit = findLastMoneyOnLine(text)
    if (!hit) continue

    const ctx = `Page ${page} line ${line}`
    const amount = parseMoneyString(hit.rawAmount, ctx, warnings)

    if (hit.key === "") {
      warnings.push(
        `${ctx}: numeric amount "${hit.rawAmount}" but no usable key text; row skipped.`,
      )
      continue
    }

    parsedRows.push({
      key: hit.key,
      amount,
      source: { page, line },
    })
  }

  if (parsedRows.length === 0) {
    warnings.push(
      "No lines matched the label+amount heuristic; check PDF text layer or use Excel ingestion.",
    )
  }

  const rawSponsorOfferRows: RawSponsorOfferRow[] = parsedRows.map((r) => ({
    key: r.key,
    amount: r.amount,
  }))

  const reviewBundle = buildModule2NegotiationReviewFromOfferRows({
    costOutput: params.costOutput,
    projectedRevenue: params.projectedRevenue,
    rawSponsorOfferRows,
    feeNotesByFeeFamily: params.feeNotesByFeeFamily,
    studyId: params.studyId,
    siteId: params.siteId,
  })

  return {
    parsedRows,
    normalizedOffers: reviewBundle.normalizedOffers,
    warnings: [...warnings, ...reviewBundle.warnings],
    unmatched: reviewBundle.unmatched,
    review: reviewBundle.review,
  }
}
