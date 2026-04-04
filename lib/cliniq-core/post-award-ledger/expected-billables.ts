import type { InternalBudgetLine } from "../budget-gap/types"
import type { ExpectedBillable } from "./types"

export type GenerateExpectedParams = {
  studyId?: string
}

/**
 * One expected billable row per internal budget line (study-level modeled revenue).
 */
export function generateExpectedBillablesFromBudget(
  internalLines: InternalBudgetLine[],
  params?: GenerateExpectedParams,
): ExpectedBillable[] {
  const studyId = params?.studyId
  return internalLines.map((line, index) => {
    const qty = Math.max(0, line.quantity)
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
