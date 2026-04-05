/**
 * Document Engine v1 — deterministic demo SoA import rows for SoA → expected billables walkthrough.
 */

import type { CoreSoaImportRow } from "../to-core-soa-import-rows"

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
    visitName: null,
    activityName: "Physical Exam",
    quantity: 1,
    unitPrice: 120,
    totalPrice: 120,
    notes: "Day 1 visit label missing on source row",
    confidence: "high",
    importStatus: "needs_review",
    importWarnings: ["Missing visitName"],
  },
  {
    sourceRecordIndex: 2,
    visitName: "Day 7",
    activityName: "Lab Panel",
    quantity: 1,
    unitPrice: 85,
    totalPrice: 85,
    notes: null,
    confidence: "low",
    importStatus: "needs_review",
    importWarnings: ["Low confidence source"],
  },
  {
    sourceRecordIndex: 3,
    visitName: "Unscheduled",
    activityName: "Travel",
    quantity: 1,
    unitPrice: null,
    totalPrice: 350,
    notes: null,
    confidence: "medium",
    importStatus: "needs_review",
    importWarnings: ["Missing unitPrice"],
  },
]
