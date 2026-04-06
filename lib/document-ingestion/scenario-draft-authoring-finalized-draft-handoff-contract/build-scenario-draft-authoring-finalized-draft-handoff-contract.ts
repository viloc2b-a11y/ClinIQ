import type { ScenarioDraftAuthoringFinalizedDraftOutputResult } from "../scenario-draft-authoring-finalized-draft-output/types"
import type { ScenarioDraftAuthoringFinalizedDraftHandoffContractResult } from "./types"

export function buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
  finalizedDraftOutputResult: ScenarioDraftAuthoringFinalizedDraftOutputResult,
): ScenarioDraftAuthoringFinalizedDraftHandoffContractResult {
  const warnings: ScenarioDraftAuthoringFinalizedDraftHandoffContractResult["warnings"] = []

  const finalizedDraftOutput = finalizedDraftOutputResult.data.finalizedDraftOutput

  const handoffReady = finalizedDraftOutput.finalizedReady
  const sessionCode = finalizedDraftOutput.sessionCode
  const worksetCode = finalizedDraftOutput.worksetCode
  const queueItemCode = finalizedDraftOutput.queueItemCode
  const remainingSessionCount = finalizedDraftOutput.remainingSessionCount
  const totalPlannedItems = finalizedDraftOutput.totalPlannedItems

  const handoffPayload = {
    title: finalizedDraftOutput.finalizedFields.title,
    objective: finalizedDraftOutput.finalizedFields.objective,
    trigger: finalizedDraftOutput.finalizedFields.trigger,
    expectedBehavior: finalizedDraftOutput.finalizedFields.expectedBehavior,
    edgeCases: [...finalizedDraftOutput.finalizedFields.edgeCases],
    completionNotes: finalizedDraftOutput.finalizedFields.completionNotes,
  }

  const hasHandoffTarget = queueItemCode !== null
  const handoffBlocked = !handoffReady
  const handoffIsEmpty =
    handoffPayload.title === null &&
    handoffPayload.objective === null &&
    handoffPayload.trigger === null &&
    handoffPayload.expectedBehavior === null &&
    handoffPayload.edgeCases.length === 0 &&
    handoffPayload.completionNotes === null

  const handoffMarkedComplete =
    finalizedDraftOutput.summary.finalizedMarkedComplete

  if (!handoffReady) {
    warnings.push({
      code: "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_BLOCKED",
      message: "Scenario draft finalized handoff contract is not ready for downstream packaging.",
      severity: "warning",
    })
  }

  if (!hasHandoffTarget) {
    warnings.push({
      code: "NO_AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_TARGET",
      message: "No finalized draft handoff contract target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (handoffIsEmpty) {
    warnings.push({
      code: "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_EMPTY",
      message: "Finalized draft handoff contract is empty and does not yet contain downstream handoff content.",
      severity: "info",
    })
  }

  return {
    data: {
      finalizedDraftHandoffContract: {
        handoffReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        handoffTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        handoffPayload,
        summary: {
          hasHandoffTarget,
          handoffBlocked,
          handoffIsEmpty,
          handoffMarkedComplete,
        },
      },
    },
    summary: {
      handoffReady,
      sessionCode,
      queueItemCode,
      handoffIsEmpty,
      handoffMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
