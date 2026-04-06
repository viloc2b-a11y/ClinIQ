import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionLaneMarkerResult } from "../scenario-draft-authoring-execution-lane-marker/types"
import { buildScenarioDraftAuthoringExecutionTrackCapsule } from "./build-scenario-draft-authoring-execution-track-capsule"

function laneMarkerResult(args: {
  laneActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionLaneMarkerResult {
  const hasLaneTarget = args.sessionCode !== null
  const laneBlocked = !args.laneActive
  return {
    data: {
      executionLaneMarker: {
        laneActive: args.laneActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasLaneTarget,
          laneBlocked,
        },
      },
    },
    summary: {
      laneActive: args.laneActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionTrackCapsule", () => {
  it("matches contract and copies lane marker fields when track active", () => {
    const m = laneMarkerResult({
      laneActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionTrackCapsule(m)

    expect(r.data.executionTrackCapsule.trackActive).toBe(true)
    expect(r.data.executionTrackCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionTrackCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionTrackCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionTrackCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionTrackCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionTrackCapsule.summary.hasTrackTarget).toBe(true)
    expect(r.data.executionTrackCapsule.summary.trackBlocked).toBe(false)
    expect(r.summary).toEqual({
      trackActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("trackActive false and trackBlocked when laneActive is false; warning emitted", () => {
    const m = laneMarkerResult({
      laneActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionTrackCapsule(m)
    expect(r.data.executionTrackCapsule.trackActive).toBe(false)
    expect(r.data.executionTrackCapsule.summary.trackBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_TRACK_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution track capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-track target", () => {
    const m = laneMarkerResult({
      laneActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionTrackCapsule(m)
    expect(r.data.executionTrackCapsule.summary.hasTrackTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_TRACK_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution track target is available because no execution-lane session target exists.",
    )
  })

  it("does not mutate execution lane marker result", () => {
    const m = laneMarkerResult({
      laneActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionTrackCapsule(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = laneMarkerResult({
      laneActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionTrackCapsule(m)).toEqual(
      buildScenarioDraftAuthoringExecutionTrackCapsule(m),
    )
  })
})
