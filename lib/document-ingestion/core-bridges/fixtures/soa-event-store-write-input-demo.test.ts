import { describe, expect, it } from "vitest"

import { buildMatchKey } from "../../matching/match-expected-to-invoice"
import { demoInvoiceRows, demoSoaImportRows } from "./soa-event-store-write-input-demo"

function soaKeys(): string[] {
  return demoSoaImportRows.map((r) => buildMatchKey({ visitName: r.visitName, activityName: r.activityName }))
}

function invKeys(): string[] {
  return demoInvoiceRows.map((r) => buildMatchKey(r))
}

describe("soa-event-store-write-input-demo fixture", () => {
  it("loads demoSoaImportRows", () => {
    expect(demoSoaImportRows).toBeDefined()
    expect(Array.isArray(demoSoaImportRows)).toBe(true)
  })

  it("loads demoInvoiceRows", () => {
    expect(demoInvoiceRows).toBeDefined()
    expect(Array.isArray(demoInvoiceRows)).toBe(true)
  })

  it("demoSoaImportRows is not empty", () => {
    expect(demoSoaImportRows.length).toBeGreaterThan(0)
  })

  it("demoInvoiceRows is not empty", () => {
    expect(demoInvoiceRows.length).toBeGreaterThan(0)
  })

  it("covers exact match, partial mismatch, unmatched expected, and unmatched invoice keys", () => {
    const sKeys = new Set(soaKeys())
    const iKeys = new Set(invKeys())

    const hasExactPair = demoSoaImportRows.some((r) =>
      demoInvoiceRows.some(
        (inv) =>
          buildMatchKey({ visitName: r.visitName, activityName: r.activityName }) === buildMatchKey(inv) &&
          r.unitPrice === inv.unitPrice &&
          r.quantity === inv.quantity &&
          r.totalPrice === inv.totalPrice,
      ),
    )
    expect(hasExactPair).toBe(true)

    const hasPartialPair = demoSoaImportRows.some((r) =>
      demoInvoiceRows.some((inv) => {
        const sameKey =
          buildMatchKey({ visitName: r.visitName, activityName: r.activityName }) === buildMatchKey(inv)
        return sameKey && r.unitPrice !== inv.unitPrice
      }),
    )
    expect(hasPartialPair).toBe(true)

    expect([...sKeys].some((k) => !iKeys.has(k))).toBe(true)
    expect([...iKeys].some((k) => !sKeys.has(k))).toBe(true)
  })
})
