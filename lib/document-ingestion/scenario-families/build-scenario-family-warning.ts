export function buildScenarioFamilyWarning(params: {
  code: string
  message: string
  severity?: "info" | "warning" | "error"
}) {
  return {
    code: params.code,
    message: params.message,
    severity: params.severity || "warning",
  }
}
