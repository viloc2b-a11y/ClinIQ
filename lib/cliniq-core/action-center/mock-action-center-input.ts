/**
 * Deterministic mock input for Action Center / leakage trace until persistence exists.
 * Wired for `buildLeakageTrace` — do not mutate at runtime.
 */

import type { ClaimItem, ClaimsLedgerRow, InvoiceLine, InvoicePackage } from "../claims/types"
import type { ExpectedBillable } from "../post-award-ledger/types"

const STUDY = "MOCK-STUDY-1"
const SPONSOR = "MOCK-SPONSOR-1"

/** Fully missing on invoice: ledger exists, no claim → not_invoiced */
const ebMissing: ExpectedBillable = {
  id: "mock-eb-ecg",
  budgetLineId: "mock-bl-ecg",
  studyId: STUDY,
  lineCode: "ECG",
  label: "ECG",
  category: "Procedure",
  visitName: "Visit 3",
  unit: "ea",
  expectedQuantity: 1,
  unitPrice: 120,
  expectedRevenue: 120,
}

/** Partially invoiced: claim + invoice line below expected */
const ebPartial: ExpectedBillable = {
  id: "mock-eb-cbc",
  budgetLineId: "mock-bl-cbc",
  studyId: STUDY,
  lineCode: "CBC",
  label: "CBC",
  category: "Labs",
  visitName: "Visit 2",
  unit: "ea",
  expectedQuantity: 1,
  unitPrice: 100,
  expectedRevenue: 100,
}

/** Blocked: requires review (still emits even if invoiced) */
const ebReview: ExpectedBillable = {
  id: "mock-eb-labs",
  budgetLineId: "mock-bl-labs",
  studyId: STUDY,
  lineCode: "LABS",
  label: "Labs panel",
  category: "Labs",
  visitName: "Screening",
  unit: "ea",
  expectedQuantity: 1,
  unitPrice: 200,
  expectedRevenue: 200,
}

/** Fully invoiced → omitted from leakage / Action Center */
const ebComplete: ExpectedBillable = {
  id: "mock-eb-mri",
  budgetLineId: "mock-bl-mri",
  studyId: STUDY,
  lineCode: "MRI",
  label: "MRI",
  category: "Procedure",
  visitName: "Visit 1",
  unit: "ea",
  expectedQuantity: 1,
  unitPrice: 150,
  expectedRevenue: 150,
}

const ledgerMissing: ClaimsLedgerRow = {
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-001",
  visitName: "Visit 3",
  eventDate: "2026-04-01T10:00:00.000Z",
  lineCode: "ECG",
  label: "ECG",
  amount: 120,
  approved: true,
  supportDocumentationComplete: true,
  eventLogId: "mock-evt-ecg",
}

const ledgerPartial: ClaimsLedgerRow = {
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-001",
  visitName: "Visit 2",
  eventDate: "2026-04-02T10:00:00.000Z",
  lineCode: "CBC",
  label: "CBC",
  amount: 100,
  approved: true,
  supportDocumentationComplete: true,
  billableInstanceId: "mock-bill-cbc",
  eventLogId: "mock-evt-cbc",
}

const ledgerReview: ClaimsLedgerRow = {
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-002",
  visitName: "Screening",
  eventDate: "2026-04-03T10:00:00.000Z",
  lineCode: "LABS",
  label: "Labs panel",
  amount: 200,
  approved: true,
  supportDocumentationComplete: true,
  billableInstanceId: "mock-bill-labs",
  eventLogId: "mock-evt-labs",
}

const ledgerComplete: ClaimsLedgerRow = {
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-003",
  visitName: "Visit 1",
  eventDate: "2026-04-04T10:00:00.000Z",
  lineCode: "MRI",
  label: "MRI",
  amount: 150,
  approved: true,
  supportDocumentationComplete: true,
  billableInstanceId: "mock-bill-mri",
  eventLogId: "mock-evt-mri",
}

const claimPartial: ClaimItem = {
  id: "mock-claim-cbc",
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-001",
  visitName: "Visit 2",
  eventDate: "2026-04-02T10:00:00.000Z",
  lineCode: "CBC",
  label: "CBC",
  amount: 100,
  status: "ready",
  requiresReview: false,
  approved: true,
  supportDocumentationComplete: true,
  billableInstanceId: "mock-bill-cbc",
  eventLogId: "mock-evt-cbc",
}

const claimReview: ClaimItem = {
  id: "mock-claim-labs",
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-002",
  visitName: "Screening",
  eventDate: "2026-04-03T10:00:00.000Z",
  lineCode: "LABS",
  label: "Labs panel",
  amount: 200,
  status: "ready",
  requiresReview: true,
  approved: true,
  supportDocumentationComplete: true,
  billableInstanceId: "mock-bill-labs",
  eventLogId: "mock-evt-labs",
}

const claimComplete: ClaimItem = {
  id: "mock-claim-mri",
  studyId: STUDY,
  sponsorId: SPONSOR,
  subjectId: "MOCK-SUB-003",
  visitName: "Visit 1",
  eventDate: "2026-04-04T10:00:00.000Z",
  lineCode: "MRI",
  label: "MRI",
  amount: 150,
  status: "ready",
  requiresReview: false,
  approved: true,
  supportDocumentationComplete: true,
  billableInstanceId: "mock-bill-mri",
  eventLogId: "mock-evt-mri",
}

const invLines: InvoiceLine[] = [
  {
    id: "mock-inv-ln-cbc",
    studyId: STUDY,
    sponsorId: SPONSOR,
    subjectId: "MOCK-SUB-001",
    visitName: "Visit 2",
    eventDate: "2026-04-02T10:00:00.000Z",
    lineCode: "CBC",
    label: "CBC",
    amount: 40,
    status: "ready",
    claimItemId: "mock-claim-cbc",
  },
  {
    id: "mock-inv-ln-labs",
    studyId: STUDY,
    sponsorId: SPONSOR,
    subjectId: "MOCK-SUB-002",
    visitName: "Screening",
    eventDate: "2026-04-03T10:00:00.000Z",
    lineCode: "LABS",
    label: "Labs panel",
    amount: 200,
    status: "ready",
    claimItemId: "mock-claim-labs",
  },
  {
    id: "mock-inv-ln-mri",
    studyId: STUDY,
    sponsorId: SPONSOR,
    subjectId: "MOCK-SUB-003",
    visitName: "Visit 1",
    eventDate: "2026-04-04T10:00:00.000Z",
    lineCode: "MRI",
    label: "MRI",
    amount: 150,
    status: "ready",
    claimItemId: "mock-claim-mri",
  },
]

const mockInvoicePackage: InvoicePackage = {
  schemaVersion: "1.0",
  studyId: STUDY,
  sponsorId: SPONSOR,
  invoicePeriodStart: "2026-04-01",
  invoicePeriodEnd: "2026-04-30",
  generatedAt: "2026-05-01T12:00:00.000Z",
  lines: invLines,
  subtotal: invLines.reduce((s, l) => s + l.amount, 0),
  lineCount: invLines.length,
  hasBlockingIssues: false,
}

/**
 * Pass-through input for `buildLeakageTrace(mockActionCenterInput)`.
 * Expect three emitted trace rows (MRI fully invoiced is suppressed).
 */
export const mockActionCenterInput = {
  expectedBillables: [ebMissing, ebPartial, ebReview, ebComplete],
  ledgerRows: [ledgerMissing, ledgerPartial, ledgerReview, ledgerComplete],
  claimItems: [claimPartial, claimReview, claimComplete],
  invoicePackages: [mockInvoicePackage],
} as const satisfies {
  expectedBillables: ExpectedBillable[]
  ledgerRows: ClaimsLedgerRow[]
  claimItems: ClaimItem[]
  invoicePackages: InvoicePackage[]
}
