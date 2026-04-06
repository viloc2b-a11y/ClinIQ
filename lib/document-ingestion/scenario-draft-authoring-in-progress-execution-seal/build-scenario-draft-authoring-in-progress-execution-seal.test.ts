import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringLiveExecutionMarkerResult } from "../scenario-draft-authoring-live-execution-marker/types"
import { buildScenarioDraftAuthoringInProgressExecutionSeal } from "./build-scenario-draft-authoring-in-progress-execution-seal"

function markerResult(args: {
  live: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringLiveExecutionMarkerResult {
  const hasLiveTarget = args.sessionCode !== null
  const liveBlocked = !args.live
  return {
    data: {
      liveExecutionMarker: {
        live: args.live,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasLiveTarget,
          liveBlocked,
        },
      },
    },
    summary: {
      live: args.live,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringInProgressExecutionSeal", () => {
  it("matches contract and copies marker fields when in progress", () => {
    const m = markerResult({
      live: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringInProgressExecutionSeal(m)

    expect(r.data.inProgressExecutionSeal.inProgress).toBe(true)
    expect(r.data.inProgressExecutionSeal.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.inProgressExecutionSeal.worksetCode).toBe("WS_A")
    expect(r.data.inProgressExecutionSeal.queueItemCode).toBe("Q_START")
    expect(r.data.inProgressExecutionSeal.remainingSessionCount).toBe(2)
    expect(r.data.inProgressExecutionSeal.totalPlannedItems).toBe(10)
    expect(r.data.inProgressExecutionSeal.summary.hasInProgressTarget).toBe(true)
    expect(r.data.inProgressExecutionSeal.summary.inProgressBlocked).toBe(false)
    expect(r.summary).toEqual({
      inProgress: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("inProgress false and inProgressBlocked when live is false; warning emitted", () => {
    const m = markerResult({
      live: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringInProgressExecutionSeal(m)
    expect(r.data.inProgressExecutionSeal.inProgress).toBe(false)
    expect(r.data.inProgressExecutionSeal.summary.inProgressBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_IN_PROGRESS_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring in-progress execution seal is not active and cannot proceed.",
    )
  })

  it("info warning when no in-progress target", () => {
    const m = markerResult({
      live: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringInProgressExecutionSeal(m)
    expect(r.data.inProgressExecutionSeal.summary.hasInProgressTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_IN_PROGRESS_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No in-progress execution target is available because no live execution session target exists.",
    )
  })

  it("does not mutate live execution marker result", () => {
    const m = markerResult({
      live: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringInProgressExecutionSeal(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = markerResult({
      live: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringInProgressExecutionSeal(m)).toEqual(
      buildScenarioDraftAuthoringInProgressExecutionSeal(m),
    )
  })
})
