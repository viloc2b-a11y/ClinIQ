import type { HardenedParseResult } from "./types"
import { normalizeHardenedRecords } from "./normalize-hardened-records"
import { validateHardenedRecords } from "./validate-hardened-records"
import { parseExcelTabularDocument } from "./excel/parse-excel-tabular-document"
import { parsePdfStructuredText } from "./pdf/parse-pdf-structured-text"
import { parseWordStructuredText } from "./word/parse-word-structured-text"
import { summarizeHardenedParse } from "./summarize-hardened-parse"
import { buildIntakeWarning } from "./build-intake-warning"

export function runHardenedDocumentIntake(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
}): HardenedParseResult {
  let parsed: HardenedParseResult

  if (params.sourceType === "excel") {
    parsed = parseExcelTabularDocument({
      workbook: params.workbook || {},
      fileName: params.fileName,
    })
  } else if (params.sourceType === "pdf") {
    parsed = parsePdfStructuredText({
      pages: params.pdfPages || [],
      fileName: params.fileName,
    })
  } else if (params.sourceType === "word") {
    parsed = parseWordStructuredText({
      paragraphs: params.wordParagraphs || [],
      fileName: params.fileName,
    })
  } else {
    parsed = summarizeHardenedParse({
      sourceType: "unknown",
      records: [],
      warnings: [
        buildIntakeWarning({
          code: "unsupported_file_type",
          message: "Unsupported file type for hardened intake",
          severity: "error",
        }),
      ],
    })
  }

  const normalizedRecords = normalizeHardenedRecords(parsed.data.records)
  const validationWarnings = validateHardenedRecords(normalizedRecords)

  return summarizeHardenedParse({
    sourceType: parsed.summary.sourceType,
    records: normalizedRecords,
    rawText: parsed.data.rawText,
    warnings: [...parsed.warnings, ...validationWarnings],
  })
}
