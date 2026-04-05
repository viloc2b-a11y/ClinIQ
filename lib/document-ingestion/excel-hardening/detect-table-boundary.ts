import { nonEmptyCount, rowIsEmptyish, sheetToRows } from "./shared/workbook-rows"

const DENSITY_WINDOW = 5
const DENSITY_THRESHOLD = 0.15

export type TableBoundary = {
  headerRowIndex: number
  startRowIndex: number
  endRowIndex: number
}

export function detectTableBoundary(params: {
  rows: unknown[][]
  maxCols?: number
}): {
  data: TableBoundary
  summary: { totalRowsConsidered: number }
  warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>
} {
  const rows = params.rows.map((r) => (Array.isArray(r) ? r : []))
  const warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }> =
    []

  let headerRowIndex = -1
  for (let i = 0; i < rows.length; i++) {
    if (nonEmptyCount(rows[i]!) >= 3) {
      headerRowIndex = i
      break
    }
  }

  if (headerRowIndex < 0) {
    warnings.push({
      code: "table_boundary_no_header",
      message: "No row with at least three non-empty cells; using row 0 as synthetic header",
      severity: "warning",
    })
    headerRowIndex = 0
  }

  const startRowIndex = Math.min(headerRowIndex + 1, Math.max(0, rows.length - 1))

  let endRowIndex = rows.length === 0 ? -1 : rows.length - 1
  let consecutiveEmpty = 0

  for (let i = startRowIndex; i < rows.length; i++) {
    const row = rows[i] || []

    if (rowIsEmptyish(row, 1)) {
      consecutiveEmpty += 1
      if (consecutiveEmpty >= 2) {
        endRowIndex = Math.max(startRowIndex, i - 2)
        warnings.push({
          code: "table_boundary_empty_run",
          message: "Table end detected after consecutive sparse rows",
          severity: "info",
        })
        break
      }
    } else {
      consecutiveEmpty = 0
    }

    let winFilled = 0
    let winCells = 0
    const winStart = Math.max(startRowIndex, i - DENSITY_WINDOW + 1)
    for (let j = winStart; j <= i; j++) {
      const r = rows[j] || []
      winCells += Math.max(1, r.length)
      winFilled += nonEmptyCount(r)
    }
    const d = winCells === 0 ? 0 : winFilled / winCells
    if (i >= startRowIndex + DENSITY_WINDOW && d < DENSITY_THRESHOLD) {
      endRowIndex = Math.max(startRowIndex, i - DENSITY_WINDOW)
      warnings.push({
        code: "table_boundary_density_drop",
        message: "Table end detected when local fill density fell below threshold",
        severity: "info",
      })
      break
    }
  }

  if (endRowIndex < headerRowIndex) {
    endRowIndex = headerRowIndex
  }

  return {
    data: {
      headerRowIndex,
      startRowIndex,
      endRowIndex,
    },
    summary: { totalRowsConsidered: rows.length },
    warnings,
  }
}

export function detectTableBoundaryForSheet(params: {
  sheet: unknown
}): ReturnType<typeof detectTableBoundary> {
  return detectTableBoundary({ rows: sheetToRows(params.sheet) })
}
