import type { ActionCenterOperationEnvelope } from "./types"
import type { ActionCenterOperationStatus } from "../summary/types"
import type { ReadOperationHistoryInput } from "./read-operation-history.types"

export type ReadOperationHistoryPageInput = ReadOperationHistoryInput & {
  cursor?: string
}

export type ReadOperationHistoryPageResult = {
  records: ActionCenterOperationEnvelope[]
  nextCursor: string | null
}

type OperationHistoryCursorPayload = {
  timestamp: string
  operationId: string
}

function encodeOperationHistoryCursor(payload: OperationHistoryCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64")
}

function decodeOperationHistoryCursor(cursor: string | undefined): OperationHistoryCursorPayload | null {
  if (!cursor) {
    return null
  }

  try {
    const json = Buffer.from(cursor, "base64").toString("utf8")
    const parsed = JSON.parse(json) as unknown

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as OperationHistoryCursorPayload).timestamp !== "string" ||
      typeof (parsed as OperationHistoryCursorPayload).operationId !== "string"
    ) {
      return null
    }

    return parsed as OperationHistoryCursorPayload
  } catch {
    return null
  }
}

export function filterOperationHistoryRows(
  rows: ActionCenterOperationEnvelope[],
  input: Pick<ReadOperationHistoryPageInput, "kind" | "status">,
): ActionCenterOperationEnvelope[] {
  let filtered = [...rows]

  if (input.kind) {
    filtered = filtered.filter((row) => row.kind === input.kind)
  }

  if (input.status) {
    filtered = filtered.filter((row) => row.status === input.status)
  }

  return filtered
}

export function sortOperationHistoryRows(
  rows: ActionCenterOperationEnvelope[],
): ActionCenterOperationEnvelope[] {
  return [...rows].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp)
    }

    return a.operationId.localeCompare(b.operationId)
  })
}

export function paginateOperationHistoryRows(
  rows: ActionCenterOperationEnvelope[],
  input: Pick<ReadOperationHistoryPageInput, "limit" | "cursor">,
): ReadOperationHistoryPageResult {
  const sorted = sortOperationHistoryRows(rows)
  const decoded = decodeOperationHistoryCursor(input.cursor)

  let startIndex = 0

  if (decoded) {
    const idx = sorted.findIndex(
      (row) => row.timestamp === decoded.timestamp && row.operationId === decoded.operationId,
    )

    if (idx >= 0) {
      startIndex = idx + 1
    }
  }

  const limit = input.limit && input.limit > 0 ? input.limit : sorted.length
  const pageRows = sorted.slice(startIndex, startIndex + limit)
  const hasMore = startIndex + limit < sorted.length
  const last = pageRows.length > 0 ? pageRows[pageRows.length - 1]! : null

  return {
    records: pageRows,
    nextCursor:
      hasMore && last
        ? encodeOperationHistoryCursor({
            timestamp: last.timestamp,
            operationId: last.operationId,
          })
        : null,
  }
}

export { decodeOperationHistoryCursor, encodeOperationHistoryCursor }
