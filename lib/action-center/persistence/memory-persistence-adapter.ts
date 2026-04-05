import { decodeActionCenterCursor, encodeActionCenterCursor } from "../pagination/cursor"

import type { ActionCenterPersistenceAdapter, ActionCenterRecord, ReadOptions, ReadPageResult } from "./types"

/** In-memory store per adapter instance (deterministic, test-safe). */
export class MemoryPersistenceAdapter implements ActionCenterPersistenceAdapter {
  private readonly records: ActionCenterRecord[] = []

  async write(records: ActionCenterRecord[]): Promise<{ written: number }> {
    if (!records || records.length === 0) {
      return { written: 0 }
    }
    this.records.push(...records.map((r) => ({ ...r })))
    return { written: records.length }
  }

  async readPage(options?: ReadOptions): Promise<ReadPageResult> {
    const sorted = [...this.records].sort((a, b) => {
      const byTime = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (byTime !== 0) {
        return byTime
      }
      return a.id.localeCompare(b.id)
    })

    let startIndex = 0

    const decoded = decodeActionCenterCursor(options?.cursor)

    if (decoded) {
      const idx = sorted.findIndex((r) => r.createdAt === decoded.createdAt && r.id === decoded.id)
      if (idx >= 0) {
        startIndex = idx + 1
      }
    } else if (options?.afterId) {
      const idx = sorted.findIndex((r) => r.id === options.afterId)
      if (idx >= 0) {
        startIndex = idx + 1
      }
    }

    const limit =
      options?.limit && options.limit > 0 ? options.limit : sorted.length

    const records = sorted.slice(startIndex, startIndex + limit).map((r) => ({ ...r }))

    const last = records.length > 0 ? records[records.length - 1]! : null
    const hasMore = startIndex + limit < sorted.length

    return {
      records,
      nextCursor:
        hasMore && last
          ? encodeActionCenterCursor({
              createdAt: last.createdAt,
              id: last.id,
            })
          : null,
    }
  }

  async readAll(options?: ReadOptions): Promise<ActionCenterRecord[]> {
    const page = await this.readPage(options)
    return page.records
  }
}
