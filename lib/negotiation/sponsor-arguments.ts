/**
 * Structured sponsor-ready arguments from negotiation line economics + labels.
 */

export type NegotiationArgumentIssueType =
  | "underpayment"
  | "missing_line"
  | "operational_burden"
  | "contractual_risk"
  | "payment_timing"
  | "pass_through_gap"

export type SponsorArgumentBundle = {
  issue_type: NegotiationArgumentIssueType
  impact_summary: string
  protocol_evidence: string
  operational_burden: string
  financial_risk: string
  recommended_position: string
  sponsor_language: string
}

export type NegotiationLineForArguments = {
  label: string
  line_code: string
  category: string
  visit_name: string
  current_price: number
  internal_cost: number
  proposed_price: number
  justification?: string
}

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

function haystack(line: NegotiationLineForArguments): string {
  return norm([line.label, line.line_code, line.category, line.visit_name, line.justification ?? ""].join(" "))
}

function classifyIssue(line: NegotiationLineForArguments): NegotiationArgumentIssueType {
  const h = haystack(line)
  if (/\bnet\s*90\b|payment\s*term|days?\s*to\s*pay|invoice\s*cycle/i.test(h)) return "payment_timing"
  if (/pass[\s-]*through|third[\s-]*party|vendor|reimbursable\s*cost/i.test(h)) return "pass_through_gap"
  if (/close[\s-]*out|archiv|regulatory\s*binder|tmf/i.test(h)) return "operational_burden"
  if (/unsched|add[\s-]*on\s*visit|extra\s*visit/i.test(h)) return "operational_burden"
  if (/screen\s*fail|screening\s*fail/i.test(h)) return "underpayment"
  if (/\becg\b|electrocardi/i.test(h)) return "underpayment"
  if (/lab\s*handl|specimen|ship|processing|packag/i.test(h)) return "missing_line"
  if (/data\s*entry|edc|query|epro/i.test(h)) return "operational_burden"
  if (/hold\s*harm|indemnif|liabil/i.test(h)) return "contractual_risk"
  const gap = line.internal_cost - line.current_price
  if (line.current_price <= 0 && line.internal_cost > 0) return "missing_line"
  if (gap > 0) return "underpayment"
  return "operational_burden"
}

function buildUnderpaymentEcg(line: NegotiationLineForArguments): SponsorArgumentBundle {
  const sponsor = money(line.current_price)
  const target = money(line.proposed_price > 0 ? line.proposed_price : line.internal_cost)
  return {
    issue_type: "underpayment",
    impact_summary: `Sponsor budget shows ${sponsor} for this line while fully loaded site execution supports ${target}.`,
    protocol_evidence:
      "Protocol-required ECG acquisition, documentation, over-read, and filing are discrete tasks with defined quality standards.",
    operational_burden:
      "Coordinator scheduling, equipment use, clinician review, and query resolution create recurring workload per subject visit.",
    financial_risk:
      "Underpriced ECG work compresses margin on every randomized subject and increases leakage if visits stack or queries multiply.",
    recommended_position: `Request adjustment toward ${target} (or documented cost build-up) so the rate reflects actual site effort.`,
    sponsor_language:
      "Based on protocol-required ECG acquisition, documentation, and review, the current rate does not reflect actual site cost. This procedure requires coordinator time, equipment use, and physician oversight. We request adjustment to reflect sustainable execution.",
  }
}

function buildMissingLab(): SponsorArgumentBundle {
  return {
    issue_type: "missing_line",
    impact_summary:
      "Sample logistics (processing, packaging, courier coordination) are real visit-adjacent tasks without a compensated budget line.",
    protocol_evidence: "Protocol timelines assume timely lab handling and shipment consistent with monitoring expectations.",
    operational_burden:
      "Staff time for labeling, cold-chain checks, documentation, and courier handoff is not absorbable within generic visit fees.",
    financial_risk: "Unfunded lab handling concentrates cost into site overhead and distorts true per-visit economics.",
    recommended_position: "Add an explicit lab handling fee per applicable visit (or per panel) indexed to operational steps.",
    sponsor_language:
      "The protocol requires sample processing, packaging, and shipment coordination. These activities are not currently compensated. We request inclusion of a lab handling fee per visit to reflect operational workload.",
  }
}

function buildScreenFail(): SponsorArgumentBundle {
  return {
    issue_type: "underpayment",
    impact_summary:
      "Screen-failure visits consume full screening effort without randomization; flat or minimal fees do not recover cost.",
    protocol_evidence: "Eligibility criteria and safety labs typically mirror randomized visit intensity up to the failure point.",
    operational_burden:
      "Consenting, scheduling, assessments, and data entry occur before randomization; coordinator and clinician time is already spent.",
    financial_risk: "Underpayment on screen failures shifts enrollment risk entirely to the site and discourages timely recruitment.",
    recommended_position: "Negotiate a screen-failure fee aligned to completed procedures and monitoring burden.",
    sponsor_language:
      "Screen failure visits require full screening procedures and coordinator effort despite non-randomization. Current compensation does not reflect actual cost. We request adjustment to ensure site sustainability.",
  }
}

function buildUnscheduled(): SponsorArgumentBundle {
  return {
    issue_type: "operational_burden",
    impact_summary: "Unscheduled visits interrupt planned capacity and often duplicate assessments outside the SoA cadence.",
    protocol_evidence: "Safety and symptomatic follow-up can require off-cycle visits that are not substitutable for scheduled windows.",
    operational_burden:
      "Same-day triage, staffing, and documentation spikes cannot be averaged into routine visit pricing without systematic underrecovery.",
    financial_risk: "Absorbing unscheduled visits inside base visit budgets erodes margin and obscures true cost-to-serve.",
    recommended_position: "Define an explicit unscheduled visit rate (or hourly bundle) with clear eligibility triggers.",
    sponsor_language:
      "Unscheduled visits require full operational support and cannot be absorbed within scheduled visit budgets. We request explicit reimbursement terms for unscheduled visits.",
  }
}

function buildPaymentTerms(): SponsorArgumentBundle {
  return {
    issue_type: "payment_timing",
    impact_summary: "Extended payment cycles strain working capital for payroll, vendors, and pass-throughs tied to active subjects.",
    protocol_evidence: "Cash timing is independent of protocol compliance but directly affects the site's ability to maintain staff continuity.",
    operational_burden: "Finance and contracts teams carry reconciliation load across long DSO windows; disputes extend exposure further.",
    financial_risk: "Net-90+ terms effectively finance the trial from site balance sheets and amplify risk if accruals lag.",
    recommended_position: "Move to industry-norm timelines (e.g., net 30–45) or milestone-based partial payments on high-throughput studies.",
    sponsor_language:
      "Extended payment timelines create cash flow pressure for site operations. We request revised payment terms aligned with standard industry timelines to support continuous study execution.",
  }
}

function buildPassThrough(): SponsorArgumentBundle {
  return {
    issue_type: "pass_through_gap",
    impact_summary:
      "Third-party and vendor costs are variable, invoice-driven, and should not be netted against fixed per-visit professional fees.",
    protocol_evidence: "Imaging, central labs, and specialty vendors are typically pass-through in multi-site trials when properly documented.",
    operational_burden: "Sites coordinate POs, accruals, and reconciliations; uncapped exposure without reimbursement creates administrative drag.",
    financial_risk: "Without pass-through treatment, the site bears vendor inflation and timing risk unrelated to execution quality.",
    recommended_position: "Document pass-through eligibility, invoicing cadence, and markup policy (if any) in the CTA/budget.",
    sponsor_language:
      "Vendor and pass-through costs must be reimbursed separately to avoid financial exposure. We request clear pass-through treatment for all third-party services.",
  }
}

function buildCloseout(): SponsorArgumentBundle {
  return {
    issue_type: "operational_burden",
    impact_summary: "Closeout concentrates reconciliation, queries, records consolidation, and archival work after last patient activity.",
    protocol_evidence: "Monitoring and archiving expectations continue beyond the last visit through database lock and audit readiness.",
    operational_burden:
      "Dedicated coordinator and regulatory time for TMF completeness, financial close, and query closure is non-trivial and bursty.",
    financial_risk: "Without a closeout fee, final-phase work is subsidized by earlier underpriced visits.",
    recommended_position: "Include a defined closeout / archival fee tied to scope (e.g., monitoring rounds, records volume).",
    sponsor_language:
      "Study closeout requires significant administrative effort including reconciliation and document archiving. We request inclusion of a closeout fee.",
  }
}

function buildDataEntry(): SponsorArgumentBundle {
  return {
    issue_type: "operational_burden",
    impact_summary:
      "EDC, ePRO, and query volume drive sustained data workload that generic visit fees understate for complex protocols.",
    protocol_evidence: "Data quality metrics and monitoring intensity scale with fields, forms, and amendment churn.",
    operational_burden:
      "Coordinators carry daily query response, SDV support, and re-entry after monitoring visits across long horizons.",
    financial_risk: "Under-budgeted data work shows up as hidden labor cost and slows resolution of revenue-impacting queries.",
    recommended_position: "Add a data management / query workload component or adjust per-visit fees where form burden is high.",
    sponsor_language:
      "The protocol requires extensive data entry and query resolution. This workload is not fully reflected in the current budget. We request adjustment to reflect coordinator time.",
  }
}

function buildContractualRisk(): SponsorArgumentBundle {
  return {
    issue_type: "contractual_risk",
    impact_summary: "One-sided liability or uncapped obligations create balance-sheet exposure beyond the value of fixed per-visit fees.",
    protocol_evidence: "CTA indemnities and insurance requirements should align with role-appropriate risk sharing for investigator sites.",
    operational_burden: "Legal review, insurance certificates, and incident reporting add overhead unrelated to patient-facing tasks.",
    financial_risk: "Asymmetric indemnity can dwarf procedural revenue if disputes arise; pricing should reflect residual risk or be carved out.",
    recommended_position: "Request mutual, role-appropriate indemnity and caps consistent with comparable multi-site trials.",
    sponsor_language:
      "We seek balanced contractual risk allocation appropriate for our role as an investigative site, with terms that do not disproportionately transfer sponsor operational risk.",
  }
}

function buildGenericUnderpayment(line: NegotiationLineForArguments): SponsorArgumentBundle {
  const sponsor = money(line.current_price)
  const internal = money(line.internal_cost)
  const target = money(line.proposed_price > 0 ? line.proposed_price : line.internal_cost)
  const gap = line.internal_cost - line.current_price
  return {
    issue_type: "underpayment",
    impact_summary: `Line is budgeted at ${sponsor} versus an internal fully loaded model of ${internal}${gap > 0 ? ` (${money(gap)} gap)` : ""}.`,
    protocol_evidence:
      "Visit and procedure intensity in the SoA implies repeatable staff and oversight effort that should be reflected in the negotiated rate card.",
    operational_burden:
      "Scheduling, visit execution, source documentation, and follow-up queries consume coordinator and clinician capacity per event.",
    financial_risk: "Persistent underpricing on high-volume lines compounds across subjects and directly reduces recoverable revenue.",
    recommended_position: `Align pricing toward ${target} with transparent assumptions (time, roles, pass-throughs).`,
    sponsor_language:
      "The current budget for this activity does not reflect the operational effort required under the protocol. We request an adjustment so the rate supports sustainable, audit-ready execution while preserving study timelines.",
  }
}

export function buildSponsorArgumentBundle(line: NegotiationLineForArguments): SponsorArgumentBundle {
  const issue = classifyIssue(line)
  const h = haystack(line)
  if (issue === "underpayment" && /\becg\b|electrocardi/i.test(h)) return buildUnderpaymentEcg(line)
  if (issue === "missing_line") return buildMissingLab()
  if (issue === "underpayment" && /screen\s*fail|screening\s*fail/i.test(h)) return buildScreenFail()
  if (issue === "operational_burden" && /unsched|add[\s-]*on\s*visit|extra\s*visit/i.test(h)) return buildUnscheduled()
  if (issue === "payment_timing") return buildPaymentTerms()
  if (issue === "pass_through_gap") return buildPassThrough()
  if (issue === "operational_burden" && /close[\s-]*out|archiv|tmf/i.test(h)) return buildCloseout()
  if (issue === "operational_burden" && /data\s*entry|edc|query|epro/i.test(h)) return buildDataEntry()
  if (issue === "contractual_risk") return buildContractualRisk()
  if (issue === "underpayment") return buildGenericUnderpayment(line)
  return buildGenericUnderpayment(line)
}
