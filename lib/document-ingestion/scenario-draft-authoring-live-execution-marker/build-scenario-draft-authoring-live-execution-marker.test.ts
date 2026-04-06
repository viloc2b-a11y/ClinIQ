import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionFocusCapsuleResult } from "../scenario-draft-authoring-execution-focus-capsule/types"
import { buildScenarioDraftAuthoringLiveExecutionMarker } from "./build-scenario-draft-authoring-live-execution-marker"

function capsuleResult(args: {
  focused: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionFocusCapsuleResult {
  const hasFocusTarget = args.sessionCode !== null
  const focusBlocked = !args.focused
  return {
    data: {
      executionFocusCapsule: {
        focused: args.focused,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasFocusTarget,
          focusBlocked,
        },
      },
    },
    summary: {
      focused: args.focused,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringLiveExecutionMarker", () => {
  it("matches contract and copies capsule fields when live", () => {
    const cap = capsuleResult({
      focused: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringLiveExecutionMarker(cap)

    expect(r.data.liveExecutionMarker.live).toBe(true)
    expect(r.data.liveExecutionMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.liveExecutionMarker.worksetCode).toBe("WS_A")
    expect(r.data.liveExecutionMarker.queueItemCode).toBe("Q_START")
    expect(r.data.liveExecutionMarker.remainingSessionCount).toBe(2)
    expect(r.data.liveExecutionMarker.totalPlannedItems).toBe(10)
    expect(r.data.liveExecutionMarker.summary.hasLiveTarget).toBe(true)
    expect(r.data.liveExecutionMarker.summary.liveBlocked).toBe(false)
    expect(r.summary).toEqual({
      live: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("live false and liveBlocked when focused is false; warning emitted", () => {
    const cap = capsuleResult({
      focused: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringLiveExecutionMarker(cap)
    expect(r.data.liveExecutionMarker.live).toBe(false)
    expect(r.data.liveExecutionMarker.summary.liveBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_LIVE_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring live execution marker is not live and cannot proceed.",
    )
  })

  it("info warning when no live target", () => {
    const cap = capsuleResult({
      focused: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringLiveExecutionMarker(cap)
    expect(r.data.liveExecutionMarker.summary.hasLiveTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_LIVE_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No live execution target is available because no execution focus session target exists.",
    )
  })

  it("does not mutate execution focus capsule result", () => {
    const cap = capsuleResult({
      focused: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(cap)
    buildScenarioDraftAuthoringLiveExecutionMarker(cap)
    expect(cap).toEqual(snap)
  })

  it("is deterministic", () => {
    const cap = capsuleResult({
      focused: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringLiveExecutionMarker(cap)).toEqual(
      buildScenarioDraftAuthoringLiveExecutionMarker(cap),
    )
  })
})
