import { cellString, nonEmptyCount } from "./shared/workbook-rows"

export type RowClassification = {
  rowIndex: number
  type: "data" | "header" | "noise" | "section"
  confidence: number
}

function looksLikeHeaderRow(row: unknown[], headerSample: Set<string>): boolean {
  let hits = 0
  for (const c of row) {
    const s = cellString(c).toLowerCase()
    if (s && headerSample.has(s)) hits += 1
  }
  return hits >= 2
}

function looksLikeSectionRow(row: unknown[]): boolean {
  const nonEmpty = nonEmptyCount(row)
  if (nonEmpty !== 1 && nonEmpty !== 2) return false
  for (const c of row) {
    const s = cellString(c)
    if (s.length >= 24) return true
  }
  return false
}

export function classifyRows(params: {
  rows: unknown[][]
  headerRowIndex: number
  headerTexts: string[]
  startRowIndex: number
  endRowIndex: number
}) {
  const headerSample = new Set(
    params.headerTexts.map((t) => t.trim().toLowerCase()).filter(Boolean),
  )

  const classifications: RowClassification[] = []
  const warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }> =
    []

  for (let i = params.startRowIndex; i <= params.endRowIndex; i++) {
    const row = params.rows[i] || []

    if (i === params.headerRowIndex) {
      classifications.push({ rowIndex: i, type: "header", confidence: 0.95 })
      continue
    }

    if (nonEmptyCount(row) === 0) {
      classifications.push({ rowIndex: i, type: "noise", confidence: 0.9 })
      continue
    }

    if (nonEmptyCount(row) <= 1 && !looksLikeSectionRow(row)) {
      classifications.push({ rowIndex: i, type: "noise", confidence: 0.75 })
      continue
    }

    if (looksLikeSectionRow(row)) {
      classifications.push({ rowIndex: i, type: "section", confidence: 0.72 })
      continue
    }

    if (looksLikeHeaderRow(row, headerSample)) {
      classifications.push({ rowIndex: i, type: "header", confidence: 0.68 })
      warnings.push({
        code: "row_duplicate_header_like",
        message: `Row ${i} resembles a repeated header row and was classified as header`,
        severity: "info",
      })
      continue
    }

    if (nonEmptyCount(row) >= 2) {
      classifications.push({ rowIndex: i, type: "data", confidence: 0.82 })
    } else {
      classifications.push({ rowIndex: i, type: "noise", confidence: 0.55 })
    }
  }

  return {
    data: { classifications },
    summary: {
      dataRows: classifications.filter((c) => c.type === "data").length,
      noiseRows: classifications.filter((c) => c.type === "noise").length,
    },
    warnings,
  }
}
