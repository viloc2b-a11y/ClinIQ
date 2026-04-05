import { getPersistenceAdapter } from "./persistence/get-adapter"

import type { ActionCenterRecord, ReadOptions } from "./persistence/types"

export async function readActionCenterRecords(
  options?: ReadOptions,
): Promise<ActionCenterRecord[]> {
  const adapter = getPersistenceAdapter()
  return adapter.readAll(options)
}
