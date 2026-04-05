import { describe, expect, it } from "vitest"

import { matchExpectedToInvoice } from "../match-expected-to-invoice"
import { demoExpectedRows, demoInvoiceRows } from "./revenue-protection-demo"

describe("revenue-protection-demo fixtures", () => {
  it("demo fixture loads", () => {
    expect(demoExpectedRows).toBeDefined()
    expect(demoInvoiceRows).toBeDefined()
  })

  it("demoExpectedRows not empty", () => {
    expect(demoExpectedRows.length).toBeGreaterThan(0)
  })

  it("demoInvoiceRows not empty", () => {
    expect(demoInvoiceRows.length).toBeGreaterThan(0)
  })

  it("mixed scenario is present in deterministic match outcome", () => {
    const m = matchExpectedToInvoice({
      expectedRows: demoExpectedRows,
      invoiceRows: demoInvoiceRows,
    })
    expect(m.matched.some((x) => x.status === "matched")).toBe(true)
    expect(m.matched.some((x) => x.status === "partial_mismatch")).toBe(true)
    expect(m.unmatchedExpected.length).toBeGreaterThanOrEqual(1)
    expect(m.unmatchedInvoice.length).toBeGreaterThanOrEqual(1)
  })
})
