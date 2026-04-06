import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionChainMarkerResult } from "../scenario-draft-authoring-execution-chain-marker/types"
import { buildScenarioDraftAuthoringExecutionSequenceCapsule } from "./build-scenario-draft-authoring-execution-sequence-capsule"

function chainMarkerResult(args: {
  chainActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionChainMarkerResult {
  const hasChainTarget = args.sessionCode !== null
  const chainBlocked = !args.chainActive
  return {
    data: {
      executionChainMarker: {
        chainActive: args.chainActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasChainTarget,
          chainBlocked,
        },
      },
    },
    summary: {
      chainActive: args.chainActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionSequenceCapsule", () => {
  it("matches contract and copies chain marker fields when sequence active", () => {
    const m = chainMarkerResult({
      chainActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionSequenceCapsule(m)

    expect(r.data.executionSequenceCapsule.sequenceActive).toBe(true)
    expect(r.data.executionSequenceCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionSequenceCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionSequenceCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionSequenceCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionSequenceCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionSequenceCapsule.summary.hasSequenceTarget).toBe(true)
    expect(r.data.executionSequenceCapsule.summary.sequenceBlocked).toBe(false)
    expect(r.summary).toEqual({
      sequenceActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("sequenceActive false and sequenceBlocked when chainActive is false; warning emitted", () => {
    const m = chainMarkerResult({
      chainActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionSequenceCapsule(m)
    expect(r.data.executionSequenceCapsule.sequenceActive).toBe(false)
    expect(r.data.executionSequenceCapsule.summary.sequenceBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_SEQUENCE_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution sequence capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-sequence target", () => {
    const m = chainMarkerResult({
      chainActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionSequenceCapsule(m)
    expect(r.data.executionSequenceCapsule.summary.hasSequenceTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_SEQUENCE_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution sequence target is available because no execution-chain session target exists.",
    )
  })

  it("does not mutate execution chain marker result", () => {
    const m = chainMarkerResult({
      chainActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionSequenceCapsule(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = chainMarkerResult({
      chainActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionSequenceCapsule(m)).toEqual(
      buildScenarioDraftAuthoringExecutionSequenceCapsule(m),
    )
  })
})
