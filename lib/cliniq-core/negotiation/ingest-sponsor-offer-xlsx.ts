/**
 * Module 2 — read sponsor offer from Excel (first sheet) → normalize → negotiation review.
 * Server / Node friendly (uses `xlsx` + optional `fs`). No PDF; no negotiation rule changes.
 */

import { readFileSync } from "node:fs"

import * as XLSX from "xlsx"

import type { FeeFamily, SiteCostModelOutput } from "../cost-model/cost-model-types"
import { buildModule2NegotiationReviewFromOfferRows } from "./build-module2-negotiation-review-from-raw-offer"
import type { Module2NegotiationReview } from "./build-module2-negotiation-review"
import type { RawSponsorOfferRow } from "./normalize-sponsor-offer-input"

export interface ParsedExcelSponsorOfferRow {
  key: string
  amount: number | null
  source: {
    sheet: string
    rowIndex: number
  }
}

export interface IngestSponsorOfferXlsxResult {
  parsedRows: ParsedExcelSponsorOfferRow[]
  normalizedOffers: Partial<Record<FeeFamily, number | null>>
  warnings: string[]
  unmatched: Array<{
    rawKey: string
    amount: number | null
  }>
  review: Module2NegotiationReview
}

/** Match header cells with trim + case-insensitive equality (no fuzzy matching). */
export type SponsorOfferXlsxColumns =
  | {
      mode: "index"
      keyColumnIndex: number
      amountColumnIndex: number
      /** 0-based index of the first data row in the sheet (default 0). Use 1 to skip one header row. */
      firstDataRowIndex?: number
    }
  | {
      mode: "header"
      keyHeader: string
      amountHeader: string
      /** 0-based row index of the header row (default 0). Data begins on the following row. */
      headerRowIndex?: number
    }

export type IngestSponsorOfferXlsxParams = {
  costOutput: SiteCostModelOutput
  projectedRevenue: number
  columns: SponsorOfferXlsxColumns
  feeNotesByFeeFamily?: Partial<Record<FeeFamily, string>>
  studyId?: string
  siteId?: string
} & (
  | { filePath: string; fileBuffer?: undefined }
  | { fileBuffer: Buffer | Uint8Array | ArrayBuffer; filePath?: undefined }
)

function readWorkbook(data: Buffer | Uint8Array | ArrayBuffer): XLSX.WorkBook {
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return XLSX.read(data, { type: "buffer" })
  }
  const u8 = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  return XLSX.read(u8, { type: "array" })
}

function loadBytes(params: IngestSponsorOfferXlsxParams): Buffer | Uint8Array | ArrayBuffer {
  if ("filePath" in params && params.filePath !== undefined) {
    return readFileSync(params.filePath)
  }
  if ("fileBuffer" in params && params.fileBuffer !== undefined) {
    return params.fileBuffer
  }
  throw new Error("ingestSponsorOfferXlsx: provide filePath or fileBuffer")
}

function normHeaderCell(value: unknown): string {
  return String(value ?? "").trim().toLowerCase()
}

function findHeaderColumnIndex(
  headerRow: unknown[],
  expected: string,
): number {
  const want = expected.trim().toLowerCase()
  for (let i = 0; i < headerRow.length; i++) {
    if (normHeaderCell(headerRow[i]) === want) return i
  }
  return -1
}

function parseAmountCell(
  cell: unknown,
  excelRowNumber: number,
  warnings: string[],
): number | null {
  if (cell === null || cell === undefined) return null
  if (typeof cell === "number") {
    if (!Number.isFinite(cell)) {
      warnings.push(
        `Row ${excelRowNumber}: non-finite numeric amount; treated as null.`,
      )
      return null
    }
    return cell
  }
  const raw = String(cell).trim()
  if (raw === "") return null
  const cleaned = raw.replace(/[\$,]/g, "").replace(/\s+/g, "")
  if (cleaned === "") {
    warnings.push(
      `Row ${excelRowNumber}: blank amount after stripping; treated as null.`,
    )
    return null
  }
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n)) {
    warnings.push(
      `Row ${excelRowNumber}: unparseable amount "${raw}"; treated as null.`,
    )
    return null
  }
  return n
}

function isRowEmpty(key: string, amountCell: unknown, parsedAmount: number | null): boolean {
  if (key !== "") return false
  if (parsedAmount !== null) return false
  if (amountCell === null || amountCell === undefined) return true
  if (typeof amountCell === "number" && !Number.isFinite(amountCell)) return true
  return String(amountCell).trim() === ""
}

function matrixFromSheet(sheet: XLSX.WorkSheet): unknown[][] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  })
  return rows as unknown[][]
}

export function ingestSponsorOfferXlsx(
  params: IngestSponsorOfferXlsxParams,
): IngestSponsorOfferXlsxResult {
  const warnings: string[] = []
  const bytes = loadBytes(params)
  const workbook = readWorkbook(bytes)

  if (!workbook.SheetNames.length) {
    warnings.push("Workbook has no sheets; no rows parsed.")
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
      warnings: [...warnings, ...review.warnings],
      unmatched: review.unmatched,
      review: review.review,
    }
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    warnings.push(`First sheet "${sheetName}" is missing; no rows parsed.`)
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
      warnings: [...warnings, ...review.warnings],
      unmatched: review.unmatched,
      review: review.review,
    }
  }

  const matrix = matrixFromSheet(sheet)
  let keyCol: number
  let amountCol: number
  let dataStartIndex: number

  const cols = params.columns
  if (cols.mode === "index") {
    keyCol = cols.keyColumnIndex
    amountCol = cols.amountColumnIndex
    dataStartIndex = cols.firstDataRowIndex ?? 0
    if (keyCol < 0 || amountCol < 0) {
      warnings.push("Negative column index; no rows parsed.")
    }
  } else {
    const headerRowIndex = cols.headerRowIndex ?? 0
    const headerRow = matrix[headerRowIndex] ?? []
    keyCol = findHeaderColumnIndex(headerRow, cols.keyHeader)
    amountCol = findHeaderColumnIndex(headerRow, cols.amountHeader)
    if (keyCol < 0) {
      warnings.push(
        `Header row ${headerRowIndex + 1}: no column matching key header "${cols.keyHeader}".`,
      )
    }
    if (amountCol < 0) {
      warnings.push(
        `Header row ${headerRowIndex + 1}: no column matching amount header "${cols.amountHeader}".`,
      )
    }
    dataStartIndex = headerRowIndex + 1
  }

  const parsedRows: ParsedExcelSponsorOfferRow[] = []

  if (keyCol < 0 || amountCol < 0) {
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
      warnings: [...warnings, ...review.warnings],
      unmatched: review.unmatched,
      review: review.review,
    }
  }

  for (let i = dataStartIndex; i < matrix.length; i++) {
    const row = matrix[i] ?? []
    const excelRowNumber = i + 1
    const keyCell = row[keyCol]
    const amountCell = row[amountCol]
    const key = String(keyCell ?? "").trim()
    const amount = parseAmountCell(amountCell, excelRowNumber, warnings)

    if (isRowEmpty(key, amountCell, amount)) {
      continue
    }

    if (key === "" && amount !== null) {
      warnings.push(
        `Row ${excelRowNumber}: amount present but key is empty; row skipped.`,
      )
      continue
    }

    parsedRows.push({
      key,
      amount,
      source: { sheet: sheetName, rowIndex: excelRowNumber },
    })
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
