import { describe, expect, it } from "vitest"

import { buildSessionCode } from "./build-session-code"

describe("buildSessionCode", () => {
  it("builds stable padded code with uppercase prefix", () => {
    expect(buildSessionCode(1)).toBe("AUTHORING_SESSION_0001")
    expect(buildSessionCode(12)).toBe("AUTHORING_SESSION_0012")
    expect(buildSessionCode(9999)).toBe("AUTHORING_SESSION_9999")
  })

  it("output uses uppercase AUTHORING_SESSION literal", () => {
    const code = buildSessionCode(3)
    expect(code).toMatch(/^AUTHORING_SESSION_\d{4}$/)
    expect(code).toBe(code.toUpperCase())
  })

  it("is deterministic for same position", () => {
    expect(buildSessionCode(42)).toEqual(buildSessionCode(42))
  })
})
