import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionCardResult } from "../scenario-draft-authoring-execution-card/types"
import { buildScenarioDraftAuthoringStartSignal } from "./build-scenario-draft-authoring-start-signal"

function executionCardResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringExecutionCardResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
}): ScenarioDraftAuthoringExecutionCardResult {
  const hasExecutionStartPoint = args.firstSessionCode !== null
  const executionBlocked = !args.launchReady
  return {
    data: {
      executionCard: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasExecutionStartPoint,
          executionBlocked,
          totalSessions: args.remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus: args.readinessStatus,
      kickoffReady: args.kickoffReady,
      launchReady: args.launchReady,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringStartSignal", () => {
  it("copies execution card fields; startNow true when launchReady and session exist", () => {
    const ec = executionCardResult({
      firstSessionCode: "AUTHORING_SESSION_0001",
      firstWorksetCode: "WS_A",
      firstQueueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 8,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringStartSignal(ec)

    expect(r.data.startSignal.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.startSignal.firstWorksetCode).toBe("WS_A")
    expect(r.data.startSignal.firstQueueItemCode).toBe("Q_START")
    expect(r.data.startSignal.remainingSessionCount).toBe(2)
    expect(r.data.startSignal.totalPlannedItems).toBe(8)
    expect(r.data.startSignal.summary.hasStartTarget).toBe(true)
    expect(r.data.startSignal.startNow).toBe(true)
    expect(r.data.startSignal.summary.startBlocked).toBe(false)
    expect(r.data.startSignal.summary.totalSessions).toBe(2)
    expect(r.summary.startNow).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_SIGNAL_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_AUTHORING_START_TARGET")).toBe(false)
  })

  it("startNow false when launchReady is false", () => {
    const ec = executionCardResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
      launchReady: false,
    })
    const r = buildScenarioDraftAuthoringStartSignal(ec)
    expect(r.data.startSignal.startNow).toBe(false)
    expect(r.data.startSignal.summary.startBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_SIGNAL_NOT_READY")).toBe(true)
  })

  it("startNow false when no first session despite launchReady", () => {
    const ec = executionCardResult({
      firstSessionCode: null,
      firstWorksetCode: null,
      firstQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringStartSignal(ec)
    expect(r.data.startSignal.startNow).toBe(false)
    expect(r.data.startSignal.summary.hasStartTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_SIGNAL_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_AUTHORING_START_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const ec = executionCardResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringStartSignal(ec)
    expect(r.warnings.some((w) => w.code === "AUTHORING_START_SIGNAL_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate execution card result", () => {
    const ec = executionCardResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const snap = structuredClone(ec)
    buildScenarioDraftAuthoringStartSignal(ec)
    expect(ec).toEqual(snap)
  })

  it("is deterministic", () => {
    const ec = executionCardResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    expect(buildScenarioDraftAuthoringStartSignal(ec)).toEqual(buildScenarioDraftAuthoringStartSignal(ec))
  })
})
