import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringImmediateExecutionTokenResult } from "../scenario-draft-authoring-immediate-execution-token/types"
import { buildScenarioDraftAuthoringActiveExecutionEnvelope } from "./build-scenario-draft-authoring-active-execution-envelope"

function tokenResult(args: {
  executionAllowed: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringImmediateExecutionTokenResult {
  const hasExecutionTarget = args.sessionCode !== null
  const executionBlocked = !args.executionAllowed
  return {
    data: {
      executionToken: {
        executionAllowed: args.executionAllowed,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasExecutionTarget,
          executionBlocked,
        },
      },
    },
    summary: {
      executionAllowed: args.executionAllowed,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringActiveExecutionEnvelope", () => {
  it("matches contract and copies token fields when active", () => {
    const t = tokenResult({
      executionAllowed: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringActiveExecutionEnvelope(t)

    expect(r.data.activeExecutionEnvelope.active).toBe(true)
    expect(r.data.activeExecutionEnvelope.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.activeExecutionEnvelope.worksetCode).toBe("WS_A")
    expect(r.data.activeExecutionEnvelope.queueItemCode).toBe("Q_START")
    expect(r.data.activeExecutionEnvelope.remainingSessionCount).toBe(2)
    expect(r.data.activeExecutionEnvelope.totalPlannedItems).toBe(10)
    expect(r.data.activeExecutionEnvelope.summary.hasActiveTarget).toBe(true)
    expect(r.data.activeExecutionEnvelope.summary.activeBlocked).toBe(false)
    expect(r.summary).toEqual({
      active: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("active false and activeBlocked when executionAllowed is false; warning emitted", () => {
    const t = tokenResult({
      executionAllowed: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringActiveExecutionEnvelope(t)
    expect(r.data.activeExecutionEnvelope.active).toBe(false)
    expect(r.data.activeExecutionEnvelope.summary.activeBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_ACTIVE_EXECUTION_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring active execution envelope is not active and cannot proceed.",
    )
  })

  it("info warning when no active target", () => {
    const t = tokenResult({
      executionAllowed: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringActiveExecutionEnvelope(t)
    expect(r.data.activeExecutionEnvelope.summary.hasActiveTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_ACTIVE_EXECUTION_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No active execution target is available because no immediate execution session target exists.",
    )
  })

  it("does not mutate immediate execution token result", () => {
    const t = tokenResult({
      executionAllowed: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(t)
    buildScenarioDraftAuthoringActiveExecutionEnvelope(t)
    expect(t).toEqual(snap)
  })

  it("is deterministic", () => {
    const t = tokenResult({
      executionAllowed: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringActiveExecutionEnvelope(t)).toEqual(
      buildScenarioDraftAuthoringActiveExecutionEnvelope(t),
    )
  })
})
