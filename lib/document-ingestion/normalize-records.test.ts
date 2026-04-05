import { describe, expect, it } from "vitest"

import {
  cleanString,
  normalizeCurrency,
  normalizeNumber,
  normalizeVisitName,
} from "./normalize-records"

describe("cleanString", () => {
  it("trims and collapses internal whitespace", () => {
    expect(cleanString("  hello   world  ")).toBe("hello world")
    expect(cleanString("a\t\nb")).toBe("a b")
  })

  it("returns null for blank or empty", () => {
    expect(cleanString("")).toBeNull()
    expect(cleanString("   \t  ")).toBeNull()
    expect(cleanString(null)).toBeNull()
    expect(cleanString(undefined)).toBeNull()
  })

  it("coerces finite numbers to string", () => {
    expect(cleanString(0)).toBe("0")
    expect(cleanString(42.5)).toBe("42.5")
  })

  it("returns null for non-stringifiable types", () => {
    expect(cleanString({})).toBeNull()
    expect(cleanString([])).toBeNull()
    expect(cleanString(true)).toBeNull()
    expect(cleanString(Number.NaN)).toBeNull()
    expect(cleanString(Number.POSITIVE_INFINITY)).toBeNull()
  })
})

describe("normalizeVisitName", () => {
  it("standardizes spacing like cleanString", () => {
    expect(normalizeVisitName("  Visit 1  ")).toBe("Visit 1")
    expect(normalizeVisitName("Screening   Visit")).toBe("Screening Visit")
  })

  it("returns null if blank", () => {
    expect(normalizeVisitName("")).toBeNull()
    expect(normalizeVisitName("  ")).toBeNull()
  })
})

describe("normalizeNumber", () => {
  it("parses integers and decimals from strings", () => {
    expect(normalizeNumber("3")).toBe(3)
    expect(normalizeNumber("3.0")).toBe(3)
    expect(normalizeNumber(" 45.50 ")).toBe(45.5)
  })

  it("parses comma-separated thousands", () => {
    expect(normalizeNumber("1,250")).toBe(1250)
    expect(normalizeNumber("1,200.5")).toBe(1200.5)
  })

  it("parses values with currency symbol for numeric path", () => {
    expect(normalizeNumber("$1,200")).toBe(1200)
  })

  it("allows negative values", () => {
    expect(normalizeNumber("-42")).toBe(-42)
    expect(normalizeNumber("-1,000.25")).toBe(-1000.25)
  })

  it("passes through finite numbers", () => {
    expect(normalizeNumber(100)).toBe(100)
    expect(normalizeNumber(-0.5)).toBe(-0.5)
  })

  it("returns null for invalid values", () => {
    expect(normalizeNumber("")).toBeNull()
    expect(normalizeNumber("N/A")).toBeNull()
    expect(normalizeNumber("abc")).toBeNull()
    expect(normalizeNumber("12.34.56")).toBeNull()
    expect(normalizeNumber({})).toBeNull()
  })
})

describe("normalizeCurrency", () => {
  it("parses currency strings", () => {
    expect(normalizeCurrency("$125.00")).toBe(125)
    expect(normalizeCurrency("USD 1,250.50")).toBe(1250.5)
    expect(normalizeCurrency("  $ 99.99 ")).toBe(99.99)
  })

  it("accepts plain numeric strings and numbers", () => {
    expect(normalizeCurrency("250")).toBe(250)
    expect(normalizeCurrency(1250.5)).toBe(1250.5)
  })

  it("returns null for invalid or placeholder values", () => {
    expect(normalizeCurrency("TBD")).toBeNull()
    expect(normalizeCurrency("")).toBeNull()
    expect(normalizeCurrency("N/A")).toBeNull()
    expect(normalizeCurrency("USD")).toBeNull()
  })
})
