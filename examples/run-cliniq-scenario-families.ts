import { formatScenarioFamilyText } from "../lib/document-ingestion/scenario-families/format-scenario-family-text"
import { runScenarioFamilySummary } from "../lib/document-ingestion/scenario-families/run-scenario-family-summary"

function main() {
  const result = runScenarioFamilySummary()
  const formatted = formatScenarioFamilyText({ result })

  console.log(formatted.data.text)
}

main()
