import { describe, expect, it } from "vitest"

import {
  WORD_LIMITED_WARNING,
  WORD_NO_CONTENT_WARNING,
  WORD_NO_STRUCTURED_WARNING,
  parseWord,
} from "./parse-word"

describe("parseWord", () => {
  it("empty input: warnings, no records", () => {
    const doc = parseWord({})
    expect(doc.records).toHaveLength(0)
    expect(doc.sourceType).toBe("word")
    expect(doc.parserId).toBe("cliniq-parse-word-v1")
    expect(doc.warnings).toContain(WORD_LIMITED_WARNING)
    expect(doc.warnings).toContain(WORD_NO_CONTENT_WARNING)
  })

  it("paragraph with contract language yields low-confidence contract_clause", () => {
    const doc = parseWord({
      rawText: "This agreement shall remain in effect until termination.",
    })
    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("contract_clause")
    if (r.kind === "contract_clause") {
      expect(r.excerpt).toContain("agreement")
      expect(r.clauseType).toBe("other")
      expect(r.booleanValue?.confidence).toBe("low")
    }
    expect(doc.warnings).not.toContain(WORD_NO_STRUCTURED_WARNING)
  })

  it("paragraph with visit language yields visit_schedule", () => {
    const doc = parseWord({
      rawText: "Screening Visit will include labs and ECG.",
    })
    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("visit_schedule")
    if (r.kind === "visit_schedule") {
      expect(r.visitName).toContain("Screening")
      expect(r.visitNumber?.confidence).toBe("low")
    }
  })

  it("paragraph with payment and currency yields budget_line", () => {
    const doc = parseWord({
      rawText: "Site will receive a fee of $125 per completed visit.",
    })
    expect(doc.records).toHaveLength(1)
    const r = doc.records[0]!
    expect(r.kind).toBe("budget_line")
    if (r.kind === "budget_line") {
      expect(r.expectedAmount?.value).toBe(125)
      expect(r.expectedAmount?.confidence).toBe("low")
    }
  })

  it("no recognizable content: no records and structured-data warning", () => {
    const doc = parseWord({ rawText: "hello world\nfoo bar" })
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain(WORD_LIMITED_WARNING)
    expect(doc.warnings).toContain(WORD_NO_STRUCTURED_WARNING)
  })
})
