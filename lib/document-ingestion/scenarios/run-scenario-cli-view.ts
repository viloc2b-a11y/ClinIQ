import { buildConsoleView } from "../cli/build-console-view"
import { evaluateCliStatus } from "../cli/evaluate-cli-status"
import { formatConsoleOutput } from "../cli/format-console-output"
import { runNamedScenario } from "./run-named-scenario"
import type { InternalScenarioKey } from "./types"

type PayloadMeta = {
  sourceType?: "excel" | "pdf" | "word" | "unknown"
  route?: "excel_hardened" | "legacy" | "unknown"
}

function metaFromPayload(payload: unknown): PayloadMeta {
  if (!payload || typeof payload !== "object" || !("meta" in payload)) return {}
  const meta = (payload as { meta?: PayloadMeta }).meta
  return meta && typeof meta === "object" ? meta : {}
}

export function runScenarioCliView(params: { key: InternalScenarioKey }) {
  const scenarioRun = runNamedScenario({
    key: params.key,
  })

  const payloadResult = scenarioRun.data.result
  const fixture = scenarioRun.data.fixture

  const payload =
    payloadResult?.data?.payload != null && typeof payloadResult.data.payload === "object"
      ? payloadResult.data.payload
      : null

  let text: string
  let formatWarnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>

  if (payloadResult && fixture && scenarioRun.summary.found) {
    const meta = metaFromPayload(payload)
    const sourceType =
      meta.sourceType ??
      payloadResult.summary.sourceType ??
      ("unknown" as const)

    const route =
      meta.route ??
      payloadResult.summary.route ??
      ("unknown" as const)

    const outputsReady = payloadResult.summary.outputsReady === true

    const artifactsReady =
      typeof payloadResult.summary.artifactsReady === "number"
        ? payloadResult.summary.artifactsReady
        : 0

    const cliStatus = evaluateCliStatus({
      status: payloadResult.summary.status,
      sourceType,
      route,
      outputsReady,
    })

    const consoleView = buildConsoleView({
      fileName: fixture.fileName,
      sourceType,
      status: cliStatus.data.status,
      route,
      outputsReady,
      artifactsReady,
      warnings: [...cliStatus.warnings, ...payloadResult.warnings],
    })

    const formatted = formatConsoleOutput({
      consoleView: consoleView.data.consoleView,
    })
    text = formatted.data.text
    formatWarnings = [...formatted.warnings]
  } else {
    text = `Scenario ${params.key} could not produce console output`
    formatWarnings = []
  }

  return {
    data: {
      scenario: scenarioRun.data.scenario,
      fixture: scenarioRun.data.fixture,
      payload,
      text,
    },
    summary: {
      status: scenarioRun.summary.found ? scenarioRun.summary.status : ("blocked" as const),
      key: params.key,
      found: scenarioRun.summary.found,
    },
    warnings: [...scenarioRun.warnings, ...formatWarnings],
  }
}
