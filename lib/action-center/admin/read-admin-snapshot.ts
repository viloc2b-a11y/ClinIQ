import { readAuditLog } from "../read-audit-log"
import { readActionCenterRecords } from "../read-action-center-records"
import { readOperationHistory } from "../envelope/read-operation-history"
import { getMetrics } from "../metrics"
import { buildActionCenterAdminSnapshot } from "./build-admin-snapshot"
import type { ActionCenterAdminSnapshot } from "./types"

export async function readActionCenterAdminSnapshot(): Promise<ActionCenterAdminSnapshot> {
  const [records, operations, audit, metrics] = await Promise.all([
    readActionCenterRecords(),
    readOperationHistory(),
    readAuditLog(),
    getMetrics(),
  ])

  return buildActionCenterAdminSnapshot({
    records,
    operations,
    audit,
    metrics,
  })
}
