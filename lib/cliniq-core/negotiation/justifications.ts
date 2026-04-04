import type { NegotiationJustification } from "./types"

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

/**
 * Facts tied to workload / compliance positioning (not legal advice).
 */
export function supportingFactsForCategory(category: string, label: string): string[] {
  const c = norm(category)
  const l = norm(label)
  const facts: string[] = []

  if (c.includes("startup") || l.includes("startup") || l.includes("activation")) {
    facts.push(
      "Startup covers contracting, SIV preparation, system build, delegation, and pharmacy setup prior to first patient activity.",
    )
  }
  if (c.includes("screen failure") || l.includes("screen failure")) {
    facts.push(
      "Screen-failure work consumes visit slots, coordinator time, and source documentation without enrollment credit.",
    )
  }
  if (
    c.includes("visit") ||
    l.includes("screening") ||
    l.includes("follow") ||
    l.includes("randomization")
  ) {
    facts.push(
      "Visit execution includes hidden PI oversight, regulatory queries, and coordination beyond the nominal visit label.",
    )
  }
  if (
    c.includes("lab") ||
    c.includes("specimen") ||
    l.includes("dry ice") ||
    l.includes("shipping") ||
    l.includes("courier")
  ) {
    facts.push(
      "Specimen handling, dry ice, and courier lanes require staff time, equipment, and documented chain-of-custody.",
    )
  }
  if (c.includes("pharmacy") || l.includes("ip ") || l.includes("accountability")) {
    facts.push(
      "Pharmacy and IP accountability include storage conditions, logs, and monitored reconciliation cycles.",
    )
  }
  if (
    c.includes("close") ||
    c.includes("archive") ||
    l.includes("close") ||
    l.includes("archiv")
  ) {
    facts.push(
      "Close-out and archiving absorb TMF QC, query closure, and IP reconciliation prior to archive sign-off.",
    )
  }
  if (c.includes("regulatory") || l.includes("amendment")) {
    facts.push(
      "Regulatory amendments require chart and binder updates, training evidence, and submission support.",
    )
  }

  if (facts.length === 0) {
    facts.push(
      "Internal totals reflect modeled staff time, systems use, and documentation burden for this activity.",
    )
  }

  return facts
}

const LIBRARY: Record<string, string> = {
  startup:
    "Startup fees should reflect full site activation effort before enrollment risk is shared.",
  screenFailure:
    "An explicit screen-failure fee aligns sponsor timelines with documented procedures performed at the site.",
  hiddenAdmin:
    "Regulatory binders, delegation, and query response are material even when not itemized on sponsor grids.",
  labLogistics:
    "Lab logistics are pass-through in name only; they require dedicated coordinator and pharmacy touchpoints.",
  pharmacyIp:
    "IP accountability has direct impact on inspection readiness and continuity of supply.",
  closeout:
    "Close-out effort scales with visit volume and IP complexity; lump caps often understate true hours.",
  paymentTiming:
    "Payment cadence and holdbacks directly affect the site’s ability to staff consistently through the study.",
}

export function buildDefensiveJustifications(params: {
  categoriesTouched: string[]
  negativeCashFlowRisk: boolean
  hasMissingCritical: boolean
}): NegotiationJustification[] {
  const out: NegotiationJustification[] = []
  const catNorm = params.categoriesTouched.map(norm).join(" ")

  if (params.hasMissingCritical) {
    out.push({
      rationale: LIBRARY.screenFailure,
      supportingFacts: [
        "Missing sponsor line items still require GCP-consistent documentation and audit trail support.",
      ],
    })
  }

  if (catNorm.includes("startup") || catNorm.includes("activation")) {
    out.push({
      rationale: LIBRARY.startup,
      supportingFacts: [
        supportingFactsForCategory("Startup", "activation")[0] ??
          "Startup work is front-loaded and non-recoverable if underfunded.",
      ],
    })
  }

  if (
    catNorm.includes("lab") ||
    catNorm.includes("specimen") ||
    catNorm.includes("shipping") ||
    catNorm.includes("dry ice")
  ) {
    out.push({
      rationale: LIBRARY.labLogistics,
      supportingFacts: [LIBRARY.labLogistics],
    })
  }

  if (catNorm.includes("pharmacy") || catNorm.includes("ip")) {
    out.push({
      rationale: LIBRARY.pharmacyIp,
      supportingFacts: [LIBRARY.pharmacyIp],
    })
  }

  if (catNorm.includes("close") || catNorm.includes("archive")) {
    out.push({
      rationale: LIBRARY.closeout,
      supportingFacts: [LIBRARY.closeout],
    })
  }

  out.push({
    rationale: LIBRARY.hiddenAdmin,
    supportingFacts: [
      "Coordinators and sub-investigators carry recurring documentation load across every patient touchpoint.",
    ],
  })

  if (params.negativeCashFlowRisk) {
    out.push({
      rationale: LIBRARY.paymentTiming,
      supportingFacts: [
        "Thin or delayed payments increase the risk of staffing gaps that affect visit windows and data quality.",
      ],
    })
  }

  return out
}
