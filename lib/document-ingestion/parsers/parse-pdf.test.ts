import { describe, expect, it } from "vitest"

import {
  PDF_LIMITED_WARNING,
  PDF_NO_CONTENT_WARNING,
  PDF_NO_STRUCTURED_WARNING,
  parsePdf,
} from "./parse-pdf"

describe("parsePdf", () => {
  it("empty input: warnings, no records", () => {
    const doc = parsePdf({})
    expect(doc.records).toHaveLength(0)
    expect(doc.sourceType).toBe("pdf")
    expect(doc.parserId).toBe("cliniq-parse-pdf-v1")
    expect(doc.warnings).toContain(PDF_LIMITED_WARNING)
    expect(doc.warnings).toContain(PDF_NO_CONTENT_WARNING)
  })

  it("rawText with visit/schedule lines yields low-confidence visit_schedule records", () => {
    const doc = parsePdf({
      rawText: "Visit Schedule\nScreening Visit\nDay 1 Visit",
    })
    expect(doc.records).toHaveLength(3)
    expect(doc.records.every((r) => r.kind === "visit_schedule")).toBe(true)
    expect(doc.warnings).toContain(PDF_LIMITED_WARNING)
    expect(doc.warnings).not.toContain(PDF_NO_STRUCTURED_WARNING)
    const r0 = doc.records[0]!
    expect(r0.kind).toBe("visit_schedule")
    if (r0.kind === "visit_schedule") {
      expect(r0.visitName).toBe("Visit Schedule")
      expect(r0.visitNumber?.confidence).toBe("low")
    }
  })

  it("rawText with currency yields budget_line with low confidence", () => {
    const doc = parsePdf({ rawText: "ECG - $85" })
    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("budget_line")
    if (r.kind === "budget_line") {
      expect(r.label).toBe("ECG")
      expect(r.expectedAmount?.value).toBe(85)
      expect(r.expectedAmount?.confidence).toBe("low")
    }
  })

  it("mixed content produces multiple heuristic records", () => {
    const doc = parsePdf({
      rawText: "Visit Window\nECG - $50\nLab assessment required",
    })
    expect(doc.records).toHaveLength(3)
    expect(doc.records[0]?.kind).toBe("visit_schedule")
    expect(doc.records[1]?.kind).toBe("budget_line")
    expect(doc.records[2]?.kind).toBe("soa_activity")
    if (doc.records[2]?.kind === "soa_activity") {
      expect(doc.records[2].activityLabel).toContain("assessment")
      expect(doc.records[2].quantity?.confidence).toBe("low")
    }
  })

  it("no recognizable content: no records and structured-data warning", () => {
    const doc = parsePdf({ rawText: "hello world\nfoo bar" })
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain(PDF_LIMITED_WARNING)
    expect(doc.warnings).toContain(PDF_NO_STRUCTURED_WARNING)
  })

  it("tables only: maps row strings through same heuristics", () => {
    const doc = parsePdf({
      tables: [[{ Visit: "Day 1", Note: "screening" }]],
    })
    expect(doc.records).toHaveLength(1)
    expect(doc.records[0]?.kind).toBe("visit_schedule")
  })
})
