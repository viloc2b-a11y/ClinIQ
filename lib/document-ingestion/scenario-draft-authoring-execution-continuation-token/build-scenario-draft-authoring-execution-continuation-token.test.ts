import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult } from "../scenario-draft-authoring-immediate-live-execution-marker/types"
import { buildScenarioDraftAuthoringExecutionContinuationToken } from "./build-scenario-draft-authoring-execution-continuation-token"

function markerResult(args: {
  immediateLive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult {
  const hasImmediateLiveTarget = args.sessionCode !== null
  const immediateLiveBlocked = !args.immediateLive
  return {
    data: {
      immediateLiveExecutionMarker: {
        immediateLive: args.immediateLive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasImmediateLiveTarget,
          immediateLiveBlocked,
        },
      },
    },
    summary: {
      immediateLive: args.immediateLive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionContinuationToken", () => {
  it("matches contract and copies marker fields when continuation active", () => {
    const m = markerResult({
      immediateLive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionContinuationToken(m)

    expect(r.data.executionContinuationToken.continuationActive).toBe(true)
    expect(r.data.executionContinuationToken.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionContinuationToken.worksetCode).toBe("WS_A")
    expect(r.data.executionContinuationToken.queueItemCode).toBe("Q_START")
    expect(r.data.executionContinuationToken.remainingSessionCount).toBe(2)
    expect(r.data.executionContinuationToken.totalPlannedItems).toBe(10)
    expect(r.data.executionContinuationToken.summary.hasContinuationTarget).toBe(true)
    expect(r.data.executionContinuationToken.summary.continuationBlocked).toBe(false)
    expect(r.summary).toEqual({
      continuationActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("continuationActive false and continuationBlocked when immediateLive is false; warning emitted", () => {
    const m = markerResult({
      immediateLive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionContinuationToken(m)
    expect(r.data.executionContinuationToken.continuationActive).toBe(false)
    expect(r.data.executionContinuationToken.summary.continuationBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_CONTINUATION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution continuation token is not active and cannot proceed.",
    )
  })

  it("info warning when no continuation target", () => {
    const m = markerResult({
      immediateLive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionContinuationToken(m)
    expect(r.data.executionContinuationToken.summary.hasContinuationTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_CONTINUATION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution-continuation target is available because no immediate-live execution session target exists.",
    )
  })

  it("does not mutate immediate-live execution marker result", () => {
    const m = markerResult({
      immediateLive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionContinuationToken(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = markerResult({
      immediateLive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionContinuationToken(m)).toEqual(
      buildScenarioDraftAuthoringExecutionContinuationToken(m),
    )
  })
})
