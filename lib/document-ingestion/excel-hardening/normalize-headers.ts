import { cellString } from "./shared/workbook-rows"

export type NormalizedHeader = {
  original: string
  normalized: string
  confidence: number
}

type Rule = { match: RegExp; canonical: string; confidence: number }

const RULES: Rule[] = [
  { match: /^(procedure|activity|service|test|exam|assessment)$/i, canonical: "activity", confidence: 0.95 },
  { match: /^(visit|timepoint|time\s*point|visit\s*name)$/i, canonical: "visitName", confidence: 0.95 },
  { match: /^(cost|fee|amount|price|rate|unit\s*price|usd|\$)$/i, canonical: "unitPrice", confidence: 0.92 },
  { match: /^(qty|quantity|units|#\s*units|#)$/i, canonical: "quantity", confidence: 0.9 },
  { match: /^category$/i, canonical: "category", confidence: 0.9 },
  { match: /^(line\s*code|code|cpt|service\s*code)$/i, canonical: "lineCode", confidence: 0.88 },
  { match: /^(budget|line|description|desc)$/i, canonical: "category", confidence: 0.75 },
  { match: /^(window|target\s*day|study\s*day|day)$/i, canonical: "targetStudyDay", confidence: 0.7 },
]

function normalizeOneHeader(raw: string): NormalizedHeader {
  const original = raw.trim()
  const compact = original.replace(/\s+/g, " ")
  if (!compact) {
    return { original, normalized: "_ignore", confidence: 0 }
  }

  for (const rule of RULES) {
    if (rule.match.test(compact)) {
      return { original, normalized: rule.canonical, confidence: rule.confidence }
    }
  }

  const lower = compact.toLowerCase()
  if (lower.includes("visit")) return { original, normalized: "visitName", confidence: 0.65 }
  if (lower.includes("proc") || lower.includes("activ")) return { original, normalized: "activity", confidence: 0.62 }
  if (lower.includes("fee") || lower.includes("cost") || lower.includes("amount"))
    return { original, normalized: "unitPrice", confidence: 0.6 }

  return { original, normalized: `raw:${compact}`, confidence: 0.35 }
}

export function normalizeHeaders(params: { headerRow: unknown[] }) {
  const row = Array.isArray(params.headerRow) ? params.headerRow : []
  const headers: NormalizedHeader[] = row.map((cell) => normalizeOneHeader(cellString(cell)))

  return {
    data: { headers },
    summary: {
      totalColumns: headers.length,
      mappedColumns: headers.filter((h) => h.normalized !== "_ignore" && !h.normalized.startsWith("raw:")).length,
    },
    warnings:
      headers.every((h) => h.confidence < 0.5)
        ? [
            {
              code: "header_low_mapping_confidence",
              message: "No high-confidence header mappings; extraction may be unreliable",
              severity: "warning" as const,
            },
          ]
        : ([] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>),
  }
}
