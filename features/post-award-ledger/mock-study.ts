import type { InternalBudgetLine } from "@/lib/cliniq-core/budget-gap/types"
import type { EventLog } from "@/lib/cliniq-core/post-award-ledger"

/** Demo study id for the minimal ledger page */
export const mockPostAwardStudyId = "LEDGER-DEMO-1"

/**
 * Small internal budget: startup, visit series, lab — used only for Module 5 demo.
 */
export const mockPostAwardInternalLines: InternalBudgetLine[] = [
  {
    id: "demo-su",
    category: "Startup",
    lineCode: "SU",
    label: "Site startup",
    visitName: "N/A",
    quantity: 1,
    unit: "ls",
    internalUnitCost: 12_000,
    internalTotal: 12_000,
    notes: "",
    source: "internal-model",
  },
  {
    id: "demo-v1",
    category: "Visit",
    lineCode: "V1",
    label: "On-site visit",
    visitName: "V1",
    quantity: 10,
    unit: "v",
    internalUnitCost: 500,
    internalTotal: 5_000,
    notes: "",
    source: "internal-model",
  },
  {
    id: "demo-lab",
    category: "Lab",
    lineCode: "LAB",
    label: "Central lab bundle",
    visitName: "V1",
    quantity: 10,
    unit: "ea",
    internalUnitCost: 200,
    internalTotal: 2_000,
    notes: "",
    source: "internal-model",
  },
]

/**
 * Partial execution: startup done, 6 of 10 visits, no lab draws → leakage on V1 + LAB.
 */
export const mockPostAwardEventLogs: EventLog[] = [
  {
    id: "demo-e-su",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-02-01T14:00:00.000Z",
    eventType: "startup_completed",
    lineCode: "SU",
    quantity: 1,
  },
  {
    id: "demo-e-v1-0",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-02-02T09:00:00.000Z",
    eventType: "visit_completed",
    patientId: "P-1",
    lineCode: "V1",
    quantity: 1,
  },
  {
    id: "demo-e-v1-1",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-02-09T09:00:00.000Z",
    eventType: "visit_completed",
    patientId: "P-2",
    lineCode: "V1",
    quantity: 1,
  },
  {
    id: "demo-e-v1-2",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-02-16T09:00:00.000Z",
    eventType: "visit_completed",
    patientId: "P-3",
    lineCode: "V1",
    quantity: 1,
  },
  {
    id: "demo-e-v1-3",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-02-23T09:00:00.000Z",
    eventType: "visit_completed",
    patientId: "P-4",
    lineCode: "V1",
    quantity: 1,
  },
  {
    id: "demo-e-v1-4",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-03-02T09:00:00.000Z",
    eventType: "visit_completed",
    patientId: "P-5",
    lineCode: "V1",
    quantity: 1,
  },
  {
    id: "demo-e-v1-5",
    studyId: mockPostAwardStudyId,
    occurredAt: "2026-03-09T09:00:00.000Z",
    eventType: "visit_completed",
    patientId: "P-6",
    lineCode: "V1",
    quantity: 1,
  },
]
