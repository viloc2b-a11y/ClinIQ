/**
 * Deterministic counteroffer rows from negotiation actions (no AI).
 */

export type NegotiationAction = {
  priority: number
  activityName: string
  visit: string
  impact: number
  urgency: "high" | "medium" | "low"
  negotiationText: string
}

export type CounterofferInput = {
  studyName?: string
  actions: NegotiationAction[]
}

export type CounterofferRow = {
  activity: string
  visit: string
  proposedFee: number
  justification: string
  priority: number
}

export type Counteroffer = {
  rows: CounterofferRow[]
  totalProposedValue: number
}

export function buildCounteroffer(input: CounterofferInput): Counteroffer {
  const sorted = [...input.actions].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.impact - a.impact
  })

  const rows: CounterofferRow[] = sorted.map((a) => {
    const multiplier = a.priority === 1 ? 1.25 : 1.15
    const proposedFee = Math.round(a.impact * multiplier)
    return {
      activity: a.activityName,
      visit: a.visit,
      proposedFee,
      justification: a.negotiationText,
      priority: a.priority,
    }
  })

  const totalProposedValue = rows.reduce((sum, r) => sum + r.proposedFee, 0)

  return { rows, totalProposedValue }
}
