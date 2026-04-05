export type ExcelMatrix = {
  sheetName: string
  rows: string[][]
}

export function extractExcelMatrix(workbook: Record<string, unknown>): ExcelMatrix[] {
  const matrices: ExcelMatrix[] = []

  for (const [sheetName, sheetValue] of Object.entries(workbook)) {
    if (!Array.isArray(sheetValue)) continue

    const rows = (sheetValue as unknown[]).map((row) => {
      if (!Array.isArray(row)) return []
      return row.map((cell) => String(cell ?? "").trim())
    })

    matrices.push({
      sheetName,
      rows,
    })
  }

  return matrices
}
