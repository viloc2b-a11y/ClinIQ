import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Calls Postgres RPC `promote_earned_to_invoiceable`.
 * Pass null/undefined to batch-update all eligible rows.
 */
export async function promoteEarnedToInvoiceable(
  client: SupabaseClient,
  billableId?: string | null,
): Promise<{ updatedCount: number; error: Error | null }> {
  const { data, error } = await client.rpc("promote_earned_to_invoiceable", {
    p_billable_id: billableId ?? null,
  })

  if (error) {
    return { updatedCount: 0, error: new Error(error.message) }
  }

  const n = typeof data === "number" ? data : Number(data)
  return { updatedCount: Number.isFinite(n) ? n : 0, error: null }
}
