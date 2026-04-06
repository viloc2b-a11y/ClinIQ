import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringKickoffWorkset } from "../scenario-draft-authoring-kickoff/types"
import { buildAuthoringSession } from "./build-authoring-session"

function kickoffWs(): ScenarioDraftAuthoringKickoffWorkset {
  return {
    worksetCode: "AUTHORING_WORKSET_0002",
    worksetPosition: 5,
    totalItems: 4,
    startQueuePosition: 20,
    endQueuePosition: 23,
    firstQueueItemCode: "Q1",
    lastQueueItemCode: "Q4",
  }
}

describe("buildAuthoringSession", () => {
  it("matches contract and copies workset fields with correct session position", () => {
    const w = kickoffWs()
    const s = buildAuthoringSession({ sessionPosition: 3, workset: w })
    expect(s).toEqual({
      sessionCode: "AUTHORING_SESSION_0003",
      sessionPosition: 3,
      targetWorksetCode: "AUTHORING_WORKSET_0002",
      targetWorksetPosition: 5,
      totalItems: 4,
      startQueuePosition: 20,
      endQueuePosition: 23,
      firstQueueItemCode: "Q1",
      lastQueueItemCode: "Q4",
    })
  })

  it("is deterministic", () => {
    const w = kickoffWs()
    expect(buildAuthoringSession({ sessionPosition: 1, workset: w })).toEqual(
      buildAuthoringSession({ sessionPosition: 1, workset: w }),
    )
  })

  it("does not mutate workset", () => {
    const w = kickoffWs()
    const snap = structuredClone(w)
    buildAuthoringSession({ sessionPosition: 1, workset: w })
    expect(w).toEqual(snap)
  })
})
