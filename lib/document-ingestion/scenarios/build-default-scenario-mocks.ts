export function buildDefaultScenarioMocks() {
  return {
    persistActionCenterItems: ({ items }: { items: unknown[] }) => ({
      persisted: items,
      summary: { total: Array.isArray(items) ? items.length : 0 },
      warnings: [],
    }),
    verifyPersistedItems: ({ expectedIds }: { expectedIds: string[] }) => ({
      found: expectedIds.length,
      missing: [],
      matched: expectedIds,
      totalExpected: expectedIds.length,
    }),
    runRecordsStage: ({ recordsInput }: { recordsInput: unknown[] }) => ({
      data: { records: recordsInput },
      summary: { totalRecords: Array.isArray(recordsInput) ? recordsInput.length : 0 },
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
    buildClaimItemsFromRecords: ({ records }: { records: unknown[] }) => ({
      claimItems: records,
      summary: { total: Array.isArray(records) ? records.length : 0 },
      warnings: [],
    }),
    buildInvoicePackages: ({ claimItems }: { claimItems: unknown[] }) => ({
      invoicePackages: claimItems,
      summary: { total: Array.isArray(claimItems) ? claimItems.length : 0 },
      warnings: [],
    }),
    computeRevenueLeakage: ({ actionItems }: { actionItems: unknown[] }) => ({
      leakageItems: actionItems,
      summary: { total: Array.isArray(actionItems) ? actionItems.length : 0 },
      warnings: [],
    }),
    computeRevenueProtectionScore: () => ({
      score: 80,
      summary: { score: 80 },
      warnings: [],
    }),
    prioritizeRevenueActions: ({ actionItems }: { actionItems: unknown[] }) => ({
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
  }
}
