import { getSupabaseClient } from "../../../integrations/supabase/client"
import { decodeAuditCursor, encodeAuditCursor } from "../pagination"
import type {
  ActionCenterAuditEntry,
  ActionCenterAuditStore,
  AuditStoreListInput,
  AuditStorePageInput,
  AuditStorePageResult,
} from "./types"

export class SupabaseActionCenterAuditStore implements ActionCenterAuditStore {
  async append(entry: ActionCenterAuditEntry): Promise<void> {
    const client = getSupabaseClient()
    if (!client) return

    await client.from("action_center_audit_log").upsert(
      {
        id: entry.id,
        step: entry.step,
        timestamp: entry.timestamp,
      },
      {
        onConflict: "id,step,timestamp",
        ignoreDuplicates: false,
      },
    )
  }

  async list(input: AuditStoreListInput = {}): Promise<ActionCenterAuditEntry[]> {
    const page = await this.readPage(input)
    return page.records
  }

  async readPage(input: AuditStorePageInput = {}): Promise<AuditStorePageResult> {
    const client = getSupabaseClient()
    if (!client) {
      return { records: [], nextCursor: null }
    }

    const pageSize = input.limit != null && input.limit > 0 ? input.limit : null
    const decoded = decodeAuditCursor(input.cursor)

    let query = client
      .from("action_center_audit_log")
      .select("*")
      .order("timestamp", { ascending: true })
      .order("id", { ascending: true })
      .order("step", { ascending: true })

    if (input.id) {
      query = query.eq("id", input.id)
    }

    if (input.step) {
      query = query.eq("step", input.step)
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

    let mapped: ActionCenterAuditEntry[] = data.map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      step: row.step as ActionCenterAuditEntry["step"],
      timestamp: row.timestamp != null ? String(row.timestamp) : "",
    }))

    if (decoded) {
      mapped = mapped.filter((row) => {
        if (row.timestamp > decoded.timestamp) return true
        if (row.timestamp < decoded.timestamp) return false
        if (row.id > decoded.id) return true
        if (row.id < decoded.id) return false
        return row.step > decoded.step
      })
    }

    if (pageSize === null) {
      return { records: mapped, nextCursor: null }
    }

    const hasMore = mapped.length > pageSize
    const records = hasMore ? mapped.slice(0, pageSize) : mapped
    const last = records.length > 0 ? records[records.length - 1]! : null

    return {
      records,
      nextCursor:
        hasMore && last
          ? encodeAuditCursor({
              timestamp: last.timestamp,
              id: last.id,
              step: last.step,
            })
          : null,
    }
  }

  async reset(): Promise<void> {
    const client = getSupabaseClient()
    if (!client) return

    await client
      .from("action_center_audit_log")
      .delete()
      .gte("timestamp", "1900-01-01T00:00:00.000Z")
  }
}
