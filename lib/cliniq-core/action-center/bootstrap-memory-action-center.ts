/**
 * STEP 5 — Seed in-memory Action Center once from the mock financial pipeline.
 * When `CLINIQ_ACTION_CENTER_PERSISTENCE_MODE=supabase`, this is a **no-op** (real data lives in DB).
 */
import {
  bootstrapActionCenterFromMockPipeline,
  resetBootstrapActionCenterFromMockPipeline,
} from "./bootstrap-from-mock-pipeline"
import { isSupabasePersistenceEnabled } from "./persistence-config"

let bootstrapped = false

/** Clears bootstrap flag so the next request re-seeds memory (tests / hot reload). */
export function resetMemoryActionCenterBootstrap(): void {
  bootstrapped = false
  resetBootstrapActionCenterFromMockPipeline()
}

export async function bootstrapMemoryActionCenter(): Promise<void> {
  if (bootstrapped || isSupabasePersistenceEnabled()) {
    return
  }

  await bootstrapActionCenterFromMockPipeline()
  bootstrapped = true
}
