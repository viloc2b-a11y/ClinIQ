import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionTransferMarkerResult } from "../scenario-draft-authoring-execution-transfer-marker/types"
import { buildScenarioDraftAuthoringExecutionSuccessorToken } from "./build-scenario-draft-authoring-execution-successor-token"

function transferMarkerResult(args: {
  transferActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionTransferMarkerResult {
  const hasTransferTarget = args.sessionCode !== null
  const transferBlocked = !args.transferActive
  return {
    data: {
      executionTransferMarker: {
        transferActive: args.transferActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasTransferTarget,
          transferBlocked,
        },
      },
    },
    summary: {
      transferActive: args.transferActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionSuccessorToken", () => {
  it("matches contract and copies transfer marker fields when successor active", () => {
    const m = transferMarkerResult({
      transferActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionSuccessorToken(m)

    expect(r.data.executionSuccessorToken.successorActive).toBe(true)
    expect(r.data.executionSuccessorToken.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionSuccessorToken.worksetCode).toBe("WS_A")
    expect(r.data.executionSuccessorToken.queueItemCode).toBe("Q_START")
    expect(r.data.executionSuccessorToken.remainingSessionCount).toBe(2)
    expect(r.data.executionSuccessorToken.totalPlannedItems).toBe(10)
    expect(r.data.executionSuccessorToken.summary.hasSuccessorTarget).toBe(true)
    expect(r.data.executionSuccessorToken.summary.successorBlocked).toBe(false)
    expect(r.summary).toEqual({
      successorActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("successorActive false and successorBlocked when transferActive is false; warning emitted", () => {
    const m = transferMarkerResult({
      transferActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionSuccessorToken(m)
    expect(r.data.executionSuccessorToken.successorActive).toBe(false)
    expect(r.data.executionSuccessorToken.summary.successorBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_SUCCESSOR_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution successor token is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-successor target", () => {
    const m = transferMarkerResult({
      transferActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionSuccessorToken(m)
    expect(r.data.executionSuccessorToken.summary.hasSuccessorTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_SUCCESSOR_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution successor target is available because no execution-transfer session target exists.",
    )
  })

  it("does not mutate execution transfer marker result", () => {
    const m = transferMarkerResult({
      transferActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionSuccessorToken(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = transferMarkerResult({
      transferActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionSuccessorToken(m)).toEqual(
      buildScenarioDraftAuthoringExecutionSuccessorToken(m),
    )
  })
})
