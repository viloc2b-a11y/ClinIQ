import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringKickoffResult } from "../scenario-draft-authoring-kickoff/types"
import { buildScenarioDraftAuthoringSessionPlan } from "./build-scenario-draft-authoring-session-plan"

function kickoffWorkset(
  code: string,
  position: number,
  totalItems: number,
  firstQ: string | null,
  lastQ: string | null,
): ScenarioDraftAuthoringKickoffResult["data"]["kickoff"]["worksets"][number] {
  return {
    worksetCode: code,
    worksetPosition: position,
    totalItems,
    startQueuePosition: position,
    endQueuePosition: position + totalItems - 1,
    firstQueueItemCode: firstQ,
    lastQueueItemCode: lastQ,
  }
}

function kickoffResult(
  worksets: ScenarioDraftAuthoringKickoffResult["data"]["kickoff"]["worksets"],
  opts: {
    readinessStatus: ScenarioDraftAuthoringKickoffResult["summary"]["readinessStatus"]
    kickoffReady: boolean
    firstWorksetCode?: string | null
  },
): ScenarioDraftAuthoringKickoffResult {
  const first = worksets[0]
  return {
    data: {
      kickoff: {
        readinessStatus: opts.readinessStatus,
        kickoffReady: opts.kickoffReady,
        firstWorksetCode: opts.firstWorksetCode ?? first?.worksetCode ?? null,
        worksets,
        summary: {
          totalWorksets: worksets.length,
          totalScheduledItems: worksets.reduce((a, w) => a + w.totalItems, 0),
          hasNullFamilyRepresentation: opts.readinessStatus === "ready_with_warnings",
          firstQueueItemCode: first?.firstQueueItemCode ?? null,
        },
      },
    },
    summary: {
      readinessStatus: opts.readinessStatus,
      kickoffReady: opts.kickoffReady,
      totalWorksets: worksets.length,
      totalScheduledItems: worksets.reduce((a, w) => a + w.totalItems, 0),
      firstWorksetCode: opts.firstWorksetCode ?? first?.worksetCode ?? null,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringSessionPlan", () => {
  const twoWorksets = [
    kickoffWorkset("W1", 1, 2, "A", "B"),
    kickoffWorkset("W2", 2, 3, "C", "E"),
  ]

  it("matches contract with one session per workset and preserved order", () => {
    const kf = kickoffResult(twoWorksets, { readinessStatus: "ready", kickoffReady: true })
    const result = buildScenarioDraftAuthoringSessionPlan(kf)

    expect(result.data.sessionPlan.sessions).toHaveLength(2)
    expect(result.data.sessionPlan.sessions[0].targetWorksetCode).toBe("W1")
    expect(result.data.sessionPlan.sessions[1].targetWorksetCode).toBe("W2")
    expect(result.data.sessionPlan.sessions[0].sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(result.data.sessionPlan.sessions[1].sessionCode).toBe("AUTHORING_SESSION_0002")
    expect(result.summary.totalSessions).toBe(2)
    expect(result.summary.totalPlannedItems).toBe(5)
    expect(result.data.sessionPlan.summary.totalPlannedItems).toBe(5)
  })

  it("firstSessionCode and first queue/workset fields correct", () => {
    const kf = kickoffResult(twoWorksets, { readinessStatus: "ready", kickoffReady: true })
    const result = buildScenarioDraftAuthoringSessionPlan(kf)

    expect(result.data.sessionPlan.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(result.summary.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(result.data.sessionPlan.summary.firstWorksetCode).toBe("W1")
    expect(result.data.sessionPlan.summary.firstQueueItemCode).toBe("A")
  })

  it("emits warning when kickoffReady is false", () => {
    const kf = kickoffResult(twoWorksets, { readinessStatus: "not_ready", kickoffReady: false })
    const result = buildScenarioDraftAuthoringSessionPlan(kf)
    expect(result.warnings.some((w) => w.code === "AUTHORING_SESSION_PLAN_NOT_READY")).toBe(true)
  })

  it("emits warning when readinessStatus is ready_with_warnings", () => {
    const kf = kickoffResult(twoWorksets, {
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
    })
    const result = buildScenarioDraftAuthoringSessionPlan(kf)
    expect(result.warnings.some((w) => w.code === "AUTHORING_SESSION_PLAN_READY_WITH_WARNINGS")).toBe(true)
  })

  it("emits info when no sessions exist", () => {
    const kf = kickoffResult([], { readinessStatus: "not_ready", kickoffReady: false })
    const result = buildScenarioDraftAuthoringSessionPlan(kf)
    expect(result.warnings.some((w) => w.code === "NO_AUTHORING_SESSIONS" && w.severity === "info")).toBe(
      true,
    )
  })

  it("does not mutate kickoff result", () => {
    const kf = kickoffResult(structuredClone(twoWorksets), {
      readinessStatus: "ready",
      kickoffReady: true,
    })
    const snap = structuredClone(kf)
    buildScenarioDraftAuthoringSessionPlan(kf)
    expect(kf).toEqual(snap)
  })

  it("is deterministic", () => {
    const kf = kickoffResult(twoWorksets, { readinessStatus: "ready", kickoffReady: true })
    expect(buildScenarioDraftAuthoringSessionPlan(kf)).toEqual(buildScenarioDraftAuthoringSessionPlan(kf))
  })
})
