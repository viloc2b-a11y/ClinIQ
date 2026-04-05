import { describe, expect, it } from "vitest"

import { demoSoaImportRows } from "./soa-to-expected-demo"

describe("soa-to-expected-demo fixture", () => {
  it("loads demoSoaImportRows", () => {
    expect(demoSoaImportRows).toBeDefined()
    expect(Array.isArray(demoSoaImportRows)).toBe(true)
  })

  it("demoSoaImportRows is not empty", () => {
    expect(demoSoaImportRows.length).toBeGreaterThan(0)
  })

  it("includes ready, missing visit, low confidence, and missing unitPrice cases", () => {
    const hasReady = demoSoaImportRows.some((r) => r.importStatus === "ready")
    const hasMissingVisit = demoSoaImportRows.some((r) => r.visitName == null)
    const hasLowConfidence = demoSoaImportRows.some((r) => r.confidence === "low")
    const hasMissingUnitPrice = demoSoaImportRows.some((r) => r.unitPrice == null)

    expect(hasReady).toBe(true)
    expect(hasMissingVisit).toBe(true)
    expect(hasLowConfidence).toBe(true)
    expect(hasMissingUnitPrice).toBe(true)
  })
})
