import { runCanonicalDemoPayload } from "../demo-payload/run-canonical-demo-payload"
import { getDocumentFixture } from "../fixtures/get-document-fixture"
import { buildDefaultScenarioMocks } from "./build-default-scenario-mocks"
import { getInternalScenario } from "./get-internal-scenario"
import type { InternalScenarioKey } from "./types"

export function runNamedScenario(params: { key: InternalScenarioKey }) {
  const scenarioResult = getInternalScenario({
    key: params.key,
  })

  const scenario = scenarioResult.data.scenario

  if (!scenario) {
    return {
      data: {
        scenario: null,
        fixture: null,
        result: null,
      },
      summary: {
        status: "blocked" as const,
        found: false,
        key: params.key,
      },
      warnings: [...scenarioResult.warnings],
    }
  }

  const fixtureResult = getDocumentFixture({
    type: scenario.fixtureType,
  })

  const fixture = fixtureResult.data.fixture

  if (!fixture) {
    return {
      data: {
        scenario,
        fixture: null,
        result: null,
      },
      summary: {
        status: "blocked" as const,
        found: false,
        key: params.key,
      },
      warnings: [...scenarioResult.warnings, ...fixtureResult.warnings],
    }
  }

  const mocks = buildDefaultScenarioMocks()

  const result = runCanonicalDemoPayload({
    fileName: fixture.fileName,
    workbook: fixture.workbook,
    ...mocks,
  })

  return {
    data: {
      scenario,
      fixture,
      result,
    },
    summary: {
      status: result.summary.status,
      found: true,
      key: scenario.key,
      fixtureType: scenario.fixtureType,
      fileName: fixture.fileName,
    },
    warnings: [...scenarioResult.warnings, ...fixtureResult.warnings, ...result.warnings],
  }
}
