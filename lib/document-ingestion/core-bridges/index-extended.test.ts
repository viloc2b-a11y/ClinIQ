import { describe, expect, it } from "vitest"

import type { CoreSoaImportRow } from "./to-core-soa-import-rows"
import type { DraftRevenueReviewEventRow } from "./to-draft-event-log-rows"
import * as bridges from "./index"

const REQUIRED_EXPORTS = [
  "toCoreSoaImportRows",
  "toCoreBudgetReviewRows",
  "toCoreInvoiceReviewRows",
  "runCoreBridgePackage",
  "toCoreSoaIntakePayload",
  "toCoreBudgetReviewPayload",
  "toCoreInvoiceReviewPayload",
  "runCorePayloadPackage",
  "toCoreSoaStructuredInput",
  "classifyCoreSoaActivities",
  "buildInitialExpectedBillables",
  "runSoaToExpectedBillables",
  "toRevenueProtectionExpectedRows",
  "runSoaRevenueProtectionReview",
  "toDraftEventLogRows",
  "toEventLogSchemaCandidate",
  "toEventStoreWriteInput",
  "toEventStoreHandoffPayload",
  "toEventStoreBoundaryInput",
  "validateEventStoreBoundary",
  "runEventStoreDryWrite",
  "runEventStoreControlledWrite",
  "verifyActionCenterWrite",
  "runSoaReviewToDraftEvents",
  "runSoaReviewToEventStoreWriteInput",
] as const

describe("core-bridges index (Step 43)", () => {
  it("exports all stable pipeline entry points", () => {
    for (const name of REQUIRED_EXPORTS) {
      expect(bridges).toHaveProperty(name)
      const fn = (bridges as Record<string, unknown>)[name]
      expect(typeof fn).toBe("function")
    }
  })

  it("import-from-index: thin path intake → structured → expected billables → revenue expected rows", async () => {
    const oneRow: CoreSoaImportRow = {
      sourceRecordIndex: 0,
      visitName: "V1",
      activityName: "A1",
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
      notes: null,
      confidence: "high",
      importStatus: "ready",
      importWarnings: [],
    }

    const intake = bridges.toCoreSoaIntakePayload({
      documentId: "idx-test-doc",
      rows: [oneRow],
    })
    const structured = bridges.toCoreSoaStructuredInput({
      documentId: intake.documentId,
      rows: intake.rows,
    })
    const soaResult = await bridges.runSoaToExpectedBillables({
      documentId: structured.documentId,
      activities: structured.activities,
    })
    const expected = bridges.toRevenueProtectionExpectedRows({
      documentId: soaResult.expectedBillables.documentId,
      rows: soaResult.expectedBillables.rows,
    })

    expect(intake.summary.totalRows).toBe(1)
    expect(structured.summary.totalActivities).toBeGreaterThan(0)
    expect(soaResult.summary.expectedBillableCount).toBeGreaterThan(0)
    expect(expected.expectedRows.length).toBeGreaterThan(0)
  })

  it("import-from-index: draft row → event candidate → event-store write-input", () => {
    const draft: DraftRevenueReviewEventRow = {
      draftEventId: "draft-event::test::1",
      eventType: "revenue_review_action",
      eventStatus: "open",
      actionId: "test::1",
      actionType: "review_missing_invoice",
      priority: 1,
      severity: "high",
      title: "T",
      description: "D",
      matchKey: "k::v",
      expectedIndex: 0,
      invoiceIndex: null,
      sourceSignalType: "missing_invoice",
      reasons: ["r"],
    }

    const candidates = bridges.toEventLogSchemaCandidate({
      documentId: "d1",
      rows: [draft],
    })
    const write = bridges.toEventStoreWriteInput({
      documentId: "d1",
      rows: candidates.rows,
    })

    expect(write.rows).toHaveLength(1)
    expect(write.rows[0].clientEventId).toBe(`write-input::${candidates.rows[0].eventId}`)
    expect(write.rows[0].eventType).toBe("revenue_review_action")
    expect(write.rows[0].matchKey).toBe("k::v")
  })
})
