/**
 * STEP 83 — Sponsor/site-facing revenue report payload from pipeline outputs (deterministic).
 */

export type RevenueReportTopActionInput = {
  id?: string
  type?: string
  title?: string
  estimatedValue?: number
  priorityScore?: number
  studyId?: string
  subjectId?: string
  visitName?: string
  lineCode?: string
  eventLogId?: string
}

export type RevenueReportInput = {
  dashboard: {
    data: {
      totalRevenueCaptured: number
      totalRevenueAtRisk: number
      protectionScore: number
      topActions: RevenueReportTopActionInput[]
    }
    summary: {
      captured: number
      atRisk: number
      score: number
    }
    warnings: string[]
  }
  leakage: {
    summary: {
      totalItems: number
      totalValue: number
    }
    warnings: string[]
  }
  invoices: {
    summary: {
      totalPackages: number
      totalAmount: number
    }
    warnings: string[]
  }
}

export type RevenueReportTopFinding = {
  rank: number
  title: string
  estimatedValue: number
  trace: {
    studyId: string | null
    subjectId: string | null
    visitName: string | null
    lineCode: string | null
    eventLogId: string | null
  }
}

export type RevenueReportResult = {
  data: {
    headline: string
    totalRevenueCaptured: number
    totalRevenueAtRisk: number
    totalRevenueOpportunity: number
    revenueProtectionScore: number
    recoveryRate: number
    totalInvoicePackages: number
    leakageItems: number
    topFindings: RevenueReportTopFinding[]
  }
  summary: {
    captured: number
    atRisk: number
    score: number
    totalOpportunity: number
    recoveryRate: number
  }
  warnings: string[]
}

export function buildRevenueReport({
  dashboard,
  leakage,
  invoices,
}: RevenueReportInput): RevenueReportResult {
  const captured = invoices.summary.totalAmount || 0
  const atRisk = leakage.summary.totalValue || 0
  const score = dashboard.summary.score || 0
  const totalOpportunity = captured + atRisk

  const topFindings = dashboard.data.topActions.slice(0, 5).map((a, index) => ({
    rank: index + 1,
    title: a.title || a.type || "Revenue action",
    estimatedValue: a.estimatedValue || a.priorityScore || 0,
    trace: {
      studyId: a.studyId || null,
      subjectId: a.subjectId || null,
      visitName: a.visitName || null,
      lineCode: a.lineCode || null,
      eventLogId: a.eventLogId || null,
    },
  }))

  const recoveryRate =
    totalOpportunity === 0
      ? 100
      : Math.round((captured / totalOpportunity) * 100)

  return {
    data: {
      headline: `Recovered revenue visibility: $${captured} captured, $${atRisk} at risk`,
      totalRevenueCaptured: captured,
      totalRevenueAtRisk: atRisk,
      totalRevenueOpportunity: totalOpportunity,
      revenueProtectionScore: score,
      recoveryRate,
      totalInvoicePackages: invoices.summary.totalPackages || 0,
      leakageItems: leakage.summary.totalItems || 0,
      topFindings,
    },
    summary: {
      captured,
      atRisk,
      score,
      totalOpportunity,
      recoveryRate,
    },
    warnings: [
      ...dashboard.warnings,
      ...leakage.warnings,
      ...invoices.warnings,
    ],
  }
}
