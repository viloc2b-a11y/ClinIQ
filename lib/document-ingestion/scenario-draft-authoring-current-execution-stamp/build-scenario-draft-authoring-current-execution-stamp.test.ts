import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringInProgressExecutionSealResult } from "../scenario-draft-authoring-in-progress-execution-seal/types"
import { buildScenarioDraftAuthoringCurrentExecutionStamp } from "./build-scenario-draft-authoring-current-execution-stamp"

function sealResult(args: {
  inProgress: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringInProgressExecutionSealResult {
  const hasInProgressTarget = args.sessionCode !== null
  const inProgressBlocked = !args.inProgress
  return {
    data: {
      inProgressExecutionSeal: {
        inProgress: args.inProgress,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasInProgressTarget,
          inProgressBlocked,
        },
      },
    },
    summary: {
      inProgress: args.inProgress,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringCurrentExecutionStamp", () => {
  it("matches contract and copies seal fields when current", () => {
    const s = sealResult({
      inProgress: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringCurrentExecutionStamp(s)

    expect(r.data.currentExecutionStamp.current).toBe(true)
    expect(r.data.currentExecutionStamp.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.currentExecutionStamp.worksetCode).toBe("WS_A")
    expect(r.data.currentExecutionStamp.queueItemCode).toBe("Q_START")
    expect(r.data.currentExecutionStamp.remainingSessionCount).toBe(2)
    expect(r.data.currentExecutionStamp.totalPlannedItems).toBe(10)
    expect(r.data.currentExecutionStamp.summary.hasCurrentTarget).toBe(true)
    expect(r.data.currentExecutionStamp.summary.currentBlocked).toBe(false)
    expect(r.summary).toEqual({
      current: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("current false and currentBlocked when inProgress is false; warning emitted", () => {
    const s = sealResult({
      inProgress: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringCurrentExecutionStamp(s)
    expect(r.data.currentExecutionStamp.current).toBe(false)
    expect(r.data.currentExecutionStamp.summary.currentBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_CURRENT_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring current execution stamp is not active and cannot proceed.",
    )
  })

  it("info warning when no current target", () => {
    const s = sealResult({
      inProgress: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringCurrentExecutionStamp(s)
    expect(r.data.currentExecutionStamp.summary.hasCurrentTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_CURRENT_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No current execution target is available because no in-progress execution session target exists.",
    )
  })

  it("does not mutate in-progress execution seal result", () => {
    const s = sealResult({
      inProgress: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(s)
    buildScenarioDraftAuthoringCurrentExecutionStamp(s)
    expect(s).toEqual(snap)
  })

  it("is deterministic", () => {
    const s = sealResult({
      inProgress: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringCurrentExecutionStamp(s)).toEqual(
      buildScenarioDraftAuthoringCurrentExecutionStamp(s),
    )
  })
})
