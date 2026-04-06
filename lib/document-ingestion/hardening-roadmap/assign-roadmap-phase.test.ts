import { describe, expect, it } from "vitest"

import { assignRoadmapPhase } from "./assign-roadmap-phase"

describe("assignRoadmapPhase", () => {
  it("maps high to phase 1", () => {
    expect(assignRoadmapPhase("high")).toBe(1)
  })

  it("maps medium to phase 2", () => {
    expect(assignRoadmapPhase("medium")).toBe(2)
  })

  it("maps low to phase 3", () => {
    expect(assignRoadmapPhase("low")).toBe(3)
  })
})
