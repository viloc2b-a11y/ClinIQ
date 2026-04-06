import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringReadinessResult } from "../scenario-draft-authoring-readiness/types"
import type { ScenarioDraftAuthoringWorkset } from "../scenario-draft-authoring-worksets/types"
import type { ScenarioDraftAuthoringWorksetResult } from "../scenario-draft-authoring-worksets/types"
import { buildScenarioDraftAuthoringKickoff } from "./build-scenario-draft-authoring-kickoff"

function workset(
  code: string,
  position: number,
  firstCode: string | null,
  lastCode: string | null,
): ScenarioDraftAuthoringWorkset {
  return {
    worksetCode: code,
    worksetPosition: position,
    startQueuePosition: position * 10,
    endQueuePosition: position * 10 + 2,
    items: [],
    summary: {
      totalItems: 3,
      firstQueueItemCode: firstCode,
      lastQueueItemCode: lastCode,
      uniqueReviewPackCount: 1,
      nullFamilyItemCount: 0,
    },
  }
}

function worksetResult(worksets: ScenarioDraftAuthoringWorkset[]): ScenarioDraftAuthoringWorksetResult {
  const totalQueueItems = worksets.reduce((acc, w) => acc + w.summary.totalItems, 0)
  return {
    data: { worksets },
    summary: {
      totalWorksets: worksets.length,
      totalQueueItems,
      configuredWorksetSize: 5,
      firstWorksetCode: worksets[0]?.worksetCode ?? null,
      lastWorksetCode: worksets[worksets.length - 1]?.worksetCode ?? null,
      worksetsWithNullFamilyItems: 0,
      maxWorksetSizeObserved: 3,
      minWorksetSizeObserved: 3,
    },
    warnings: [],
  }
}

function readiness(status: "ready" | "ready_with_warnings" | "not_ready", nullFamily = false): ScenarioDraftAuthoringReadinessResult {
  return {
    data: {
      readiness: {
        status,
        checks: {
          hasWorksets: status !== "not_ready",
          allWorksetsPopulated: status !== "not_ready",
          hasScheduledItems: status !== "not_ready",
          hasRepresentedFamilies: status !== "not_ready",
          hasRepresentedStructureIntents: status !== "not_ready",
          hasNullFamilyRepresentation: nullFamily || status === "ready_with_warnings",
        },
        reasons: [],
      },
    },
    summary: {
      status,
      totalWorksets: 1,
      totalScheduledItems: 1,
      representedFamilyCount: 1,
      representedStructureIntentCount: 1,
      nullFamilyRepresented: nullFamily || status === "ready_with_warnings",
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringKickoff", () => {
  const ws = [
    workset("AUTHORING_WORKSET_0001", 1, "Q_A", "Q_B"),
    workset("AUTHORING_WORKSET_0002", 2, "Q_C", "Q_D"),
  ]

  it("matches contract for ready state", () => {
    const wr = worksetResult(ws)
    const rr = readiness("ready", false)
    const result = buildScenarioDraftAuthoringKickoff({ worksetResult: wr, readinessResult: rr })

    expect(result.data.kickoff.readinessStatus).toBe("ready")
    expect(result.data.kickoff.kickoffReady).toBe(true)
    expect(result.data.kickoff.firstWorksetCode).toBe("AUTHORING_WORKSET_0001")
    expect(result.data.kickoff.summary.totalWorksets).toBe(2)
    expect(result.data.kickoff.summary.totalScheduledItems).toBe(6)
    expect(result.data.kickoff.summary.hasNullFamilyRepresentation).toBe(false)
    expect(result.data.kickoff.summary.firstQueueItemCode).toBe("Q_A")
    expect(result.summary).toEqual({
      readinessStatus: "ready",
      kickoffReady: true,
      totalWorksets: 2,
      totalScheduledItems: 6,
      firstWorksetCode: "AUTHORING_WORKSET_0001",
    })
    expect(result.warnings).toHaveLength(0)
  })

  it("kickoffReady true for ready_with_warnings and emits warning", () => {
    const wr = worksetResult(ws)
    const rr = readiness("ready_with_warnings", true)
    const result = buildScenarioDraftAuthoringKickoff({ worksetResult: wr, readinessResult: rr })

    expect(result.data.kickoff.kickoffReady).toBe(true)
    expect(result.data.kickoff.summary.hasNullFamilyRepresentation).toBe(true)
    expect(result.warnings.some((w) => w.code === "AUTHORING_KICKOFF_READY_WITH_WARNINGS")).toBe(true)
    expect(result.warnings.some((w) => w.code === "AUTHORING_KICKOFF_NOT_READY")).toBe(false)
  })

  it("kickoffReady false for not_ready and emits not-ready warning", () => {
    const wr = worksetResult(ws)
    const rr = readiness("not_ready")
    const result = buildScenarioDraftAuthoringKickoff({ worksetResult: wr, readinessResult: rr })

    expect(result.data.kickoff.kickoffReady).toBe(false)
    expect(result.warnings.some((w) => w.code === "AUTHORING_KICKOFF_NOT_READY")).toBe(true)
    expect(result.warnings.some((w) => w.code === "AUTHORING_KICKOFF_READY_WITH_WARNINGS")).toBe(false)
  })

  it("preserves workset order and first queue item from first workset", () => {
    const wr = worksetResult(ws)
    const result = buildScenarioDraftAuthoringKickoff({
      worksetResult: wr,
      readinessResult: readiness("ready"),
    })
    expect(result.data.kickoff.worksets.map((k) => k.worksetCode)).toEqual([
      "AUTHORING_WORKSET_0001",
      "AUTHORING_WORKSET_0002",
    ])
    expect(result.data.kickoff.worksets[0].firstQueueItemCode).toBe("Q_A")
  })

  it("does not mutate inputs", () => {
    const wr = worksetResult(structuredClone(ws))
    const rr = readiness("ready")
    const wrSnap = structuredClone(wr)
    const rrSnap = structuredClone(rr)
    buildScenarioDraftAuthoringKickoff({ worksetResult: wr, readinessResult: rr })
    expect(wr).toEqual(wrSnap)
    expect(rr).toEqual(rrSnap)
  })

  it("is deterministic", () => {
    const wr = worksetResult(ws)
    const rr = readiness("ready")
    expect(buildScenarioDraftAuthoringKickoff({ worksetResult: wr, readinessResult: rr })).toEqual(
      buildScenarioDraftAuthoringKickoff({ worksetResult: wr, readinessResult: rr }),
    )
  })
})
