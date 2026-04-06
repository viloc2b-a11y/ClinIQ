import { describe, expect, it } from "vitest"

import { getDocumentFixture } from "./get-document-fixture"

describe("getDocumentFixture", () => {
  it("gets fixture by type", () => {
    const result = getDocumentFixture({
      type: "excel_simple_budget",
    })

    expect(result.summary.found).toBe(true)
    expect(result.data.fixture?.fileName).toBe("simple-budget.xlsx")
  })
})
