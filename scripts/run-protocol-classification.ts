/**
 * CLI: classify protocol rows from JSON → canonical JSON + CSV (CSV from written JSON).
 *
 *   npx tsx scripts/run-protocol-classification.ts --input=./protocol-rows.json
 *   npx tsx scripts/run-protocol-classification.ts --input=./rows.json --outDir=./out
 */

import { mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { classifyProtocolActivities } from "../lib/cliniq-core/protocol-classification/classify-protocol-activities"
import { writeProtocolClassificationCsvFromJsonFile } from "../lib/cliniq-core/protocol-classification/export-protocol-classification-csv"
import {
  buildProtocolClassificationJsonDocument,
  writeProtocolClassificationJsonDocument,
} from "../lib/cliniq-core/protocol-classification/export-protocol-classification-json"
import { protocolActivitiesToExpectedBillables } from "../lib/cliniq-core/protocol-classification/to-expected-billables"
import type { SoARow } from "../lib/cliniq-core/protocol-classification/types"

const JSON_NAME = "protocol_classification.json"
const CSV_NAME = "protocol_classification.csv"

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue
    const body = raw.slice(2)
    const eq = body.indexOf("=")
    if (eq === -1) {
      out[body] = "true"
      continue
    }
    out[body.slice(0, eq)] = body.slice(eq + 1)
  }
  return out
}

function requireArg(args: Record<string, string>, key: string): string {
  const v = args[key]
  if (v === undefined || v === "") {
    console.error(`Missing required argument: --${key}=PATH`)
    process.exit(1)
  }
  return v
}

function readJsonFile(path: string): unknown {
  let text: string
  try {
    text = readFileSync(path, "utf8")
  } catch (e) {
    console.error(`Failed to read ${path}:`, e instanceof Error ? e.message : e)
    process.exit(1)
  }
  try {
    return JSON.parse(text) as unknown
  } catch (e) {
    console.error(`Invalid JSON (${path}):`, e instanceof Error ? e.message : e)
    process.exit(1)
  }
}

function asSoARows(data: unknown): SoARow[] {
  if (!Array.isArray(data)) {
    console.error("Input must be a JSON array of protocol row objects.")
    process.exit(1)
  }
  const rows: SoARow[] = []
  for (let i = 0; i < data.length; i++) {
    const o = data[i]
    if (o === null || typeof o !== "object") {
      console.error(`Row ${i}: expected object.`)
      process.exit(1)
    }
    const r = o as Record<string, unknown>
    const studyId = r.studyId
    const activityId = r.activityId
    const visitName = r.visitName
    const activityType = r.activityType
    if (
      typeof studyId !== "string" ||
      typeof activityId !== "string" ||
      typeof visitName !== "string" ||
      typeof activityType !== "string"
    ) {
      console.error(
        `Row ${i}: requires string studyId, activityId, visitName, activityType.`,
      )
      process.exit(1)
    }
    rows.push({
      studyId,
      activityId,
      visitName,
      activityType,
      quantity: typeof r.quantity === "number" ? r.quantity : undefined,
      billableTo: typeof r.billableTo === "string" ? r.billableTo : undefined,
      lineCode: typeof r.lineCode === "string" ? r.lineCode : undefined,
      feeCode: typeof r.feeCode === "string" ? r.feeCode : undefined,
      sponsorException: r.sponsorException === true,
      unitPrice: typeof r.unitPrice === "number" ? r.unitPrice : undefined,
      expectedRevenue:
        typeof r.expectedRevenue === "number" ? r.expectedRevenue : undefined,
      protocolUnit:
        typeof r.protocolUnit === "string" ? r.protocolUnit : undefined,
    })
  }
  return rows
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = requireArg(args, "input")
  const outDir = args.outDir ?? process.cwd()

  mkdirSync(outDir, { recursive: true })

  const raw = readJsonFile(inputPath)
  const rows = asSoARows(raw)

  const classifiedActivities = classifyProtocolActivities(rows)
  const {
    expectedBillables,
    deferredConditionals,
    ignoredNonBillables,
  } = protocolActivitiesToExpectedBillables(classifiedActivities)

  const doc = buildProtocolClassificationJsonDocument({
    classifiedActivities,
    expectedBillables,
    deferredConditionals,
    ignoredNonBillables,
  })

  const jsonPath = join(outDir, JSON_NAME)
  const csvPath = join(outDir, CSV_NAME)

  writeProtocolClassificationJsonDocument(jsonPath, doc)
  writeProtocolClassificationCsvFromJsonFile(csvPath, jsonPath)

  const billable = classifiedActivities.filter((a) => a.classification === "billable")
  const conditional = classifiedActivities.filter(
    (a) => a.classification === "conditional",
  )
  const nonBillable = classifiedActivities.filter(
    (a) => a.classification === "non_billable",
  )

  console.log(`total classified: ${classifiedActivities.length}`)
  console.log(`billable count: ${billable.length}`)
  console.log(`conditional count: ${conditional.length}`)
  console.log(`non-billable count: ${nonBillable.length}`)
  console.log(`deferred count: ${deferredConditionals.length}`)
  console.log(`json: ${jsonPath}`)
  console.log(`csv: ${csvPath}`)
}

main()
