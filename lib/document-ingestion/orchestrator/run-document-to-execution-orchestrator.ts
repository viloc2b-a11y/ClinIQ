import type { HumanResolutionPayload } from "../human-resolution/types"
import { runManualReviewPipeline } from "../manual-review/run-manual-review-pipeline"
import { runHumanResolutionMerge } from "../human-resolution/run-human-resolution-merge"
import { runCorrectedReentryGate } from "../reentry/run-corrected-reentry-gate"
import { runDownstreamCanonicalBridge } from "../downstream-bridge/run-downstream-canonical-bridge"
import { runCoreBinding } from "../core-binding/run-core-binding"
import { buildActionCenterSeeds } from "./build-action-center-seeds"
import { evaluateOrchestratorStatus } from "./evaluate-orchestrator-status"

export function runDocumentToExecutionOrchestrator(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
  humanResolutionPayload?: HumanResolutionPayload | null
}) {
  const intake = runManualReviewPipeline({
    sourceType: params.sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
  })

  const acceptanceStatus = intake.summary.acceptanceStatus

  let humanResolution: ReturnType<typeof runHumanResolutionMerge> | null = null
  let reentry: ReturnType<typeof runCorrectedReentryGate> | null = null
  let downstream: ReturnType<typeof runDownstreamCanonicalBridge> | null = null
  let coreBinding: ReturnType<typeof runCoreBinding> | null = null

  const gatedIntake = intake.data.intake

  if (acceptanceStatus === "accepted" || acceptanceStatus === "accepted_with_warnings") {
    reentry = runCorrectedReentryGate({
      correctedParse: {
        data: {
          sourceType: params.sourceType,
          fileName: params.fileName ?? null,
          records: gatedIntake.data.adapted.data.records,
          appliedCorrections: [],
        },
        summary: {
          sourceType: params.sourceType,
          totalRecords: gatedIntake.data.adapted.summary.totalRecords,
          appliedCount: 0,
        },
      },
    })
  } else if (params.humanResolutionPayload) {
    humanResolution = runHumanResolutionMerge({
      payload: params.humanResolutionPayload,
      adaptedRecords: gatedIntake.data.adapted.data.records,
    })

    reentry = runCorrectedReentryGate({
      correctedParse: humanResolution.data.correctedParse,
    })
  }

  if (reentry?.summary.canReenter) {
    downstream = runDownstreamCanonicalBridge({
      reentryPayload: reentry.data.reentryPayload,
    })

    coreBinding = runCoreBinding({
      downstream,
    })
  }

  const actionSeeds = buildActionCenterSeeds({
    coreBinding: coreBinding as unknown as Parameters<typeof buildActionCenterSeeds>[0]["coreBinding"],
  })

  const orchestrator = evaluateOrchestratorStatus({
    acceptanceStatus,
    reentryStatus: reentry?.summary.status ?? null,
    downstreamStatus: downstream?.summary.status ?? null,
    coreBindingStatus: coreBinding?.summary.status ?? null,
    executionReady: coreBinding?.summary.executionReady ?? false,
    totalActionSeeds: actionSeeds.summary.totalActionSeeds,
  })

  return {
    data: {
      intake,
      manualReview: intake.data.reviewPayload,
      humanResolution,
      reentry,
      downstream,
      coreBinding,
      actionSeeds: actionSeeds.data.actionSeeds,
    },
    summary: {
      status: orchestrator.data.status,
      acceptanceStatus,
      reentryStatus: reentry?.summary.status ?? null,
      downstreamStatus: downstream?.summary.status ?? null,
      coreBindingStatus: coreBinding?.summary.status ?? null,
      totalActionSeeds: actionSeeds.summary.totalActionSeeds,
      executionReady: coreBinding?.summary.executionReady ?? false,
    },
    warnings: [
      ...intake.warnings,
      ...(humanResolution?.warnings ?? []),
      ...(reentry?.warnings ?? []),
      ...(downstream?.warnings ?? []),
      ...(coreBinding?.warnings ?? []),
      ...actionSeeds.warnings,
      ...orchestrator.warnings,
    ],
  }
}
