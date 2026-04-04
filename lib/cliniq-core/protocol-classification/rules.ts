import type {
  ProtocolClassifiedActivity,
  ProtocolActivityCondition,
  SoARow,
} from "./types"

const NON_BILLABLE_BILLABLE_TO = new Set([
  "none",
  "non_billable",
  "not_billable",
  "na",
  "n/a",
  "no",
])

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "_")
}

function normVisit(s: string): string {
  return s.trim().toLowerCase()
}

function baseOutput(row: SoARow): Pick<
  ProtocolClassifiedActivity,
  "studyId" | "activityId" | "visitName" | "lineCode" | "feeCode" | "source"
> {
  return {
    studyId: row.studyId,
    activityId: row.activityId,
    visitName: row.visitName,
    lineCode: row.lineCode,
    feeCode: row.feeCode,
    source: "soa_row",
  }
}

function isExplicitNonBillable(row: SoARow): boolean {
  const bt = row.billableTo
  if (bt !== undefined && bt.length > 0) {
    const key = norm(bt)
    if (NON_BILLABLE_BILLABLE_TO.has(key)) return true
  }
  const at = norm(row.activityType)
  if (at === "non_billable" || at.startsWith("non_billable_")) return true
  return false
}

function isUnscheduled(row: SoARow): boolean {
  const v = normVisit(row.visitName)
  const t = norm(row.activityType)
  return v.includes("unscheduled") || t.includes("unscheduled")
}

function isRepeatLab(row: SoARow): boolean {
  const t = norm(row.activityType)
  const qty = row.quantity ?? 1
  if (t.includes("repeat_lab") || t.includes("repeatlab")) return true
  if ((t === "lab_draw" || t.includes("lab_draw")) && qty > 1) return true
  return false
}

/**
 * Ordered rules:
 * 1) explicit non-billable
 * 2) unscheduled → conditional
 * 3) repeat labs → conditional
 * 4) default → billable
 */
export function classifyActivity(row: SoARow): ProtocolClassifiedActivity {
  const base = baseOutput(row)

  if (isExplicitNonBillable(row)) {
    return {
      ...base,
      classification: "non_billable",
      rationale:
        "Explicit non-billable: billableTo sentinel or activityType marked non_billable.",
    }
  }

  if (isUnscheduled(row)) {
    const conditions: ProtocolActivityCondition[] = [
      {
        kind: "unscheduled_visit",
        description:
          "Confirm visit occurred per protocol/sponsor policy and document in visit log before billing.",
      },
    ]
    return {
      ...base,
      classification: "conditional",
      rationale:
        "Visit or activity marked unscheduled — billing requires execution evidence and sponsor alignment.",
      conditions,
    }
  }

  if (isRepeatLab(row)) {
    const conditions: ProtocolActivityCondition[] = [
      {
        kind: "repeat_lab",
        description:
          "Verify each lab occurrence against protocol limits and sponsor grid before invoicing.",
      },
    ]
    return {
      ...base,
      classification: "conditional",
      rationale:
        "Repeat or multi-quantity lab activity — bill per documented occurrences within allowed windows.",
      conditions,
    }
  }

  return {
    ...base,
    classification: "billable",
    rationale: "Default: scheduled protocol activity with no blocking rules applied.",
  }
}
