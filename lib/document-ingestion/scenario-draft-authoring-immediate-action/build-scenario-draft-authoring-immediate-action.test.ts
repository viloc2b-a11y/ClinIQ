import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringStartPacketResult } from "../scenario-draft-authoring-start-packet/types"
import { buildScenarioDraftAuthoringImmediateAction } from "./build-scenario-draft-authoring-immediate-action"

function startPacketResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringStartPacketResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
}): ScenarioDraftAuthoringStartPacketResult {
  const hasStartPacketTarget = args.firstSessionCode !== null
  const startBlocked = !args.startReady
  return {
    data: {
      startPacket: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        startReady: args.startReady,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasStartPacketTarget,
          startBlocked,
          totalSessions: args.remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus: args.readinessStatus,
      kickoffReady: args.kickoffReady,
      launchReady: args.launchReady,
      startNow: args.startNow,
      startReady: args.startReady,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringImmediateAction", () => {
  it("copies start packet fields; actNow true when startReady and session exist", () => {
    const sp = startPacketResult({
      firstSessionCode: "AUTHORING_SESSION_0001",
      firstWorksetCode: "WS_A",
      firstQueueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
    })
    const r = buildScenarioDraftAuthoringImmediateAction(sp)

    expect(r.data.immediateActionCard.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.immediateActionCard.firstWorksetCode).toBe("WS_A")
    expect(r.data.immediateActionCard.firstQueueItemCode).toBe("Q_START")
    expect(r.data.immediateActionCard.remainingSessionCount).toBe(2)
    expect(r.data.immediateActionCard.totalPlannedItems).toBe(10)
    expect(r.data.immediateActionCard.summary.hasImmediateActionTarget).toBe(true)
    expect(r.data.immediateActionCard.actNow).toBe(true)
    expect(r.data.immediateActionCard.summary.actionBlocked).toBe(false)
    expect(r.data.immediateActionCard.summary.totalSessions).toBe(2)
    expect(r.summary.actNow).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_IMMEDIATE_ACTION_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_IMMEDIATE_ACTION_TARGET")).toBe(false)
  })

  it("actNow false when startReady is false", () => {
    const sp = startPacketResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
      launchReady: false,
      startNow: false,
      startReady: false,
    })
    const r = buildScenarioDraftAuthoringImmediateAction(sp)
    expect(r.data.immediateActionCard.actNow).toBe(false)
    expect(r.data.immediateActionCard.summary.actionBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_IMMEDIATE_ACTION_NOT_READY")).toBe(true)
  })

  it("actNow false when no first session even if startReady true", () => {
    const sp = startPacketResult({
      firstSessionCode: null,
      firstWorksetCode: null,
      firstQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
    })
    const r = buildScenarioDraftAuthoringImmediateAction(sp)
    expect(r.data.immediateActionCard.actNow).toBe(false)
    expect(r.data.immediateActionCard.summary.hasImmediateActionTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_IMMEDIATE_ACTION_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_IMMEDIATE_ACTION_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const sp = startPacketResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
    })
    const r = buildScenarioDraftAuthoringImmediateAction(sp)
    expect(r.warnings.some((w) => w.code === "AUTHORING_IMMEDIATE_ACTION_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate start packet result", () => {
    const sp = startPacketResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
    })
    const snap = structuredClone(sp)
    buildScenarioDraftAuthoringImmediateAction(sp)
    expect(sp).toEqual(snap)
  })

  it("is deterministic", () => {
    const sp = startPacketResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
    })
    expect(buildScenarioDraftAuthoringImmediateAction(sp)).toEqual(buildScenarioDraftAuthoringImmediateAction(sp))
  })
})
