import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionStreamMarkerResult } from "../scenario-draft-authoring-execution-stream-marker/types"
import { buildScenarioDraftAuthoringExecutionFlowCapsule } from "./build-scenario-draft-authoring-execution-flow-capsule"

function streamMarkerResult(args: {
  streamActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionStreamMarkerResult {
  const hasStreamTarget = args.sessionCode !== null
  const streamBlocked = !args.streamActive
  return {
    data: {
      executionStreamMarker: {
        streamActive: args.streamActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasStreamTarget,
          streamBlocked,
        },
      },
    },
    summary: {
      streamActive: args.streamActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionFlowCapsule", () => {
  it("matches contract and copies stream marker fields when flow active", () => {
    const m = streamMarkerResult({
      streamActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionFlowCapsule(m)

    expect(r.data.executionFlowCapsule.flowActive).toBe(true)
    expect(r.data.executionFlowCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionFlowCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionFlowCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionFlowCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionFlowCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionFlowCapsule.summary.hasFlowTarget).toBe(true)
    expect(r.data.executionFlowCapsule.summary.flowBlocked).toBe(false)
    expect(r.summary).toEqual({
      flowActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("flowActive false and flowBlocked when streamActive is false; warning emitted", () => {
    const m = streamMarkerResult({
      streamActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionFlowCapsule(m)
    expect(r.data.executionFlowCapsule.flowActive).toBe(false)
    expect(r.data.executionFlowCapsule.summary.flowBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_FLOW_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution flow capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-flow target", () => {
    const m = streamMarkerResult({
      streamActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionFlowCapsule(m)
    expect(r.data.executionFlowCapsule.summary.hasFlowTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_FLOW_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution flow target is available because no execution-stream session target exists.",
    )
  })

  it("does not mutate execution stream marker result", () => {
    const m = streamMarkerResult({
      streamActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionFlowCapsule(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = streamMarkerResult({
      streamActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionFlowCapsule(m)).toEqual(
      buildScenarioDraftAuthoringExecutionFlowCapsule(m),
    )
  })
})
