import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionFlowCapsuleResult } from "../scenario-draft-authoring-execution-flow-capsule/types"
import { buildScenarioDraftAuthoringExecutionPathMarker } from "./build-scenario-draft-authoring-execution-path-marker"

function flowCapsuleResult(args: {
  flowActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionFlowCapsuleResult {
  const hasFlowTarget = args.sessionCode !== null
  const flowBlocked = !args.flowActive
  return {
    data: {
      executionFlowCapsule: {
        flowActive: args.flowActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasFlowTarget,
          flowBlocked,
        },
      },
    },
    summary: {
      flowActive: args.flowActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionPathMarker", () => {
  it("matches contract and copies flow capsule fields when path active", () => {
    const c = flowCapsuleResult({
      flowActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionPathMarker(c)

    expect(r.data.executionPathMarker.pathActive).toBe(true)
    expect(r.data.executionPathMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionPathMarker.worksetCode).toBe("WS_A")
    expect(r.data.executionPathMarker.queueItemCode).toBe("Q_START")
    expect(r.data.executionPathMarker.remainingSessionCount).toBe(2)
    expect(r.data.executionPathMarker.totalPlannedItems).toBe(10)
    expect(r.data.executionPathMarker.summary.hasPathTarget).toBe(true)
    expect(r.data.executionPathMarker.summary.pathBlocked).toBe(false)
    expect(r.summary).toEqual({
      pathActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("pathActive false and pathBlocked when flowActive is false; warning emitted", () => {
    const c = flowCapsuleResult({
      flowActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionPathMarker(c)
    expect(r.data.executionPathMarker.pathActive).toBe(false)
    expect(r.data.executionPathMarker.summary.pathBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_PATH_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution path marker is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-path target", () => {
    const c = flowCapsuleResult({
      flowActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionPathMarker(c)
    expect(r.data.executionPathMarker.summary.hasPathTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_PATH_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution path target is available because no execution-flow session target exists.",
    )
  })

  it("does not mutate execution flow capsule result", () => {
    const c = flowCapsuleResult({
      flowActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringExecutionPathMarker(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = flowCapsuleResult({
      flowActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionPathMarker(c)).toEqual(
      buildScenarioDraftAuthoringExecutionPathMarker(c),
    )
  })
})
