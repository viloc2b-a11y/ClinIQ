import type { ActionCenterOperationEnvelope } from "../types"
import type { ActionCenterOperationStatus } from "../../summary/types"

export type OperationEnvelopeStoreListInput = {
  kind?: "write" | "verify" | "write_and_verify"
  status?: ActionCenterOperationStatus
}

export type OperationEnvelopeStorePageInput = OperationEnvelopeStoreListInput & {
  limit?: number
  cursor?: string
}

export type OperationEnvelopeStorePageResult = {
  records: ActionCenterOperationEnvelope[]
  nextCursor: string | null
}

export interface OperationEnvelopeStore {
  append(envelope: ActionCenterOperationEnvelope): Promise<void>
  list(
    input?: OperationEnvelopeStoreListInput,
  ): Promise<ActionCenterOperationEnvelope[]>
  readPage?(
    input?: OperationEnvelopeStorePageInput,
  ): Promise<OperationEnvelopeStorePageResult>
  reset(): Promise<void>
}
