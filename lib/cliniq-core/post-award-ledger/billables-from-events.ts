import type { BillableInstance, EventLog, ExpectedBillable } from "./types"

function rateRowForLineCode(
  lineCode: string,
  expected: ExpectedBillable[],
): ExpectedBillable | undefined {
  return expected.find((e) => e.lineCode === lineCode)
}

/**
 * Turn a single execution event into a billable instance using expected unit economics.
 * Unknown line codes return null (no billable generated).
 */
export function generateBillablesFromEvent(
  event: EventLog,
  expectedBillables: ExpectedBillable[],
): BillableInstance | null {
  const row = rateRowForLineCode(event.lineCode, expectedBillables)
  if (!row) return null

  const quantity = event.quantity ?? 1
  if (quantity <= 0) return null

  const unitAmount = row.unitPrice
  const totalAmount = unitAmount * quantity

  return {
    id: `bill-${event.id}`,
    eventLogId: event.id,
    studyId: event.studyId,
    lineCode: event.lineCode,
    label: row.label,
    category: row.category,
    quantity,
    unitAmount,
    totalAmount,
    occurredAt: event.occurredAt,
  }
}
