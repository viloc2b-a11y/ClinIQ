export function toDocumentChainInput(params: {
  parsedDocument: {
    sourceType: "excel" | "pdf" | "word" | "unknown"
    fileName: string | null
    records: unknown[]
  } | null
}) {
  const records = params.parsedDocument?.records || []

  return {
    data: {
      parsedDocument: {
        sourceType: params.parsedDocument?.sourceType || "unknown",
        fileName: params.parsedDocument?.fileName || null,
        records,
      },
    },
    summary: {
      totalRecords: Array.isArray(records) ? records.length : 0,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
