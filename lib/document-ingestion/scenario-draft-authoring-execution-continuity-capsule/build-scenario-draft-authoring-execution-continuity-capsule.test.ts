import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionSuccessorTokenResult } from "../scenario-draft-authoring-execution-successor-token/types"
import { buildScenarioDraftAuthoringExecutionContinuityCapsule } from "./build-scenario-draft-authoring-execution-continuity-capsule"

function successorTokenResult(args: {
  successorActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionSuccessorTokenResult {
  const hasSuccessorTarget = args.sessionCode !== null
  const successorBlocked = !args.successorActive
  return {
    data: {
      executionSuccessorToken: {
        successorActive: args.successorActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasSuccessorTarget,
          successorBlocked,
        },
      },
    },
    summary: {
      successorActive: args.successorActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionContinuityCapsule", () => {
  it("matches contract and copies successor token fields when continuity active", () => {
    const t = successorTokenResult({
      successorActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionContinuityCapsule(t)

    expect(r.data.executionContinuityCapsule.continuityActive).toBe(true)
    expect(r.data.executionContinuityCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionContinuityCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionContinuityCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionContinuityCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionContinuityCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionContinuityCapsule.summary.hasContinuityTarget).toBe(true)
    expect(r.data.executionContinuityCapsule.summary.continuityBlocked).toBe(false)
    expect(r.summary).toEqual({
      continuityActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("continuityActive false and continuityBlocked when successorActive is false; warning emitted", () => {
    const t = successorTokenResult({
      successorActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionContinuityCapsule(t)
    expect(r.data.executionContinuityCapsule.continuityActive).toBe(false)
    expect(r.data.executionContinuityCapsule.summary.continuityBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_CONTINUITY_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution continuity capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-continuity target", () => {
    const t = successorTokenResult({
      successorActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionContinuityCapsule(t)
    expect(r.data.executionContinuityCapsule.summary.hasContinuityTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_CONTINUITY_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution continuity target is available because no execution-successor session target exists.",
    )
  })

  it("does not mutate execution successor token result", () => {
    const t = successorTokenResult({
      successorActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(t)
    buildScenarioDraftAuthoringExecutionContinuityCapsule(t)
    expect(t).toEqual(snap)
  })

  it("is deterministic", () => {
    const t = successorTokenResult({
      successorActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionContinuityCapsule(t)).toEqual(
      buildScenarioDraftAuthoringExecutionContinuityCapsule(t),
    )
  })
})
