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

/** activityType normalized — too vague to bill without human confirmation */
const AMBIGUOUS_ACTIVITY_TYPES = new Set([
  "other",
  "misc",
  "miscellaneous",
  "tbd",
  "unknown",
  "unspecified",
  "ambiguous",
  "pending_classification",
  "na",
  "?",
])

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "_")
}

function normVisit(s: string): string {
  return s.trim().toLowerCase()
}

function baseOutput(row: SoARow): Pick<
  ProtocolClassifiedActivity,
  | "studyId"
  | "activityId"
  | "visitName"
  | "lineCode"
  | "feeCode"
  | "source"
  | "activityType"
  | "unitPrice"
  | "expectedQuantity"
  | "expectedRevenue"
  | "protocolUnit"
> {
  const at = row.activityType.trim()
  return {
    studyId: row.studyId,
    activityId: row.activityId,
    visitName: row.visitName,
    lineCode: row.lineCode,
    feeCode: row.feeCode,
    source: "soa_row",
    activityType: at.length > 0 ? at : undefined,
    unitPrice: row.unitPrice,
    expectedQuantity:
      row.quantity !== undefined && Number.isFinite(row.quantity)
        ? row.quantity
        : undefined,
    expectedRevenue: row.expectedRevenue,
    protocolUnit:
      row.protocolUnit !== undefined && row.protocolUnit.trim().length > 0
        ? row.protocolUnit.trim()
        : undefined,
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

function isSponsorException(row: SoARow): boolean {
  if (row.sponsorException === true) return true
  const t = norm(row.activityType)
  const v = normVisit(row.visitName)
  if (t.includes("sponsor_exception") || v.includes("sponsor exception")) return true
  const bt = row.billableTo
  if (bt !== undefined && norm(bt) === "sponsor_exception") return true
  return false
}

function isRescreen(row: SoARow): boolean {
  const t = norm(row.activityType)
  const v = normVisit(row.visitName)
  if (
    t.includes("re_screen") ||
    t.includes("rescreen") ||
    t.includes("repeat_screen") ||
    t.includes("repeat_screening") ||
    v.includes("re-screen") ||
    v.includes("rescreen") ||
    v.includes("repeat screening") ||
    v.includes("repeat_screening")
  ) {
    return true
  }
  return false
}

function isExtraCall(row: SoARow): boolean {
  const t = norm(row.activityType)
  const v = normVisit(row.visitName)
  if (t.includes("extra_call") || t.includes("extracall")) return true
  if (v.includes("extra call") || v.includes("extracall")) return true
  if (t.includes("additional_call") || v.includes("additional call")) return true
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

function isAmbiguous(row: SoARow): boolean {
  const atRaw = row.activityType.trim()
  const vnRaw = row.visitName.trim()
  if (atRaw.length === 0 || vnRaw.length === 0) return true
  const at = norm(row.activityType)
  if (AMBIGUOUS_ACTIVITY_TYPES.has(at)) return true
  const vn = norm(row.visitName)
  if (AMBIGUOUS_ACTIVITY_TYPES.has(vn)) return true
  return false
}

/**
 * Deterministic rule order (first match wins):
 * 1) explicit non-billable
 * 2) sponsor exception → conditional
 * 3) re-screen → conditional
 * 4) extra calls → non_billable
 * 5) unscheduled → conditional
 * 6) repeat labs → conditional
 * 7) ambiguous visit/activity → conditional (manual review)
 * 8) default → billable
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

  if (isSponsorException(row)) {
    const conditions: ProtocolActivityCondition[] = [
      {
        kind: "sponsor_exception",
        description:
          "Validate exception against executed amendment, sponsor letter, or CTMS approval before billing.",
      },
      {
        kind: "manual_review",
        description:
          "Finance or contracts must confirm the exception is active for this subject/visit window.",
      },
    ]
    return {
      ...base,
      classification: "conditional",
      rationale: "Sponsor exception requires explicit validation.",
      conditions,
    }
  }

  if (isRescreen(row)) {
    const conditions: ProtocolActivityCondition[] = [
      {
        kind: "requires_screen_failure",
        description:
          "Document prior screen failure (source records, eligibility log) before treating as billable.",
      },
      {
        kind: "occurrence_limit",
        description:
          "Confirm repeat is within protocol-allowed screening attempts and sponsor grid caps.",
      },
    ]
    return {
      ...base,
      classification: "conditional",
      rationale:
        "Requires documented prior screen failure and protocol-allowed repeat.",
      conditions,
    }
  }

  if (isExtraCall(row)) {
    return {
      ...base,
      classification: "non_billable",
      rationale:
        "Extra calls are non-billable unless sponsor exception exists.",
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

  if (isAmbiguous(row)) {
    const conditions: ProtocolActivityCondition[] = [
      {
        kind: "manual_review",
        description:
          "Resolve ambiguous visit or activity labeling against the SoA and sponsor budget before billing.",
      },
    ]
    return {
      ...base,
      classification: "conditional",
      rationale: "Requires manual review.",
      conditions,
    }
  }

  return {
    ...base,
    classification: "billable",
    rationale: "Default: scheduled protocol activity with no blocking rules applied.",
  }
}
