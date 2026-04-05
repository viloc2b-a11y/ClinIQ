/**
 * Step 12 — {@link runPreSoaIntake} wires parse → handoff → bridge → pre-SoA.
 */
import { describe, expect, it } from "vitest"

import { runPreSoaIntake } from "./run-pre-soa-intake"

describe("runPreSoaIntake", () => {
  it("Excel happy path end-to-end", async () => {
    const out = await runPreSoaIntake({
      fileName: "soa.xlsx",
      rows: [
        { Visit: "Screening", Procedure: "Consent", Quantity: "1", Fee: "$0" },
        { Visit: "Day 1", Procedure: "Physical Exam", Quantity: "1", Fee: "$125.00" },
      ],
    })
    expect(out.parsedDocument.records.length).toBeGreaterThan(0)
    expect(out.handoff.summary.totalRecords).toBeGreaterThan(0)
    expect(out.bridge.soaCandidates.length).toBeGreaterThan(0)
    expect(out.preSoa.rows.length).toBeGreaterThan(0)
  })

  it("Excel rows needing review: blank visit + unparseable fee", async () => {
    const out = await runPreSoaIntake({
      fileName: "soa.xlsx",
      rows: [{ Visit: "", Procedure: "ECG", Fee: "TBD" }],
    })
    expect(out.preSoa.rows[0]!.needsReview).toBe(true)
    expect(out.preSoa.rows[0]!.reviewReasons.length).toBeGreaterThan(0)
  })

  it("unsupported file type: empty records, warnings, zero bridge SoA, empty pre-SoA", async () => {
    const out = await runPreSoaIntake({ fileName: "data.bin" })
    expect(out.parsedDocument.records).toEqual([])
    expect(out.parsedDocument.warnings.length).toBeGreaterThan(0)
    expect(out.bridge.summary.totalMappedCandidates).toBe(0)
    expect(out.bridge.soaCandidates).toHaveLength(0)
    expect(out.preSoa.rows).toEqual([])
    expect(out.preSoa.warnings).toContain("No SoA activity candidates were provided.")
  })

  it("PDF input: returns all layers without throwing", async () => {
    const out = await runPreSoaIntake({
      fileName: "contract.pdf",
      rawText: "Visit Schedule\nDay 1 Visit",
    })
    expect(out.parsedDocument).toBeTruthy()
    expect(out.handoff).toBeTruthy()
    expect(out.bridge).toBeTruthy()
    expect(out.preSoa).toBeTruthy()
    expect(Array.isArray(out.preSoa.rows)).toBe(true)
  })
})
