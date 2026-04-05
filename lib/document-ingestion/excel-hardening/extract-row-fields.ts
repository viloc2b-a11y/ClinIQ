import type { NormalizedHeader } from "./normalize-headers"
import { cellString, isNumericCell } from "./shared/workbook-rows"

export type ExtractedField = {
  value: unknown
  confidence: number
  sourceColumn: string
}

export type ExtractedRow = {
  rowIndex: number
  extracted: Record<string, ExtractedField>
  overallConfidence: number
}

const TARGET_FIELDS = [
  "visitName",
  "activity",
  "unitPrice",
  "quantity",
  "lineCode",
] as const

function parseNumber(cell: unknown): number | null {
  if (typeof cell === "number" && Number.isFinite(cell)) return cell
  const s = cellString(cell)
  if (!s) return null
  const n = Number(s.replace(/,/g, ""))
  return Number.isFinite(n) ? n : null
}

export function extractRowFields(params: {
  row: unknown[]
  headers: NormalizedHeader[]
}): ExtractedRow {
  const extracted: Record<string, ExtractedField> = {}
  const confidences: number[] = []

  const colMap = new Map<string, { idx: number; header: NormalizedHeader }>()
  params.headers.forEach((h, idx) => {
    if (h.normalized === "_ignore") return
    if (h.normalized.startsWith("raw:")) {
      colMap.set(h.normalized, { idx, header: h })
      return
    }
    if (!colMap.has(h.normalized)) colMap.set(h.normalized, { idx, header: h })
  })

  for (const field of TARGET_FIELDS) {
    const entry = colMap.get(field)
    if (!entry) continue
    const cell = params.row[entry.idx]
    const sourceColumn = entry.header.original || `col_${entry.idx}`
    let value: unknown = null
    let confidence = entry.header.confidence * 0.85

    if (field === "unitPrice" || field === "quantity") {
      const n = parseNumber(cell)
      if (n !== null) {
        value = n
        confidence *= isNumericCell(cell) ? 1 : 0.85
      } else {
        value = cellString(cell) || null
        confidence *= 0.4
      }
    } else {
      const s = cellString(cell)
      value = s || null
      confidence *= s ? 1 : 0.25
    }

    if (value !== null && value !== "") {
      extracted[field] = {
        value,
        confidence: Math.min(1, Math.max(0, confidence)),
        sourceColumn,
      }
      confidences.push(extracted[field]!.confidence)
    }
  }

  const overallConfidence =
    confidences.length === 0 ? 0 : confidences.reduce((a, b) => a + b, 0) / confidences.length

  return {
    rowIndex: -1,
    extracted,
    overallConfidence: Math.round(overallConfidence * 1000) / 1000,
  }
}

export function extractFieldsForDataRows(params: {
  rows: unknown[][]
  classifications: Array<{ rowIndex: number; type: string }>
  headers: NormalizedHeader[]
}) {
  const parsed: ExtractedRow[] = []

  for (const c of params.classifications) {
    if (c.type !== "data") continue
    const row = params.rows[c.rowIndex] || []
    const er = extractRowFields({ row, headers: params.headers })
    parsed.push({ ...er, rowIndex: c.rowIndex })
  }

  return {
    data: { rows: parsed },
    summary: { extractedRows: parsed.length },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
