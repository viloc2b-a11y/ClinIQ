import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringReadyToExecuteResult } from "../scenario-draft-authoring-ready-to-execute/types"
import { buildScenarioDraftAuthoringExecutionHandshake } from "./build-scenario-draft-authoring-execution-handshake"

function readyToExecuteResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringReadyToExecuteResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
  committed: boolean
  finalGo: boolean
  readyToExecute: boolean
}): ScenarioDraftAuthoringReadyToExecuteResult {
  const hasReadyToExecuteTarget = args.firstSessionCode !== null
  const readyToExecuteBlocked = !args.readyToExecute
  return {
    data: {
      readyToExecuteSnapshot: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        startReady: args.startReady,
        actNow: args.actNow,
        confirmed: args.confirmed,
        committed: args.committed,
        finalGo: args.finalGo,
        readyToExecute: args.readyToExecute,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasReadyToExecuteTarget,
          readyToExecuteBlocked,
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
      readyToExecute: args.readyToExecute,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionHandshake", () => {
  it("copies ready-to-execute fields; executionApproved true when readyToExecute and session exist", () => {
    const rte = readyToExecuteResult({
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
      readyToExecute: true,
    })
    const r = buildScenarioDraftAuthoringExecutionHandshake(rte)

    expect(r.data.executionHandshake.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionHandshake.firstWorksetCode).toBe("WS_A")
    expect(r.data.executionHandshake.firstQueueItemCode).toBe("Q_START")
    expect(r.data.executionHandshake.remainingSessionCount).toBe(2)
    expect(r.data.executionHandshake.totalPlannedItems).toBe(10)
    expect(r.data.executionHandshake.summary.hasExecutionHandshakeTarget).toBe(true)
    expect(r.data.executionHandshake.executionApproved).toBe(true)
    expect(r.data.executionHandshake.summary.executionHandshakeBlocked).toBe(false)
    expect(r.data.executionHandshake.summary.totalSessions).toBe(2)
    expect(r.summary.executionApproved).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_HANDSHAKE_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_EXECUTION_HANDSHAKE_TARGET")).toBe(false)
  })

  it("executionApproved false when readyToExecute is false", () => {
    const rte = readyToExecuteResult({
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
      readyToExecute: false,
    })
    const r = buildScenarioDraftAuthoringExecutionHandshake(rte)
    expect(r.data.executionHandshake.executionApproved).toBe(false)
    expect(r.data.executionHandshake.summary.executionHandshakeBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_HANDSHAKE_NOT_READY")).toBe(true)
  })

  it("executionApproved false when no first session even if readyToExecute true", () => {
    const rte = readyToExecuteResult({
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
      readyToExecute: true,
    })
    const r = buildScenarioDraftAuthoringExecutionHandshake(rte)
    expect(r.data.executionHandshake.executionApproved).toBe(false)
    expect(r.data.executionHandshake.summary.hasExecutionHandshakeTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_HANDSHAKE_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_EXECUTION_HANDSHAKE_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const rte = readyToExecuteResult({
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
      readyToExecute: true,
    })
    const r = buildScenarioDraftAuthoringExecutionHandshake(rte)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_HANDSHAKE_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate ready-to-execute result", () => {
    const rte = readyToExecuteResult({
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
      readyToExecute: true,
    })
    const snap = structuredClone(rte)
    buildScenarioDraftAuthoringExecutionHandshake(rte)
    expect(rte).toEqual(snap)
  })

  it("is deterministic", () => {
    const rte = readyToExecuteResult({
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
      readyToExecute: true,
    })
    expect(buildScenarioDraftAuthoringExecutionHandshake(rte)).toEqual(
      buildScenarioDraftAuthoringExecutionHandshake(rte),
    )
  })
})
