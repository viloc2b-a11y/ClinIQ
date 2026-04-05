import { listOperationEnvelopes } from "./history-store"
import {
  filterOperationHistoryRows,
  paginateOperationHistoryRows,
  type ReadOperationHistoryPageInput,
  type ReadOperationHistoryPageResult,
} from "./history-pagination"
import { getOperationEnvelopeStore } from "./store/get-store"

export async function readOperationHistoryPage(
  input: ReadOperationHistoryPageInput = {},
): Promise<ReadOperationHistoryPageResult> {
  const store = getOperationEnvelopeStore()

  if (typeof store.readPage === "function") {
    return store.readPage(input)
  }

  const rows = await listOperationEnvelopes()
  const filtered = filterOperationHistoryRows(rows, input)

  return paginateOperationHistoryRows(filtered, input)
}
