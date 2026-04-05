import type { IntakeWarning, IntakeWarningCode } from "./types"

export function buildIntakeWarning(params: {
  code: IntakeWarningCode
  message: string
  severity?: "info" | "warning" | "error"
  location?: IntakeWarning["location"]
}): IntakeWarning {
  return {
    code: params.code,
    message: params.message,
    severity: params.severity || "warning",
    location: params.location,
  }
}
