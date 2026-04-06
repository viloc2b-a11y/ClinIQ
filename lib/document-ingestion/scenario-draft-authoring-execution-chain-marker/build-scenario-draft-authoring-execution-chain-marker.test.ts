import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionContinuityCapsuleResult } from "../scenario-draft-authoring-execution-continuity-capsule/types"
import { buildScenarioDraftAuthoringExecutionChainMarker } from "./build-scenario-draft-authoring-execution-chain-marker"

function continuityCapsuleResult(args: {
  continuityActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionContinuityCapsuleResult {
  const hasContinuityTarget = args.sessionCode !== null
  const continuityBlocked = !args.continuityActive
  return {
    data: {
      executionContinuityCapsule: {
        continuityActive: args.continuityActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasContinuityTarget,
          continuityBlocked,
        },
      },
    },
    summary: {
      continuityActive: args.continuityActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionChainMarker", () => {
  it("matches contract and copies continuity capsule fields when chain active", () => {
    const c = continuityCapsuleResult({
      continuityActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionChainMarker(c)

    expect(r.data.executionChainMarker.chainActive).toBe(true)
    expect(r.data.executionChainMarker.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionChainMarker.worksetCode).toBe("WS_A")
    expect(r.data.executionChainMarker.queueItemCode).toBe("Q_START")
    expect(r.data.executionChainMarker.remainingSessionCount).toBe(2)
    expect(r.data.executionChainMarker.totalPlannedItems).toBe(10)
    expect(r.data.executionChainMarker.summary.hasChainTarget).toBe(true)
    expect(r.data.executionChainMarker.summary.chainBlocked).toBe(false)
    expect(r.summary).toEqual({
      chainActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("chainActive false and chainBlocked when continuityActive is false; warning emitted", () => {
    const c = continuityCapsuleResult({
      continuityActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionChainMarker(c)
    expect(r.data.executionChainMarker.chainActive).toBe(false)
    expect(r.data.executionChainMarker.summary.chainBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_CHAIN_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution chain marker is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-chain target", () => {
    const c = continuityCapsuleResult({
      continuityActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionChainMarker(c)
    expect(r.data.executionChainMarker.summary.hasChainTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_CHAIN_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution chain target is available because no execution-continuity session target exists.",
    )
  })

  it("does not mutate execution continuity capsule result", () => {
    const c = continuityCapsuleResult({
      continuityActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringExecutionChainMarker(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = continuityCapsuleResult({
      continuityActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionChainMarker(c)).toEqual(
      buildScenarioDraftAuthoringExecutionChainMarker(c),
    )
  })
})
