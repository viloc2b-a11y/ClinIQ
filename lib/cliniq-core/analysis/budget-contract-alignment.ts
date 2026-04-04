/**
 * Deterministic budget vs contract financial alignment (no inference, no ML).
 */

export type BudgetContractAlignmentBudgetInput = {
  lineItems: { description: string; amount: number }[]
  paymentTerms?: string
  invoiceFrequency?: string
}

export type BudgetContractAlignmentContractInput = {
  paymentTerms?: string
  invoiceFrequency?: string
  redFlags: string[]
}

export type BudgetContractAlignmentInput = {
  budget: BudgetContractAlignmentBudgetInput
  contract: BudgetContractAlignmentContractInput
}

export type AlignmentIssueSeverity = "low" | "medium" | "high"

export type AlignmentIssue = {
  type: string
  severity: AlignmentIssueSeverity
  message: string
}

export type AlignmentRecommendationPriority = "high" | "medium" | "low"

export type AlignmentRecommendationImpact = "cash_flow" | "revenue" | "risk"

export type AlignmentRecommendationEstimatedImpact = {
  type: "cash_flow_delay"
  days: number
  estimatedValue?: number
}

export type AlignmentRecommendation = {
  action: string
  priority: AlignmentRecommendationPriority
  impact: AlignmentRecommendationImpact
  justification: string
  negotiationText: string
  estimatedImpact?: AlignmentRecommendationEstimatedImpact
}

export type BudgetContractAlignmentResult = {
  issues: AlignmentIssue[]
  recommendations: AlignmentRecommendation[]
  summary: {
    totalIssues: number
    criticalIssues: number
  }
}

function isPresent(s: string | undefined): boolean {
  return s !== undefined && s.trim().length > 0
}

/** Same day extraction semantics as documents extractors (deterministic). */
function parsePaymentDays(text: string): number | undefined {
  const lower = text.trim().toLowerCase()

  let m = lower.match(/\bnet\s+(\d+)(?:\s*days?)?\b/)
  if (m) return Number(m[1])

  m = lower.match(/\bpayment\s+within\s+(\d+)(?:\s*days?)?\b/)
  if (m) return Number(m[1])

  m = lower.match(/\bpayable\s+within\s+(\d+)(?:\s*days?)?\b/)
  if (m) return Number(m[1])

  return undefined
}

function normalizeComparableText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Known labels from budget + contract extractors → single key for comparison. */
function canonicalInvoiceFrequency(s: string): string {
  const x = normalizeComparableText(s)
  const table: Record<string, string> = {
    "at close-out": "close-out",
    "at closeout": "close-out",
    "close out": "close-out",
    closeout: "close-out",
    "close-out": "close-out",
  }
  return table[x] ?? x
}

function paymentTermsAligned(budgetTerms: string, contractTerms: string): boolean {
  const bDays = parsePaymentDays(budgetTerms)
  const cDays = parsePaymentDays(contractTerms)
  if (bDays !== undefined && cDays !== undefined) {
    return bDays === cDays
  }
  return normalizeComparableText(budgetTerms) === normalizeComparableText(contractTerms)
}

function severityRank(s: AlignmentIssueSeverity): number {
  if (s === "high") return 0
  if (s === "medium") return 1
  return 2
}

function issueKey(i: AlignmentIssue): string {
  return `${i.type}\x1e${i.severity}\x1e${i.message}`
}

function sortIssues(issues: AlignmentIssue[]): AlignmentIssue[] {
  return [...issues].sort((a, b) => {
    const rs = severityRank(a.severity) - severityRank(b.severity)
    if (rs !== 0) return rs
    const ts = a.type.localeCompare(b.type)
    if (ts !== 0) return ts
    return a.message.localeCompare(b.message)
  })
}

function recommendationPriorityRank(p: AlignmentRecommendationPriority): number {
  if (p === "high") return 0
  if (p === "medium") return 1
  return 2
}

function recommendationKey(r: AlignmentRecommendation): string {
  return `${r.action}\x1e${r.priority}\x1e${r.impact}\x1e${r.justification}\x1e${r.negotiationText}`
}

/** Budget invoice cadence as stated (trimmed); used only when budget frequency is known. */
function budgetInvoiceFrequencyPhrase(budget: BudgetContractAlignmentBudgetInput): string | undefined {
  const f = budget.invoiceFrequency?.trim()
  return f && f.length > 0 ? f : undefined
}

/** Sponsor-facing phrasing for payment alignment (deterministic; uses parsed net days when present). */
function paymentTermsTargetPhrase(budgetTermsTrimmed: string): string {
  const d = parsePaymentDays(budgetTermsTrimmed)
  if (d !== undefined) return `Net ${d} days`
  return budgetTermsTrimmed
}

function sortRecommendations(recs: AlignmentRecommendation[]): AlignmentRecommendation[] {
  return [...recs].sort((a, b) => {
    const pr = recommendationPriorityRank(a.priority) - recommendationPriorityRank(b.priority)
    if (pr !== 0) return pr
    return a.action.localeCompare(b.action)
  })
}

/**
 * Negotiation-ready actions derived from finalized issues and contract redFlags only
 * (no new inference beyond issue detection rules).
 */
function buildRecommendations(
  input: BudgetContractAlignmentInput,
  issues: AlignmentIssue[],
): AlignmentRecommendation[] {
  const { budget, contract } = input
  const issueTypes = new Set(issues.map((i) => i.type))
  const raw: AlignmentRecommendation[] = []

  if (issueTypes.has("payment_terms_mismatch")) {
    const b = budget.paymentTerms?.trim() ?? ""
    const c = contract.paymentTerms?.trim() ?? ""
    const bDays = parsePaymentDays(b)
    const cDays = parsePaymentDays(c)
    if (bDays !== undefined && cDays !== undefined && cDays > bDays) {
      const target = paymentTermsTargetPhrase(b)
      const delayDays = cDays - bDays
      const baseNegotiation = `We propose aligning payment terms to ${target} to ensure operational sustainability and consistent study execution.`
      let estimatedValue: number | undefined
      if (budget.lineItems.length > 0) {
        const totalBudgetValue = budget.lineItems.reduce((sum, item) => sum + item.amount, 0)
        const dailyValue = totalBudgetValue / 30
        estimatedValue = Math.round(dailyValue * delayDays)
      }
      const delayNarrative =
        estimatedValue !== undefined
          ? ` This represents an estimated ${delayDays}-day delay in cash flow, equivalent to approximately $${estimatedValue} in delayed revenue.`
          : ` This represents an estimated ${delayDays}-day delay in cash flow.`
      raw.push({
        action: `Negotiate payment terms from ${c} to ${b}`,
        priority: "high",
        impact: "cash_flow",
        justification:
          "Extended payment terms negatively impact site cash flow and operational sustainability.",
        negotiationText: `${baseNegotiation}${delayNarrative}`,
        estimatedImpact: {
          type: "cash_flow_delay",
          days: delayDays,
          ...(estimatedValue !== undefined ? { estimatedValue } : {}),
        },
      })
    }
  }

  if (issueTypes.has("missing_contract_payment_terms")) {
    raw.push({
      action: "Add explicit payment terms (e.g. Net 30)",
      priority: "high",
      impact: "cash_flow",
      justification:
        "Without stated payment terms, collection timing and cash planning lack a contractual baseline, which exposes the site to avoidable administrative delay and uncertainty.",
      negotiationText:
        "Please incorporate explicit payment terms (for example, Net 30) into the agreement so invoicing, accruals, and collections follow a single, enforceable schedule.",
    })
  }

  if (issueTypes.has("contract_red_flag_missing_payment_terms")) {
    raw.push({
      action: "Reconcile contract checklist: payment terms present but flagged as missing",
      priority: "high",
      impact: "risk",
      justification:
        "The contract text includes payment terms while the diligence checklist still marks payment terms as missing, which creates inconsistent records for finance and legal review.",
      negotiationText:
        "Our review shows executed payment terms in the agreement while the red-flag summary still lists payment terms as missing. Please update the contract exhibits and checklist so payment timing is unambiguous for all parties.",
    })
  }

  if (issueTypes.has("invoice_frequency_mismatch")) {
    const freq = budgetInvoiceFrequencyPhrase(budget) ?? "the agreed budget cadence"
    raw.push({
      action: `Align contract invoice frequency to the budget (${freq})`,
      priority: "medium",
      impact: "cash_flow",
      justification:
        "The contract's invoicing cadence does not match the finalized budget, which undermines predictable cash flow and study operations planning.",
      negotiationText: `We request that sponsor invoicing follow the cadence reflected in our agreed budget (${freq}) so site cash flow and study delivery remain aligned with the negotiated economics.`,
    })
  }

  if (issueTypes.has("missing_contract_invoice_frequency")) {
    const freq = budgetInvoiceFrequencyPhrase(budget)
    if (freq !== undefined) {
      raw.push({
        action: `Define contract invoice frequency to match budget (${freq})`,
        priority: "medium",
        impact: "cash_flow",
        justification:
          "The budget specifies an invoicing cadence, but the contract is silent, leaving billing timing without a contractual anchor.",
        negotiationText: `Please add contract language that invoices will be issued on the same cadence as the agreed budget (${freq}), so expectations are clear and consistently applied.`,
      })
    } else {
      raw.push({
        action: "Define invoice frequency (monthly recommended)",
        priority: "medium",
        impact: "cash_flow",
        justification:
          "Undefined invoicing cadence complicates forecasting and operational continuity planning.",
        negotiationText:
          "We recommend specifying invoice frequency (monthly, unless otherwise agreed) to support consistent cash flow and operational continuity.",
      })
    }
  }

  const sortedFlags = [...contract.redFlags].sort((a, b) => a.localeCompare(b))
  if (sortedFlags.includes("indemnification_unclear")) {
    raw.push({
      action: "Clarify indemnification clause",
      priority: "medium",
      impact: "risk",
      justification:
        "Ambiguous indemnification language leaves risk allocation undefined for the site and sponsor, which is a common source of stalled site startup and legal rework.",
      negotiationText:
        "We ask that indemnification be revised to clearly describe each party's obligations, carve-outs, and procedures so risk is allocated in line with industry-standard clinical trial agreements.",
    })
  }
  if (sortedFlags.includes("publication_clause_unclear")) {
    raw.push({
      action: "Clarify publication rights",
      priority: "medium",
      impact: "risk",
      justification:
        "Unclear publication rights may conflict with institutional policies and academic obligations, creating compliance risk for the investigator and institution.",
      negotiationText:
        "Please clarify publication and data-use rights so they align with institutional policy and customary academic dissemination timelines, including reasonable notice and sponsor review where applicable.",
    })
  }

  const seen = new Set<string>()
  const deduped: AlignmentRecommendation[] = []
  for (const r of sortRecommendations(raw)) {
    const k = recommendationKey(r)
    if (seen.has(k)) continue
    seen.add(k)
    deduped.push(r)
  }
  return deduped
}

/**
 * Detect financial misalignment between budget and contract terms.
 */
export function analyzeBudgetContractAlignment(
  input: BudgetContractAlignmentInput,
): BudgetContractAlignmentResult {
  const { budget, contract } = input
  const raw: AlignmentIssue[] = []

  const hasContractPaymentTerms = isPresent(contract.paymentTerms)
  const hasContractInvoiceFrequency = isPresent(contract.invoiceFrequency)

  if (!hasContractPaymentTerms) {
    raw.push({
      type: "missing_contract_payment_terms",
      severity: "high",
      message: "Contract payment terms are missing.",
    })
  }

  if (
    contract.redFlags.includes("missing_payment_terms") &&
    hasContractPaymentTerms
  ) {
    raw.push({
      type: "contract_red_flag_missing_payment_terms",
      severity: "high",
      message: 'Contract redFlags include "missing_payment_terms" while payment terms are present.',
    })
  }

  if (!hasContractInvoiceFrequency) {
    raw.push({
      type: "missing_contract_invoice_frequency",
      severity: "medium",
      message: "Contract invoice frequency is missing.",
    })
  }

  const hasBudgetPaymentTerms = isPresent(budget.paymentTerms)
  if (hasBudgetPaymentTerms && hasContractPaymentTerms) {
    const b = budget.paymentTerms!.trim()
    const c = contract.paymentTerms!.trim()
    if (!paymentTermsAligned(b, c)) {
      const bDays = parsePaymentDays(b)
      const cDays = parsePaymentDays(c)
      let severity: AlignmentIssueSeverity = "medium"
      if (
        bDays !== undefined &&
        cDays !== undefined &&
        cDays > bDays
      ) {
        severity = "high"
      }
      raw.push({
        type: "payment_terms_mismatch",
        severity,
        message: `Payment terms differ: budget "${b}" vs contract "${c}".`,
      })
    }
  }

  const hasBudgetInvoiceFrequency = isPresent(budget.invoiceFrequency)
  if (hasBudgetInvoiceFrequency && hasContractInvoiceFrequency) {
    const b = canonicalInvoiceFrequency(budget.invoiceFrequency!)
    const c = canonicalInvoiceFrequency(contract.invoiceFrequency!)
    if (b !== c) {
      raw.push({
        type: "invoice_frequency_mismatch",
        severity: "medium",
        message: `Invoice frequency differs: budget "${budget.invoiceFrequency!.trim()}" vs contract "${contract.invoiceFrequency!.trim()}".`,
      })
    }
  }

  const seen = new Set<string>()
  const deduped: AlignmentIssue[] = []
  for (const issue of sortIssues(raw)) {
    const k = issueKey(issue)
    if (seen.has(k)) continue
    seen.add(k)
    deduped.push(issue)
  }

  const criticalIssues = deduped.filter((i) => i.severity === "high").length
  const recommendations = buildRecommendations(input, deduped)

  return {
    issues: deduped,
    recommendations,
    summary: {
      totalIssues: deduped.length,
      criticalIssues,
    },
  }
}
