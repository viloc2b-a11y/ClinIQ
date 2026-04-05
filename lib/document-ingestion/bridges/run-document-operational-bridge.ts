import { runDocumentIngestionV2 } from "../run-document-ingestion-v2"
import { evaluateDocumentBridgeStatus } from "./evaluate-document-bridge-status"
import { toDocumentChainInput } from "./to-document-chain-input"

export function runDocumentOperationalBridge(params: {
  fileName?: string
  mimeType?: string | null
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
}) {
  const ingestion = runDocumentIngestionV2({
    fileName: params.fileName,
    mimeType: params.mimeType ?? undefined,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
  })

  const parsedDocument = ingestion.data.parsedDocument || null
  const route = ingestion.summary.route
  const sourceType = ingestion.summary.sourceType
  const recordCount =
    parsedDocument && Array.isArray(parsedDocument.records) ? parsedDocument.records.length : 0

  const bridgeInput = toDocumentChainInput({
    parsedDocument,
  })

  const status = evaluateDocumentBridgeStatus({
    sourceType,
    route,
    recordCount,
  })

  return {
    data: {
      ingestion,
      bridgeInput: bridgeInput.data.parsedDocument,
    },
    summary: {
      status: status.data.status,
      sourceType,
      route,
      totalRecords: recordCount,
    },
    warnings: [...ingestion.warnings, ...bridgeInput.warnings, ...status.warnings],
  }
}
