export type ActionCenterAuditEntry = {
  id: string
  step: "write_attempt" | "write_success" | "write_fail"
  timestamp: string
}

const auditLog: ActionCenterAuditEntry[] = []

export function appendAudit(entry: ActionCenterAuditEntry): void {
  auditLog.push({ ...entry })
}

export function getAuditLog(): ActionCenterAuditEntry[] {
  return [...auditLog]
}

/** Tests / isolated runs */
export function resetAuditLog(): void {
  auditLog.length = 0
}
