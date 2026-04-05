import { getSupabaseClient } from "../../integrations/supabase/client"
import { decodeActionCenterCursor, encodeActionCenterCursor } from "../pagination/cursor"

import type {
  ActionCenterPersistenceAdapter,
  ActionCenterRecord,
  ReadOptions,
  ReadPageResult,
} from "./types"

function mapRow(r: any): ActionCenterRecord {
  return {
    id: String(r.id ?? ""),
    type: String(r.type ?? ""),
    payload: r.payload,
    createdAt: r.created_at != null ? String(r.created_at) : "",
  }
}

export class SupabasePersistenceAdapter implements ActionCenterPersistenceAdapter {
  async write(records: ActionCenterRecord[]): Promise<{ written: number }> {
    const client = getSupabaseClient()

    if (!client || !records.length) {
      return { written: 0 }
    }

    const rows = records.map((r) => ({
      id: r.id,
      type: r.type,
      payload: r.payload,
      created_at: r.createdAt,
    }))

    const { data, error } = await client
      .from("action_center_records")
      .upsert(rows, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select("id")

    if (error) {
      return { written: 0 }
    }

    return { written: Array.isArray(data) ? data.length : 0 }
  }

  async readPage(options?: ReadOptions): Promise<ReadPageResult> {
    const client = getSupabaseClient()
    if (!client) {
      return { records: [], nextCursor: null }
    }

    const decoded = decodeActionCenterCursor(options?.cursor)
    const posLimit = options?.limit && options.limit > 0 ? options.limit : null

    if (!decoded && !options?.afterId && posLimit === null) {
      const { data, error } = await client
        .from("action_center_records")
        .select("*")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })

      if (error || !data) {
        return { records: [], nextCursor: null }
      }

      return { records: data.map(mapRow), nextCursor: null }
    }

    if (posLimit === null) {
      let query = client
        .from("action_center_records")
        .select("*")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })

      if (decoded) {
        query = query.gte("created_at", decoded.createdAt)
      } else if (options?.afterId) {
        const { data: anchor } = await client
          .from("action_center_records")
          .select("created_at")
          .eq("id", options.afterId)
          .maybeSingle()

        if (anchor?.created_at == null) {
          return { records: [], nextCursor: null }
        }

        query = query.gt("created_at", anchor.created_at)
      }

      const { data, error } = await query

      if (error || !data) {
        return { records: [], nextCursor: null }
      }

      let rows = data.map(mapRow)

      if (decoded) {
        rows = rows.filter(
          (r) =>
            r.createdAt > decoded.createdAt ||
            (r.createdAt === decoded.createdAt && r.id > decoded.id),
        )
      }

      return { records: rows, nextCursor: null }
    }

    const limit = posLimit

    let query = client
      .from("action_center_records")
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(limit + 1)

    if (decoded) {
      query = query.gte("created_at", decoded.createdAt)
    } else if (options?.afterId) {
      const { data: anchor } = await client
        .from("action_center_records")
        .select("created_at")
        .eq("id", options.afterId)
        .maybeSingle()

      if (anchor?.created_at != null) {
        query = query.gt("created_at", anchor.created_at)
      }
    }

    const { data, error } = await query

    if (error || !data) {
      return { records: [], nextCursor: null }
    }

    let rows = data.map(mapRow)

    if (decoded) {
      rows = rows.filter(
        (r) =>
          r.createdAt > decoded.createdAt ||
          (r.createdAt === decoded.createdAt && r.id > decoded.id),
      )
    }

    const hasMore = rows.length > limit
    const records = hasMore ? rows.slice(0, limit) : rows
    const last = records.length > 0 ? records[records.length - 1]! : null

    return {
      records,
      nextCursor:
        hasMore && last
          ? encodeActionCenterCursor({
              createdAt: last.createdAt,
              id: last.id,
            })
          : null,
    }
  }

  async readAll(options?: ReadOptions): Promise<ActionCenterRecord[]> {
    const page = await this.readPage(options)
    return page.records
  }
}
