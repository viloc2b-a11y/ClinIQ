import { getPersistenceAdapter } from "./persistence/get-adapter"

import type { ReadOptions, ReadPageResult } from "./persistence/types"

export async function readActionCenterRecordsPage(
  options?: ReadOptions,
): Promise<ReadPageResult> {
  const adapter = getPersistenceAdapter()

  if (typeof adapter.readPage === "function") {
    return adapter.readPage(options)
  }

  const records = await adapter.readAll(options)

  return {
    records,
    nextCursor: null,
  }
}
