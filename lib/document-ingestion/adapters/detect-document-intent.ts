import type { AdapterCandidate, AdapterDocumentIntent } from "./types"

function scoreIntent(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  return keywords.reduce((acc, keyword) => {
    return acc + (lower.includes(keyword) ? 1 : 0)
  }, 0)
}

export function detectDocumentIntent(params: {
  fileName?: string
  rawText?: string
  normalizedRecords?: Array<{ recordType: string; fields: Record<string, unknown> }>
}): {
  intent: AdapterDocumentIntent
  candidates: AdapterCandidate[]
} {
  const fileName = (params.fileName || "").toLowerCase()
  const rawText = (params.rawText || "").toLowerCase()

  const recordHints = (params.normalizedRecords || [])
    .map((r) => {
      const parts: string[] = [r.recordType]
      for (const [k, v] of Object.entries(r.fields)) {
        parts.push(k)
        if (typeof v === "string" && v.trim()) parts.push(v)
        else if (
          v &&
          typeof v === "object" &&
          "value" in (v as Record<string, unknown>)
        ) {
          const inner = (v as { value?: unknown }).value
          if (typeof inner === "string" && inner.trim()) parts.push(inner)
        }
      }
      return parts.join(" ")
    })
    .join(" ")
    .toLowerCase()

  const corpus = `${fileName}\n${rawText}\n${recordHints}`

  const soaScore = scoreIntent(corpus, [
    "schedule of assessments",
    "soa",
    "visit",
    "procedure",
    "assessment",
    "screening",
    "baseline",
    "week",
    "unscheduled",
  ])

  const budgetScore = scoreIntent(corpus, [
    "budget",
    "payment",
    "fee",
    "invoice",
    "pass-through",
    "grant",
    "screen fail",
    "procedure fee",
    "startup",
  ])

  const contractScore = scoreIntent(corpus, [
    "agreement",
    "contract",
    "terms",
    "payment terms",
    "confidentiality",
    "indemnification",
    "termination",
    "governing law",
  ])

  const candidates: AdapterCandidate[] = [
    {
      adapterId: "soa-v1",
      intent: "soa",
      confidence: soaScore >= 5 ? "high" : soaScore >= 3 ? "medium" : "low",
      reason: `soa keyword score=${soaScore}`,
    },
    {
      adapterId: "budget-v1",
      intent: "budget",
      confidence:
        budgetScore >= 5 ? "high" : budgetScore >= 3 ? "medium" : "low",
      reason: `budget keyword score=${budgetScore}`,
    },
    {
      adapterId: "contract-v1",
      intent: "contract",
      confidence:
        contractScore >= 5 ? "high" : contractScore >= 3 ? "medium" : "low",
      reason: `contract keyword score=${contractScore}`,
    },
  ]

  const sorted = [...candidates].sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 }
    const d = order[b.confidence] - order[a.confidence]
    if (d !== 0) return d
    return a.adapterId.localeCompare(b.adapterId)
  })

  const top = sorted[0]

  if (!top || top.confidence === "low") {
    return {
      intent: "unknown",
      candidates: sorted,
    }
  }

  return {
    intent: top.intent,
    candidates: sorted,
  }
}
