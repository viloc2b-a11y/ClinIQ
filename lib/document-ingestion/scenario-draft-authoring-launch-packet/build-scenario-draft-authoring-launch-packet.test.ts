import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringControlSnapshotResult } from "../scenario-draft-authoring-control-snapshot/types"
import { buildScenarioDraftAuthoringLaunchPacket } from "./build-scenario-draft-authoring-launch-packet"

function controlSnapshotResult(args: {
  firstActionableSessionCode: string | null
  firstActionableWorksetCode: string | null
  firstActionableQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringControlSnapshotResult["summary"]["readinessStatus"]
  kickoffReady: boolean
}): ScenarioDraftAuthoringControlSnapshotResult {
  const n = args.remainingSessionCount
  return {
    data: {
      controlSnapshot: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        firstActionableSessionCode: args.firstActionableSessionCode,
        firstActionableWorksetCode: args.firstActionableWorksetCode,
        firstActionableQueueItemCode: args.firstActionableQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          totalSessions: n,
          hasActionableSession: n > 0,
          firstSessionIsActionable: n > 0,
        },
      },
    },
    summary: {
      readinessStatus: args.readinessStatus,
      kickoffReady: args.kickoffReady,
      firstActionableSessionCode: args.firstActionableSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringLaunchPacket", () => {
  it("launchReady true when kickoffReady and first actionable session exist", () => {
    const cs = controlSnapshotResult({
      firstActionableSessionCode: "AUTHORING_SESSION_0001",
      firstActionableWorksetCode: "W1",
      firstActionableQueueItemCode: "Q0",
      remainingSessionCount: 2,
      totalPlannedItems: 9,
      readinessStatus: "ready",
      kickoffReady: true,
    })
    const r = buildScenarioDraftAuthoringLaunchPacket(cs)
    expect(r.data.launchPacket.launchReady).toBe(true)
    expect(r.data.launchPacket.summary.launchBlocked).toBe(false)
    expect(r.data.launchPacket.summary.hasLaunchTarget).toBe(true)
    expect(r.summary.launchReady).toBe(true)
    expect(r.data.launchPacket.firstLaunchSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.launchPacket.firstLaunchWorksetCode).toBe("W1")
    expect(r.data.launchPacket.firstLaunchQueueItemCode).toBe("Q0")
    expect(r.data.launchPacket.remainingSessionCount).toBe(2)
    expect(r.data.launchPacket.totalPlannedItems).toBe(9)
    expect(r.data.launchPacket.summary.totalSessions).toBe(2)
    expect(r.warnings.some((w) => w.code === "AUTHORING_LAUNCH_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_AUTHORING_LAUNCH_TARGET")).toBe(false)
  })

  it("launchReady false when kickoffReady is false", () => {
    const cs = controlSnapshotResult({
      firstActionableSessionCode: "AUTHORING_SESSION_0001",
      firstActionableWorksetCode: "W1",
      firstActionableQueueItemCode: "Q0",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
    })
    const r = buildScenarioDraftAuthoringLaunchPacket(cs)
    expect(r.data.launchPacket.launchReady).toBe(false)
    expect(r.data.launchPacket.summary.launchBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_LAUNCH_NOT_READY")).toBe(true)
  })

  it("launchReady false when no first actionable session", () => {
    const cs = controlSnapshotResult({
      firstActionableSessionCode: null,
      firstActionableWorksetCode: null,
      firstActionableQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
    })
    const r = buildScenarioDraftAuthoringLaunchPacket(cs)
    expect(r.data.launchPacket.launchReady).toBe(false)
    expect(r.data.launchPacket.summary.hasLaunchTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_LAUNCH_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_AUTHORING_LAUNCH_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const cs = controlSnapshotResult({
      firstActionableSessionCode: "AUTHORING_SESSION_0001",
      firstActionableWorksetCode: "W1",
      firstActionableQueueItemCode: "Q0",
      remainingSessionCount: 1,
      totalPlannedItems: 3,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
    })
    const r = buildScenarioDraftAuthoringLaunchPacket(cs)
    expect(r.warnings.some((w) => w.code === "AUTHORING_LAUNCH_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate control snapshot result", () => {
    const cs = controlSnapshotResult({
      firstActionableSessionCode: "S",
      firstActionableWorksetCode: "W",
      firstActionableQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
    })
    const snap = structuredClone(cs)
    buildScenarioDraftAuthoringLaunchPacket(cs)
    expect(cs).toEqual(snap)
  })

  it("is deterministic", () => {
    const cs = controlSnapshotResult({
      firstActionableSessionCode: "S",
      firstActionableWorksetCode: "W",
      firstActionableQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
    })
    expect(buildScenarioDraftAuthoringLaunchPacket(cs)).toEqual(buildScenarioDraftAuthoringLaunchPacket(cs))
  })
})
