/**
 * Deterministic mock rows for local revenue-protection review demos (no I/O).
 */

import type { ExpectedRow, InvoiceRow } from "../match-expected-to-invoice"

const rowDefaults = {
  notes: null as string | null,
  confidence: "high" as const,
  needsReview: false,
  reviewReasons: [] as string[],
}

/** Expected billables: Screening (exact), Day 1 (unit mismatch vs invoice), Day 7 (no invoice line). */
export const demoExpectedRows: ExpectedRow[] = [
  {
    sourceRecordIndex: 0,
    visitName: "Screening",
    activityName: "Consent",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    ...rowDefaults,
  },
  {
    sourceRecordIndex: 1,
    visitName: "Day 1",
    activityName: "Physical Exam",
    quantity: 1,
    unitPrice: 125,
    totalPrice: 125,
    ...rowDefaults,
  },
  {
    sourceRecordIndex: 2,
    visitName: "Day 7",
    activityName: "Lab Panel",
    quantity: 1,
    unitPrice: 200,
    totalPrice: 200,
    ...rowDefaults,
  },
]

/** Invoice lines: Screening (exact), Day 1 (unit price differs; line total unchanged for demo), Unplanned (no expected). */
export const demoInvoiceRows: InvoiceRow[] = [
  {
    sourceRecordIndex: 0,
    visitName: "Screening",
    activityName: "Consent",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    ...rowDefaults,
  },
  {
    sourceRecordIndex: 1,
    visitName: "Day 1",
    activityName: "Physical Exam",
    quantity: 1,
    unitPrice: 130,
    totalPrice: 125,
    ...rowDefaults,
  },
  {
    sourceRecordIndex: 2,
    visitName: "Unplanned",
    activityName: "Travel Reimbursement",
    quantity: 1,
    unitPrice: 450,
    totalPrice: 450,
    ...rowDefaults,
  },
]
