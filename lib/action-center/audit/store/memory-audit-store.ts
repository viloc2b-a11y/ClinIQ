import {
  filterAuditRows,
  paginateAuditRows,
  sortAuditRows,
} from "../pagination"
import type {
  ActionCenterAuditEntry,
  ActionCenterAuditStore,
  AuditStoreListInput,
  AuditStorePageInput,
  AuditStorePageResult,
} from "./types"

const rows: ActionCenterAuditEntry[] = []

export class MemoryActionCenterAuditStore implements ActionCenterAuditStore {
  async append(entry: ActionCenterAuditEntry): Promise<void> {
    rows.push(entry)
  }

  async list(input: AuditStoreListInput = {}): Promise<ActionCenterAuditEntry[]> {
    const filtered = filterAuditRows(rows, input)
    let result = sortAuditRows(filtered)

    if (input.limit && input.limit > 0) {
      result = result.slice(-input.limit)
    }

    return result
  }

  async readPage(input: AuditStorePageInput = {}): Promise<AuditStorePageResult> {
    const filtered = filterAuditRows(rows, input)
    return paginateAuditRows(filtered, input)
  }

  async reset(): Promise<void> {
    rows.length = 0
  }
}
