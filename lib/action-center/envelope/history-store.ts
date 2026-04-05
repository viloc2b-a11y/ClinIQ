import type { ActionCenterOperationEnvelope } from "./types"
import { getOperationEnvelopeStore } from "./store/get-store"

export async function appendOperationEnvelope(
  envelope: ActionCenterOperationEnvelope,
): Promise<void> {
  const store = getOperationEnvelopeStore()
  await store.append(envelope)
}

export async function listOperationEnvelopes(): Promise<ActionCenterOperationEnvelope[]> {
  const store = getOperationEnvelopeStore()
  return store.list()
}

export async function resetOperationEnvelopeHistory(): Promise<void> {
  const store = getOperationEnvelopeStore()
  await store.reset()
}
