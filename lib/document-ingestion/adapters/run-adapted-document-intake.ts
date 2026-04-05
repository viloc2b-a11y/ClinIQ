import type { HardenedRecord } from "../hardening/types"
import { runHardenedDocumentIntake } from "../hardening/run-hardened-document-intake"
import { runLayoutAdapter } from "./run-layout-adapter"

function hardenedRecordsToAdapterInput(records: HardenedRecord[]) {
  return records.map((r) => ({
    recordType: r.recordType,
    fields: r.fields as unknown as Record<string, unknown>,
    trace: r.trace,
  }))
}

export function runAdaptedDocumentIntake(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
}) {
  const hardened = runHardenedDocumentIntake({
    sourceType: params.sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
  })

  const adapted = runLayoutAdapter({
    fileName: params.fileName,
    rawText: hardened.data.rawText,
    records: hardenedRecordsToAdapterInput(hardened.data.records),
  })

  return {
    data: {
      hardened,
      adapted,
    },
    summary: {
      sourceType: hardened.summary.sourceType,
      hardenedRecords: hardened.summary.totalRecords,
      adaptedRecords: adapted.summary.totalRecords,
      adapterId: adapted.summary.adapterId,
      fallbackUsed: adapted.summary.fallbackUsed,
    },
    warnings: [...hardened.warnings, ...adapted.warnings],
  }
}
