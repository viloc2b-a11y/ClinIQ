import { describe, expect, it } from "vitest"

import { runManualReviewPipeline } from "./run-manual-review-pipeline"

describe("STEP 88 — Manual review pipeline", () => {
  it("does not queue accepted strong excel parse", () => {
    const result = runManualReviewPipeline({
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

    expect(result.summary.accepted).toBe(true)
    expect(result.summary.shouldQueue).toBe(false)
  })

  it("queues weak pdf parse for manual review", () => {
    const result = runManualReviewPipeline({
      sourceType: "pdf",
      fileName: "misc_notes.pdf",
      pdfPages: [
        { text: "random notes with little structure and no clear fee schedule" },
      ],
    })

    expect(result.summary.shouldQueue).toBe(true)
    expect(
      result.summary.priority === "high" || result.summary.priority === "medium",
    ).toBe(true)
  })

  it("queues rejected unknown source", () => {
    const result = runManualReviewPipeline({
      sourceType: "unknown",
      fileName: "binary.dat",
    })

    expect(result.summary.shouldQueue).toBe(true)
    expect(result.data.reviewPayload.data.queueEntry?.status).toBe("pending")
  })
})
