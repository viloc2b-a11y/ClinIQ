import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringCoverageWorkset } from "./types"
import { buildFamilyCoverage } from "./build-family-coverage"

describe("buildFamilyCoverage", () => {
  const worksets: ScenarioDraftAuthoringCoverageWorkset[] = []

  const sourceWorksets = [
    {
      worksetCode: "W1",
      items: [
        { familyKey: "happy_path" as const },
        { familyKey: "happy_path" as const },
      ],
    },
    {
      worksetCode: "W2",
      items: [
        { familyKey: "row_structure" as const },
        { familyKey: "happy_path" as const },
      ],
    },
    {
      worksetCode: "W3",
      items: [{ familyKey: null }],
    },
  ]

  it("produces one row per family with counts and first workset", () => {
    const rows = buildFamilyCoverage({ worksets, sourceWorksets })
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.familyKey)).toEqual(["happy_path", "row_structure", null])
    const happy = rows.find((r) => r.familyKey === "happy_path")
    expect(happy?.totalItems).toBe(3)
    expect(happy?.worksetCount).toBe(2)
    expect(happy?.firstWorksetCode).toBe("W1")
    const row = rows.find((r) => r.familyKey === "row_structure")
    expect(row?.totalItems).toBe(1)
    expect(row?.firstWorksetCode).toBe("W2")
    const unassigned = rows.find((r) => r.familyKey === null)
    expect(unassigned?.totalItems).toBe(1)
    expect(unassigned?.firstWorksetCode).toBe("W3")
  })

  it("does not mutate sourceWorksets", () => {
    const snap = structuredClone(sourceWorksets)
    buildFamilyCoverage({ worksets, sourceWorksets })
    expect(sourceWorksets).toEqual(snap)
  })
})
