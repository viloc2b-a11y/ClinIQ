import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringCurrentExecutionStampResult } from "../scenario-draft-authoring-current-execution-stamp/types"
import { buildScenarioDraftAuthoringActiveNowExecutionBadge } from "./build-scenario-draft-authoring-active-now-execution-badge"

function stampResult(args: {
  current: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringCurrentExecutionStampResult {
  const hasCurrentTarget = args.sessionCode !== null
  const currentBlocked = !args.current
  return {
    data: {
      currentExecutionStamp: {
        current: args.current,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasCurrentTarget,
          currentBlocked,
        },
      },
    },
    summary: {
      current: args.current,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringActiveNowExecutionBadge", () => {
  it("matches contract and copies stamp fields when activeNow", () => {
    const st = stampResult({
      current: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringActiveNowExecutionBadge(st)

    expect(r.data.activeNowExecutionBadge.activeNow).toBe(true)
    expect(r.data.activeNowExecutionBadge.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.activeNowExecutionBadge.worksetCode).toBe("WS_A")
    expect(r.data.activeNowExecutionBadge.queueItemCode).toBe("Q_START")
    expect(r.data.activeNowExecutionBadge.remainingSessionCount).toBe(2)
    expect(r.data.activeNowExecutionBadge.totalPlannedItems).toBe(10)
    expect(r.data.activeNowExecutionBadge.summary.hasActiveNowTarget).toBe(true)
    expect(r.data.activeNowExecutionBadge.summary.activeNowBlocked).toBe(false)
    expect(r.summary).toEqual({
      activeNow: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("activeNow false and activeNowBlocked when current is false; warning emitted", () => {
    const st = stampResult({
      current: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringActiveNowExecutionBadge(st)
    expect(r.data.activeNowExecutionBadge.activeNow).toBe(false)
    expect(r.data.activeNowExecutionBadge.summary.activeNowBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_ACTIVE_NOW_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring active-now execution badge is not active and cannot proceed.",
    )
  })

  it("info warning when no active-now target", () => {
    const st = stampResult({
      current: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringActiveNowExecutionBadge(st)
    expect(r.data.activeNowExecutionBadge.summary.hasActiveNowTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_ACTIVE_NOW_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No active-now execution target is available because no current execution session target exists.",
    )
  })

  it("does not mutate current execution stamp result", () => {
    const st = stampResult({
      current: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(st)
    buildScenarioDraftAuthoringActiveNowExecutionBadge(st)
    expect(st).toEqual(snap)
  })

  it("is deterministic", () => {
    const st = stampResult({
      current: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringActiveNowExecutionBadge(st)).toEqual(
      buildScenarioDraftAuthoringActiveNowExecutionBadge(st),
    )
  })
})
