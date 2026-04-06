import { describe, expect, it } from "vitest"

import { runFixtureCanonicalDemo } from "./run-fixture-canonical-demo"

describe("runFixtureCanonicalDemo", () => {
  it("runs canonical demo from internal fixture", () => {
    const result = runFixtureCanonicalDemo({
      type: "excel_simple_budget",
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

    expect(result.summary.found).toBe(true)
    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
  })
})
