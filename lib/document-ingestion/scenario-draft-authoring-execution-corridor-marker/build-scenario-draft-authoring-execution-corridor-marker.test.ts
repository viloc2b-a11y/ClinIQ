import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionTrackCapsuleResult } from "../scenario-draft-authoring-execution-track-capsule/types"
import { buildScenarioDraftAuthoringExecutionCorridorMarker } from "./build-scenario-draft-authoring-execution-corridor-marker"

function trackCapsuleResult(args: {
  trackActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionTrackCapsuleResult {
  const hasTrackTarget = args.sessionCode !== null
  const trackBlocked = !args.trackActive
  return {
    data: {
      executionTrackCapsule: {
        trackActive: args.trackActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasTrackTarget,
          trackBlocked,
        },
      },
    },
    summary: {
      trackActive: args.trackActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionCorridorMarker", () => {
  it("matches contract and copies track capsule fields when corridor active", () => {
    const c = trackCapsuleResult({
      trackActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionCorridorMarker(c)

    expect(r.data.executionCorridorMarker.corridorActive).toBe(true)
    expect(r.data.executionCorridorMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionCorridorMarker.worksetCode).toBe("WS_A")
    expect(r.data.executionCorridorMarker.queueItemCode).toBe("Q_START")
    expect(r.data.executionCorridorMarker.remainingSessionCount).toBe(2)
    expect(r.data.executionCorridorMarker.totalPlannedItems).toBe(10)
    expect(r.data.executionCorridorMarker.summary.hasCorridorTarget).toBe(true)
    expect(r.data.executionCorridorMarker.summary.corridorBlocked).toBe(false)
    expect(r.summary).toEqual({
      corridorActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("corridorActive false and corridorBlocked when trackActive is false; warning emitted", () => {
    const c = trackCapsuleResult({
      trackActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionCorridorMarker(c)
    expect(r.data.executionCorridorMarker.corridorActive).toBe(false)
    expect(r.data.executionCorridorMarker.summary.corridorBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_CORRIDOR_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution corridor marker is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-corridor target", () => {
    const c = trackCapsuleResult({
      trackActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionCorridorMarker(c)
    expect(r.data.executionCorridorMarker.summary.hasCorridorTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_CORRIDOR_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution corridor target is available because no execution-track session target exists.",
    )
  })

  it("does not mutate execution track capsule result", () => {
    const c = trackCapsuleResult({
      trackActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringExecutionCorridorMarker(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = trackCapsuleResult({
      trackActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionCorridorMarker(c)).toEqual(
      buildScenarioDraftAuthoringExecutionCorridorMarker(c),
    )
  })
})
