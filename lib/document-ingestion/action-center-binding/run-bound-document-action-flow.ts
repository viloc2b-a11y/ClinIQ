import type { HumanResolutionPayload } from "../human-resolution/types"
import { runDocumentToExecutionOrchestrator } from "../orchestrator/run-document-to-execution-orchestrator"
import { runActionCenterBinding } from "./run-action-center-binding"

export function runBoundDocumentActionFlow(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
  humanResolutionPayload?: HumanResolutionPayload | null
  persistActionCenterItems?: (payload: {
    items: Array<{
      id: string
      type: string
      title: string
      estimatedValue: number
      sourceTrace?: Record<string, unknown> | null
    }>
  }) => unknown
  verifyPersistedItems?: (params: { expectedIds: string[] }) => {
    found?: number
    missing?: string[]
    matched?: string[]
    totalExpected?: number
  }
}) {
  const orchestration = runDocumentToExecutionOrchestrator({
    sourceType: params.sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
    humanResolutionPayload: params.humanResolutionPayload,
  })

  const actionCenter = runActionCenterBinding({
    orchestration: orchestration as unknown as Parameters<typeof runActionCenterBinding>[0]["orchestration"],
    persistActionCenterItems: params.persistActionCenterItems,
    verifyPersistedItems: params.verifyPersistedItems,
  })

  return {
    data: {
      orchestration,
      actionCenter,
    },
    summary: {
      orchestrationStatus: orchestration.summary.status,
      actionCenterStatus: actionCenter.summary.status,
      totalActionSeeds: orchestration.summary.totalActionSeeds,
      attemptedWrite: actionCenter.summary.attemptedWrite,
      verified: actionCenter.summary.verified,
    },
    warnings: [...orchestration.warnings, ...actionCenter.warnings],
  }
}
