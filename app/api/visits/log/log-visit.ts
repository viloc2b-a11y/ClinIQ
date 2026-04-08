export type LogVisitPayload = {
  study_id: string
  subject_id: string
  visit_name: string
  completed_by?: string | null
  timestamp?: string | null
  expected_billables?: unknown[]
}

export type LogVisitResult =
  | {
      ok: true
      study_id: string
      subject_id: string
      visit_name: string
      triggered_count: number
      events_emitted: number
      message: string
    }
  | { ok: false; error: string }

/**
 * Production-safe placeholder: logs are accepted but not persisted here.
 * Use `/api/ingest-event` for real execution-truth ingestion.
 */
export async function logVisit(_payload: LogVisitPayload): Promise<LogVisitResult> {
  return {
    ok: true,
    study_id: _payload.study_id,
    subject_id: _payload.subject_id,
    visit_name: _payload.visit_name,
    triggered_count: 0,
    events_emitted: 1,
    message: "Visit accepted (Node/TS).",
  }
}

