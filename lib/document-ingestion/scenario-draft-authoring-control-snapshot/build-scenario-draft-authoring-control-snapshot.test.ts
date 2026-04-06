import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringHandoffResult } from "../scenario-draft-authoring-handoff/types"
import { buildScenarioDraftAuthoringControlSnapshot } from "./build-scenario-draft-authoring-control-snapshot"

function handoffSession(
  code: string,
  workset: string,
  firstQ: string | null,
): ScenarioDraftAuthoringHandoffResult["data"]["handoff"]["sessions"][number] {
  return {
    sessionCode: code,
    sessionPosition: 1,
    targetWorksetCode: workset,
    targetWorksetPosition: 1,
    totalItems: 2,
    startQueuePosition: 1,
    endQueuePosition: 2,
    firstQueueItemCode: firstQ,
    lastQueueItemCode: "Z",
    isFirstSession: true,
  }
}

function handoffSession2(): ScenarioDraftAuthoringHandoffResult["data"]["handoff"]["sessions"][number] {
  return {
    sessionCode: "AUTHORING_SESSION_0002",
    sessionPosition: 2,
    targetWorksetCode: "W2",
    targetWorksetPosition: 2,
    totalItems: 1,
    startQueuePosition: 3,
    endQueuePosition: 3,
    firstQueueItemCode: "Q2",
    lastQueueItemCode: "Q2",
    isFirstSession: false,
  }
}

function handoffResult(
  sessions: ScenarioDraftAuthoringHandoffResult["data"]["handoff"]["sessions"],
  opts: {
    readinessStatus: ScenarioDraftAuthoringHandoffResult["summary"]["readinessStatus"]
    kickoffReady: boolean
    totalPlannedItems: number
  },
): ScenarioDraftAuthoringHandoffResult {
  const first = sessions[0]
  return {
    data: {
      handoff: {
        readinessStatus: opts.readinessStatus,
        kickoffReady: opts.kickoffReady,
        firstSessionCode: first?.sessionCode ?? null,
        sessions,
        summary: {
          totalSessions: sessions.length,
          totalPlannedItems: opts.totalPlannedItems,
          firstWorksetCode: first?.targetWorksetCode ?? null,
          firstQueueItemCode: first?.firstQueueItemCode ?? null,
        },
      },
    },
    summary: {
      readinessStatus: opts.readinessStatus,
      kickoffReady: opts.kickoffReady,
      totalSessions: sessions.length,
      totalPlannedItems: opts.totalPlannedItems,
      firstSessionCode: first?.sessionCode ?? null,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringControlSnapshot", () => {
  const twoSessions = [handoffSession("AUTHORING_SESSION_0001", "WS_MAIN", "Q_START"), handoffSession2()]

  it("matches contract; first actionable fields from sessions[0]", () => {
    const hf = handoffResult(twoSessions, { readinessStatus: "ready", kickoffReady: true, totalPlannedItems: 7 })
    const result = buildScenarioDraftAuthoringControlSnapshot(hf)

    expect(result.data.controlSnapshot.firstActionableSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(result.data.controlSnapshot.firstActionableWorksetCode).toBe("WS_MAIN")
    expect(result.data.controlSnapshot.firstActionableQueueItemCode).toBe("Q_START")
    expect(result.data.controlSnapshot.remainingSessionCount).toBe(2)
    expect(result.data.controlSnapshot.totalPlannedItems).toBe(7)
    expect(result.summary.remainingSessionCount).toBe(2)
    expect(result.summary.totalPlannedItems).toBe(7)
    expect(result.data.controlSnapshot.summary.totalSessions).toBe(2)
    expect(result.data.controlSnapshot.summary.hasActionableSession).toBe(true)
    expect(result.data.controlSnapshot.summary.firstSessionIsActionable).toBe(true)
  })

  it("warning when kickoffReady is false", () => {
    const hf = handoffResult(twoSessions, { readinessStatus: "not_ready", kickoffReady: false, totalPlannedItems: 0 })
    const result = buildScenarioDraftAuthoringControlSnapshot(hf)
    expect(result.warnings.some((w) => w.code === "AUTHORING_CONTROL_NOT_READY")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const hf = handoffResult(twoSessions, {
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      totalPlannedItems: 3,
    })
    const result = buildScenarioDraftAuthoringControlSnapshot(hf)
    expect(result.warnings.some((w) => w.code === "AUTHORING_CONTROL_READY_WITH_WARNINGS")).toBe(true)
  })

  it("info when no sessions; actionable flags false", () => {
    const hf = handoffResult([], { readinessStatus: "not_ready", kickoffReady: false, totalPlannedItems: 0 })
    const result = buildScenarioDraftAuthoringControlSnapshot(hf)
    expect(
      result.warnings.some((w) => w.code === "NO_AUTHORING_CONTROL_SESSION" && w.severity === "info"),
    ).toBe(true)
    expect(result.data.controlSnapshot.firstActionableSessionCode).toBeNull()
    expect(result.data.controlSnapshot.remainingSessionCount).toBe(0)
    expect(result.data.controlSnapshot.summary.hasActionableSession).toBe(false)
    expect(result.data.controlSnapshot.summary.firstSessionIsActionable).toBe(false)
  })

  it("does not mutate handoff result", () => {
    const hf = handoffResult(structuredClone(twoSessions), {
      readinessStatus: "ready",
      kickoffReady: true,
      totalPlannedItems: 7,
    })
    const snap = structuredClone(hf)
    buildScenarioDraftAuthoringControlSnapshot(hf)
    expect(hf).toEqual(snap)
  })

  it("is deterministic", () => {
    const hf = handoffResult(twoSessions, { readinessStatus: "ready", kickoffReady: true, totalPlannedItems: 7 })
    expect(buildScenarioDraftAuthoringControlSnapshot(hf)).toEqual(buildScenarioDraftAuthoringControlSnapshot(hf))
  })
})
