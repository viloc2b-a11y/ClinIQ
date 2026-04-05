import type { ActionCenterOperationEnvelope } from "../types"
import type { OperationEnvelopeStore, OperationEnvelopeStoreListInput } from "./types"

const rows: ActionCenterOperationEnvelope[] = []

export class MemoryOperationEnvelopeStore implements OperationEnvelopeStore {
  async append(envelope: ActionCenterOperationEnvelope): Promise<void> {
    rows.push(envelope)
  }

  async list(input: OperationEnvelopeStoreListInput = {}): Promise<ActionCenterOperationEnvelope[]> {
    let result = [...rows]

    if (input.kind) {
      result = result.filter((row) => row.kind === input.kind)
    }

    if (input.status) {
      result = result.filter((row) => row.status === input.status)
    }

    result.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp.localeCompare(b.timestamp)
      }

      return a.operationId.localeCompare(b.operationId)
    })

    return result
  }

  async reset(): Promise<void> {
    rows.length = 0
  }
}
