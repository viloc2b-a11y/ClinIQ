import { formatScenarioMatrixText } from "../lib/document-ingestion/scenario-matrix/format-scenario-matrix-text"
import { runScenarioMatrix } from "../lib/document-ingestion/scenario-matrix/run-scenario-matrix"

function main() {
  const matrix = runScenarioMatrix()
  const formatted = formatScenarioMatrixText({ matrix })

  console.log(formatted.data.text)
}

main()
