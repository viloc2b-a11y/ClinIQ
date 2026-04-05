import type { ActionCenterOperationEnvelope } from "../types"
import {
  filterOperationHistoryRows,
  paginateOperationHistoryRows,
  sortOperationHistoryRows,
} from "../history-pagination"
import type {
  OperationEnvelopeStore,
  OperationEnvelopeStoreListInput,
  OperationEnvelopeStorePageInput,
  OperationEnvelopeStorePageResult,
} from "./types"

const rows: ActionCenterOperationEnvelope[] = []

export class MemoryOperationEnvelopeStore implements OperationEnvelopeStore {
  async append(envelope: ActionCenterOperationEnvelope): Promise<void> {
    rows.push(envelope)
  }

  async list(
    input: OperationEnvelopeStoreListInput = {},
  ): Promise<ActionCenterOperationEnvelope[]> {
    const filtered = filterOperationHistoryRows(rows, input)
    return sortOperationHistoryRows(filtered)
  }

  async readPage(
    input: OperationEnvelopeStorePageInput = {},
  ): Promise<OperationEnvelopeStorePageResult> {
    const filtered = filterOperationHistoryRows(rows, input)
    return paginateOperationHistoryRows(filtered, input)
  }

  async reset(): Promise<void> {
    rows.length = 0
  }
}
