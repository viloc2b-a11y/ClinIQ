import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringSustainedExecutionCapsuleResult } from "../scenario-draft-authoring-sustained-execution-capsule/types"
import { buildScenarioDraftAuthoringOngoingExecutionMarker } from "./build-scenario-draft-authoring-ongoing-execution-marker"

function capsuleResult(args: {
  sustained: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringSustainedExecutionCapsuleResult {
  const hasSustainedTarget = args.sessionCode !== null
  const sustainedBlocked = !args.sustained
  return {
    data: {
      sustainedExecutionCapsule: {
        sustained: args.sustained,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasSustainedTarget,
          sustainedBlocked,
        },
      },
    },
    summary: {
      sustained: args.sustained,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringOngoingExecutionMarker", () => {
  it("matches contract and copies capsule fields when ongoing", () => {
    const c = capsuleResult({
      sustained: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringOngoingExecutionMarker(c)

    expect(r.data.ongoingExecutionMarker.ongoing).toBe(true)
    expect(r.data.ongoingExecutionMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.ongoingExecutionMarker.worksetCode).toBe("WS_A")
    expect(r.data.ongoingExecutionMarker.queueItemCode).toBe("Q_START")
    expect(r.data.ongoingExecutionMarker.remainingSessionCount).toBe(2)
    expect(r.data.ongoingExecutionMarker.totalPlannedItems).toBe(10)
    expect(r.data.ongoingExecutionMarker.summary.hasOngoingTarget).toBe(true)
    expect(r.data.ongoingExecutionMarker.summary.ongoingBlocked).toBe(false)
    expect(r.summary).toEqual({
      ongoing: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("ongoing false and ongoingBlocked when sustained is false; warning emitted", () => {
    const c = capsuleResult({
      sustained: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringOngoingExecutionMarker(c)
    expect(r.data.ongoingExecutionMarker.ongoing).toBe(false)
    expect(r.data.ongoingExecutionMarker.summary.ongoingBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_ONGOING_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring ongoing execution marker is not active and cannot proceed.",
    )
  })

  it("info warning when no ongoing-execution target", () => {
    const c = capsuleResult({
      sustained: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringOngoingExecutionMarker(c)
    expect(r.data.ongoingExecutionMarker.summary.hasOngoingTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_ONGOING_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No ongoing-execution target is available because no sustained-execution session target exists.",
    )
  })

  it("does not mutate sustained execution capsule result", () => {
    const c = capsuleResult({
      sustained: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringOngoingExecutionMarker(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = capsuleResult({
      sustained: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringOngoingExecutionMarker(c)).toEqual(
      buildScenarioDraftAuthoringOngoingExecutionMarker(c),
    )
  })
})
