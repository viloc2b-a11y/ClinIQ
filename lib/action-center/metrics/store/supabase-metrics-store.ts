import { getSupabaseClient } from "../../../integrations/supabase/client"
import type { ActionCenterMetrics, ActionCenterMetricsStore } from "./types"

const METRICS_KEY = "global"

const DEFAULT_METRICS: ActionCenterMetrics = {
  writesAttempted: 0,
  writesSuccess: 0,
  writesFailed: 0,
}

export class SupabaseActionCenterMetricsStore implements ActionCenterMetricsStore {
  async get(): Promise<ActionCenterMetrics> {
    const client = getSupabaseClient()
    if (!client) {
      return { ...DEFAULT_METRICS }
    }

    const { data, error } = await client
      .from("action_center_metrics")
      .select("*")
      .eq("key", METRICS_KEY)
      .maybeSingle()

    if (error || !data) {
      return { ...DEFAULT_METRICS }
    }

    const row = data as Record<string, unknown>

    return {
      writesAttempted: Number(row.writes_attempted ?? 0),
      writesSuccess: Number(row.writes_success ?? 0),
      writesFailed: Number(row.writes_failed ?? 0),
    }
  }

  async set(metrics: ActionCenterMetrics): Promise<void> {
    const client = getSupabaseClient()
    if (!client) return

    await client.from("action_center_metrics").upsert(
      {
        key: METRICS_KEY,
        writes_attempted: metrics.writesAttempted,
        writes_success: metrics.writesSuccess,
        writes_failed: metrics.writesFailed,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
        ignoreDuplicates: false,
      },
    )
  }

  async reset(): Promise<void> {
    await this.set({ ...DEFAULT_METRICS })
  }
}
