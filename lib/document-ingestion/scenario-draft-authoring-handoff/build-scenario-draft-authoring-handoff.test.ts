import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringSessionPlanResult } from "../scenario-draft-authoring-session-plan/types"
import { buildScenarioDraftAuthoringHandoff } from "./build-scenario-draft-authoring-handoff"

function planSession(
  position: number,
  worksetCode: string,
  firstQ: string | null,
): ScenarioDraftAuthoringSessionPlanResult["data"]["sessionPlan"]["sessions"][number] {
  return {
    sessionCode: `AUTHORING_SESSION_${String(position).padStart(4, "0")}`,
    sessionPosition: position,
    targetWorksetCode: worksetCode,
    targetWorksetPosition: position,
    totalItems: position,
    startQueuePosition: position,
    endQueuePosition: position + 2,
    firstQueueItemCode: firstQ,
    lastQueueItemCode: "Z",
  }
}

function sessionPlanResult(
  sessions: ScenarioDraftAuthoringSessionPlanResult["data"]["sessionPlan"]["sessions"],
  opts: {
    readinessStatus: ScenarioDraftAuthoringSessionPlanResult["summary"]["readinessStatus"]
    kickoffReady: boolean
    firstWorksetCode: string | null
    totalPlannedItems: number
  },
): ScenarioDraftAuthoringSessionPlanResult {
  return {
    data: {
      sessionPlan: {
        readinessStatus: opts.readinessStatus,
        kickoffReady: opts.kickoffReady,
        firstSessionCode: sessions[0]?.sessionCode ?? null,
        sessions,
        summary: {
          totalSessions: sessions.length,
          totalPlannedItems: opts.totalPlannedItems,
          firstWorksetCode: opts.firstWorksetCode,
          firstQueueItemCode: sessions[0]?.firstQueueItemCode ?? null,
        },
      },
    },
    summary: {
      readinessStatus: opts.readinessStatus,
      kickoffReady: opts.kickoffReady,
      totalSessions: sessions.length,
      totalPlannedItems: opts.totalPlannedItems,
      firstSessionCode: sessions[0]?.sessionCode ?? null,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringHandoff", () => {
  const twoSessions = [planSession(1, "WS_A", "Q0"), planSession(2, "WS_B", "Q1")]

  it("matches contract; order preserved; summary fields from plan", () => {
    const sp = sessionPlanResult(twoSessions, {
      readinessStatus: "ready",
      kickoffReady: true,
      firstWorksetCode: "WS_A",
      totalPlannedItems: 3,
    })
    const result = buildScenarioDraftAuthoringHandoff(sp)

    expect(result.data.handoff.sessions).toHaveLength(2)
    expect(result.data.handoff.sessions[0].targetWorksetCode).toBe("WS_A")
    expect(result.data.handoff.sessions[1].targetWorksetCode).toBe("WS_B")
    expect(result.data.handoff.sessions[0].isFirstSession).toBe(true)
    expect(result.data.handoff.sessions[1].isFirstSession).toBe(false)
    expect(result.data.handoff.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(result.summary.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(result.data.handoff.summary.firstWorksetCode).toBe("WS_A")
    expect(result.data.handoff.summary.firstQueueItemCode).toBe("Q0")
    expect(result.data.handoff.summary.totalPlannedItems).toBe(3)
    expect(result.summary.totalPlannedItems).toBe(3)
  })

  it("warning when kickoffReady is false", () => {
    const sp = sessionPlanResult(twoSessions, {
      readinessStatus: "not_ready",
      kickoffReady: false,
      firstWorksetCode: "WS_A",
      totalPlannedItems: 3,
    })
    const result = buildScenarioDraftAuthoringHandoff(sp)
    expect(result.warnings.some((w) => w.code === "AUTHORING_HANDOFF_NOT_READY")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const sp = sessionPlanResult(twoSessions, {
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      firstWorksetCode: "WS_A",
      totalPlannedItems: 3,
    })
    const result = buildScenarioDraftAuthoringHandoff(sp)
    expect(result.warnings.some((w) => w.code === "AUTHORING_HANDOFF_READY_WITH_WARNINGS")).toBe(true)
  })

  it("info when no sessions", () => {
    const sp = sessionPlanResult([], {
      readinessStatus: "not_ready",
      kickoffReady: false,
      firstWorksetCode: null,
      totalPlannedItems: 0,
    })
    const result = buildScenarioDraftAuthoringHandoff(sp)
    expect(
      result.warnings.some((w) => w.code === "NO_AUTHORING_HANDOFF_SESSIONS" && w.severity === "info"),
    ).toBe(true)
  })

  it("does not mutate session plan result", () => {
    const sp = sessionPlanResult(structuredClone(twoSessions), {
      readinessStatus: "ready",
      kickoffReady: true,
      firstWorksetCode: "WS_A",
      totalPlannedItems: 3,
    })
    const snap = structuredClone(sp)
    buildScenarioDraftAuthoringHandoff(sp)
    expect(sp).toEqual(snap)
  })

  it("is deterministic", () => {
    const sp = sessionPlanResult(twoSessions, {
      readinessStatus: "ready",
      kickoffReady: true,
      firstWorksetCode: "WS_A",
      totalPlannedItems: 3,
    })
    expect(buildScenarioDraftAuthoringHandoff(sp)).toEqual(buildScenarioDraftAuthoringHandoff(sp))
  })
})
