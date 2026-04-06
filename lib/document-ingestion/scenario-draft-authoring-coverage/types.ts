import type { ScenarioFamilyKey } from "../scenario-families/types"

export type ScenarioDraftAuthoringCoverageFamily = {
  familyKey: ScenarioFamilyKey | null
  totalItems: number
  worksetCount: number
  firstWorksetCode: string | null
}

export type ScenarioDraftAuthoringCoverageStructureIntent = {
  structureIntent:
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
  totalItems: number
  worksetCount: number
  firstWorksetCode: string | null
}

export type ScenarioDraftAuthoringCoverageWorkset = {
  worksetCode: string
  worksetPosition: number
  totalItems: number
  familyKeys: Array<ScenarioFamilyKey | null>
  structureIntents: Array<
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
  >
  firstQueueItemCode: string | null
  lastQueueItemCode: string | null
}

export type ScenarioDraftAuthoringCoverageResult = {
  data: {
    worksets: ScenarioDraftAuthoringCoverageWorkset[]
    families: ScenarioDraftAuthoringCoverageFamily[]
    structureIntents: ScenarioDraftAuthoringCoverageStructureIntent[]
  }
  summary: {
    totalWorksets: number
    totalScheduledItems: number
    representedFamilyCount: number
    representedStructureIntentCount: number
    nullFamilyRepresented: boolean
    firstWorksetCode: string | null
    firstFamilyKey: ScenarioFamilyKey | null
    firstStructureIntent:
      | "edge_case_expansion"
      | "family_depth_expansion"
      | "distribution_rebalance"
      | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
