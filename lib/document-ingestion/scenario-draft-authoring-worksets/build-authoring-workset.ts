import type { ScenarioDraftAuthoringQueueItem } from "../scenario-draft-authoring-queue/types"
import { buildWorksetCode } from "./build-workset-code"
import type { ScenarioDraftAuthoringWorkset } from "./types"

export function buildAuthoringWorkset(args: {
  worksetPosition: number
  items: ScenarioDraftAuthoringQueueItem[]
}): ScenarioDraftAuthoringWorkset {
  const uniqueReviewPackCount = new Set(args.items.map((item) => item.reviewPackCode)).size

  const nullFamilyItemCount = args.items.filter((item) => item.familyKey === null).length

  return {
    worksetCode: buildWorksetCode(args.worksetPosition),
    worksetPosition: args.worksetPosition,
    startQueuePosition: args.items[0]?.queuePosition ?? null,
    endQueuePosition: args.items[args.items.length - 1]?.queuePosition ?? null,
    items: [...args.items],
    summary: {
      totalItems: args.items.length,
      firstQueueItemCode: args.items[0]?.globalQueueCode ?? null,
      lastQueueItemCode: args.items[args.items.length - 1]?.globalQueueCode ?? null,
      uniqueReviewPackCount,
      nullFamilyItemCount,
    },
  }
}
