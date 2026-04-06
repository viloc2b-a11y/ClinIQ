import type { DocumentFixtureType } from "../fixtures/types"

export type InternalScenarioKey =
  | "budget_simple_happy_path"
  | "soa_simple_happy_path"
  | "budget_multi_sheet_detection"
  | "budget_messy_boundary_detection"
  | "visit_schedule_basic"
  | "budget_sparse_rows"
  | "budget_noisy_headers"
  | "budget_duplicate_headers"
  | "budget_sectioned_layout"
  | "multi_candidate_sheet_selection"

export type InternalScenarioDefinition = {
  key: InternalScenarioKey
  label: string
  description: string
  fixtureType: DocumentFixtureType
  tags: string[]
}
