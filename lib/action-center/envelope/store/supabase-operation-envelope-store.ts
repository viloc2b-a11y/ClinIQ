import { getSupabaseClient } from "../../../integrations/supabase/client"
import type { ActionCenterOperationEnvelope } from "../types"
import type {
  ActionCenterVerifySummary,
  ActionCenterWriteAndVerifySummary,
  ActionCenterWriteSummary,
} from "../../summary/types"
import {
  decodeOperationHistoryCursor,
  encodeOperationHistoryCursor,
} from "../history-pagination"
import type {
  OperationEnvelopeStore,
  OperationEnvelopeStoreListInput,
  OperationEnvelopeStorePageInput,
  OperationEnvelopeStorePageResult,
} from "./types"

export class SupabaseOperationEnvelopeStore implements OperationEnvelopeStore {
  async append(envelope: ActionCenterOperationEnvelope): Promise<void> {
    const client = getSupabaseClient()
    if (!client) return

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

  async list(
    input: OperationEnvelopeStoreListInput = {},
  ): Promise<ActionCenterOperationEnvelope[]> {
    const page = await this.readPage(input)
    return page.records
  }

  async readPage(
    input: OperationEnvelopeStorePageInput = {},
  ): Promise<OperationEnvelopeStorePageResult> {
    const client = getSupabaseClient()
    if (!client) {
      return { records: [], nextCursor: null }
    }

    const pageSize = input.limit != null && input.limit > 0 ? input.limit : null
    const decoded = decodeOperationHistoryCursor(input.cursor)

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

    if (decoded) {
      query = query.gte("timestamp", decoded.timestamp)
    }

    if (pageSize !== null) {
      query = query.limit(pageSize + 1)
    }

    const { data, error } = await query

    if (error || !data) {
      return { records: [], nextCursor: null }
    }

    let rows: ActionCenterOperationEnvelope[] = data.map((row: Record<string, unknown>) => {
      const operationId = String(row.operation_id ?? "")
      const timestamp = row.timestamp != null ? String(row.timestamp) : ""
      const status = row.status as ActionCenterOperationEnvelope["status"]
      const kind = String(row.kind ?? "")

      if (kind === "write") {
        return {
          operationId,
          timestamp,
          kind,
          status,
          summary: (row.summary ?? {}) as ActionCenterWriteSummary,
        }
      }
      if (kind === "verify") {
        return {
          operationId,
          timestamp,
          kind,
          status,
          summary: (row.summary ?? {}) as ActionCenterVerifySummary,
        }
      }
      return {
        operationId,
        timestamp,
        kind: "write_and_verify",
        status,
        summary: (row.summary ?? {}) as ActionCenterWriteAndVerifySummary,
      }
    })

    if (decoded) {
      rows = rows.filter((row) => {
        if (row.timestamp > decoded.timestamp) return true
        if (row.timestamp < decoded.timestamp) return false
        return row.operationId > decoded.operationId
      })
    }

    if (pageSize === null) {
      return { records: rows, nextCursor: null }
    }

    const hasMore = rows.length > pageSize
    const records = hasMore ? rows.slice(0, pageSize) : rows
    const last = records.length > 0 ? records[records.length - 1]! : null

    return {
      records,
      nextCursor:
        hasMore && last
          ? encodeOperationHistoryCursor({
              timestamp: last.timestamp,
              operationId: last.operationId,
            })
          : null,
    }
  }

  async reset(): Promise<void> {
    const client = getSupabaseClient()
    if (!client) return

    await client
      .from("action_center_operation_envelopes")
      .delete()
      .gte("timestamp", "1900-01-01T00:00:00.000Z")
  }
}
