import { CLINIQ_DEFAULT_PAYLOADS } from "../api/test-cost-client"
import type { InternalBudgetLine } from "../budget-gap/types"
import { calculateProcedureCost } from "../cost-truth/cost-engine"
import type { RoleCost, SiteCostProfile } from "../cost-truth/cost-types"
import { applyMargin, applyOverhead } from "../cost-truth/cost-rules"
import type { ExpectedBillable } from "./types"

export type GenerateExpectedParams = {
  studyId?: string
  roleCosts?: RoleCost[]
  siteCostProfile?: SiteCostProfile
  complexityMultiplier?: number
  therapeuticArea?: string
}

function costTruthPathApplies(
  line: InternalBudgetLine,
  params: GenerateExpectedParams | undefined,
): boolean {
  if (!params?.roleCosts?.length || params.siteCostProfile === undefined) {
    return false
  }
  const proc = line.costTruthProcedure
  return proc !== undefined && proc.times.length > 0
}

function internalCostPathApplies(
  params: GenerateExpectedParams | undefined,
): boolean {
  if (!params) return false
  return (
    params.siteCostProfile !== undefined ||
    params.complexityMultiplier !== undefined
  )
}

/**
 * One expected billable row per internal budget line (study-level modeled revenue).
 *
 * Pricing priority:
 * 1. Cost Truth from `CLINIQ_DEFAULT_PAYLOADS[line.lineCode]` when defined (`price_with_margin` × qty)
 * 2. Cost Truth from `line.costTruthProcedure` + `params.roleCosts` + `params.siteCostProfile`
 * 3. Internal unit cost + optional complexity / site OH & margin
 * 4. Legacy internal totals / unit price
 */
export function generateExpectedBillablesFromBudget(
  internalLines: InternalBudgetLine[],
  params?: GenerateExpectedParams,
): ExpectedBillable[] {
  const studyId = params?.studyId
  const complexityMultiplier = params?.complexityMultiplier ?? 1.0

  return internalLines.map((line, index) => {
    const qty = Math.max(0, line.quantity)

    const defaultPayload = CLINIQ_DEFAULT_PAYLOADS[line.lineCode]
    if (defaultPayload !== undefined) {
      const breakdown = calculateProcedureCost(
        defaultPayload.procedure,
        defaultPayload.roleCosts,
        defaultPayload.siteCostProfile,
      )
      const unitPrice = breakdown.price_with_margin
      return {
        id: `exp-${line.id}-${index}`,
        budgetLineId: line.id,
        studyId,
        lineCode: line.lineCode,
        label: line.label,
        category: line.category,
        visitName: line.visitName,
        unit: line.unit,
        expectedQuantity: qty,
        unitPrice,
        expectedRevenue: unitPrice * qty,
      }
    }

    if (costTruthPathApplies(line, params)) {
      const breakdown = calculateProcedureCost(
        line.costTruthProcedure!,
        params!.roleCosts!,
        params!.siteCostProfile!,
      )
      const unitPrice = breakdown.price_with_margin
      return {
        id: `exp-${line.id}-${index}`,
        budgetLineId: line.id,
        studyId,
        lineCode: line.lineCode,
        label: line.label,
        category: line.category,
        visitName: line.visitName,
        unit: line.unit,
        expectedQuantity: qty,
        unitPrice,
        expectedRevenue: unitPrice * qty,
      }
    }

    if (internalCostPathApplies(params)) {
      const p = params!
      let unitPrice = line.internalUnitCost * complexityMultiplier
      if (p.siteCostProfile !== undefined) {
        unitPrice = applyMargin(
          applyOverhead(unitPrice, p.siteCostProfile.overhead_percent),
          p.siteCostProfile.margin_target,
        )
      }
      return {
        id: `exp-${line.id}-${index}`,
        budgetLineId: line.id,
        studyId,
        lineCode: line.lineCode,
        label: line.label,
        category: line.category,
        visitName: line.visitName,
        unit: line.unit,
        expectedQuantity: qty,
        unitPrice,
        expectedRevenue: unitPrice * qty,
      }
    }

    const unitPrice =
      qty > 0 ? line.internalTotal / qty : line.internalUnitCost
    return {
      id: `exp-${line.id}-${index}`,
      budgetLineId: line.id,
      studyId,
      lineCode: line.lineCode,
      label: line.label,
      category: line.category,
      visitName: line.visitName,
      unit: line.unit,
      expectedQuantity: qty,
      unitPrice,
      expectedRevenue: line.internalTotal,
    }
  })
}
