import type { ParseAcceptanceReason, ParseAcceptanceReasonCode } from "./types"

export function buildAcceptanceReason(params: {
  code: ParseAcceptanceReasonCode
  message: string
  severity?: "info" | "warning" | "error"
}): ParseAcceptanceReason {
  return {
    code: params.code,
    message: params.message,
    severity: params.severity || "warning",
  }
}
