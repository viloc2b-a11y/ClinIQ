import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringOperatorBriefResult } from "../scenario-draft-authoring-operator-brief/types"
import { buildScenarioDraftAuthoringExecutionCard } from "./build-scenario-draft-authoring-execution-card"

function operatorBriefResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringOperatorBriefResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
}): ScenarioDraftAuthoringOperatorBriefResult {
  const hasOperatorStartPoint = args.firstSessionCode !== null
  const launchBlocked = !args.launchReady
  return {
    data: {
      operatorBrief: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasOperatorStartPoint,
          launchBlocked,
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

describe("buildScenarioDraftAuthoringExecutionCard", () => {
  it("copies operator brief fields and computes execution summary when launch ready", () => {
    const ob = operatorBriefResult({
      firstSessionCode: "AUTHORING_SESSION_0001",
      firstWorksetCode: "WS_A",
      firstQueueItemCode: "Q_START",
      remainingSessionCount: 4,
      totalPlannedItems: 20,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringExecutionCard(ob)

    expect(r.data.executionCard.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionCard.firstWorksetCode).toBe("WS_A")
    expect(r.data.executionCard.firstQueueItemCode).toBe("Q_START")
    expect(r.data.executionCard.remainingSessionCount).toBe(4)
    expect(r.data.executionCard.totalPlannedItems).toBe(20)
    expect(r.data.executionCard.summary.hasExecutionStartPoint).toBe(true)
    expect(r.data.executionCard.summary.executionBlocked).toBe(false)
    expect(r.data.executionCard.summary.totalSessions).toBe(4)
    expect(r.summary.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_CARD_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_EXECUTION_START_POINT")).toBe(false)
  })

  it("warning when launchReady is false", () => {
    const ob = operatorBriefResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
      launchReady: false,
    })
    const r = buildScenarioDraftAuthoringExecutionCard(ob)
    expect(r.data.executionCard.summary.executionBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_CARD_NOT_READY")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const ob = operatorBriefResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      launchReady: true,
    })
    const r = buildScenarioDraftAuthoringExecutionCard(ob)
    expect(r.warnings.some((w) => w.code === "AUTHORING_EXECUTION_CARD_READY_WITH_WARNINGS")).toBe(true)
  })

  it("info when no execution start point", () => {
    const ob = operatorBriefResult({
      firstSessionCode: null,
      firstWorksetCode: null,
      firstQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: false,
    })
    const r = buildScenarioDraftAuthoringExecutionCard(ob)
    expect(r.data.executionCard.summary.hasExecutionStartPoint).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_EXECUTION_START_POINT" && w.severity === "info")).toBe(true)
  })

  it("does not mutate operator brief result", () => {
    const ob = operatorBriefResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    const snap = structuredClone(ob)
    buildScenarioDraftAuthoringExecutionCard(ob)
    expect(ob).toEqual(snap)
  })

  it("is deterministic", () => {
    const ob = operatorBriefResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
    })
    expect(buildScenarioDraftAuthoringExecutionCard(ob)).toEqual(buildScenarioDraftAuthoringExecutionCard(ob))
  })
})
