import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionHandshakeResult } from "../scenario-draft-authoring-execution-handshake/types"
import { buildScenarioDraftAuthoringExecuteNow } from "./build-scenario-draft-authoring-execute-now"

function executionHandshakeResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringExecutionHandshakeResult["summary"]["readinessStatus"]
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
}): ScenarioDraftAuthoringExecutionHandshakeResult {
  const hasExecutionHandshakeTarget = args.firstSessionCode !== null
  const executionHandshakeBlocked = !args.executionApproved
  return {
    data: {
      executionHandshake: {
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
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasExecutionHandshakeTarget,
          executionHandshakeBlocked,
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
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecuteNow", () => {
  it("copies handshake fields; executeNow true when executionApproved and session exist", () => {
    const eh = executionHandshakeResult({
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
    })
    const r = buildScenarioDraftAuthoringExecuteNow(eh)

    expect(r.data.executeNowCard.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executeNowCard.firstWorksetCode).toBe("WS_A")
    expect(r.data.executeNowCard.firstQueueItemCode).toBe("Q_START")
    expect(r.data.executeNowCard.remainingSessionCount).toBe(2)
    expect(r.data.executeNowCard.totalPlannedItems).toBe(10)
    expect(r.data.executeNowCard.summary.hasExecuteNowTarget).toBe(true)
    expect(r.data.executeNowCard.executeNow).toBe(true)
    expect(r.data.executeNowCard.summary.executeNowBlocked).toBe(false)
    expect(r.data.executeNowCard.summary.totalSessions).toBe(2)
    expect(r.summary.executeNow).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTE_NOW_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_EXECUTE_NOW_TARGET")).toBe(false)
  })

  it("executeNow false when executionApproved is false", () => {
    const eh = executionHandshakeResult({
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
    })
    const r = buildScenarioDraftAuthoringExecuteNow(eh)
    expect(r.data.executeNowCard.executeNow).toBe(false)
    expect(r.data.executeNowCard.summary.executeNowBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTE_NOW_NOT_READY")).toBe(true)
  })

  it("executeNow false when no first session even if executionApproved true", () => {
    const eh = executionHandshakeResult({
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
    })
    const r = buildScenarioDraftAuthoringExecuteNow(eh)
    expect(r.data.executeNowCard.executeNow).toBe(false)
    expect(r.data.executeNowCard.summary.hasExecuteNowTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTE_NOW_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_EXECUTE_NOW_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const eh = executionHandshakeResult({
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
    })
    const r = buildScenarioDraftAuthoringExecuteNow(eh)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTE_NOW_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate execution handshake result", () => {
    const eh = executionHandshakeResult({
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
    })
    const snap = structuredClone(eh)
    buildScenarioDraftAuthoringExecuteNow(eh)
    expect(eh).toEqual(snap)
  })

  it("is deterministic", () => {
    const eh = executionHandshakeResult({
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
    })
    expect(buildScenarioDraftAuthoringExecuteNow(eh)).toEqual(buildScenarioDraftAuthoringExecuteNow(eh))
  })
})
