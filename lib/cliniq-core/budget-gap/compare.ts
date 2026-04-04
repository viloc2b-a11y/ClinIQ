import { isCriticalInvoiceableCategory } from "./critical-invoiceables"
import { budgetLineMatchKey } from "./normalize"
import type {
  BudgetGapLine,
  BudgetGapSummary,
  CompareBudgetInput,
  CompareBudgetResult,
  GapStatus,
  MissingInvoiceable,
  SponsorBudgetLine,
} from "./types"

function groupByKey<T>(items: T[], keyFn: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const item of items) {
    const k = keyFn(item)
    const arr = m.get(k)
    if (arr) arr.push(item)
    else m.set(k, [item])
  }
  return m
}

function aggregateSponsorOffers(lines: SponsorBudgetLine[]): {
  quantity: number
  sponsorTotalOffer: number
  sponsorUnitOffer: number
} {
  const sponsorTotalOffer = lines.reduce((s, l) => s + l.sponsorTotalOffer, 0)
  const quantity = lines.reduce((s, l) => s + l.quantity, 0)
  const sponsorUnitOffer =
    quantity > 0
      ? sponsorTotalOffer / quantity
      : lines[0]?.sponsorUnitOffer ?? 0
  return { quantity, sponsorTotalOffer, sponsorUnitOffer }
}

function classifyGapStatus(params: {
  internalTotal: number
  gapAmount: number
  sponsorMatched: boolean
  critical: boolean
}): GapStatus {
  const { internalTotal, gapAmount, sponsorMatched, critical } = params
  if (critical && !sponsorMatched) return "missing"
  if (gapAmount < 0) return "loss"
  if (internalTotal <= 0) return gapAmount > 0 ? "profitable" : "breakeven"
  const margin = gapAmount / internalTotal
  if (margin >= 0.1) return "profitable"
  return "breakeven"
}

function gapPercent(internalTotal: number, gapAmount: number): number {
  if (internalTotal === 0) return gapAmount === 0 ? 0 : gapAmount > 0 ? 1 : -1
  return gapAmount / internalTotal
}

function buildSummary(params: {
  gapLines: BudgetGapLine[]
  missingInvoiceables: MissingInvoiceable[]
  studyMeta: CompareBudgetInput["studyMeta"]
}): BudgetGapSummary {
  const { gapLines, missingInvoiceables, studyMeta } = params
  const totalInternalRevenue = gapLines.reduce((s, l) => s + l.internalTotal, 0)
  const totalSponsorRevenue = gapLines.reduce((s, l) => s + l.sponsorTotalOffer, 0)
  const totalGap = totalSponsorRevenue - totalInternalRevenue

  const patients = studyMeta.patientsInBudget
  const totalGapPerPatient =
    patients !== undefined && patients > 0 ? totalGap / patients : null

  const planned = studyMeta.plannedEnrollment
  const projectedStudyGap =
    patients !== undefined && patients > 0 && planned !== undefined && planned > 0
      ? (totalGap / patients) * planned
      : null

  const recommendedRevenueTargetAt20Margin = totalInternalRevenue * 1.2

  const lossLineCount = gapLines.filter((l) => l.status === "loss").length
  const negativeCashFlowRisk =
    totalGap < -0.01 ||
    missingInvoiceables.length > 0 ||
    lossLineCount >= Math.ceil(gapLines.length * 0.35)

  const primaryAlerts: string[] = []
  if (missingInvoiceables.length > 0) {
    primaryAlerts.push(
      `${missingInvoiceables.length} critical invoiceable line(s) have no sponsor offer — revenue is at risk.`,
    )
  }
  if (totalGap < -0.01) {
    primaryAlerts.push(
      `Sponsor offer is $${Math.abs(totalGap).toLocaleString(undefined, { maximumFractionDigits: 0 })} below internal cost for this scope.`,
    )
  } else if (totalGap >= 0 && totalInternalRevenue > 0) {
    const m = totalGap / totalInternalRevenue
    if (m < 0.1) {
      primaryAlerts.push(
        `Blended margin is ${(m * 100).toFixed(1)}% — below the 10% profitability band on compared lines.`,
      )
    }
  }
  if (lossLineCount > 0) {
    primaryAlerts.push(`${lossLineCount} budget line(s) are underwater vs internal cost.`)
  }
  if (primaryAlerts.length === 0) {
    primaryAlerts.push("No major structural alerts on compared lines.")
  }

  return {
    totalInternalRevenue,
    totalSponsorRevenue,
    totalGap,
    totalGapPerPatient,
    projectedStudyGap,
    recommendedRevenueTargetAt20Margin,
    negativeCashFlowRisk,
    primaryAlerts,
  }
}

export function compareSponsorBudgetToInternalBudget(
  input: CompareBudgetInput,
): CompareBudgetResult {
  const { internalLines, sponsorLines, studyMeta } = input

  const sponsorByKey = groupByKey(sponsorLines, (l) => budgetLineMatchKey(l))
  const internalByKey = groupByKey(internalLines, (l) => budgetLineMatchKey(l))

  const sponsorTotalsByKey = new Map<string, number>()
  for (const [key, arr] of sponsorByKey) {
    sponsorTotalsByKey.set(key, aggregateSponsorOffers(arr).sponsorTotalOffer)
  }

  const gapLines: BudgetGapLine[] = []
  const missingInvoiceables: MissingInvoiceable[] = []

  for (const internal of internalLines) {
    const key = budgetLineMatchKey(internal)
    const bucket = internalByKey.get(key) ?? [internal]
    const bucketInternalTotal = bucket.reduce((s, l) => s + l.internalTotal, 0)
    const sponsorPool = sponsorTotalsByKey.get(key) ?? 0
    const sponsorAllocated =
      bucketInternalTotal > 0
        ? sponsorPool * (internal.internalTotal / bucketInternalTotal)
        : sponsorPool / bucket.length

    const sponsorMatched = (sponsorByKey.get(key)?.length ?? 0) > 0
    const agg = sponsorByKey.get(key)
    const { sponsorUnitOffer } = agg
      ? aggregateSponsorOffers(agg)
      : { sponsorUnitOffer: 0 }

    const sponsorUnitForRow =
      internal.quantity > 0
        ? sponsorAllocated / internal.quantity
        : sponsorUnitOffer

    const gapAmount = sponsorAllocated - internal.internalTotal
    const critical = isCriticalInvoiceableCategory(internal.category)
    const status = classifyGapStatus({
      internalTotal: internal.internalTotal,
      gapAmount,
      sponsorMatched,
      critical,
    })

    const notes =
      internal.notes ||
      (!sponsorMatched
        ? critical
          ? "No matching sponsor line for a critical invoiceable category."
          : "No matching sponsor line for this internal activity."
        : "")

    const line: BudgetGapLine = {
      id: `gap-${internal.id}`,
      category: internal.category,
      lineCode: internal.lineCode,
      label: internal.label,
      visitName: internal.visitName,
      quantity: internal.quantity,
      unit: internal.unit,
      internalUnitCost: internal.internalUnitCost,
      internalTotal: internal.internalTotal,
      sponsorUnitOffer: sponsorUnitForRow,
      sponsorTotalOffer: sponsorAllocated,
      gapAmount,
      gapPercent: gapPercent(internal.internalTotal, gapAmount),
      status,
      notes,
      source: "merged",
    }
    gapLines.push(line)

    if (critical && !sponsorMatched) {
      const mi: MissingInvoiceable = {
        id: `missing-${internal.id}`,
        category: internal.category,
        lineCode: internal.lineCode,
        label: internal.label,
        visitName: internal.visitName,
        quantity: internal.quantity,
        unit: internal.unit,
        internalUnitCost: internal.internalUnitCost,
        internalTotal: internal.internalTotal,
        gapAmount,
        gapPercent: gapPercent(internal.internalTotal, gapAmount),
        status: "missing",
        notes:
          "Sponsor budget omits this critical invoiceable; negotiate an explicit line item.",
        source: "derived",
      }
      missingInvoiceables.push(mi)
    }
  }

  const internalKeys = new Set(internalLines.map((l) => budgetLineMatchKey(l)))
  const unmatchedSponsorKeys: string[] = []
  for (const key of sponsorByKey.keys()) {
    if (!internalKeys.has(key)) unmatchedSponsorKeys.push(key)
  }

  const summary = buildSummary({
    gapLines,
    missingInvoiceables,
    studyMeta,
  })

  if (unmatchedSponsorKeys.length > 0) {
    summary.primaryAlerts.unshift(
      `${unmatchedSponsorKeys.length} sponsor line(s) did not match any internal budget row (check labels/visits/categories).`,
    )
  }

  return { gapLines, missingInvoiceables, summary }
}
