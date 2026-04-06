export function assignRoadmapPhase(priority: "high" | "medium" | "low"): 1 | 2 | 3 {
  if (priority === "high") return 1
  if (priority === "medium") return 2
  return 3
}
