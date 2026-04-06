import { describe, expect, it } from "vitest"

import { buildWorksetCode } from "./build-workset-code"

describe("buildWorksetCode", () => {
  it("builds padded deterministic code", () => {
    expect(buildWorksetCode(1)).toBe("AUTHORING_WORKSET_0001")
    expect(buildWorksetCode(42)).toBe("AUTHORING_WORKSET_0042")
  })

  it("output is uppercase", () => {
    const code = buildWorksetCode(7)
    expect(code).toBe(code.toUpperCase())
  })

  it("is deterministic for same position", () => {
    expect(buildWorksetCode(3)).toEqual(buildWorksetCode(3))
  })
})
