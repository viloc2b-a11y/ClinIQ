import type { ScenarioDraftAuthoringAssignmentPacketResult } from "../scenario-draft-authoring-assignment-packet/types"
import type { ScenarioDraftAuthoringDraftScaffoldContractResult } from "./types"

export function buildScenarioDraftAuthoringDraftScaffoldContract(
  assignmentPacketResult: ScenarioDraftAuthoringAssignmentPacketResult,
): ScenarioDraftAuthoringDraftScaffoldContractResult {
  const warnings: ScenarioDraftAuthoringDraftScaffoldContractResult["warnings"] = []

  const assignmentPacket = assignmentPacketResult.data.assignmentPacket

  const scaffoldReady = assignmentPacket.assignmentReady
  const sessionCode = assignmentPacket.sessionCode
  const worksetCode = assignmentPacket.worksetCode
  const queueItemCode = assignmentPacket.queueItemCode
  const remainingSessionCount = assignmentPacket.remainingSessionCount
  const totalPlannedItems = assignmentPacket.totalPlannedItems

  const hasScaffoldTarget = queueItemCode !== null
  const scaffoldBlocked = !scaffoldReady
  const scaffoldIsEmpty = true

  if (!scaffoldReady) {
    warnings.push({
      code: "AUTHORING_DRAFT_SCAFFOLD_BLOCKED",
      message: "Scenario draft authoring draft scaffold contract is not ready for downstream drafting use.",
      severity: "warning",
    })
  }

  if (!hasScaffoldTarget) {
    warnings.push({
      code: "NO_AUTHORING_DRAFT_SCAFFOLD_TARGET",
      message: "No authoring draft scaffold target is available because no queue item target exists.",
      severity: "info",
    })
  }

  warnings.push({
    code: "AUTHORING_DRAFT_SCAFFOLD_EMPTY",
    message: "Draft scaffold is intentionally empty and awaits human authoring input.",
    severity: "info",
  })

  return {
    data: {
      draftScaffoldContract: {
        scaffoldReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        scaffoldTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        scaffold: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
        },
        summary: {
          hasScaffoldTarget,
          scaffoldBlocked,
          scaffoldIsEmpty,
        },
      },
    },
    summary: {
      scaffoldReady,
      sessionCode,
      queueItemCode,
      scaffoldIsEmpty,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
