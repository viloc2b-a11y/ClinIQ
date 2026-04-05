import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { mapActionCenterItemToRow, mapRowToActionCenterItem } from "./persistence-mappers"
import type { ActionCenterPersistenceAdapter } from "./persistence-adapter"
import type { ActionItemRow } from "./persistence-types"
import type { ActionCenterItem } from "./types"

/**
 * Stable, adapter-level error `message` values. No silent recovery and **no fallback to memory** here —
 * use `getActionCenterPersistenceMode()` / env to stay on memory when Supabase is unavailable.
 */
export const SUPABASE_ADAPTER_ERROR = {
  missingSupabaseEnv: "missing_supabase_env",
  failedToListActionItems: "failed_to_list_action_items",
  failedToUpsertActionItems: "failed_to_upsert_action_items",
  actionItemNotFound: "action_item_not_found",
  failedToUpdateActionItemStatus: "failed_to_update_action_item_status",
  failedToAppendActionItemEvent: "failed_to_append_action_item_event",
} as const

function throwAdapterError(message: (typeof SUPABASE_ADAPTER_ERROR)[keyof typeof SUPABASE_ADAPTER_ERROR]): never {
  throw new Error(message)
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "string" && value.trim() !== "") return Number(value)
  return 0
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return String(value)
}

function toMetadata(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/** Maps a PostgREST row for `cliniq_action_items` into {@link ActionItemRow}. */
export function dbRowToActionItemRow(row: Record<string, unknown>): ActionItemRow {
  return {
    id: String(row.id),
    study_id: String(row.study_id),
    sponsor_id: toStringOrNull(row.sponsor_id),
    subject_id: String(row.subject_id),
    visit_name: String(row.visit_name),
    line_code: String(row.line_code),
    action_type: String(row.action_type),
    owner_role: String(row.owner_role),
    priority: String(row.priority),
    status: String(row.status),
    title: String(row.title),
    description: String(row.description),
    expected_amount: toNumber(row.expected_amount),
    invoiced_amount: toNumber(row.invoiced_amount),
    missing_amount: toNumber(row.missing_amount),
    leakage_status: String(row.leakage_status),
    leakage_reason: String(row.leakage_reason),
    event_log_id: toStringOrNull(row.event_log_id),
    billable_instance_id: toStringOrNull(row.billable_instance_id),
    invoice_period_start: toStringOrNull(row.invoice_period_start),
    invoice_period_end: toStringOrNull(row.invoice_period_end),
    source_hash: toStringOrNull(row.source_hash),
    metadata: toMetadata(row.metadata),
    created_at: row.created_at != null ? String(row.created_at) : new Date().toISOString(),
    updated_at: row.updated_at != null ? String(row.updated_at) : new Date().toISOString(),
    resolved_at: toStringOrNull(row.resolved_at),
  }
}

/** high → medium → low → anything else (deterministic client-side ordering). */
function prioritySortRank(priority: string): number {
  if (priority === "high") return 0
  if (priority === "medium") return 1
  if (priority === "low") return 2
  return 3
}

/** Matches product queue ordering: priority, then missing amount, then id. */
function compareActionItemsForList(a: ActionCenterItem, b: ActionCenterItem): number {
  const pr = prioritySortRank(a.priority) - prioritySortRank(b.priority)
  if (pr !== 0) return pr
  if (b.missingAmount !== a.missingAmount) {
    return b.missingAmount - a.missingAmount
  }
  return a.id.localeCompare(b.id)
}

function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""

  if (url === "" || key === "") {
    throwAdapterError(SUPABASE_ADAPTER_ERROR.missingSupabaseEnv)
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Supabase-backed {@link ActionCenterPersistenceAdapter}. Inject a {@link SupabaseClient}
 * (typically service role, server-side). Not wired into API routes yet.
 */
// Future:
// - write action center snapshots to cliniq_action_center_snapshots
// - hydrate summary directly from persisted state if needed

export class SupabasePersistenceAdapter implements ActionCenterPersistenceAdapter {
  constructor(private readonly client: SupabaseClient = createSupabaseAdminClient()) {}

  async listActionItems(): Promise<ActionCenterItem[]> {
    const { data, error } = await this.client
      .from("cliniq_action_items")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throwAdapterError(SUPABASE_ADAPTER_ERROR.failedToListActionItems)
    }

    const rows = (data ?? []) as Record<string, unknown>[]
    const items = rows.map((row) => mapRowToActionCenterItem(dbRowToActionItemRow(row)))
    items.sort(compareActionItemsForList)
    return items
  }

  async upsertActionItems(items: ActionCenterItem[]): Promise<void> {
    if (items.length === 0) return
    const records = items.map((item) => mapActionCenterItemToRow(item))
    const { error } = await this.client.from("cliniq_action_items").upsert(records, {
      onConflict: "id",
    })
    if (error) {
      throwAdapterError(SUPABASE_ADAPTER_ERROR.failedToUpsertActionItems)
    }
  }

  async updateActionItemStatus(params: {
    itemId: string
    status: "open" | "in_progress" | "blocked" | "resolved"
  }): Promise<void> {
    const now = new Date().toISOString()
    const patch: Record<string, unknown> = {
      status: params.status,
      updated_at: now,
      resolved_at: params.status === "resolved" ? now : null,
    }
    const { data, error } = await this.client
      .from("cliniq_action_items")
      .update(patch)
      .eq("id", params.itemId)
      .select("id")

    if (error) {
      throw new Error("failed_to_update_action_item_status")
    }

    if (!data?.length) {
      throw new Error("action_item_not_found")
    }
  }

  async appendActionItemEvent(params: {
    actionItemId: string
    eventType: string
    fromStatus?: string
    toStatus?: string
    actorType?: string
    actorId?: string
    note?: string
    payload?: Record<string, unknown>
  }): Promise<void> {
    const row = {
      action_item_id: params.actionItemId,
      event_type: params.eventType,
      from_status: params.fromStatus ?? null,
      to_status: params.toStatus ?? null,
      actor_type: params.actorType ?? "system",
      actor_id: params.actorId ?? null,
      note: params.note ?? null,
      payload: params.payload ?? {},
    }
    const { error } = await this.client.from("cliniq_action_item_events").insert(row)
    if (error) {
      throwAdapterError(SUPABASE_ADAPTER_ERROR.failedToAppendActionItemEvent)
    }
  }
}

export function createSupabasePersistenceAdapter(): ActionCenterPersistenceAdapter {
  return new SupabasePersistenceAdapter()
}
