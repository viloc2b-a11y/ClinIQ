import { buildFixtureWarning } from "./build-fixture-warning"
import { listDocumentFixtures } from "./list-document-fixtures"
import type { DocumentFixtureType } from "./types"

export function getDocumentFixture(params: { type: DocumentFixtureType }) {
  const fixtures = listDocumentFixtures().data.fixtures
  const match = fixtures.find((fixture) => fixture.type === params.type) || null

  return {
    data: {
      fixture: match,
    },
    summary: {
      found: match != null,
      type: params.type,
    },
    warnings:
      match == null
        ? [
            buildFixtureWarning({
              code: "document_fixture_not_found",
              message: `No document fixture found for type: ${params.type}`,
              severity: "error",
            }),
          ]
        : ([] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>),
  }
}
