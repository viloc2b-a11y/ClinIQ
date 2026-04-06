import { formatConsoleOutput } from "../lib/document-ingestion/cli/format-console-output"
import { runCanonicalCliExecution } from "../lib/document-ingestion/cli/run-canonical-cli-execution"
import { runFixtureCanonicalDemo } from "../lib/document-ingestion/fixtures/run-fixture-canonical-demo"
import type { DocumentFixtureType } from "../lib/document-ingestion/fixtures/types"
import { buildDefaultScenarioMocks } from "../lib/document-ingestion/scenarios/build-default-scenario-mocks"
import { runScenarioCliView } from "../lib/document-ingestion/scenarios/run-scenario-cli-view"
import type { InternalScenarioKey } from "../lib/document-ingestion/scenarios/types"

function main() {
  const scenarioIdx = process.argv.indexOf("--scenario")
  const fixtureIdx = process.argv.indexOf("--fixture")
  const mocks = buildDefaultScenarioMocks()

  if (scenarioIdx !== -1) {
    const next = process.argv[scenarioIdx + 1]
    const key = (
      next && !next.startsWith("-") ? next : "budget_simple_happy_path"
    ) as InternalScenarioKey

    const result = runScenarioCliView({ key })
    console.log(result.data.text)
    return
  }

  if (fixtureIdx !== -1) {
    const next = process.argv[fixtureIdx + 1]
    const type = (
      next && !next.startsWith("-") ? next : "excel_simple_budget"
    ) as DocumentFixtureType

    const fixtureRun = runFixtureCanonicalDemo({
      type,
      ...mocks,
    })

    console.log(JSON.stringify({ summary: fixtureRun.summary }, null, 2))
    return
  }

  const workbook = {
    Sheet1: [
      ["Visit", "Procedure", "Fee"],
      ["Screening", "CBC", "125"],
      ["Baseline", "ECG", "300"],
    ],
  }

  const result = runCanonicalCliExecution({
    fileName: "budget.xlsx",
    workbook,
    ...mocks,
  })

  const formatted = formatConsoleOutput({
    consoleView: result.data.consoleView,
  })

  console.log(formatted.data.text)
}

main()
