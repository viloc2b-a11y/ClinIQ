import { runQualityGatedDocumentIntake } from "../quality-gates/run-quality-gated-document-intake"
import { buildManualReviewPayload } from "./build-manual-review-payload"
import { buildReviewerSummary } from "./build-reviewer-summary"

export function runManualReviewPipeline(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
}) {
  const intake = runQualityGatedDocumentIntake({
    sourceType: params.sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
  })

  const reviewPayload = buildManualReviewPayload({
    fileName: params.fileName,
    sourceType: params.sourceType,
    adapted: intake.data.adapted,
    qualityGate: intake.data.qualityGate,
  })

  const reviewerSummary = buildReviewerSummary({
    reviewPayload,
  })

  return {
    data: {
      intake,
      reviewPayload,
      reviewerSummary,
    },
    summary: {
      acceptanceStatus: intake.summary.acceptanceStatus,
      accepted: intake.summary.accepted,
      shouldQueue: reviewPayload.summary.shouldQueue,
      priority: reviewPayload.summary.priority,
      totalFieldIssues: reviewPayload.summary.totalFieldIssues,
    },
    warnings: [
      ...intake.warnings,
      ...reviewPayload.warnings,
      ...reviewerSummary.warnings,
    ],
  }
}
