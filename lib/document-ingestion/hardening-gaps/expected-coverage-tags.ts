export const EXPECTED_COVERAGE_TAGS = [
  "edge-case",
  "multi-table",
  "fragmented",
  "messy-headers",
  "duplicate-headers",
  "blank-rows",
  "sparse-layout",
  "multi-sheet",
  "mixed-content",
  "unknown-shape",
  "ambiguous",
] as const

export type ExpectedCoverageTag = (typeof EXPECTED_COVERAGE_TAGS)[number]
