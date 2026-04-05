import type {
  ActionCenterPersistenceAdapter,
  ActionCenterRecord,
  ReadOptions,
  ReadPageResult,
} from "./types"

/** Stub adapter — counts writes, no I/O (additive placeholder). */
export class RealPersistenceAdapter implements ActionCenterPersistenceAdapter {
  async write(records: ActionCenterRecord[]): Promise<{ written: number }> {
    return { written: records?.length ?? 0 }
  }

  async readPage(_options?: ReadOptions): Promise<ReadPageResult> {
    return { records: [], nextCursor: null }
  }

  async readAll(options?: ReadOptions): Promise<ActionCenterRecord[]> {
    const page = await this.readPage(options)
    return page.records
  }
}
