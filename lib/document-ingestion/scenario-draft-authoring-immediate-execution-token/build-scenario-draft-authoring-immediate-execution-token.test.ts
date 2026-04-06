import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringFirstMoveResult } from "../scenario-draft-authoring-first-move/types"
import { buildScenarioDraftAuthoringImmediateExecutionToken } from "./build-scenario-draft-authoring-immediate-execution-token"

function firstMoveResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  firstMoveReady: boolean
  readinessStatus?: ScenarioDraftAuthoringFirstMoveResult["summary"]["readinessStatus"]
}): ScenarioDraftAuthoringFirstMoveResult {
  const readinessStatus = args.readinessStatus ?? "ready"
  const hasFirstMoveTarget = args.firstSessionCode !== null
  const firstMoveBlocked = !args.firstMoveReady
  return {
    data: {
      firstMoveSnapshot: {
        readinessStatus,
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
        firstMoveReady: args.firstMoveReady,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasFirstMoveTarget,
          firstMoveBlocked,
          totalSessions: args.remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
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
      firstMoveReady: args.firstMoveReady,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringImmediateExecutionToken", () => {
  it("matches contract: maps session/workset/queue, counts, and planned items", () => {
    const fm = firstMoveResult({
      firstSessionCode: "AUTHORING_SESSION_0001",
      firstWorksetCode: "WS_A",
      firstQueueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
      firstMoveReady: true,
    })
    const r = buildScenarioDraftAuthoringImmediateExecutionToken(fm)

    expect(r.data.executionToken.executionAllowed).toBe(true)
    expect(r.data.executionToken.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionToken.worksetCode).toBe("WS_A")
    expect(r.data.executionToken.queueItemCode).toBe("Q_START")
    expect(r.data.executionToken.remainingSessionCount).toBe(2)
    expect(r.data.executionToken.totalPlannedItems).toBe(10)
    expect(r.data.executionToken.summary.hasExecutionTarget).toBe(true)
    expect(r.data.executionToken.summary.executionBlocked).toBe(false)
    expect(r.summary).toEqual({
      executionAllowed: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("executionBlocked and warning when executionAllowed is false", () => {
    const fm = firstMoveResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      firstMoveReady: false,
    })
    const r = buildScenarioDraftAuthoringImmediateExecutionToken(fm)
    expect(r.data.executionToken.executionAllowed).toBe(false)
    expect(r.data.executionToken.summary.executionBlocked).toBe(true)
    const notAllowed = r.warnings.find((w) => w.code === "AUTHORING_IMMEDIATE_EXECUTION_NOT_ALLOWED")
    expect(notAllowed?.message).toBe(
      "Scenario draft authoring immediate execution token is not allowed to proceed.",
    )
  })

  it("executionAllowed follows snapshot firstMoveReady, not summary when they differ", () => {
    const fm: ScenarioDraftAuthoringFirstMoveResult = {
      data: {
        firstMoveSnapshot: {
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
          firstMoveReady: true,
          firstSessionCode: "S",
          firstWorksetCode: "W",
          firstQueueItemCode: "Q",
          remainingSessionCount: 1,
          totalPlannedItems: 1,
          summary: {
            hasFirstMoveTarget: true,
            firstMoveBlocked: false,
            totalSessions: 1,
          },
        },
      },
      summary: {
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
        firstMoveReady: false,
        firstSessionCode: "S",
        remainingSessionCount: 1,
        totalPlannedItems: 1,
      },
      warnings: [],
    }
    const r = buildScenarioDraftAuthoringImmediateExecutionToken(fm)
    expect(r.data.executionToken.executionAllowed).toBe(true)
  })

  it("info warning when no execution target", () => {
    const fm = firstMoveResult({
      firstSessionCode: null,
      firstWorksetCode: null,
      firstQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      firstMoveReady: false,
    })
    const r = buildScenarioDraftAuthoringImmediateExecutionToken(fm)
    expect(r.data.executionToken.summary.hasExecutionTarget).toBe(false)
    const noTarget = r.warnings.find((w) => w.code === "NO_IMMEDIATE_EXECUTION_TARGET")
    expect(noTarget?.severity).toBe("info")
    expect(noTarget?.message).toBe(
      "No immediate execution target is available because no first-move session target exists.",
    )
  })

  it("does not mutate first-move result", () => {
    const fm = firstMoveResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      firstMoveReady: true,
    })
    const snap = structuredClone(fm)
    buildScenarioDraftAuthoringImmediateExecutionToken(fm)
    expect(fm).toEqual(snap)
  })

  it("is deterministic", () => {
    const fm = firstMoveResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      firstMoveReady: true,
    })
    expect(buildScenarioDraftAuthoringImmediateExecutionToken(fm)).toEqual(
      buildScenarioDraftAuthoringImmediateExecutionToken(fm),
    )
  })
})
