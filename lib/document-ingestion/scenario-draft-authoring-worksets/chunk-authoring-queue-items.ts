import type { ScenarioDraftAuthoringQueueItem } from "../scenario-draft-authoring-queue/types"

export function chunkAuthoringQueueItems(
  queueItems: ScenarioDraftAuthoringQueueItem[],
  chunkSize: number,
): ScenarioDraftAuthoringQueueItem[][] {
  if (chunkSize <= 0) return []

  const chunks: ScenarioDraftAuthoringQueueItem[][] = []

  for (let index = 0; index < queueItems.length; index += chunkSize) {
    chunks.push(queueItems.slice(index, index + chunkSize))
  }

  return chunks
}
