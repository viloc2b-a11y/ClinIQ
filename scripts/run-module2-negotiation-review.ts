/**
 * CLI: run Module 2 negotiation review against a sponsor offer file (xlsx or pdf).
 * Writes canonical JSON + operational CSV; console is minimal (counts + paths).
 *
 * Examples:
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=xlsx --file=./offer.xlsx --mode=index --keyColumnIndex=0 --amountColumnIndex=1
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=xlsx --file=./offer.xlsx --mode=header --keyHeader=Fee --amountHeader=Amount
 *   npx tsx scripts/run-module2-negotiation-review.ts --sourceType=pdf --file=./offer.pdf
 *   npx tsx scripts/run-module2-negotiation-review.ts ... --outDir=./out
 */

import { mkdirSync } from "node:fs"
import { join } from "node:path"

import { buildSiteCostModelOutput } from "../lib/cliniq-core/cost-model/site-cost-model-v2"
import { writeModule2NegotiationReviewCsv } from "../lib/cliniq-core/negotiation/export-module2-review-csv"
import { writeModule2NegotiationReviewJson } from "../lib/cliniq-core/negotiation/export-module2-review-json"
import { ingestSponsorOffer } from "../lib/cliniq-core/negotiation/ingest-sponsor-offer"
import type { SponsorOfferXlsxColumns } from "../lib/cliniq-core/negotiation/ingest-sponsor-offer-xlsx"

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
  const sourceType = requireArg(args, "sourceType") as "xlsx" | "pdf"
  const file = requireArg(args, "file")
  const projectedRevenue = optNum(args, "projectedRevenue") ?? 500_000
  const outDir = args.outDir ?? process.cwd()

  if (sourceType !== "xlsx" && sourceType !== "pdf") {
    console.error("--sourceType must be xlsx or pdf.")
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

  const result =
    sourceType === "xlsx"
      ? await ingestSponsorOffer({
          sourceType: "xlsx",
          costOutput,
          projectedRevenue,
          filePath: file,
          columns: buildXlsxColumns(args),
          ...(studyId !== undefined ? { studyId } : {}),
          ...(siteId !== undefined ? { siteId } : {}),
        })
      : await ingestSponsorOffer({
          sourceType: "pdf",
          costOutput,
          projectedRevenue,
          filePath: file,
          ...(studyId !== undefined ? { studyId } : {}),
          ...(siteId !== undefined ? { siteId } : {}),
        })

  const jsonPath = join(outDir, JSON_NAME)
  const csvPath = join(outDir, CSV_NAME)
  mkdirSync(outDir, { recursive: true })
  writeModule2NegotiationReviewJson(jsonPath, result)
  writeModule2NegotiationReviewCsv(csvPath, result)

  const s = result.review.summary
  console.log(
    [
      `sourceType=${result.sourceType}`,
      `warnings=${result.warnings.length}`,
      `unmatched=${result.unmatched.length}`,
      `fees=${s.totalFees}`,
      `mustWin=${s.mustWinCount}`,
      `defendable=${s.defendableCount}`,
      `tradeoff=${s.tradeoffCount}`,
      `unknownOffer=${s.unknownOfferCount}`,
      `json=${jsonPath}`,
      `csv=${csvPath}`,
    ].join(" | "),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
