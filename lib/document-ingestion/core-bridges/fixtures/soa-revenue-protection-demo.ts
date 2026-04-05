/**
 * Document Engine v1 — SoA import + invoice rows for full SoA → revenue-protection demo (deterministic).
 *
 * Scenario (after intake → structured → classification → billables → expected rows):
 * - Screening / Consent ↔ exact match
 * - Day 7 / Lab Panel ↔ same key, unit price mismatch
 * - Day 1 / Physical Exam → unmatched expected (no invoice row)
 * - Unscheduled / Travel Reimbursement → unmatched invoice (no SoA row)
 */

import type { CoreSoaImportRow } from "../to-core-soa-import-rows"
import type { InvoiceRow } from "../../matching/match-expected-to-invoice"

export const demoSoaImportRows: CoreSoaImportRow[] = [
  {
    sourceRecordIndex: 0,
    visitName: "Screening",
    activityName: "Consent",
    quantity: 1,
    unitPrice: 500,
    totalPrice: 500,
    notes: null,
    confidence: "high",
    importStatus: "ready",
    importWarnings: [],
  },
  {
    sourceRecordIndex: 1,
    visitName: "Day 7",
    activityName: "Lab Panel",
    quantity: 1,
    unitPrice: 85,
    totalPrice: 85,
    notes: null,
    confidence: "high",
    importStatus: "ready",
    importWarnings: [],
  },
  {
    sourceRecordIndex: 2,
    visitName: "Day 1",
    activityName: "Physical Exam",
    quantity: 1,
    unitPrice: 120,
    totalPrice: 120,
    notes: null,
    confidence: "high",
    importStatus: "ready",
    importWarnings: [],
  },
]

export const demoInvoiceRows: InvoiceRow[] = [
  {
    sourceRecordIndex: 0,
    visitName: "Screening",
    activityName: "Consent",
    quantity: 1,
    unitPrice: 500,
    totalPrice: 500,
    notes: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
  },
  {
    sourceRecordIndex: 1,
    visitName: "Day 7",
    activityName: "Lab Panel",
    quantity: 1,
    unitPrice: 99,
    totalPrice: 85,
    notes: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
  },
  {
    sourceRecordIndex: 2,
    visitName: "Unscheduled",
    activityName: "Travel Reimbursement",
    quantity: 1,
    unitPrice: 350,
    totalPrice: 350,
    notes: null,
    confidence: "medium",
    needsReview: false,
    reviewReasons: [],
  },
]
