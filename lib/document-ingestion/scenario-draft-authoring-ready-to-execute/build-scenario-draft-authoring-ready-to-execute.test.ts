import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringFinalGoResult } from "../scenario-draft-authoring-final-go/types"
import { buildScenarioDraftAuthoringReadyToExecute } from "./build-scenario-draft-authoring-ready-to-execute"

function finalGoResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringFinalGoResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
  committed: boolean
  finalGo: boolean
}): ScenarioDraftAuthoringFinalGoResult {
  const hasFinalGoTarget = args.firstSessionCode !== null
  const finalGoBlocked = !args.finalGo
  return {
    data: {
      finalGoCard: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        startReady: args.startReady,
        actNow: args.actNow,
        confirmed: args.confirmed,
        committed: args.committed,
        finalGo: args.finalGo,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasFinalGoTarget,
          finalGoBlocked,
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
      actNow: args.actNow,
      confirmed: args.confirmed,
      committed: args.committed,
      finalGo: args.finalGo,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringReadyToExecute", () => {
  it("copies final-go fields; readyToExecute true when finalGo and session exist", () => {
    const fg = finalGoResult({
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
      actNow: true,
      confirmed: true,
      committed: true,
      finalGo: true,
    })
    const r = buildScenarioDraftAuthoringReadyToExecute(fg)

    expect(r.data.readyToExecuteSnapshot.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.readyToExecuteSnapshot.firstWorksetCode).toBe("WS_A")
    expect(r.data.readyToExecuteSnapshot.firstQueueItemCode).toBe("Q_START")
    expect(r.data.readyToExecuteSnapshot.remainingSessionCount).toBe(2)
    expect(r.data.readyToExecuteSnapshot.totalPlannedItems).toBe(10)
    expect(r.data.readyToExecuteSnapshot.summary.hasReadyToExecuteTarget).toBe(true)
    expect(r.data.readyToExecuteSnapshot.readyToExecute).toBe(true)
    expect(r.data.readyToExecuteSnapshot.summary.readyToExecuteBlocked).toBe(false)
    expect(r.data.readyToExecuteSnapshot.summary.totalSessions).toBe(2)
    expect(r.summary.readyToExecute).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_READY_TO_EXECUTE_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_READY_TO_EXECUTE_TARGET")).toBe(false)
  })

  it("readyToExecute false when finalGo is false", () => {
    const fg = finalGoResult({
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
      actNow: false,
      confirmed: false,
      committed: false,
      finalGo: false,
    })
    const r = buildScenarioDraftAuthoringReadyToExecute(fg)
    expect(r.data.readyToExecuteSnapshot.readyToExecute).toBe(false)
    expect(r.data.readyToExecuteSnapshot.summary.readyToExecuteBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_READY_TO_EXECUTE_NOT_READY")).toBe(true)
  })

  it("readyToExecute false when no first session even if finalGo true", () => {
    const fg = finalGoResult({
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
      actNow: true,
      confirmed: true,
      committed: true,
      finalGo: true,
    })
    const r = buildScenarioDraftAuthoringReadyToExecute(fg)
    expect(r.data.readyToExecuteSnapshot.readyToExecute).toBe(false)
    expect(r.data.readyToExecuteSnapshot.summary.hasReadyToExecuteTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_READY_TO_EXECUTE_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_READY_TO_EXECUTE_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const fg = finalGoResult({
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
      actNow: true,
      confirmed: true,
      committed: true,
      finalGo: true,
    })
    const r = buildScenarioDraftAuthoringReadyToExecute(fg)
    expect(r.warnings.some((w) => w.code === "AUTHORING_READY_TO_EXECUTE_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate final-go result", () => {
    const fg = finalGoResult({
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
      actNow: true,
      confirmed: true,
      committed: true,
      finalGo: true,
    })
    const snap = structuredClone(fg)
    buildScenarioDraftAuthoringReadyToExecute(fg)
    expect(fg).toEqual(snap)
  })

  it("is deterministic", () => {
    const fg = finalGoResult({
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
      actNow: true,
      confirmed: true,
      committed: true,
      finalGo: true,
    })
    expect(buildScenarioDraftAuthoringReadyToExecute(fg)).toEqual(
      buildScenarioDraftAuthoringReadyToExecute(fg),
    )
  })
})
