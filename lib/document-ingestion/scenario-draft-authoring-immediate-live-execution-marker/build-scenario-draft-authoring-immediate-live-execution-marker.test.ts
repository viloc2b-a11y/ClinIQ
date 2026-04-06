import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringActiveNowExecutionBadgeResult } from "../scenario-draft-authoring-active-now-execution-badge/types"
import { buildScenarioDraftAuthoringImmediateLiveExecutionMarker } from "./build-scenario-draft-authoring-immediate-live-execution-marker"

function badgeResult(args: {
  activeNow: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringActiveNowExecutionBadgeResult {
  const hasActiveNowTarget = args.sessionCode !== null
  const activeNowBlocked = !args.activeNow
  return {
    data: {
      activeNowExecutionBadge: {
        activeNow: args.activeNow,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasActiveNowTarget,
          activeNowBlocked,
        },
      },
    },
    summary: {
      activeNow: args.activeNow,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringImmediateLiveExecutionMarker", () => {
  it("matches contract and copies badge fields when immediateLive", () => {
    const b = badgeResult({
      activeNow: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringImmediateLiveExecutionMarker(b)

    expect(r.data.immediateLiveExecutionMarker.immediateLive).toBe(true)
    expect(r.data.immediateLiveExecutionMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.immediateLiveExecutionMarker.worksetCode).toBe("WS_A")
    expect(r.data.immediateLiveExecutionMarker.queueItemCode).toBe("Q_START")
    expect(r.data.immediateLiveExecutionMarker.remainingSessionCount).toBe(2)
    expect(r.data.immediateLiveExecutionMarker.totalPlannedItems).toBe(10)
    expect(r.data.immediateLiveExecutionMarker.summary.hasImmediateLiveTarget).toBe(true)
    expect(r.data.immediateLiveExecutionMarker.summary.immediateLiveBlocked).toBe(false)
    expect(r.summary).toEqual({
      immediateLive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("immediateLive false and immediateLiveBlocked when activeNow is false; warning emitted", () => {
    const b = badgeResult({
      activeNow: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringImmediateLiveExecutionMarker(b)
    expect(r.data.immediateLiveExecutionMarker.immediateLive).toBe(false)
    expect(r.data.immediateLiveExecutionMarker.summary.immediateLiveBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_IMMEDIATE_LIVE_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring immediate-live execution marker is not active and cannot proceed.",
    )
  })

  it("info warning when no immediate-live target", () => {
    const b = badgeResult({
      activeNow: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringImmediateLiveExecutionMarker(b)
    expect(r.data.immediateLiveExecutionMarker.summary.hasImmediateLiveTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_IMMEDIATE_LIVE_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No immediate-live execution target is available because no active-now execution session target exists.",
    )
  })

  it("does not mutate active-now execution badge result", () => {
    const b = badgeResult({
      activeNow: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(b)
    buildScenarioDraftAuthoringImmediateLiveExecutionMarker(b)
    expect(b).toEqual(snap)
  })

  it("is deterministic", () => {
    const b = badgeResult({
      activeNow: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringImmediateLiveExecutionMarker(b)).toEqual(
      buildScenarioDraftAuthoringImmediateLiveExecutionMarker(b),
    )
  })
})
