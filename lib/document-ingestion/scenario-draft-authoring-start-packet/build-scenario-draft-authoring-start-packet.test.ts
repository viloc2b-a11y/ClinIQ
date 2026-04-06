import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringStartSignalResult } from "../scenario-draft-authoring-start-signal/types"
import { buildScenarioDraftAuthoringStartPacket } from "./build-scenario-draft-authoring-start-packet"

function startSignalResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringStartSignalResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
}): ScenarioDraftAuthoringStartSignalResult {
  const hasStartTarget = args.firstSessionCode !== null
  const startBlocked = !args.startNow
  return {
    data: {
      startSignal: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasStartTarget,
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
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringStartPacket", () => {
  it("copies start signal fields; startReady true when startNow and session exist", () => {
    const ss = startSignalResult({
      firstSessionCode: "AUTHORING_SESSION_0001",
      firstWorksetCode: "WS_A",
      firstQueueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
    })
    const r = buildScenarioDraftAuthoringStartPacket(ss)

    expect(r.data.startPacket.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.startPacket.firstWorksetCode).toBe("WS_A")
    expect(r.data.startPacket.firstQueueItemCode).toBe("Q_START")
    expect(r.data.startPacket.remainingSessionCount).toBe(2)
    expect(r.data.startPacket.totalPlannedItems).toBe(10)
    expect(r.data.startPacket.summary.hasStartPacketTarget).toBe(true)
    expect(r.data.startPacket.startReady).toBe(true)
    expect(r.data.startPacket.summary.startBlocked).toBe(false)
    expect(r.data.startPacket.summary.totalSessions).toBe(2)
    expect(r.summary.startReady).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_PACKET_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_AUTHORING_START_PACKET_TARGET")).toBe(false)
  })

  it("startReady false when startNow is false", () => {
    const ss = startSignalResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
      launchReady: false,
      startNow: false,
    })
    const r = buildScenarioDraftAuthoringStartPacket(ss)
    expect(r.data.startPacket.startReady).toBe(false)
    expect(r.data.startPacket.summary.startBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_PACKET_NOT_READY")).toBe(true)
  })

  it("startReady false when no first session even if startNow true", () => {
    const ss = startSignalResult({
      firstSessionCode: null,
      firstWorksetCode: null,
      firstQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
    })
    const r = buildScenarioDraftAuthoringStartPacket(ss)
    expect(r.data.startPacket.startReady).toBe(false)
    expect(r.data.startPacket.summary.hasStartPacketTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_PACKET_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_AUTHORING_START_PACKET_TARGET" && w.severity === "info")).toBe(
      true,
    )
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const ss = startSignalResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
    })
    const r = buildScenarioDraftAuthoringStartPacket(ss)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_PACKET_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate start signal result", () => {
    const ss = startSignalResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
    })
    const snap = structuredClone(ss)
    buildScenarioDraftAuthoringStartPacket(ss)
    expect(ss).toEqual(snap)
  })

  it("is deterministic", () => {
    const ss = startSignalResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
    })
    expect(buildScenarioDraftAuthoringStartPacket(ss)).toEqual(buildScenarioDraftAuthoringStartPacket(ss))
  })
})
