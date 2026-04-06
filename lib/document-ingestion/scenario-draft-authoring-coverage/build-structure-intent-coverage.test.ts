import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringCoverageWorkset } from "./types"
import { buildStructureIntentCoverage } from "./build-structure-intent-coverage"

describe("buildStructureIntentCoverage", () => {
  const worksets: ScenarioDraftAuthoringCoverageWorkset[] = []

  const sourceWorksets = [
    {
      worksetCode: "W1",
      items: [
        { structureIntent: "distribution_rebalance" as const },
        { structureIntent: "edge_case_expansion" as const },
      ],
    },
    {
      worksetCode: "W2",
      items: [{ structureIntent: "edge_case_expansion" as const }],
    },
  ]

  it("orders intents by priority and aggregates counts", () => {
    const rows = buildStructureIntentCoverage({ worksets, sourceWorksets })
    expect(rows.map((r) => r.structureIntent)).toEqual([
      "edge_case_expansion",
      "distribution_rebalance",
    ])
    const edge = rows.find((r) => r.structureIntent === "edge_case_expansion")
    expect(edge?.totalItems).toBe(2)
    expect(edge?.worksetCount).toBe(2)
    expect(edge?.firstWorksetCode).toBe("W1")
    const dist = rows.find((r) => r.structureIntent === "distribution_rebalance")
    expect(dist?.totalItems).toBe(1)
    expect(dist?.firstWorksetCode).toBe("W1")
  })

  it("does not mutate sourceWorksets", () => {
    const snap = structuredClone(sourceWorksets)
    buildStructureIntentCoverage({ worksets, sourceWorksets })
    expect(sourceWorksets).toEqual(snap)
  })
})
