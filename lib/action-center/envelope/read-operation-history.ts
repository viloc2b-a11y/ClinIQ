import type { ActionCenterOperationEnvelope } from "./types"
import { readOperationHistoryPage } from "./read-operation-history-page"
import type { ReadOperationHistoryInput } from "./read-operation-history.types"

export async function readOperationHistory(
  input: ReadOperationHistoryInput = {},
): Promise<ActionCenterOperationEnvelope[]> {
  const page = await readOperationHistoryPage(input)
  return page.records
}
