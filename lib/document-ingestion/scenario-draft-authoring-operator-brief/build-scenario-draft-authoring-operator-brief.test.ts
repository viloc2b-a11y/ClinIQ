import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringLaunchPacketResult } from "../scenario-draft-authoring-launch-packet/types"
import { buildScenarioDraftAuthoringOperatorBrief } from "./build-scenario-draft-authoring-operator-brief"

function launchPacketResult(args: {
  firstLaunchSessionCode: string | null
  firstLaunchWorksetCode: string | null
  firstLaunchQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringLaunchPacketResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
}): ScenarioDraftAuthoringLaunchPacketResult {
  const hasLaunchTarget = args.firstLaunchSessionCode !== null
  const launchBlocked = !args.launchReady
  return {
    data: {
      launchPacket: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        firstLaunchSessionCode: args.firstLaunchSessionCode,
        firstLaunchWorksetCode: args.firstLaunchWorksetCode,
        firstLaunchQueueItemCode: args.firstLaunchQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasLaunchTarget,
          launchBlocked,
          totalSessions: args.remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus: args.readinessStatus,
      kickoffReady: args.kickoffReady,
      launchReady: args.launchReady,
      firstLaunchSessionCode: args.firstLaunchSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringOperatorBrief", () => {
  it("copies launch fields and computes summary when launch ready", () => {
    const lp = launchPacketResult({
      firstLaunchSessionCode: "AUTHORING_SESSION_0001",
      firstLaunchWorksetCode: "WS_A",
      firstLaunchQueueItemCode: "Q_START",
      remainingSessionCount: 3,
      totalPlannedItems: 12,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringOperatorBrief(lp)

    expect(r.data.operatorBrief.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.operatorBrief.firstWorksetCode).toBe("WS_A")
    expect(r.data.operatorBrief.firstQueueItemCode).toBe("Q_START")
    expect(r.data.operatorBrief.remainingSessionCount).toBe(3)
    expect(r.data.operatorBrief.totalPlannedItems).toBe(12)
    expect(r.data.operatorBrief.summary.hasOperatorStartPoint).toBe(true)
    expect(r.data.operatorBrief.summary.launchBlocked).toBe(false)
    expect(r.data.operatorBrief.summary.totalSessions).toBe(3)
    expect(r.summary.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.warnings.some((w) => w.code === "AUTHORING_OPERATOR_BRIEF_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_OPERATOR_START_POINT")).toBe(false)
  })

  it("warning when launchReady is false", () => {
    const lp = launchPacketResult({
      firstLaunchSessionCode: "S",
      firstLaunchWorksetCode: "W",
      firstLaunchQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
      launchReady: false,
    })
    const r = buildScenarioDraftAuthoringOperatorBrief(lp)
    expect(r.data.operatorBrief.summary.launchBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_OPERATOR_BRIEF_NOT_READY")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const lp = launchPacketResult({
      firstLaunchSessionCode: "S",
      firstLaunchWorksetCode: "W",
      firstLaunchQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringOperatorBrief(lp)
    expect(r.warnings.some((w) => w.code === "AUTHORING_OPERATOR_BRIEF_READY_WITH_WARNINGS")).toBe(true)
  })

  it("info when no operator start point", () => {
    const lp = launchPacketResult({
      firstLaunchSessionCode: null,
      firstLaunchWorksetCode: null,
      firstLaunchQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: false,
    })
    const r = buildScenarioDraftAuthoringOperatorBrief(lp)
    expect(r.data.operatorBrief.summary.hasOperatorStartPoint).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_OPERATOR_START_POINT" && w.severity === "info")).toBe(true)
  })

  it("does not mutate launch packet result", () => {
    const lp = launchPacketResult({
      firstLaunchSessionCode: "S",
      firstLaunchWorksetCode: "W",
      firstLaunchQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const snap = structuredClone(lp)
    buildScenarioDraftAuthoringOperatorBrief(lp)
    expect(lp).toEqual(snap)
  })

  it("is deterministic", () => {
    const lp = launchPacketResult({
      firstLaunchSessionCode: "S",
      firstLaunchWorksetCode: "W",
      firstLaunchQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    expect(buildScenarioDraftAuthoringOperatorBrief(lp)).toEqual(buildScenarioDraftAuthoringOperatorBrief(lp))
  })
})
