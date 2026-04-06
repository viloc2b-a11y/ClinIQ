import type { ScenarioDraftAuthoringHandoffResult } from "../scenario-draft-authoring-handoff/types"
import type { ScenarioDraftAuthoringControlSnapshotResult } from "./types"

export function buildScenarioDraftAuthoringControlSnapshot(
  handoffResult: ScenarioDraftAuthoringHandoffResult,
): ScenarioDraftAuthoringControlSnapshotResult {
  const warnings: ScenarioDraftAuthoringControlSnapshotResult["warnings"] = []

  const sessions = handoffResult.data.handoff.sessions
  const firstSession = sessions[0] ?? null

  const readinessStatus = handoffResult.summary.readinessStatus
  const kickoffReady = handoffResult.summary.kickoffReady
  const firstActionableSessionCode = firstSession?.sessionCode ?? null
  const firstActionableWorksetCode = firstSession?.targetWorksetCode ?? null
  const firstActionableQueueItemCode = firstSession?.firstQueueItemCode ?? null
  const remainingSessionCount = sessions.length
  const totalPlannedItems = handoffResult.summary.totalPlannedItems

  if (!kickoffReady) {
    warnings.push({
      code: "AUTHORING_CONTROL_NOT_READY",
      message: "Scenario draft authoring control snapshot is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_CONTROL_READY_WITH_WARNINGS",
      message: "Scenario draft authoring control snapshot can start but includes warning conditions.",
      severity: "warning",
    })
  }

  if (sessions.length === 0) {
    warnings.push({
      code: "NO_AUTHORING_CONTROL_SESSION",
      message: "No actionable authoring session is available because no handoff sessions were provided.",
      severity: "info",
    })
  }

  return {
    data: {
      controlSnapshot: {
        readinessStatus,
        kickoffReady,
        firstActionableSessionCode,
        firstActionableWorksetCode,
        firstActionableQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          totalSessions: sessions.length,
          hasActionableSession: sessions.length > 0,
          firstSessionIsActionable: sessions.length > 0,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      firstActionableSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
