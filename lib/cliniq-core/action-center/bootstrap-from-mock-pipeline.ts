import { mockActionCenterInput } from "./mock-action-center-input"
import { writeThroughActionCenter } from "./write-through-action-center"

let bootstrapped = false

/** Clears the mock-pipeline bootstrap flag (paired with {@link resetMemoryActionCenterBootstrap}). */
export function resetBootstrapActionCenterFromMockPipeline(): void {
  bootstrapped = false
}

export async function bootstrapActionCenterFromMockPipeline(): Promise<void> {
  if (bootstrapped) return

  await writeThroughActionCenter(mockActionCenterInput)
  bootstrapped = true
}
