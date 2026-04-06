import { formatTracePackText } from "../lib/document-ingestion/trace-pack/format-trace-pack-text"
import { runScenarioTracePack } from "../lib/document-ingestion/trace-pack/run-scenario-trace-pack"

function main() {
  const result = runScenarioTracePack({
    key: "budget_simple_happy_path",
  })

  const formatted = formatTracePackText({
    tracePack: { data: result.data.tracePack },
  })

  console.log(formatted.data.text)
}

main()
