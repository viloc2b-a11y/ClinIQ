import { listOperationEnvelopes } from "./history-store"
import {
  filterOperationHistoryRows,
  paginateOperationHistoryRows,
  type ReadOperationHistoryPageInput,
  type ReadOperationHistoryPageResult,
} from "./history-pagination"

export async function readOperationHistoryPage(
  input: ReadOperationHistoryPageInput = {},
): Promise<ReadOperationHistoryPageResult> {
  const rows = await listOperationEnvelopes()
  const filtered = filterOperationHistoryRows(rows, input)

  return paginateOperationHistoryRows(filtered, input)
}
