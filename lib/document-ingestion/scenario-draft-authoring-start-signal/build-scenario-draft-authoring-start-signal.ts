import type { ScenarioDraftAuthoringExecutionCardResult } from "../scenario-draft-authoring-execution-card/types"
import type { ScenarioDraftAuthoringStartSignalResult } from "./types"

export function buildScenarioDraftAuthoringStartSignal(
  executionCardResult: ScenarioDraftAuthoringExecutionCardResult,
): ScenarioDraftAuthoringStartSignalResult {
  const warnings: ScenarioDraftAuthoringStartSignalResult["warnings"] = []

  const executionCard = executionCardResult.data.executionCard

  const readinessStatus = executionCardResult.summary.readinessStatus
  const kickoffReady = executionCardResult.summary.kickoffReady
  const launchReady = executionCardResult.summary.launchReady
  const firstSessionCode = executionCard.firstSessionCode
  const firstWorksetCode = executionCard.firstWorksetCode
  const firstQueueItemCode = executionCard.firstQueueItemCode
  const remainingSessionCount = executionCard.remainingSessionCount
  const totalPlannedItems = executionCard.totalPlannedItems

  const hasStartTarget = firstSessionCode !== null
  const startNow = launchReady && hasStartTarget
  const startBlocked = !startNow

  if (!startNow) {
    warnings.push({
      code: "AUTHORING_START_SIGNAL_NOT_READY",
      message: "Scenario draft authoring start signal is not ready to begin.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_START_SIGNAL_READY_WITH_WARNINGS",
      message: "Scenario draft authoring can begin but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasStartTarget) {
    warnings.push({
      code: "NO_AUTHORING_START_TARGET",
      message: "No start target is available because no execution start point exists.",
      severity: "info",
    })
  }

  return {
    data: {
      startSignal: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasStartTarget,
          startBlocked,
          totalSessions: remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      launchReady,
      startNow,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
