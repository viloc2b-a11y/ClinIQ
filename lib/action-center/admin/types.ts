import type { ActionCenterMetrics } from "../metrics/store/types"
import type { ActionCenterOperationStatus } from "../summary/types"

export type ActionCenterAdminSnapshot = {
  generatedAt: string
  records: {
    total: number
    byType: Record<string, number>
  }
  operations: {
    total: number
    byKind: Record<"write" | "verify" | "write_and_verify", number>
    byStatus: Record<ActionCenterOperationStatus, number>
  }
  audit: {
    total: number
    byStep: Record<"write_attempt" | "write_success" | "write_fail", number>
  }
  metrics: ActionCenterMetrics
}
