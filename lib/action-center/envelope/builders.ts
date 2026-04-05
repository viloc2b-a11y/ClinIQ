import { appendOperationEnvelope } from "./history-store"
import { writeActionCenterRecords } from "../write-action-center-records"
import { verifyActionCenterRecordsUnified } from "../verify-action-center-records-unified"
import { writeAndVerifyActionCenterRecords } from "../write-and-verify-action-center-records"
import {
  buildVerifyOperationEnvelope,
  buildWriteAndVerifyOperationEnvelope,
  buildWriteOperationEnvelope,
} from "./build-operation-envelope"

export async function writeActionCenterRecordsWithEnvelope(input: {
  records: Array<{
    id: string
    type: string
    payload: any
    createdAt: string
  }>
  timestamp?: string
}) {
  const summary = await writeActionCenterRecords(input.records)
  const envelope = buildWriteOperationEnvelope(summary, input.timestamp)
  await appendOperationEnvelope(envelope)
  return envelope
}

export async function verifyActionCenterRecordsWithEnvelope(input: {
  expectedIds: string[]
  mode?: "full" | "paged"
  pageSize?: number
  timestamp?: string
}) {
  const summary = await verifyActionCenterRecordsUnified({
    expectedIds: input.expectedIds,
    mode: input.mode,
    pageSize: input.pageSize,
  })

  const envelope = buildVerifyOperationEnvelope(summary, input.timestamp)
  await appendOperationEnvelope(envelope)
  return envelope
}

export async function writeAndVerifyActionCenterRecordsWithEnvelope(input: {
  records: Array<{
    id: string
    type: string
    payload: any
    createdAt: string
  }>
  expectedIds?: string[]
  mode?: "full" | "paged"
  pageSize?: number
  timestamp?: string
}) {
  const summary = await writeAndVerifyActionCenterRecords({
    records: input.records,
    expectedIds: input.expectedIds,
    mode: input.mode,
    pageSize: input.pageSize,
  })

  const envelope = buildWriteAndVerifyOperationEnvelope(summary, input.timestamp)
  await appendOperationEnvelope(envelope)
  return envelope
}
