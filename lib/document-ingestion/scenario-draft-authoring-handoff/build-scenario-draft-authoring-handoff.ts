import type { ScenarioDraftAuthoringSessionPlanResult } from "../scenario-draft-authoring-session-plan/types"
import { buildHandoffSession } from "./build-handoff-session"
import type { ScenarioDraftAuthoringHandoffResult } from "./types"

export function buildScenarioDraftAuthoringHandoff(
  sessionPlanResult: ScenarioDraftAuthoringSessionPlanResult,
): ScenarioDraftAuthoringHandoffResult {
  const warnings: ScenarioDraftAuthoringHandoffResult["warnings"] = []

  const sessions = sessionPlanResult.data.sessionPlan.sessions.map((session) => buildHandoffSession(session))

  const readinessStatus = sessionPlanResult.summary.readinessStatus
  const kickoffReady = sessionPlanResult.summary.kickoffReady
  const firstSessionCode = sessions[0]?.sessionCode ?? null
  const firstWorksetCode = sessionPlanResult.data.sessionPlan.summary.firstWorksetCode
  const firstQueueItemCode = sessions[0]?.firstQueueItemCode ?? null
  const totalPlannedItems = sessionPlanResult.summary.totalPlannedItems

  if (!kickoffReady) {
    warnings.push({
      code: "AUTHORING_HANDOFF_NOT_READY",
      message: "Scenario draft authoring handoff bundle is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_HANDOFF_READY_WITH_WARNINGS",
      message: "Scenario draft authoring handoff bundle can start but includes warning conditions.",
      severity: "warning",
    })
  }

  if (sessions.length === 0) {
    warnings.push({
      code: "NO_AUTHORING_HANDOFF_SESSIONS",
      message: "No authoring handoff sessions were generated because no session-plan sessions were provided.",
      severity: "info",
    })
  }

  return {
    data: {
      handoff: {
        readinessStatus,
        kickoffReady,
        firstSessionCode,
        sessions,
        summary: {
          totalSessions: sessions.length,
          totalPlannedItems,
          firstWorksetCode,
          firstQueueItemCode,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      totalSessions: sessions.length,
      totalPlannedItems,
      firstSessionCode,
    },
    warnings,
  }
}
