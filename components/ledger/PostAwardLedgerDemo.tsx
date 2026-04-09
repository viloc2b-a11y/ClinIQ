import {
  mockPostAwardEventLogs,
  mockPostAwardInternalLines,
  mockPostAwardStudyId,
} from "@/features/post-award-ledger/mock-study"
import {
  buildLedger,
  detectRevenueLeakage,
  generateBillablesFromEvent,
  generateExpectedBillablesFromBudget,
} from "@/lib/cliniq-core/post-award-ledger"

export default function PostAwardLedgerDemo() {
  const expected = generateExpectedBillablesFromBudget(mockPostAwardInternalLines, {
    studyId: mockPostAwardStudyId,
  })
  const billableInstances = mockPostAwardEventLogs
    .map((ev) => generateBillablesFromEvent(ev, expected))
    .filter((b): b is NonNullable<typeof b> => b !== null)
  const ledger = buildLedger(expected, billableInstances)
  const leakage = detectRevenueLeakage(ledger)

  const payload = {
    studyId: mockPostAwardStudyId,
    expectedBillableCount: expected.length,
    eventCount: mockPostAwardEventLogs.length,
    billableInstanceCount: billableInstances.length,
    expectedVsActual: ledger.map((row) => ({
      lineCode: row.lineCode,
      label: row.label,
      expectedRevenue: row.expectedRevenue,
      actualRevenue: row.actualRevenue,
      variance: row.variance,
      status: row.status,
      billableEvents: row.matchedBillableCount,
    })),
    leakageReport: {
      totalExpectedRevenue: leakage.totalExpectedRevenue,
      totalActualRevenue: leakage.totalActualRevenue,
      leakageAmount: leakage.leakageAmount,
      overageAmount: leakage.overageAmount,
      fullyMissingLineCodes: leakage.fullyMissingBillables.map((e) => e.lineCode),
      partialLineCodes: leakage.partialBillables.map((e) => e.lineCode),
    },
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-16 font-mono text-sm sm:px-6">
      <header className="space-y-2 border-b border-border/60 pb-6 font-sans">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Finance · Post-award ledger
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ledger demo</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Mock budget → expected billables; mock events → billable instances; ledger + leakage
          (no external systems).
        </p>
      </header>
      <section className="space-y-2">
        <h2 className="font-sans font-medium text-foreground text-xs uppercase tracking-wide">
          Summary
        </h2>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed">
          {JSON.stringify(payload.leakageReport, null, 2)}
        </pre>
      </section>
      <section className="space-y-2">
        <h2 className="font-sans font-medium text-foreground text-xs uppercase tracking-wide">
          Ledger (expected vs actual)
        </h2>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed">
          {JSON.stringify(payload.expectedVsActual, null, 2)}
        </pre>
      </section>
    </main>
  )
}
