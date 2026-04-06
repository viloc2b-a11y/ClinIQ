import type { ActionCenterItem } from "@/lib/cliniq-core/action-center/types"

import type { ExpectedVsActualLine } from "./merge-expected-actual"

export function missingBillablesToActionCenterItems(
  studyKey: string,
  missing: ExpectedVsActualLine[],
  visitByLine: Map<string, string>,
): ActionCenterItem[] {
  return missing.map((line) => {
    const gapRev = Math.max(0, line.revenue_gap)
    const visitName = visitByLine.get(line.line_code) ?? "—"
    return {
      id: `${studyKey}::${line.line_code}::missing_billable`,
      studyId: studyKey,
      subjectId: "_aggregate",
      visitName,
      lineCode: line.line_code,
      actionType: "missing_billable",
      ownerRole: "billing",
      priority: "high",
      status: "open",
      title: `Missing billable: ${line.line_code}`,
      description: `Expected revenue ${line.expected_revenue.toFixed(2)} vs actual ${line.actual_amount.toFixed(2)}; quantity gap ${line.quantity_gap}.`,
      expectedAmount: line.expected_revenue,
      invoicedAmount: line.actual_amount,
      missingAmount: gapRev,
      leakageStatus: "missing",
      leakageReason: "not_invoiced",
      metadata: { issue_type: "missing_billable", severity: "high" },
    }
  })
}
