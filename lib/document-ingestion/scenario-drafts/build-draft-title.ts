export function buildDraftTitle(proposedScenarioKey: string): string {
  const cleaned = proposedScenarioKey.replace(/^scenario_/, "").replace(/_/g, " ").trim()

  if (!cleaned) return "Scenario Draft"

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
