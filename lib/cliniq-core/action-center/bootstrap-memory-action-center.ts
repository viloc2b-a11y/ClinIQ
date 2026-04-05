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

  try {
    await bootstrapActionCenterFromMockPipeline()
  } catch {
    throw new Error("failed_to_bootstrap_memory_action_center")
  }
  bootstrapped = true
}
