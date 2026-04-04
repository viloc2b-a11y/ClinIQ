import { isCriticalInvoiceableCategory } from "./critical-invoiceables"
import { budgetLineMatchKey } from "./normalize"
import type {
  BudgetGapLine,
  BudgetGapSummary,
  CompareBudgetInput,
  CompareBudgetResult,
  GapStatus,
  MissingInvoiceable,
  SiteNegotiationVariables,
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

function keySet(keys?: string[]): Set<string> {
  return new Set(keys ?? [])
}

function formatCoordinatorNotes(notes?: string[]): string {
  if (!notes?.length) return ""
  return `Coordinator notes: ${notes.join(" | ")}`
}

function appendCoordinatorToNotes(base: string, coordinatorNotes?: string[]): string {
  const c = formatCoordinatorNotes(coordinatorNotes)
  if (!c) return base
  return base ? `${base} | ${c}` : c
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

/** When `siteNegotiationVariables` is provided (including `{}`). */
function classifyGapStatusWithPolicy(params: {
  key: string
  internalTotal: number
  gapAmount: number
  sponsorMatched: boolean
  critical: boolean
  policy: SiteNegotiationVariables
}): GapStatus {
  const { key, internalTotal, gapAmount, sponsorMatched, critical, policy } = params
  const internalOnly = keySet(policy.internal_only_keys)
  const required = keySet(policy.required_match_keys)
  const minRatio = (policy.min_acceptable_margin_percent ?? 10) / 100

  if (internalOnly.has(key) && !sponsorMatched) return "internal_only"
  if (required.has(key) && !sponsorMatched) return "missing"
  if (critical && !sponsorMatched) return "missing"
  if (sponsorMatched) {
    if (internalTotal > 0) {
      const margin = gapAmount / internalTotal
      return margin >= minRatio ? "present" : "undervalued"
    }
    return gapAmount >= 0 ? "present" : "undervalued"
  }
  return "undervalued"
}

function buildPricingRuleOnlyGapLine(
  key: string,
  lines: SponsorBudgetLine[],
  coordinatorNotes?: string[],
): BudgetGapLine {
  const agg = aggregateSponsorOffers(lines)
  const first = lines[0]!
  const idSlug = key.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80)
  const base =
    "Unmatched sponsor line; classified as pricing_rule_only per site policy (ignored in unmatched alert)."
  return {
    id: `gap-pricing-rule-${idSlug}`,
    category: first.category,
    lineCode: first.lineCode,
    label: first.label,
    visitName: first.visitName,
    quantity: agg.quantity,
    unit: first.unit,
    internalUnitCost: 0,
    internalTotal: 0,
    sponsorUnitOffer: agg.sponsorUnitOffer,
    sponsorTotalOffer: agg.sponsorTotalOffer,
    gapAmount: agg.sponsorTotalOffer,
    gapPercent: 1,
    status: "pricing_rule_only",
    notes: appendCoordinatorToNotes(base, coordinatorNotes),
    source: "derived",
  }
}

function gapPercent(internalTotal: number, gapAmount: number): number {
  if (internalTotal === 0) return gapAmount === 0 ? 0 : gapAmount > 0 ? 1 : -1
  return gapAmount / internalTotal
}

function buildSummary(params: {
  gapLines: BudgetGapLine[]
  missingInvoiceables: MissingInvoiceable[]
  studyMeta: CompareBudgetInput["studyMeta"]
  coordinatorNotes?: string[]
  /** Profitability band percent (e.g. 10); defaults to 10 for blended-margin alert. */
  minAcceptableMarginPercent?: number
}): BudgetGapSummary {
  const { gapLines, missingInvoiceables, studyMeta } = params
  const bandPct = params.minAcceptableMarginPercent ?? 10
  const bandRatio = bandPct / 100

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

  const underwaterCount = gapLines.filter(
    (l) => l.status === "loss" || l.status === "undervalued",
  ).length
  const negativeCashFlowRisk =
    totalGap < -0.01 ||
    missingInvoiceables.length > 0 ||
    underwaterCount >= Math.ceil(gapLines.length * 0.35)

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
    if (m < bandRatio) {
      primaryAlerts.push(
        `Blended margin is ${(m * 100).toFixed(1)}% — below the ${bandPct}% profitability band on compared lines.`,
      )
    }
  }
  if (underwaterCount > 0) {
    primaryAlerts.push(
      `${underwaterCount} budget line(s) are underwater vs internal cost.`,
    )
  }
  if (primaryAlerts.length === 0) {
    primaryAlerts.push("No major structural alerts on compared lines.")
  }

  if (params.coordinatorNotes?.length) {
    for (const n of params.coordinatorNotes) {
      primaryAlerts.push(`Coordinator: ${n}`)
    }
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
  const { internalLines, sponsorLines, studyMeta, siteNegotiationVariables: policy } =
    input

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

    const internalOnlySet = policy ? keySet(policy.internal_only_keys) : null
    const isInternalOnlyRow =
      Boolean(policy && internalOnlySet?.has(key) && !sponsorMatched)

    const status: GapStatus = policy
      ? classifyGapStatusWithPolicy({
          key,
          internalTotal: internal.internalTotal,
          gapAmount,
          sponsorMatched,
          critical,
          policy,
        })
      : classifyGapStatus({
          internalTotal: internal.internalTotal,
          gapAmount,
          sponsorMatched,
          critical,
        })

    let notes =
      internal.notes ||
      (!sponsorMatched
        ? critical
          ? "No matching sponsor line for a critical invoiceable category."
          : "No matching sponsor line for this internal activity."
        : "")

    if (policy && status === "internal_only") {
      notes =
        notes ||
        "Site policy: internal-only line; sponsor mirror not expected for this match key."
    }

    notes = appendCoordinatorToNotes(notes, policy?.coordinator_notes)

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

    const requiredSet = policy ? keySet(policy.required_match_keys) : null
    const shouldMissingInvoiceable =
      !sponsorMatched &&
      !isInternalOnlyRow &&
      (critical || (requiredSet?.has(key) ?? false))

    if (shouldMissingInvoiceable) {
      const miNotes = appendCoordinatorToNotes(
        critical
          ? "Sponsor budget omits this critical invoiceable; negotiate an explicit line item."
          : "Sponsor budget omits a required line per site policy; negotiate an explicit line item.",
        policy?.coordinator_notes,
      )
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
        notes: miNotes,
        source: "derived",
      }
      missingInvoiceables.push(mi)
    }
  }

  const internalKeys = new Set(internalLines.map((l) => budgetLineMatchKey(l)))
  const ignoreUnmatched = keySet(
    policy?.ignore_unmatched_sponsor_keys?.map((k) => k.trim()),
  )
  const unmatchedSponsorKeysForAlert: string[] = []

  for (const key of sponsorByKey.keys()) {
    if (internalKeys.has(key)) continue
    if (ignoreUnmatched.has(key)) {
      gapLines.push(
        buildPricingRuleOnlyGapLine(
          key,
          sponsorByKey.get(key)!,
          policy?.coordinator_notes,
        ),
      )
    } else {
      unmatchedSponsorKeysForAlert.push(key)
    }
  }

  const summary = buildSummary({
    gapLines,
    missingInvoiceables,
    studyMeta,
    coordinatorNotes: policy?.coordinator_notes,
    minAcceptableMarginPercent: policy
      ? (policy.min_acceptable_margin_percent ?? 10)
      : undefined,
  })

  if (unmatchedSponsorKeysForAlert.length > 0) {
    summary.primaryAlerts.unshift(
      `${unmatchedSponsorKeysForAlert.length} sponsor line(s) did not match any internal budget row (check labels/visits/categories).`,
    )
  }

  return { gapLines, missingInvoiceables, summary }
}
