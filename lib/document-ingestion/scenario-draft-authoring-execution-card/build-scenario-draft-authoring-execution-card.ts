import type { ScenarioDraftAuthoringOperatorBriefResult } from "../scenario-draft-authoring-operator-brief/types"
import type { ScenarioDraftAuthoringExecutionCardResult } from "./types"

export function buildScenarioDraftAuthoringExecutionCard(
  operatorBriefResult: ScenarioDraftAuthoringOperatorBriefResult,
): ScenarioDraftAuthoringExecutionCardResult {
  const warnings: ScenarioDraftAuthoringExecutionCardResult["warnings"] = []

  const operatorBrief = operatorBriefResult.data.operatorBrief

  const readinessStatus = operatorBriefResult.summary.readinessStatus
  const kickoffReady = operatorBriefResult.summary.kickoffReady
  const launchReady = operatorBriefResult.summary.launchReady
  const firstSessionCode = operatorBrief.firstSessionCode
  const firstWorksetCode = operatorBrief.firstWorksetCode
  const firstQueueItemCode = operatorBrief.firstQueueItemCode
  const remainingSessionCount = operatorBrief.remainingSessionCount
  const totalPlannedItems = operatorBrief.totalPlannedItems

  const hasExecutionStartPoint = firstSessionCode !== null
  const executionBlocked = !launchReady

  if (!launchReady) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CARD_NOT_READY",
      message: "Scenario draft authoring execution card is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_EXECUTION_CARD_READY_WITH_WARNINGS",
      message: "Scenario draft authoring execution card can start but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasExecutionStartPoint) {
    warnings.push({
      code: "NO_EXECUTION_START_POINT",
      message: "No execution start point is available because no launch session exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionCard: {
        readinessStatus,
        kickoffReady,
        launchReady,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasExecutionStartPoint,
          executionBlocked,
          totalSessions: remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      launchReady,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
