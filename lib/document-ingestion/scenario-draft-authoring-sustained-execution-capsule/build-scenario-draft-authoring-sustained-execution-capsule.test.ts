import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionContinuationTokenResult } from "../scenario-draft-authoring-execution-continuation-token/types"
import { buildScenarioDraftAuthoringSustainedExecutionCapsule } from "./build-scenario-draft-authoring-sustained-execution-capsule"

function tokenResult(args: {
  continuationActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionContinuationTokenResult {
  const hasContinuationTarget = args.sessionCode !== null
  const continuationBlocked = !args.continuationActive
  return {
    data: {
      executionContinuationToken: {
        continuationActive: args.continuationActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasContinuationTarget,
          continuationBlocked,
        },
      },
    },
    summary: {
      continuationActive: args.continuationActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringSustainedExecutionCapsule", () => {
  it("matches contract and copies token fields when sustained", () => {
    const t = tokenResult({
      continuationActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringSustainedExecutionCapsule(t)

    expect(r.data.sustainedExecutionCapsule.sustained).toBe(true)
    expect(r.data.sustainedExecutionCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.sustainedExecutionCapsule.worksetCode).toBe("WS_A")
    expect(r.data.sustainedExecutionCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.sustainedExecutionCapsule.remainingSessionCount).toBe(2)
    expect(r.data.sustainedExecutionCapsule.totalPlannedItems).toBe(10)
    expect(r.data.sustainedExecutionCapsule.summary.hasSustainedTarget).toBe(true)
    expect(r.data.sustainedExecutionCapsule.summary.sustainedBlocked).toBe(false)
    expect(r.summary).toEqual({
      sustained: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("sustained false and sustainedBlocked when continuationActive is false; warning emitted", () => {
    const t = tokenResult({
      continuationActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringSustainedExecutionCapsule(t)
    expect(r.data.sustainedExecutionCapsule.sustained).toBe(false)
    expect(r.data.sustainedExecutionCapsule.summary.sustainedBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_SUSTAINED_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring sustained execution capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no sustained-execution target", () => {
    const t = tokenResult({
      continuationActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringSustainedExecutionCapsule(t)
    expect(r.data.sustainedExecutionCapsule.summary.hasSustainedTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_SUSTAINED_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No sustained-execution target is available because no execution-continuation session target exists.",
    )
  })

  it("does not mutate execution continuation token result", () => {
    const t = tokenResult({
      continuationActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(t)
    buildScenarioDraftAuthoringSustainedExecutionCapsule(t)
    expect(t).toEqual(snap)
  })

  it("is deterministic", () => {
    const t = tokenResult({
      continuationActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringSustainedExecutionCapsule(t)).toEqual(
      buildScenarioDraftAuthoringSustainedExecutionCapsule(t),
    )
  })
})
