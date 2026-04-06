import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringWorkset } from "../scenario-draft-authoring-worksets/types"
import { buildKickoffWorkset } from "./build-kickoff-workset"

function sampleWorkset(): ScenarioDraftAuthoringWorkset {
  return {
    worksetCode: "AUTHORING_WORKSET_0001",
    worksetPosition: 2,
    startQueuePosition: 10,
    endQueuePosition: 15,
    items: [],
    summary: {
      totalItems: 6,
      firstQueueItemCode: "G_FIRST",
      lastQueueItemCode: "G_LAST",
      uniqueReviewPackCount: 2,
      nullFamilyItemCount: 0,
    },
  }
}

describe("buildKickoffWorkset", () => {
  it("matches contract and copies summary-derived and queue range fields", () => {
    const w = sampleWorkset()
    const k = buildKickoffWorkset(w)
    expect(k).toEqual({
      worksetCode: "AUTHORING_WORKSET_0001",
      worksetPosition: 2,
      totalItems: 6,
      startQueuePosition: 10,
      endQueuePosition: 15,
      firstQueueItemCode: "G_FIRST",
      lastQueueItemCode: "G_LAST",
    })
  })

  it("is deterministic", () => {
    const w = sampleWorkset()
    expect(buildKickoffWorkset(w)).toEqual(buildKickoffWorkset(w))
  })

  it("does not mutate input workset", () => {
    const w = sampleWorkset()
    const snap = structuredClone(w)
    buildKickoffWorkset(w)
    expect(w).toEqual(snap)
  })
})
