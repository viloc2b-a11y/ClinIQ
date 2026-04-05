export type ActionCenterAuditEntry = {
  id: string
  step: "write_attempt" | "write_success" | "write_fail"
  timestamp: string
}

export type AuditStoreListInput = {
  id?: string
  step?: "write_attempt" | "write_success" | "write_fail"
  limit?: number
}

export type AuditStorePageInput = AuditStoreListInput & {
  cursor?: string
}

export type AuditStorePageResult = {
  records: ActionCenterAuditEntry[]
  nextCursor: string | null
}

export interface ActionCenterAuditStore {
  append(entry: ActionCenterAuditEntry): Promise<void>
  list(input?: AuditStoreListInput): Promise<ActionCenterAuditEntry[]>
  readPage?(input?: AuditStorePageInput): Promise<AuditStorePageResult>
  reset(): Promise<void>
}
