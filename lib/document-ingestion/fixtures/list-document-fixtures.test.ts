import { describe, expect, it } from "vitest"

import { listDocumentFixtures } from "./list-document-fixtures"

describe("listDocumentFixtures", () => {
  it("lists internal document fixtures", () => {
    const result = listDocumentFixtures()

    expect(result.summary.totalFixtures).toBeGreaterThanOrEqual(10)
  })
})
