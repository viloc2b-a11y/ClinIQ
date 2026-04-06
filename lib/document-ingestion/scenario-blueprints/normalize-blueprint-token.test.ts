import { describe, expect, it } from "vitest"

import { normalizeBlueprintToken } from "./normalize-blueprint-token"

describe("normalizeBlueprintToken", () => {
  it("lowercases", () => {
    expect(normalizeBlueprintToken("HappyPath")).toBe("happypath")
  })

  it("replaces symbols and spaces with underscores", () => {
    expect(normalizeBlueprintToken("a b-c.d")).toBe("a_b_c_d")
  })

  it("collapses repeated underscores", () => {
    expect(normalizeBlueprintToken("a___b")).toBe("a_b")
  })

  it("trims leading and trailing underscores", () => {
    expect(normalizeBlueprintToken("___x___")).toBe("x")
  })

  it("falls back to unknown for empty result", () => {
    expect(normalizeBlueprintToken("")).toBe("unknown")
    expect(normalizeBlueprintToken("___")).toBe("unknown")
  })
})
