import { describe, expect, it } from "vitest"

import {
  buildInitialExpectedBillables,
  classifyCoreSoaActivities,
  runCoreBridgePackage,
  runCorePayloadPackage,
  runSoaReviewToDraftEvents,
  runSoaRevenueProtectionReview,
  toDraftEventLogRows,
  toEventLogSchemaCandidate,
  runSoaToExpectedBillables,
  toRevenueProtectionExpectedRows,
  toCoreBudgetReviewPayload,
  toCoreBudgetReviewRows,
  toCoreInvoiceReviewPayload,
  toCoreInvoiceReviewRows,
  toCoreSoaImportRows,
  toCoreSoaIntakePayload,
  toCoreSoaStructuredInput,
} from "./index"

describe("core-bridges index exports", () => {
  it("exports public bridge functions", () => {
    expect(typeof toCoreSoaImportRows).toBe("function")
    expect(typeof toCoreBudgetReviewRows).toBe("function")
    expect(typeof toCoreInvoiceReviewRows).toBe("function")
    expect(typeof runCoreBridgePackage).toBe("function")
    expect(typeof toCoreSoaIntakePayload).toBe("function")
    expect(typeof toCoreBudgetReviewPayload).toBe("function")
    expect(typeof toCoreInvoiceReviewPayload).toBe("function")
    expect(typeof runCorePayloadPackage).toBe("function")
    expect(typeof toCoreSoaStructuredInput).toBe("function")
    expect(typeof classifyCoreSoaActivities).toBe("function")
    expect(typeof buildInitialExpectedBillables).toBe("function")
    expect(typeof runSoaToExpectedBillables).toBe("function")
    expect(typeof toRevenueProtectionExpectedRows).toBe("function")
    expect(typeof runSoaRevenueProtectionReview).toBe("function")
    expect(typeof runSoaReviewToDraftEvents).toBe("function")
    expect(typeof toDraftEventLogRows).toBe("function")
    expect(typeof toEventLogSchemaCandidate).toBe("function")
  })

  it("importing from index runs package orchestrator with mixed mock input", async () => {
    const pkg = await runCoreBridgePackage({
      documentId: "idx-test",
      preSoaRows: [
        {
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "A",
          quantity: 1,
          unitPrice: 1,
          totalPrice: 1,
          notes: null,
          confidence: "high",
          needsReview: false,
          reviewReasons: [],
        },
      ],
      preBudgetRows: [
        {
          sourceRecordIndex: 0,
          activityName: "B",
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          notes: null,
          confidence: "high",
          needsReview: false,
          reviewReasons: [],
          flags: { missingPricing: false, inconsistentTotals: false },
        },
      ],
      preInvoiceRows: [
        {
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "C",
          quantity: 1,
          unitPrice: 5,
          totalPrice: 5,
          notes: null,
          confidence: "high",
          needsReview: false,
          reviewReasons: [],
          flags: {
            missingVisit: false,
            missingActivity: false,
            missingPricing: false,
            inconsistentTotals: false,
          },
        },
      ],
    })
    expect(pkg.soaImport).toBeTruthy()
    expect(pkg.budgetReview).toBeTruthy()
    expect(pkg.invoiceReview).toBeTruthy()
    expect(pkg.summary.totalRows).toBeGreaterThanOrEqual(0)
    expect(pkg.summary.totalRows).toBe(3)
  })
})
