import type { SupabaseClient } from "@supabase/supabase-js"

import type { CreateBillableFromEventRpcParams } from "./types"

/**
 * Calls Postgres RPC `create_billable_from_event`.
 * Returns existing id on duplicate operational key; null if `auto_create_billable` is false for the fee row.
 */
export async function createBillableFromEvent(
  client: SupabaseClient,
  params: CreateBillableFromEventRpcParams,
): Promise<{ id: string | null; error: Error | null }> {
  const payload = {
    p_event_type: params.p_event_type,
    p_event_id: params.p_event_id,
    p_study_id: params.p_study_id,
    p_site_id: params.p_site_id,
    p_subject_id: params.p_subject_id ?? null,
    p_visit_id: params.p_visit_id ?? null,
    p_occurred_at: params.p_occurred_at ?? new Date().toISOString(),
  }

  const { data, error } = await client.rpc("create_billable_from_event", payload)

  if (error) {
    return { id: null, error: new Error(error.message) }
  }

  if (data == null) {
    return { id: null, error: null }
  }
  return { id: String(data), error: null }
}
