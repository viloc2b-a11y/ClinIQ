/**
 * Deterministic sponsor-facing budget negotiation email from revenue decision + actions (no AI).
 */

export type NegotiationAction = {
  priority: number
  activityName: string
  visit: string
  impact: number
  urgency: "high" | "medium" | "low"
  negotiationText: string
}

export type RevenueDecision = {
  totalRevenueOpportunity: number
  revenueAtRisk: number
  coveragePercent: number
  decision: "SAFE" | "MODERATE_RISK" | "HIGH_RISK"
  headline: string
  topActions: {
    activity: string
    impact: number
    priority: number
  }[]
}

export type NegotiationEmailInput = {
  sponsorName?: string
  studyName?: string
  siteName?: string
  decision: RevenueDecision
  actions: NegotiationAction[]
}

export type NegotiationEmail = {
  subject: string
  body: string
}

function formatGapDollars(n: number): string {
  return String(Math.round(n))
}

function topThreeActions(actions: NegotiationAction[]): NegotiationAction[] {
  return [...actions]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.impact - a.impact
    })
    .slice(0, 3)
}

export function buildNegotiationEmail(input: NegotiationEmailInput): NegotiationEmail {
  const { sponsorName, studyName, siteName, decision, actions } = input

  const subject = studyName?.trim()
    ? `Budget Clarification Request — ${studyName.trim()}`
    : "Budget Clarification Request"

  const greetingLine = sponsorName?.trim() ? `Dear ${sponsorName.trim()},` : "Dear Team,"

  const studyClause = studyName?.trim()
    ? `For ${studyName.trim()}, the protocol includes billable work that is not in the proposed sponsor budget.`
    : `The protocol includes billable work that is not in the proposed sponsor budget.`

  const assessmentParagraph = `About $${Math.round(decision.revenueAtRisk)} in site revenue is at risk with the budget as written (${decision.coveragePercent}% of our projected revenue is covered). If the budget matches the protocol, opportunity is about $${Math.round(decision.totalRevenueOpportunity)}.`

  const riskVsCounterofferNote =
    "This estimate reflects current uncovered revenue risk. Our suggested counteroffer may be higher to support negotiation."

  const top = topThreeActions(actions)
  let keyItemsBlock: string
  if (top.length === 0) {
    keyItemsBlock = "Please add the missing protocol line items (or equivalent fees) so the budget matches the work we do."
  } else {
    const lines = top.map(
      (a) =>
        `- ${a.activityName} (${a.visit}) — estimated gap $${formatGapDollars(a.impact)}`,
    )
    keyItemsBlock = `Items missing from the budget:\n${lines.join("\n")}`
  }

  const askParagraph =
    top.length === 0
      ? "Please send a revised budget. Happy to walk through it on a short call."
      : "Please revise the budget to include these items. Happy to walk through it on a short call."

  const closingLines = siteName?.trim()
    ? `Sincerely,\n${siteName.trim()}`
    : "Sincerely,\nSite Team"

  const body = [
    greetingLine,
    "",
    studyClause,
    "",
    assessmentParagraph,
    "",
    riskVsCounterofferNote,
    "",
    keyItemsBlock,
    "",
    askParagraph,
    "",
    closingLines,
  ].join("\n")

  return { subject, body }
}
