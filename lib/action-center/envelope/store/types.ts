import type { ActionCenterOperationEnvelope } from "../types"
import type { ActionCenterOperationStatus } from "../../summary/types"

export type OperationEnvelopeStoreListInput = {
  kind?: "write" | "verify" | "write_and_verify"
  status?: ActionCenterOperationStatus
}

export interface OperationEnvelopeStore {
  append(envelope: ActionCenterOperationEnvelope): Promise<void>
  list(input?: OperationEnvelopeStoreListInput): Promise<ActionCenterOperationEnvelope[]>
  reset(): Promise<void>
}
