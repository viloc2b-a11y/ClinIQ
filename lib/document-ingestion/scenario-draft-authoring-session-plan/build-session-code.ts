export function buildSessionCode(sessionPosition: number): string {
  return `AUTHORING_SESSION_${String(sessionPosition).padStart(4, "0")}`
}
