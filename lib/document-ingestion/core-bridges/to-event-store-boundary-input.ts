/**
 * Document Engine v1 — handoff payload → Action Center / `cliniq_action_items` row shape (no persistence).
 *
 * Target contract: {@link ActionItemRow} in `lib/cliniq-core/action-center/persistence-types.ts`,
 * aligned with `supabase/schema/cliniq_action_center_v1.sql` (`public.cliniq_action_items`).
 */

import type { ActionItemRow } from "../../cliniq-core/action-center/persistence-types"

import type { EventStoreHandoffPayload } from "./to-event-store-handoff-payload"
import type { EventStoreWriteInputRow } from "./to-event-store-write-input"

export type { ActionItemRow }

export type EventStoreBoundaryInputRow = ActionItemRow

const EMPTY_EVENTS_WARNING = "No handoff events provided for event-store boundary input."

/**
 * Placeholders: document-ingested revenue reviews do not carry study/subject context yet.
 * Persistence layer must replace before or during real insert.
 */
const PLACEHOLDER_STUDY_ID = "document-engine:pending-study"
const PLACEHOLDER_SUBJECT_ID = "document-engine:pending-subject"

/** Static timestamps only — real writes should use DB defaults or server clock at insert time. */
const PLACEHOLDER_TIMESTAMPTZ = "1970-01-01T00:00:00.000Z"

const PLACEHOLDER_FIELDS_WARNING =
  "Boundary rows use placeholder study_id, subject_id, amounts (0), and static timestamps; replace at persistence time."

function splitMatchKey(matchKey: string): { visitName: string; lineCode: string } {
  const idx = matchKey.indexOf("::")
  if (idx < 0) {
    const v = matchKey.trim()
    return { visitName: v || "document-engine:unspecified", lineCode: "-" }
  }
  const visitName = matchKey.slice(0, idx).trim() || "document-engine:unspecified"
  const lineCode = matchKey.slice(idx + 2).trim() || "-"
  return { visitName, lineCode }
}

function priorityToLabel(priority: EventStoreWriteInputRow["priority"]): "high" | "medium" | "low" {
  if (priority === 1) return "high"
  if (priority === 2) return "medium"
  return "low"
}

function leakageFromSignal(
  signal: EventStoreWriteInputRow["sourceSignalType"],
): Pick<ActionItemRow, "leakage_status" | "leakage_reason"> {
  switch (signal) {
    case "missing_invoice":
      return { leakage_status: "missing", leakage_reason: "not_invoiced" }
    case "unexpected_invoice":
      return { leakage_status: "not_invoice_ready", leakage_reason: "requires_review" }
    case "quantity_mismatch":
    case "unit_price_mismatch":
    case "total_price_mismatch":
      return { leakage_status: "partial", leakage_reason: "partially_invoiced" }
    case "incomplete_comparison":
      return { leakage_status: "not_invoice_ready", leakage_reason: "requires_review" }
  }
}

function handoffEventToBoundaryRow(
  e: EventStoreWriteInputRow,
  handoffDocumentId: string | null,
): ActionItemRow {
  const { visitName, lineCode } = splitMatchKey(e.matchKey)
  const { leakage_status, leakage_reason } = leakageFromSignal(e.sourceSignalType)

  return {
    id: e.clientEventId,
    study_id: PLACEHOLDER_STUDY_ID,
    sponsor_id: null,
    subject_id: PLACEHOLDER_SUBJECT_ID,
    visit_name: visitName,
    line_code: lineCode,
    action_type: e.eventType,
    owner_role: "manual_review",
    priority: priorityToLabel(e.priority),
    status: e.eventStatus,
    title: e.title,
    description: e.description,
    expected_amount: 0,
    invoiced_amount: 0,
    missing_amount: 0,
    leakage_status,
    leakage_reason,
    event_log_id: null,
    billable_instance_id: null,
    invoice_period_start: null,
    invoice_period_end: null,
    source_hash: null,
    metadata: {
      documentEngine: {
        handoffDocumentId,
        clientEventId: e.clientEventId,
        sourceDocumentId: e.sourceDocumentId,
        sourceActionId: e.sourceActionId,
        sourceDraftEventId: e.sourceDraftEventId,
        sourceSignalType: e.sourceSignalType,
        sourceActionType: e.sourceActionType,
        matchKey: e.matchKey,
        expectedIndex: e.expectedIndex,
        invoiceIndex: e.invoiceIndex,
        reasons: [...e.reasons],
        handoffMetadata: { ...e.metadata },
      },
    },
    created_at: PLACEHOLDER_TIMESTAMPTZ,
    updated_at: PLACEHOLDER_TIMESTAMPTZ,
    resolved_at: null,
  }
}

export function toEventStoreBoundaryInput(input: {
  payload: EventStoreHandoffPayload
}): {
  rows: EventStoreBoundaryInputRow[]
  summary: {
    totalInputEvents: number
    totalBoundaryRows: number
    priority1Count: number
    priority2Count: number
    priority3Count: number
    highSeverityCount: number
    mediumSeverityCount: number
    lowSeverityCount: number
  }
  warnings: string[]
} {
  const { payload } = input
  const events = payload.events

  const warnings: string[] = []
  if (events.length === 0) {
    warnings.push(EMPTY_EVENTS_WARNING)
  }

  const rows = events.map((e) => handoffEventToBoundaryRow(e, payload.documentId))

  if (events.length > 0) {
    warnings.push(PLACEHOLDER_FIELDS_WARNING)
  }

  const priority1Count = events.filter((e) => e.priority === 1).length
  const priority2Count = events.filter((e) => e.priority === 2).length
  const priority3Count = events.filter((e) => e.priority === 3).length
  const highSeverityCount = events.filter((e) => e.severity === "high").length
  const mediumSeverityCount = events.filter((e) => e.severity === "medium").length
  const lowSeverityCount = events.filter((e) => e.severity === "low").length

  return {
    rows,
    summary: {
      totalInputEvents: events.length,
      totalBoundaryRows: rows.length,
      priority1Count,
      priority2Count,
      priority3Count,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
    },
    warnings,
  }
}
