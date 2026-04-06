import { formatScenarioCatalogText } from "../lib/document-ingestion/scenario-catalog/format-scenario-catalog-text"
import { runScenarioCatalog } from "../lib/document-ingestion/scenario-catalog/run-scenario-catalog"

function main() {
  const catalog = runScenarioCatalog()
  const formatted = formatScenarioCatalogText({ catalog })

  console.log(formatted.data.text)
}

main()
