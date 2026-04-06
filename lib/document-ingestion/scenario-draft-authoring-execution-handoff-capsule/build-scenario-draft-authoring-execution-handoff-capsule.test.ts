import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionRelayTokenResult } from "../scenario-draft-authoring-execution-relay-token/types"
import { buildScenarioDraftAuthoringExecutionHandoffCapsule } from "./build-scenario-draft-authoring-execution-handoff-capsule"

function relayTokenResult(args: {
  relayActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionRelayTokenResult {
  const hasRelayTarget = args.sessionCode !== null
  const relayBlocked = !args.relayActive
  return {
    data: {
      executionRelayToken: {
        relayActive: args.relayActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasRelayTarget,
          relayBlocked,
        },
      },
    },
    summary: {
      relayActive: args.relayActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionHandoffCapsule", () => {
  it("matches contract and copies relay token fields when handoff active", () => {
    const t = relayTokenResult({
      relayActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionHandoffCapsule(t)

    expect(r.data.executionHandoffCapsule.handoffActive).toBe(true)
    expect(r.data.executionHandoffCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionHandoffCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionHandoffCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionHandoffCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionHandoffCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionHandoffCapsule.summary.hasHandoffTarget).toBe(true)
    expect(r.data.executionHandoffCapsule.summary.handoffBlocked).toBe(false)
    expect(r.summary).toEqual({
      handoffActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("handoffActive false and handoffBlocked when relayActive is false; warning emitted", () => {
    const t = relayTokenResult({
      relayActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionHandoffCapsule(t)
    expect(r.data.executionHandoffCapsule.handoffActive).toBe(false)
    expect(r.data.executionHandoffCapsule.summary.handoffBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_HANDOFF_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution handoff capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-handoff target", () => {
    const t = relayTokenResult({
      relayActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionHandoffCapsule(t)
    expect(r.data.executionHandoffCapsule.summary.hasHandoffTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_HANDOFF_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution handoff target is available because no execution-relay session target exists.",
    )
  })

  it("does not mutate execution relay token result", () => {
    const t = relayTokenResult({
      relayActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(t)
    buildScenarioDraftAuthoringExecutionHandoffCapsule(t)
    expect(t).toEqual(snap)
  })

  it("is deterministic", () => {
    const t = relayTokenResult({
      relayActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionHandoffCapsule(t)).toEqual(
      buildScenarioDraftAuthoringExecutionHandoffCapsule(t),
    )
  })
})
