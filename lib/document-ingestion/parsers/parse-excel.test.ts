import { describe, expect, it } from "vitest"

import { detectColumnMap, isEmptyRow, normalizeHeaderKey, parseExcel } from "./parse-excel"

describe("parseExcel", () => {
  it("happy path SoA-like rows: soa_activity, normalized names, numeric parsing", () => {
    const doc = parseExcel({
      fileName: "soa.xlsx",
      sheetName: "Sheet1",
      rows: [
        { Visit: "Screening", Procedure: "Informed Consent", Quantity: "1", Fee: "$0" },
        { Visit: "Day 1", Procedure: "Physical Exam", Quantity: "1", Fee: "$125.00" },
      ],
    })

    expect(doc.sourceType).toBe("excel")
    expect(doc.parserId).toBe("cliniq-parse-excel-v1")
    expect(doc.schemaVersion).toBe("1")
    expect(doc.documentRole).toBe("soa")
    expect(doc.records).toHaveLength(2)
    expect(doc.records[0]?.kind).toBe("soa_activity")
    expect(doc.records[1]?.kind).toBe("soa_activity")

    const r0 = doc.records[0]!
    expect(r0.kind).toBe("soa_activity")
    if (r0.kind === "soa_activity") {
      expect(r0.visitName).toBe("Screening")
      expect(r0.activityLabel).toBe("Informed Consent")
      expect(r0.quantity?.value).toBe(1)
      expect(r0.quantity?.confidence).toBe("high")
      expect(r0.unitAmount?.value).toBe(0)
      expect(r0.provenance?.rowIndex1Based).toBe(1)
    }

    const r1 = doc.records[1]!
    expect(r1.kind).toBe("soa_activity")
    if (r1.kind === "soa_activity") {
      expect(r1.visitName).toBe("Day 1")
      expect(r1.activityLabel).toBe("Physical Exam")
      expect(r1.unitAmount?.value).toBe(125)
    }

    expect(doc.warnings).toEqual([])
  })

  it("budget-like rows without visit classify as budget_line", () => {
    const doc = parseExcel({
      rows: [{ Item: "Study Startup", Quantity: "1", Rate: "$1500" }],
    })

    expect(doc.documentRole).toBe("budget")
    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("budget_line")
    if (r.kind === "budget_line") {
      expect(r.label).toBe("Study Startup")
      expect(r.expectedQuantity?.value).toBe(1)
      expect(r.unitPrice?.value).toBe(1500)
    }
  })

  it("blank visit with visit column + procedure: soa_activity for pre-SoA review", () => {
    const doc = parseExcel({
      rows: [{ Visit: "", Procedure: "ECG", Fee: "TBD" }],
    })

    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("soa_activity")
    if (r.kind === "soa_activity") {
      expect(r.visitName).toBeUndefined()
      expect(r.activityLabel).toBe("ECG")
      expect(r.unitAmount?.value).toBeNull()
      expect(r.unitAmount?.confidence).toBe("low")
    }
  })

  it("noisy headers still map columns", () => {
    const doc = parseExcel({
      rows: [
        {
          " Visit Name ": "Day 1",
          "Procedure Description": "ECG",
          " Unit Price ": "$85.00",
        },
      ],
    })

    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("soa_activity")
    if (r.kind === "soa_activity") {
      expect(r.visitName).toBe("Day 1")
      expect(r.activityLabel).toBe("ECG")
      expect(r.unitAmount?.value).toBe(85)
    }
  })

  it("skips rows with insufficient data and emits warnings", () => {
    const doc = parseExcel({
      rows: [{ Notes: "just a note" }, { Random: "value" }],
    })

    expect(doc.records).toHaveLength(0)
    expect(doc.warnings.some((w) => w.includes("Row 1 skipped"))).toBe(true)
    expect(doc.warnings.some((w) => w.includes("Row 2 skipped"))).toBe(true)
    expect(doc.warnings.some((w) => w.includes("no recognized data rows"))).toBe(true)
  })

  it("invalid numerics: record kept, null fields, warnings", () => {
    const doc = parseExcel({
      rows: [{ Visit: "Day 1", Procedure: "Lab Draw", Quantity: "abc", Fee: "TBD" }],
    })

    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("soa_activity")
    if (r.kind === "soa_activity") {
      expect(r.visitName).toBe("Day 1")
      expect(r.activityLabel).toBe("Lab Draw")
      expect(r.quantity?.value).toBeNull()
      expect(r.quantity?.confidence).toBe("low")
      expect(r.unitAmount?.value).toBeNull()
      expect(r.unitAmount?.confidence).toBe("low")
    }
    expect(doc.warnings.some((w) => w.includes("unparseable quantity"))).toBe(true)
    expect(doc.warnings.some((w) => w.includes("unparseable unit price"))).toBe(true)
  })

  it("empty input yields zero records and warning", () => {
    const doc = parseExcel({ rows: [] })
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain("No rows supplied: nothing to parse.")
  })
})

describe("normalizeHeaderKey", () => {
  it("strips noise for matching", () => {
    expect(normalizeHeaderKey(" Visit Name ")).toBe("visitname")
    expect(normalizeHeaderKey("visit_name")).toBe("visitname")
    expect(normalizeHeaderKey("Unit-Price")).toBe("unitprice")
  })
})

describe("detectColumnMap", () => {
  it("maps first matching key per role in sorted key order", () => {
    const m = detectColumnMap([{ Z: "x", Visit: "v", Activity: "a" }])
    expect(m.visit).toBe("Visit")
    expect(m.activity).toBe("Activity")
  })
})

describe("isEmptyRow", () => {
  it("detects blank rows", () => {
    expect(isEmptyRow({})).toBe(true)
    expect(isEmptyRow({ a: "", b: "  " })).toBe(true)
    expect(isEmptyRow({ a: "x" })).toBe(false)
  })
})
