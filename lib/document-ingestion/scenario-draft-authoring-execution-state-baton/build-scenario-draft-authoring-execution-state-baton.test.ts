import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringOngoingExecutionMarkerResult } from "../scenario-draft-authoring-ongoing-execution-marker/types"
import { buildScenarioDraftAuthoringExecutionStateBaton } from "./build-scenario-draft-authoring-execution-state-baton"

function markerResult(args: {
  ongoing: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringOngoingExecutionMarkerResult {
  const hasOngoingTarget = args.sessionCode !== null
  const ongoingBlocked = !args.ongoing
  return {
    data: {
      ongoingExecutionMarker: {
        ongoing: args.ongoing,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasOngoingTarget,
          ongoingBlocked,
        },
      },
    },
    summary: {
      ongoing: args.ongoing,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionStateBaton", () => {
  it("matches contract and copies marker fields when execution state active", () => {
    const m = markerResult({
      ongoing: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionStateBaton(m)

    expect(r.data.executionStateBaton.executionStateActive).toBe(true)
    expect(r.data.executionStateBaton.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionStateBaton.worksetCode).toBe("WS_A")
    expect(r.data.executionStateBaton.queueItemCode).toBe("Q_START")
    expect(r.data.executionStateBaton.remainingSessionCount).toBe(2)
    expect(r.data.executionStateBaton.totalPlannedItems).toBe(10)
    expect(r.data.executionStateBaton.summary.hasExecutionStateTarget).toBe(true)
    expect(r.data.executionStateBaton.summary.executionStateBlocked).toBe(false)
    expect(r.summary).toEqual({
      executionStateActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("executionStateActive false and executionStateBlocked when ongoing is false; warning emitted", () => {
    const m = markerResult({
      ongoing: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionStateBaton(m)
    expect(r.data.executionStateBaton.executionStateActive).toBe(false)
    expect(r.data.executionStateBaton.summary.executionStateBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_STATE_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution state baton is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-state target", () => {
    const m = markerResult({
      ongoing: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionStateBaton(m)
    expect(r.data.executionStateBaton.summary.hasExecutionStateTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_STATE_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution-state target is available because no ongoing-execution session target exists.",
    )
  })

  it("does not mutate ongoing execution marker result", () => {
    const m = markerResult({
      ongoing: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionStateBaton(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = markerResult({
      ongoing: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionStateBaton(m)).toEqual(
      buildScenarioDraftAuthoringExecutionStateBaton(m),
    )
  })
})
