import { describe, expect, it } from "vitest"

import { runDocumentToExecutionOrchestrator } from "./run-document-to-execution-orchestrator"

describe("STEP 93 — Document-to-execution orchestrator", () => {
  it("runs accepted excel document through execution orchestration", () => {
    const result = runDocumentToExecutionOrchestrator({
      sourceType: "excel",
      fileName: "study_soa.xlsx",
      workbook: {
        Sheet1: [
          ["Visit", "Procedure", "Fee"],
          ["Screening", "CBC", "125"],
          ["Baseline", "ECG", "300"],
        ],
      },
    })

    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
    expect(result.summary.executionReady).toBe(true)
    expect(result.summary.totalActionSeeds).toBeGreaterThan(0)
  })

  it("runs manual correction path when initial parse is not accepted", () => {
    const result = runDocumentToExecutionOrchestrator({
      sourceType: "excel",
      fileName: "soa_needs_fix.xlsx",
      workbook: {
        Sheet1: [
          ["Visit", "Procedure", "Fee"],
          ["", "CBC", ""],
        ],
      },
      humanResolutionPayload: {
        reviewId: "review-excel-manual_review_required-soa",
        fileName: "soa_needs_fix.xlsx",
        sourceType: "excel",
        corrections: [
          {
            recordIndex: 0,
            recordType: "soa_activity",
            fieldName: "visitName",
            originalValue: null,
            correctedValue: "Screening",
            decision: "approve",
          },
          {
            recordIndex: 0,
            recordType: "soa_activity",
            fieldName: "unitPrice",
            originalValue: null,
            correctedValue: "125",
            decision: "approve",
          },
        ],
      },
    })

    expect(result.data.humanResolution).not.toBeNull()
    expect(
      result.summary.reentryStatus === "accepted" ||
        result.summary.reentryStatus === "accepted_with_warnings",
    ).toBe(true)
  })

  it("stays blocked when no accepted or corrected reentry exists", () => {
    const result = runDocumentToExecutionOrchestrator({
      sourceType: "unknown",
      fileName: "x.bin",
    })

    expect(result.summary.status).toBe("blocked")
    expect(result.summary.executionReady).toBe(false)
  })
})
