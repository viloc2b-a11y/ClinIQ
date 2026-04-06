import { describe, expect, it } from "vitest"

import { buildGlobalQueueCode } from "./build-global-queue-code"

describe("buildGlobalQueueCode", () => {
  it("builds stable uppercase code with padded queue position", () => {
    const code = buildGlobalQueueCode({
      queuePosition: 1,
      reviewPackCode: "REVIEW_PACK_HAPPY_PATH_EDGE_CASE_EXPANSION",
      draftCode: "DRAFT_BLUEPRINT_X_1",
    })
    expect(code.startsWith("AUTHORING_QUEUE_0001_")).toBe(true)
    expect(code).toBe(code.toUpperCase())
  })

  it("pads queue position to four digits", () => {
    const code = buildGlobalQueueCode({
      queuePosition: 42,
      reviewPackCode: "PACK",
      draftCode: "D",
    })
    expect(code).toContain("_0042_")
  })

  it("normalizes pack and draft tokens", () => {
    const code = buildGlobalQueueCode({
      queuePosition: 3,
      reviewPackCode: "Review-Pack!!",
      draftCode: "Draft::Code",
    })
    expect(code).toMatch(/^AUTHORING_QUEUE_0003_/)
    expect(code).toBe(code.toUpperCase())
  })
})
