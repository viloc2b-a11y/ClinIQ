/**
 * Bridge: Protocol Classification v1 → Module 5 `ExpectedBillable` (type-only import from post-award-ledger).
 */

import type { ExpectedBillable } from "../post-award-ledger/types"
import type { ProtocolClassifiedActivity } from "./types"

export interface ProtocolToExpectedBillablesResult {
  expectedBillables: ExpectedBillable[]
  deferredConditionals: ProtocolClassifiedActivity[]
  ignoredNonBillables: ProtocolClassifiedActivity[]
}

function slugPart(s: string): string {
  const t = s.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")
  return t.length > 0 ? t : "na"
}

function resolveLineCode(a: ProtocolClassifiedActivity): string | null {
  const lc = a.lineCode?.trim()
  if (lc) return lc
  const fc = a.feeCode?.trim()
  if (fc) return fc
  return null
}

function hasRequiredIdentity(a: ProtocolClassifiedActivity): boolean {
  return (
    a.studyId.trim().length > 0 &&
    a.activityId.trim().length > 0 &&
    a.visitName.trim().length > 0
  )
}

/** Non-fabricated economics: all present, finite, and quantity × unitPrice matches expectedRevenue. */
function hasExplicitConsistentEconomics(a: ProtocolClassifiedActivity): boolean {
  const { unitPrice, expectedQuantity, expectedRevenue } = a
  if (
    unitPrice === undefined ||
    expectedQuantity === undefined ||
    expectedRevenue === undefined
  ) {
    return false
  }
  if (
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(expectedQuantity) ||
    !Number.isFinite(expectedRevenue)
  ) {
    return false
  }
  if (expectedQuantity <= 0) return false
  if (unitPrice < 0 || expectedRevenue < 0) return false
  const product = unitPrice * expectedQuantity
  return Math.abs(product - expectedRevenue) < 1e-6
}

function resolveLabel(a: ProtocolClassifiedActivity): string {
  const t = a.activityType?.trim()
  if (t && t.length > 0) return t
  return a.activityId.trim()
}

/**
 * - `billable` → one `ExpectedBillable` only when identity, `lineCode`/`feeCode`, and explicit consistent economics exist.
 * - `conditional` → `deferredConditionals` (unchanged references).
 * - `non_billable` → `ignoredNonBillables` (unchanged references).
 * - Billable rows missing code, identity, or economics → `deferredConditionals` (unchanged references; no rationale mutation).
 * - `ExpectedBillable.unit` uses `protocolUnit` when set; otherwise `"ea"` (structural default required by the type).
 */
export function protocolActivitiesToExpectedBillables(
  activities: ProtocolClassifiedActivity[],
): ProtocolToExpectedBillablesResult {
  const expectedBillables: ExpectedBillable[] = []
  const deferredConditionals: ProtocolClassifiedActivity[] = []
  const ignoredNonBillables: ProtocolClassifiedActivity[] = []

  for (const a of activities) {
    if (a.classification === "non_billable") {
      ignoredNonBillables.push(a)
      continue
    }

    if (a.classification === "conditional") {
      deferredConditionals.push(a)
      continue
    }

    if (a.classification !== "billable") {
      deferredConditionals.push(a)
      continue
    }

    if (!hasRequiredIdentity(a)) {
      deferredConditionals.push(a)
      continue
    }

    const lineCode = resolveLineCode(a)
    if (!lineCode) {
      deferredConditionals.push(a)
      continue
    }

    if (!hasExplicitConsistentEconomics(a)) {
      deferredConditionals.push(a)
      continue
    }

    const sid = slugPart(a.studyId)
    const aid = slugPart(a.activityId)
    const id = `exp-proto-${sid}-${aid}`
    const budgetLineId = `proto-bl-${sid}-${aid}`

    expectedBillables.push({
      id,
      budgetLineId,
      studyId: a.studyId.trim(),
      lineCode,
      label: resolveLabel(a),
      category: "protocol",
      visitName: a.visitName.trim(),
      unit: a.protocolUnit?.trim() || "ea",
      expectedQuantity: a.expectedQuantity!,
      unitPrice: a.unitPrice!,
      expectedRevenue: a.expectedRevenue!,
    })
  }

  return { expectedBillables, deferredConditionals, ignoredNonBillables }
}
