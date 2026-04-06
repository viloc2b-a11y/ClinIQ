import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecuteNowResult } from "../scenario-draft-authoring-execute-now/types"
import { buildScenarioDraftAuthoringFirstMove } from "./build-scenario-draft-authoring-first-move"

function executeNowResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringExecuteNowResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
  committed: boolean
  finalGo: boolean
  readyToExecute: boolean
  executionApproved: boolean
  executeNow: boolean
}): ScenarioDraftAuthoringExecuteNowResult {
  const hasExecuteNowTarget = args.firstSessionCode !== null
  const executeNowBlocked = !args.executeNow
  return {
    data: {
      executeNowCard: {
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
        executionApproved: args.executionApproved,
        executeNow: args.executeNow,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasExecuteNowTarget,
          executeNowBlocked,
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
      executionApproved: args.executionApproved,
      executeNow: args.executeNow,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringFirstMove", () => {
  it("copies execute-now fields; firstMoveReady true when executeNow and session exist", () => {
    const en = executeNowResult({
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
      executionApproved: true,
      executeNow: true,
    })
    const r = buildScenarioDraftAuthoringFirstMove(en)

    expect(r.data.firstMoveSnapshot.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.firstMoveSnapshot.firstWorksetCode).toBe("WS_A")
    expect(r.data.firstMoveSnapshot.firstQueueItemCode).toBe("Q_START")
    expect(r.data.firstMoveSnapshot.remainingSessionCount).toBe(2)
    expect(r.data.firstMoveSnapshot.totalPlannedItems).toBe(10)
    expect(r.data.firstMoveSnapshot.summary.hasFirstMoveTarget).toBe(true)
    expect(r.data.firstMoveSnapshot.firstMoveReady).toBe(true)
    expect(r.data.firstMoveSnapshot.summary.firstMoveBlocked).toBe(false)
    expect(r.data.firstMoveSnapshot.summary.totalSessions).toBe(2)
    expect(r.summary.firstMoveReady).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FIRST_MOVE_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_FIRST_MOVE_TARGET")).toBe(false)
  })

  it("firstMoveReady false when executeNow is false", () => {
    const en = executeNowResult({
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
      executionApproved: false,
      executeNow: false,
    })
    const r = buildScenarioDraftAuthoringFirstMove(en)
    expect(r.data.firstMoveSnapshot.firstMoveReady).toBe(false)
    expect(r.data.firstMoveSnapshot.summary.firstMoveBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FIRST_MOVE_NOT_READY")).toBe(true)
  })

  it("firstMoveReady false when no first session even if executeNow true", () => {
    const en = executeNowResult({
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
      executionApproved: true,
      executeNow: true,
    })
    const r = buildScenarioDraftAuthoringFirstMove(en)
    expect(r.data.firstMoveSnapshot.firstMoveReady).toBe(false)
    expect(r.data.firstMoveSnapshot.summary.hasFirstMoveTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FIRST_MOVE_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_FIRST_MOVE_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const en = executeNowResult({
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
      executionApproved: true,
      executeNow: true,
    })
    const r = buildScenarioDraftAuthoringFirstMove(en)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FIRST_MOVE_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate execute-now result", () => {
    const en = executeNowResult({
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
      executionApproved: true,
      executeNow: true,
    })
    const snap = structuredClone(en)
    buildScenarioDraftAuthoringFirstMove(en)
    expect(en).toEqual(snap)
  })

  it("is deterministic", () => {
    const en = executeNowResult({
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
      executionApproved: true,
      executeNow: true,
    })
    expect(buildScenarioDraftAuthoringFirstMove(en)).toEqual(buildScenarioDraftAuthoringFirstMove(en))
  })
})
