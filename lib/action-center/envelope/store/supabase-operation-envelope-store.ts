import { getSupabaseClient } from "../../../integrations/supabase/client"

import type { ActionCenterOperationEnvelope } from "../types"
import type { OperationEnvelopeStore, OperationEnvelopeStoreListInput } from "./types"

export class SupabaseOperationEnvelopeStore implements OperationEnvelopeStore {
  async append(envelope: ActionCenterOperationEnvelope): Promise<void> {
    const client = getSupabaseClient()
    if (!client) {
      return
    }

    await client.from("action_center_operation_envelopes").upsert(
      {
        operation_id: envelope.operationId,
        timestamp: envelope.timestamp,
        kind: envelope.kind,
        status: envelope.status,
        summary: envelope.summary,
      },
      {
        onConflict: "operation_id",
        ignoreDuplicates: false,
      },
    )
  }

  async list(input: OperationEnvelopeStoreListInput = {}): Promise<ActionCenterOperationEnvelope[]> {
    const client = getSupabaseClient()
    if (!client) {
      return []
    }

    let query = client
      .from("action_center_operation_envelopes")
      .select("*")
      .order("timestamp", { ascending: true })
      .order("operation_id", { ascending: true })

    if (input.kind) {
      query = query.eq("kind", input.kind)
    }

    if (input.status) {
      query = query.eq("status", input.status)
    }

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map((row: Record<string, unknown>) => ({
      operationId: String(row.operation_id ?? ""),
      timestamp: row.timestamp != null ? String(row.timestamp) : "",
      kind: row.kind as ActionCenterOperationEnvelope["kind"],
      status: row.status as ActionCenterOperationEnvelope["status"],
      summary: row.summary,
    })) as ActionCenterOperationEnvelope[]
  }

  async reset(): Promise<void> {
    const client = getSupabaseClient()
    if (!client) {
      return
    }

    await client
      .from("action_center_operation_envelopes")
      .delete()
      .gte("timestamp", "1900-01-01T00:00:00.000Z")
  }
}
