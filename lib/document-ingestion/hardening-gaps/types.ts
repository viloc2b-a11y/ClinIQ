import type { ScenarioFamilyKey } from "../scenario-families/types"

export type TagCoverageEntry = {
  tag: string
  count: number
  families: ScenarioFamilyKey[]
  priorityWeight: number
  coverageLevel: "strong" | "medium" | "weak" | "missing"
}

export type FamilyCoverageGap = {
  familyKey: ScenarioFamilyKey
  totalScenarios: number
  highPriorityScenarios: number
  roadmapPhase: 1 | 2 | 3 | null
  gapLevel: "high" | "medium" | "low"
  reasons: string[]
}

export type HardeningGap = {
  code: string
  type: "tag" | "family" | "distribution"
  severity: "high" | "medium" | "low"
  message: string
}

export type HardeningGapResult = {
  data: {
    tagCoverage: TagCoverageEntry[]
    familyCoverageGaps: FamilyCoverageGap[]
    gaps: HardeningGap[]
  }
  summary: {
    totalTags: number
    weakTagCount: number
    missingTagCount: number
    familiesWithHighGap: number
    familiesWithMediumGap: number
    familiesWithLowGap: number
    topGapCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
