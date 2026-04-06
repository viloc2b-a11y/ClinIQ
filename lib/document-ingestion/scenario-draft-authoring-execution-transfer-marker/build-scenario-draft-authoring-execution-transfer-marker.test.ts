import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionHandoffCapsuleResult } from "../scenario-draft-authoring-execution-handoff-capsule/types"
import { buildScenarioDraftAuthoringExecutionTransferMarker } from "./build-scenario-draft-authoring-execution-transfer-marker"

function handoffCapsuleResult(args: {
  handoffActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionHandoffCapsuleResult {
  const hasHandoffTarget = args.sessionCode !== null
  const handoffBlocked = !args.handoffActive
  return {
    data: {
      executionHandoffCapsule: {
        handoffActive: args.handoffActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasHandoffTarget,
          handoffBlocked,
        },
      },
    },
    summary: {
      handoffActive: args.handoffActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionTransferMarker", () => {
  it("matches contract and copies handoff capsule fields when transfer active", () => {
    const h = handoffCapsuleResult({
      handoffActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionTransferMarker(h)

    expect(r.data.executionTransferMarker.transferActive).toBe(true)
    expect(r.data.executionTransferMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionTransferMarker.worksetCode).toBe("WS_A")
    expect(r.data.executionTransferMarker.queueItemCode).toBe("Q_START")
    expect(r.data.executionTransferMarker.remainingSessionCount).toBe(2)
    expect(r.data.executionTransferMarker.totalPlannedItems).toBe(10)
    expect(r.data.executionTransferMarker.summary.hasTransferTarget).toBe(true)
    expect(r.data.executionTransferMarker.summary.transferBlocked).toBe(false)
    expect(r.summary).toEqual({
      transferActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("transferActive false and transferBlocked when handoffActive is false; warning emitted", () => {
    const h = handoffCapsuleResult({
      handoffActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionTransferMarker(h)
    expect(r.data.executionTransferMarker.transferActive).toBe(false)
    expect(r.data.executionTransferMarker.summary.transferBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_TRANSFER_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution transfer marker is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-transfer target", () => {
    const h = handoffCapsuleResult({
      handoffActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionTransferMarker(h)
    expect(r.data.executionTransferMarker.summary.hasTransferTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_TRANSFER_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution transfer target is available because no execution-handoff session target exists.",
    )
  })

  it("does not mutate execution handoff capsule result", () => {
    const h = handoffCapsuleResult({
      handoffActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(h)
    buildScenarioDraftAuthoringExecutionTransferMarker(h)
    expect(h).toEqual(snap)
  })

  it("is deterministic", () => {
    const h = handoffCapsuleResult({
      handoffActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionTransferMarker(h)).toEqual(
      buildScenarioDraftAuthoringExecutionTransferMarker(h),
    )
  })
})
