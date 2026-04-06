import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult } from "../scenario-draft-authoring-execution-carry-forward-capsule/types"
import { buildScenarioDraftAuthoringExecutionRelayToken } from "./build-scenario-draft-authoring-execution-relay-token"

function capsuleResult(args: {
  carryForwardActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult {
  const hasCarryForwardTarget = args.sessionCode !== null
  const carryForwardBlocked = !args.carryForwardActive
  return {
    data: {
      executionCarryForwardCapsule: {
        carryForwardActive: args.carryForwardActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasCarryForwardTarget,
          carryForwardBlocked,
        },
      },
    },
    summary: {
      carryForwardActive: args.carryForwardActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionRelayToken", () => {
  it("matches contract and copies capsule fields when relay active", () => {
    const c = capsuleResult({
      carryForwardActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionRelayToken(c)

    expect(r.data.executionRelayToken.relayActive).toBe(true)
    expect(r.data.executionRelayToken.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionRelayToken.worksetCode).toBe("WS_A")
    expect(r.data.executionRelayToken.queueItemCode).toBe("Q_START")
    expect(r.data.executionRelayToken.remainingSessionCount).toBe(2)
    expect(r.data.executionRelayToken.totalPlannedItems).toBe(10)
    expect(r.data.executionRelayToken.summary.hasRelayTarget).toBe(true)
    expect(r.data.executionRelayToken.summary.relayBlocked).toBe(false)
    expect(r.summary).toEqual({
      relayActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("relayActive false and relayBlocked when carryForwardActive is false; warning emitted", () => {
    const c = capsuleResult({
      carryForwardActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionRelayToken(c)
    expect(r.data.executionRelayToken.relayActive).toBe(false)
    expect(r.data.executionRelayToken.summary.relayBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_RELAY_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution relay token is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-relay target", () => {
    const c = capsuleResult({
      carryForwardActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionRelayToken(c)
    expect(r.data.executionRelayToken.summary.hasRelayTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_RELAY_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution relay target is available because no carry-forward session target exists.",
    )
  })

  it("does not mutate execution carry-forward capsule result", () => {
    const c = capsuleResult({
      carryForwardActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringExecutionRelayToken(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = capsuleResult({
      carryForwardActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionRelayToken(c)).toEqual(
      buildScenarioDraftAuthoringExecutionRelayToken(c),
    )
  })
})
