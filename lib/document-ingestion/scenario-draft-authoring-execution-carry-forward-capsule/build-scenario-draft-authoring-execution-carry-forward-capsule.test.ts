import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionStateBatonResult } from "../scenario-draft-authoring-execution-state-baton/types"
import { buildScenarioDraftAuthoringExecutionCarryForwardCapsule } from "./build-scenario-draft-authoring-execution-carry-forward-capsule"

function batonResult(args: {
  executionStateActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionStateBatonResult {
  const hasExecutionStateTarget = args.sessionCode !== null
  const executionStateBlocked = !args.executionStateActive
  return {
    data: {
      executionStateBaton: {
        executionStateActive: args.executionStateActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasExecutionStateTarget,
          executionStateBlocked,
        },
      },
    },
    summary: {
      executionStateActive: args.executionStateActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionCarryForwardCapsule", () => {
  it("matches contract and copies baton fields when carry-forward active", () => {
    const b = batonResult({
      executionStateActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionCarryForwardCapsule(b)

    expect(r.data.executionCarryForwardCapsule.carryForwardActive).toBe(true)
    expect(r.data.executionCarryForwardCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionCarryForwardCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionCarryForwardCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionCarryForwardCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionCarryForwardCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionCarryForwardCapsule.summary.hasCarryForwardTarget).toBe(true)
    expect(r.data.executionCarryForwardCapsule.summary.carryForwardBlocked).toBe(false)
    expect(r.summary).toEqual({
      carryForwardActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("carryForwardActive false and carryForwardBlocked when executionStateActive is false; warning emitted", () => {
    const b = batonResult({
      executionStateActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionCarryForwardCapsule(b)
    expect(r.data.executionCarryForwardCapsule.carryForwardActive).toBe(false)
    expect(r.data.executionCarryForwardCapsule.summary.carryForwardBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_CARRY_FORWARD_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution carry-forward capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no carry-forward target", () => {
    const b = batonResult({
      executionStateActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionCarryForwardCapsule(b)
    expect(r.data.executionCarryForwardCapsule.summary.hasCarryForwardTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_CARRY_FORWARD_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution carry-forward target is available because no execution-state session target exists.",
    )
  })

  it("does not mutate execution state baton result", () => {
    const b = batonResult({
      executionStateActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(b)
    buildScenarioDraftAuthoringExecutionCarryForwardCapsule(b)
    expect(b).toEqual(snap)
  })

  it("is deterministic", () => {
    const b = batonResult({
      executionStateActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionCarryForwardCapsule(b)).toEqual(
      buildScenarioDraftAuthoringExecutionCarryForwardCapsule(b),
    )
  })
})
