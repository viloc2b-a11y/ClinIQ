export function buildWorksetCode(worksetPosition: number): string {
  return `AUTHORING_WORKSET_${String(worksetPosition).padStart(4, "0")}`
}
