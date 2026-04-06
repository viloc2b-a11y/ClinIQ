import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionSequenceCapsuleResult } from "../scenario-draft-authoring-execution-sequence-capsule/types"
import { buildScenarioDraftAuthoringExecutionStreamMarker } from "./build-scenario-draft-authoring-execution-stream-marker"

function sequenceCapsuleResult(args: {
  sequenceActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionSequenceCapsuleResult {
  const hasSequenceTarget = args.sessionCode !== null
  const sequenceBlocked = !args.sequenceActive
  return {
    data: {
      executionSequenceCapsule: {
        sequenceActive: args.sequenceActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasSequenceTarget,
          sequenceBlocked,
        },
      },
    },
    summary: {
      sequenceActive: args.sequenceActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionStreamMarker", () => {
  it("matches contract and copies sequence capsule fields when stream active", () => {
    const c = sequenceCapsuleResult({
      sequenceActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionStreamMarker(c)

    expect(r.data.executionStreamMarker.streamActive).toBe(true)
    expect(r.data.executionStreamMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionStreamMarker.worksetCode).toBe("WS_A")
    expect(r.data.executionStreamMarker.queueItemCode).toBe("Q_START")
    expect(r.data.executionStreamMarker.remainingSessionCount).toBe(2)
    expect(r.data.executionStreamMarker.totalPlannedItems).toBe(10)
    expect(r.data.executionStreamMarker.summary.hasStreamTarget).toBe(true)
    expect(r.data.executionStreamMarker.summary.streamBlocked).toBe(false)
    expect(r.summary).toEqual({
      streamActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("streamActive false and streamBlocked when sequenceActive is false; warning emitted", () => {
    const c = sequenceCapsuleResult({
      sequenceActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionStreamMarker(c)
    expect(r.data.executionStreamMarker.streamActive).toBe(false)
    expect(r.data.executionStreamMarker.summary.streamBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_STREAM_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution stream marker is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-stream target", () => {
    const c = sequenceCapsuleResult({
      sequenceActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionStreamMarker(c)
    expect(r.data.executionStreamMarker.summary.hasStreamTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_STREAM_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution stream target is available because no execution-sequence session target exists.",
    )
  })

  it("does not mutate execution sequence capsule result", () => {
    const c = sequenceCapsuleResult({
      sequenceActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringExecutionStreamMarker(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = sequenceCapsuleResult({
      sequenceActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionStreamMarker(c)).toEqual(
      buildScenarioDraftAuthoringExecutionStreamMarker(c),
    )
  })
})
