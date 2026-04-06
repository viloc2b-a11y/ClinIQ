import type { ScenarioDraftAuthoringKickoffResult } from "../scenario-draft-authoring-kickoff/types"
import { buildAuthoringSession } from "./build-authoring-session"
import type { ScenarioDraftAuthoringSessionPlanResult } from "./types"

export function buildScenarioDraftAuthoringSessionPlan(
  kickoffResult: ScenarioDraftAuthoringKickoffResult,
): ScenarioDraftAuthoringSessionPlanResult {
  const warnings: ScenarioDraftAuthoringSessionPlanResult["warnings"] = []

  const sessions = kickoffResult.data.kickoff.worksets.map((workset, index) =>
    buildAuthoringSession({
      sessionPosition: index + 1,
      workset,
    }),
  )

  const readinessStatus = kickoffResult.summary.readinessStatus
  const kickoffReady = kickoffResult.summary.kickoffReady
  const totalPlannedItems = sessions.reduce((sum, session) => sum + session.totalItems, 0)

  if (!kickoffReady) {
    warnings.push({
      code: "AUTHORING_SESSION_PLAN_NOT_READY",
      message: "Scenario draft authoring session plan is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_SESSION_PLAN_READY_WITH_WARNINGS",
      message: "Scenario draft authoring session plan can start but includes warning conditions.",
      severity: "warning",
    })
  }

  if (sessions.length === 0) {
    warnings.push({
      code: "NO_AUTHORING_SESSIONS",
      message: "No authoring sessions were generated because no kickoff worksets were provided.",
      severity: "info",
    })
  }

  const firstSessionCode = sessions[0]?.sessionCode ?? null
  const firstWorksetCode = kickoffResult.data.kickoff.firstWorksetCode
  const firstQueueItemCode = sessions[0]?.firstQueueItemCode ?? null

  return {
    data: {
      sessionPlan: {
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
