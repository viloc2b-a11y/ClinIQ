import { runAdaptedDocumentIntake } from "../adapters/run-adapted-document-intake"
import { evaluateParseAcceptance } from "./evaluate-parse-acceptance"

export function runQualityGatedDocumentIntake(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
}) {
  const adaptedIntake = runAdaptedDocumentIntake({
    sourceType: params.sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
  })

  const decision = evaluateParseAcceptance({
    sourceType: params.sourceType,
    adapted: adaptedIntake.data.adapted,
  })

  return {
    data: {
      hardened: adaptedIntake.data.hardened,
      adapted: adaptedIntake.data.adapted,
      qualityGate: decision,
    },
    summary: {
      sourceType: adaptedIntake.summary.sourceType,
      hardenedRecords: adaptedIntake.summary.hardenedRecords,
      adaptedRecords: adaptedIntake.summary.adaptedRecords,
      adapterId: adaptedIntake.summary.adapterId,
      fallbackUsed: adaptedIntake.summary.fallbackUsed,
      acceptanceStatus: decision.summary.status,
      accepted: decision.summary.accepted,
    },
    warnings: [...adaptedIntake.warnings, ...decision.warnings],
  }
}
