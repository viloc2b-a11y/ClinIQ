/**
 * CLI: Module 2 negotiation review for rows | record | xlsx | pdf.
 * Writes canonical JSON first, then CSV derived by re-reading that JSON file.
 *
 * rows / record (JSON payload via file or inline):
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=rows --inline='[{"key":"startup","amount":5000}]'
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=rows --file=./offer-rows.json
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=record --inline='{"startup":5000,"screening_visit":100}'
 *
 * xlsx / pdf (--file is path to the document):
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=xlsx --file=./offer.xlsx --mode=header --keyHeader=Fee --amountHeader=Amount
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=pdf --file=./offer.pdf
 *
 * Optional: --outDir=DIR (default cwd)
 */

import { mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { buildSiteCostModelOutput } from "../lib/cliniq-core/cost-model/site-cost-model-v2"
import { writeModule2NegotiationReviewCsvFromJsonFile } from "../lib/cliniq-core/negotiation/export-module2-review-csv"
import { writeModule2NegotiationReviewJson } from "../lib/cliniq-core/negotiation/export-module2-review-json"
import { ingestSponsorOffer } from "../lib/cliniq-core/negotiation/ingest-sponsor-offer"
import type { SponsorOfferXlsxColumns } from "../lib/cliniq-core/negotiation/ingest-sponsor-offer-xlsx"
import type { RawSponsorOfferRow } from "../lib/cliniq-core/negotiation/normalize-sponsor-offer-input"

const JSON_NAME = "module2_negotiation_review.json"
const CSV_NAME = "module2_negotiation_review.csv"

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
    console.error(`Missing required argument: --${key}=...`)
    process.exit(1)
  }
  return v
}

function optInt(args: Record<string, string>, key: string): number | undefined {
  const v = args[key]
  if (v === undefined || v === "") return undefined
  const n = Number.parseInt(v, 10)
  if (!Number.isFinite(n)) {
    console.error(`Invalid integer for --${key}: ${v}`)
    process.exit(1)
  }
  return n
}

function optNum(args: Record<string, string>, key: string): number | undefined {
  const v = args[key]
  if (v === undefined || v === "") return undefined
  const n = Number.parseFloat(v)
  if (!Number.isFinite(n)) {
    console.error(`Invalid number for --${key}: ${v}`)
    process.exit(1)
  }
  return n
}

function loadJsonText(args: Record<string, string>): string {
  const inline = args.inline
  const file = args.file
  if (inline !== undefined && inline !== "") return inline
  if (file !== undefined && file !== "") {
    return readFileSync(file, "utf8")
  }
  console.error("Provide --file=PATH or --inline=... with JSON for rows/record.")
  process.exit(1)
}

function parseRowsPayload(text: string): RawSponsorOfferRow[] {
  let j: unknown
  try {
    j = JSON.parse(text) as unknown
  } catch (e) {
    console.error("Invalid JSON for rows:", e instanceof Error ? e.message : e)
    process.exit(1)
  }
  if (Array.isArray(j)) {
    return j as RawSponsorOfferRow[]
  }
  if (
    j &&
    typeof j === "object" &&
    Array.isArray((j as { rows?: unknown }).rows)
  ) {
    return (j as { rows: RawSponsorOfferRow[] }).rows
  }
  console.error('rows: expected JSON array or { "rows": [...] }.')
  process.exit(1)
}

function parseRecordPayload(text: string): Record<string, number | null | undefined> {
  let j: unknown
  try {
    j = JSON.parse(text) as unknown
  } catch (e) {
    console.error("Invalid JSON for record:", e instanceof Error ? e.message : e)
    process.exit(1)
  }
  if (!j || typeof j !== "object" || Array.isArray(j)) {
    console.error("record: expected JSON object mapping fee keys to numbers.")
    process.exit(1)
  }
  return j as Record<string, number | null | undefined>
}

function buildXlsxColumns(args: Record<string, string>): SponsorOfferXlsxColumns {
  const mode = requireArg(args, "mode")
  if (mode === "index") {
    const keyColumnIndex = optInt(args, "keyColumnIndex")
    const amountColumnIndex = optInt(args, "amountColumnIndex")
    if (keyColumnIndex === undefined || amountColumnIndex === undefined) {
      console.error(
        "For --mode=index, require --keyColumnIndex=N and --amountColumnIndex=N (0-based).",
      )
      process.exit(1)
    }
    const firstDataRowIndex = optInt(args, "firstDataRowIndex")
    return {
      mode: "index",
      keyColumnIndex,
      amountColumnIndex,
      ...(firstDataRowIndex !== undefined ? { firstDataRowIndex } : {}),
    }
  }
  if (mode === "header") {
    const keyHeader = requireArg(args, "keyHeader")
    const amountHeader = requireArg(args, "amountHeader")
    const headerRowIndex = optInt(args, "headerRowIndex")
    return {
      mode: "header",
      keyHeader,
      amountHeader,
      ...(headerRowIndex !== undefined ? { headerRowIndex } : {}),
    }
  }
  console.error(`Unknown --mode=${mode} (use index or header).`)
  process.exit(1)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceType = requireArg(args, "sourceType") as
    | "rows"
    | "record"
    | "xlsx"
    | "pdf"
  const projectedRevenue = optNum(args, "projectedRevenue") ?? 500_000
  const outDir = args.outDir ?? process.cwd()

  if (
    sourceType !== "rows" &&
    sourceType !== "record" &&
    sourceType !== "xlsx" &&
    sourceType !== "pdf"
  ) {
    console.error("--sourceType must be rows, record, xlsx, or pdf.")
    process.exit(1)
  }

  const costOutput = buildSiteCostModelOutput({
    studyType: "generic",
    complexityInput: {
      duration_months: 12,
      visit_count: 10,
      procedures_per_visit: 2,
      endpoints_score: 1,
      population_score: 1,
      substudies_score: 0,
    },
    paymentTermsInput: {
      net_days: 45,
      holdback_pct: 0.1,
      startup_payment_amount: 5000,
      holdback_months_retained: 3,
      cost_of_capital_annual: 0.08,
    },
    projectedRevenue,
  })

  const studyId = args.studyId
  const siteId = args.siteId
  const baseExtras = {
    ...(studyId !== undefined ? { studyId } : {}),
    ...(siteId !== undefined ? { siteId } : {}),
  }

  let result: Awaited<ReturnType<typeof ingestSponsorOffer>>

  if (sourceType === "rows") {
    const text = loadJsonText(args)
    const rows = parseRowsPayload(text)
    result = await ingestSponsorOffer({
      sourceType: "rows",
      costOutput,
      projectedRevenue,
      rows,
      ...baseExtras,
    })
  } else if (sourceType === "record") {
    const text = loadJsonText(args)
    const record = parseRecordPayload(text)
    result = await ingestSponsorOffer({
      sourceType: "record",
      costOutput,
      projectedRevenue,
      record,
      ...baseExtras,
    })
  } else if (sourceType === "xlsx") {
    const file = requireArg(args, "file")
    result = await ingestSponsorOffer({
      sourceType: "xlsx",
      costOutput,
      projectedRevenue,
      filePath: file,
      columns: buildXlsxColumns(args),
      ...baseExtras,
    })
  } else {
    const file = requireArg(args, "file")
    result = await ingestSponsorOffer({
      sourceType: "pdf",
      costOutput,
      projectedRevenue,
      filePath: file,
      ...baseExtras,
    })
  }

  const jsonPath = join(outDir, JSON_NAME)
  const csvPath = join(outDir, CSV_NAME)
  mkdirSync(outDir, { recursive: true })
  writeModule2NegotiationReviewJson(jsonPath, result)
  writeModule2NegotiationReviewCsvFromJsonFile(csvPath, jsonPath)

  console.log(`warnings: ${result.warnings.length}`)
  console.log(`unmatched: ${result.unmatched.length}`)
  console.log("headlines:")
  for (const line of result.review.summary.headlines) {
    console.log(`  - ${line}`)
  }
  console.log(`json: ${jsonPath}`)
  console.log(`csv: ${csvPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
