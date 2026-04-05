import type {
  ActionCenterAuditEntry,
  AuditStoreListInput,
  AuditStorePageInput,
  AuditStorePageResult,
} from "./store/types"

type AuditCursorPayload = {
  timestamp: string
  id: string
  step: string
}

export function encodeAuditCursor(payload: AuditCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64")
}

export function decodeAuditCursor(cursor: string | undefined): AuditCursorPayload | null {
  if (!cursor) return null

  try {
    const json = Buffer.from(cursor, "base64").toString("utf8")
    const parsed = JSON.parse(json) as unknown

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as AuditCursorPayload).timestamp !== "string" ||
      typeof (parsed as AuditCursorPayload).id !== "string" ||
      typeof (parsed as AuditCursorPayload).step !== "string"
    ) {
      return null
    }

    return parsed as AuditCursorPayload
  } catch {
    return null
  }
}

export function filterAuditRows(
  rows: ActionCenterAuditEntry[],
  input: Pick<AuditStoreListInput, "id" | "step">,
): ActionCenterAuditEntry[] {
  let filtered = [...rows]

  if (input.id) {
    filtered = filtered.filter((row) => row.id === input.id)
  }

  if (input.step) {
    filtered = filtered.filter((row) => row.step === input.step)
  }

  return filtered
}

export function sortAuditRows(rows: ActionCenterAuditEntry[]): ActionCenterAuditEntry[] {
  return [...rows].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp)
    }

    if (a.id !== b.id) {
      return a.id.localeCompare(b.id)
    }

    return a.step.localeCompare(b.step)
  })
}

export function paginateAuditRows(
  rows: ActionCenterAuditEntry[],
  input: Pick<AuditStorePageInput, "limit" | "cursor">,
): AuditStorePageResult {
  const sorted = sortAuditRows(rows)
  const decoded = decodeAuditCursor(input.cursor)

  let startIndex = 0

  if (decoded) {
    const idx = sorted.findIndex(
      (row) =>
        row.timestamp === decoded.timestamp &&
        row.id === decoded.id &&
        row.step === decoded.step,
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
        ? encodeAuditCursor({
            timestamp: last.timestamp,
            id: last.id,
            step: last.step,
          })
        : null,
  }
}
