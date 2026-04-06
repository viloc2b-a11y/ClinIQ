import type { ScenarioDraftAuthoringQueueItem } from "../scenario-draft-authoring-queue/types"

export type ScenarioDraftAuthoringWorkset = {
  worksetCode: string
  worksetPosition: number
  startQueuePosition: number | null
  endQueuePosition: number | null
  items: ScenarioDraftAuthoringQueueItem[]
  summary: {
    totalItems: number
    firstQueueItemCode: string | null
    lastQueueItemCode: string | null
    uniqueReviewPackCount: number
    nullFamilyItemCount: number
  }
}

export type ScenarioDraftAuthoringWorksetResult = {
  data: {
    worksets: ScenarioDraftAuthoringWorkset[]
  }
  summary: {
    totalWorksets: number
    totalQueueItems: number
    configuredWorksetSize: number
    firstWorksetCode: string | null
    lastWorksetCode: string | null
    worksetsWithNullFamilyItems: number
    maxWorksetSizeObserved: number
    minWorksetSizeObserved: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
