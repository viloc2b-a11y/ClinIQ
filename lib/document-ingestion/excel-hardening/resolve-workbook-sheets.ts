/**
 * Supports flat workbooks (`{ Sheet1: rows[] }`) and nested `{ Sheets: { Sheet1: rows[] } }`.
 */
export function resolveWorkbookSheets(workbook: Record<string, unknown>): Record<string, unknown> {
  const sheets = workbook.Sheets
  if (sheets != null && typeof sheets === "object" && !Array.isArray(sheets)) {
    return sheets as Record<string, unknown>
  }
  return workbook
}
