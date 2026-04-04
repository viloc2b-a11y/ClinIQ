import type { LeakageStatus, QuantifiedLineLeakage, QuantifiedRevenueLeakageReport } from "./quantify-leakage"

export type LeakageActionPriority = 1 | 2 | 3

export type LeakageAction = {
  lineCode: string
  label: string
  leakage: number
  leakageRatePct: number
  priority: LeakageActionPriority
  actionType: "review_billing" | "verify_execution" | "check_documentation"
  message: string
}

const ZERO_INVOICED_MESSAGE = "No invoiced amount detected for expected billable line."

function priorityAndType(status: LeakageStatus): {
  priority: LeakageActionPriority
  actionType: LeakageAction["actionType"]
} {
  if (status === "critical") return { priority: 1, actionType: "review_billing" }
  if (status === "warning") return { priority: 2, actionType: "verify_execution" }
  return { priority: 3, actionType: "check_documentation" }
}

function messageForLine(line: QuantifiedLineLeakage, actionType: LeakageAction["actionType"]): string {
  if (line.invoiced === 0 && line.expected > 0) return ZERO_INVOICED_MESSAGE
  switch (actionType) {
    case "review_billing":
      return "Review billed amount against expected revenue."
    case "verify_execution":
      return "Verify procedure execution and billing submission."
    case "check_documentation":
      return "Check supporting documentation and billing readiness."
  }
}

function lineToAction(line: QuantifiedLineLeakage): LeakageAction {
  const { priority, actionType } = priorityAndType(line.status)
  const leakageRatePct = Math.round(line.leakagePct * 100 * 10) / 10
  return {
    lineCode: line.lineCode,
    label: line.label,
    leakage: line.leakage,
    leakageRatePct,
    priority,
    actionType,
    message: messageForLine(line, actionType),
  }
}

/**
 * Prioritized operational follow-up from quantified leakage (deterministic).
 */
export function buildLeakageActions(report: QuantifiedRevenueLeakageReport): LeakageAction[] {
  const leaking = report.lineBreakdown.filter((l) => l.leakage > 0)
  const mapped = leaking.map(lineToAction)
  mapped.sort((a, b) => {
    if (b.leakage !== a.leakage) return b.leakage - a.leakage
    if (b.leakageRatePct !== a.leakageRatePct) return b.leakageRatePct - a.leakageRatePct
    return a.lineCode.localeCompare(b.lineCode)
  })
  return mapped.slice(0, 5)
}
