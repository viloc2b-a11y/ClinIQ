/** Deterministic 2D grid from a workbook sheet value (array-of-arrays). */
export function sheetToRows(sheet: unknown): unknown[][] {
  if (!Array.isArray(sheet)) return []
  return sheet.map((row) => (Array.isArray(row) ? row : []))
}

export function cellString(cell: unknown): string {
  if (cell === null || cell === undefined) return ""
  if (typeof cell === "string") return cell.trim()
  if (typeof cell === "number" && Number.isFinite(cell)) return String(cell)
  if (typeof cell === "boolean") return cell ? "true" : "false"
  return String(cell).trim()
}

export function isNumericCell(cell: unknown): boolean {
  if (typeof cell === "number" && Number.isFinite(cell)) return true
  if (typeof cell === "string") {
    const t = cell.trim()
    if (!t) return false
    const n = Number(t.replace(/,/g, ""))
    return Number.isFinite(n)
  }
  return false
}

export function nonEmptyCount(row: unknown[]): number {
  let n = 0
  for (const c of row) {
    if (cellString(c) !== "") n += 1
  }
  return n
}

export function rowIsEmptyish(row: unknown[], maxNonEmpty = 1): boolean {
  return nonEmptyCount(row) <= maxNonEmpty
}
