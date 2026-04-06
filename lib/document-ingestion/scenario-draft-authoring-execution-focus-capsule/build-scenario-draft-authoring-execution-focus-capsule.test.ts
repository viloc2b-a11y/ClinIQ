import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringActiveExecutionEnvelopeResult } from "../scenario-draft-authoring-active-execution-envelope/types"
import { buildScenarioDraftAuthoringExecutionFocusCapsule } from "./build-scenario-draft-authoring-execution-focus-capsule"

function envelopeResult(args: {
  active: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringActiveExecutionEnvelopeResult {
  const hasActiveTarget = args.sessionCode !== null
  const activeBlocked = !args.active
  return {
    data: {
      activeExecutionEnvelope: {
        active: args.active,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasActiveTarget,
          activeBlocked,
        },
      },
    },
    summary: {
      active: args.active,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionFocusCapsule", () => {
  it("matches contract and copies envelope fields when focused", () => {
    const env = envelopeResult({
      active: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionFocusCapsule(env)

    expect(r.data.executionFocusCapsule.focused).toBe(true)
    expect(r.data.executionFocusCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionFocusCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionFocusCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionFocusCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionFocusCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionFocusCapsule.summary.hasFocusTarget).toBe(true)
    expect(r.data.executionFocusCapsule.summary.focusBlocked).toBe(false)
    expect(r.summary).toEqual({
      focused: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("focused false and focusBlocked when active is false; warning emitted", () => {
    const env = envelopeResult({
      active: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionFocusCapsule(env)
    expect(r.data.executionFocusCapsule.focused).toBe(false)
    expect(r.data.executionFocusCapsule.summary.focusBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_FOCUS_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution focus capsule is not focused and cannot proceed.",
    )
  })

  it("info warning when no focus target", () => {
    const env = envelopeResult({
      active: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionFocusCapsule(env)
    expect(r.data.executionFocusCapsule.summary.hasFocusTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_FOCUS_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution focus target is available because no active execution session target exists.",
    )
  })

  it("does not mutate active execution envelope result", () => {
    const env = envelopeResult({
      active: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(env)
    buildScenarioDraftAuthoringExecutionFocusCapsule(env)
    expect(env).toEqual(snap)
  })

  it("is deterministic", () => {
    const env = envelopeResult({
      active: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionFocusCapsule(env)).toEqual(
      buildScenarioDraftAuthoringExecutionFocusCapsule(env),
    )
  })
})
