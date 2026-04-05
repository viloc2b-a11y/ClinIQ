import { describe, expect, it } from "vitest"

import { runFullDocumentRevenueBridge } from "./run-full-document-revenue-bridge"

describe("STEP 100 — runFullDocumentRevenueBridge", () => {
  it("runs revenue bridge from excel document path", () => {
    const workbook = {
      Sheet1: [
        ["Visit", "Procedure", "Fee"],
        ["Screening", "CBC", "125"],
        ["Baseline", "ECG", "300"],
      ],
    }

    const result = runFullDocumentRevenueBridge({
      fileName: "budget.xlsx",
      workbook,
      persistActionCenterItems: ({ items }) => ({
        persisted: items,
        summary: { total: items.length },
        warnings: [],
      }),
      verifyPersistedItems: ({ expectedIds }) => ({
        found: expectedIds.length,
        missing: [],
        matched: expectedIds,
        totalExpected: expectedIds.length,
      }),
      runRecordsStage: ({ recordsInput }) => ({
        data: { records: recordsInput },
        summary: { totalRecords: recordsInput.length },
        warnings: [],
      }),
      runEnvelopesStage: () => ({
        data: { envelopes: [] },
        summary: { totalEnvelopes: 0 },
        warnings: [],
      }),
      runAuditStage: () => ({
        data: { audit: [] },
        summary: { totalAuditEntries: 0 },
        warnings: [],
      }),
      runMetricsStage: () => ({
        data: { metrics: {} },
        summary: { ok: true },
        warnings: [],
      }),
      runAdminSnapshotStage: () => ({
        data: {},
        summary: { ok: true },
        warnings: [],
      }),
      runHealthSnapshotStage: () => ({
        data: {},
        summary: { ok: true },
        warnings: [],
      }),
      buildClaimItemsFromRecords: ({ records }) => ({
        claimItems: records,
        summary: { total: Array.isArray(records) ? records.length : 0 },
        warnings: [],
      }),
      buildInvoicePackages: ({ claimItems }) => ({
        invoicePackages: claimItems,
        summary: { total: Array.isArray(claimItems) ? claimItems.length : 0 },
        warnings: [],
      }),
      computeRevenueLeakage: ({ actionItems }) => ({
        leakageItems: actionItems,
        summary: { total: Array.isArray(actionItems) ? actionItems.length : 0 },
        warnings: [],
      }),
      computeRevenueProtectionScore: () => ({
        score: 80,
        summary: { score: 80 },
        warnings: [],
      }),
      prioritizeRevenueActions: ({ actionItems }) => ({
        prioritizedActions: actionItems,
        summary: { total: Array.isArray(actionItems) ? actionItems.length : 0 },
        warnings: [],
      }),
      buildRevenueDashboardSnapshot: () => ({
        data: {},
        summary: { score: 80 },
        warnings: [],
      }),
      buildRevenueReport: () => ({
        data: {},
        summary: { score: 80 },
        warnings: [],
      }),
      buildRevenueExecutiveSummary: () => ({
        data: {},
        summary: { ok: true },
        warnings: [],
      }),
      buildRevenueEmail: () => ({
        data: {},
        summary: { ok: true },
        warnings: [],
      }),
      buildRevenuePdfPayload: () => ({
        data: {},
        summary: { ok: true },
        warnings: [],
      }),
      renderRevenueReportHtml: () => ({
        data: { html: "<html></html>" },
        summary: { ok: true },
        warnings: [],
      }),
      buildRevenueDashboardCards: () => ({
        data: { cards: [] },
        summary: { totalCards: 0 },
        warnings: [],
      }),
      buildSendReportPayload: () => ({
        data: { status: "draft" },
        summary: { status: "draft" },
        warnings: [],
      }),
      buildDemoOutputSurface: () => ({
        data: { hero: {}, cards: [], reportPreviewHtml: "", sendReport: {} },
        summary: { ok: true },
        warnings: [],
      }),
    })

    expect(result.summary.sourceType).toBe("excel")
    expect(result.summary.route).toBe("excel_hardened")
    expect(result.summary.revenueReady === true || result.summary.revenueReady === false).toBe(true)
  })
})
