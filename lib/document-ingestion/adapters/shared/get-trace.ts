export function getTrace(input: {
  adapterId: string
  record: {
    trace?: {
      sourceType?: "excel" | "pdf" | "word" | "unknown"
      fileName?: string
      sheetName?: string
      pageNumber?: number
      rowIndex?: number
      rawTextSnippet?: string
    }
  }
}) {
  return {
    adapterId: input.adapterId,
    sourceType: input.record.trace?.sourceType || "unknown",
    fileName: input.record.trace?.fileName,
    sheetName: input.record.trace?.sheetName,
    pageNumber: input.record.trace?.pageNumber,
    rowIndex: input.record.trace?.rowIndex,
    rawTextSnippet: input.record.trace?.rawTextSnippet,
  }
}
