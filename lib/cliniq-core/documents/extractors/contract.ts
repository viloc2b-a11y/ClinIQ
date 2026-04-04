import type { ContractExtraction } from "../types"
import { lowerCaseSafe } from "../utils/text"
import { extractPaymentTerms } from "./budget"

/** Contract invoicing cadence (first match wins). */
const CONTRACT_FREQUENCY_PATTERNS: readonly { pattern: string; label: string }[] = [
  { pattern: "monthly", label: "monthly" },
  { pattern: "quarterly", label: "quarterly" },
  { pattern: "per visit", label: "per visit" },
  { pattern: "upon completion", label: "upon completion" },
  { pattern: "at close-out", label: "close-out" },
  { pattern: "at closeout", label: "close-out" },
  { pattern: "close-out", label: "close-out" },
  { pattern: "closeout", label: "close-out" },
  { pattern: "close out", label: "close-out" },
] as const

const SPONSOR_COLON = /\bsponsor\s*:\s*([^\n]+)/gi

const AGREEMENT_BETWEEN =
  /this\s+agreement\s+is\s+between\s+(.+?)\s+and\s+(.+?)(?:[.,;]|\n|$|\s+whereas|\s*\()/i

/** Two named-ish parties; avoids "between 1 and 5 days". */
const BETWEEN_AND_PARTIES =
  /\bbetween\s+([A-Za-z][^.\n]{2,120}?)\s+and\s+([A-Za-z][^.\n]{2,120}?)(?:[.,;]|\n|$)/i

/** Optional "shall be" / "is" before governed. */
const GOVERNED_LAWS_OF =
  /\bgoverned\s+by\s+(?:the\s+)?laws?\s+of\s+([A-Za-z][A-Za-z\s]{0,80}?)(?:\.|,|\n|$)/i

const GOVERNING_LAW_COLON = /governing\s+law\s*:\s*([^\n]+)/i

function normalizePartyName(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[.:;]+$/g, "").trim()
}

function normalizeGoverningLawJurisdiction(s: string): string {
  return normalizePartyName(s).replace(/[.,;:)\]]+$/g, "").trim()
}

/** Site / investigator party vs sponsor-style counterparty (deterministic keywords). */
function isSiteLikeParty(name: string): boolean {
  const lower = lowerCaseSafe(name.trim())
  if (/\bvilo\s+research\s+group\b/.test(lower)) return true
  if (/\bresearch\s+group\b/.test(lower)) return true
  if (/\bclinical\s+site\b/.test(lower)) return true
  if (/\binvestigator\s+site\b/.test(lower)) return true
  if (/\bacademic\s+medical\s+center\b/.test(lower)) return true
  if (/\bmedical\s+center\b/.test(lower)) return true
  if (/\bteaching\s+hospital\b/.test(lower)) return true
  if (/\bhealth\s+system\b/.test(lower)) return true
  if (/\buniversity\b/.test(lower)) return true
  if (/\bhospital\b/.test(lower)) return true
  if (/\binstitution\b/.test(lower)) return true
  if (/\bresearch\s+center\b/.test(lower)) return true
  if (/\bcancer\s+center\b/.test(lower)) return true
  if (/\bcontract\s+research\s+organization\b/.test(lower) || /\bcro\b/.test(lower)) return false
  if (/\b(?:the\s+)?site\b/.test(lower)) return true
  if (/\bcenter\b/.test(lower)) return true
  return false
}

function resolveSponsorFromTwoParties(
  rawA: string,
  rawB: string,
): { sponsor?: string; ambiguousSponsor: boolean } {
  const a = normalizePartyName(rawA)
  const b = normalizePartyName(rawB)
  if (!a || !b) return { ambiguousSponsor: true }

  const siteA = isSiteLikeParty(a)
  const siteB = isSiteLikeParty(b)

  if (siteA && !siteB) return { sponsor: b, ambiguousSponsor: false }
  if (siteB && !siteA) return { sponsor: a, ambiguousSponsor: false }
  if (siteA && siteB) return { ambiguousSponsor: true }
  return { sponsor: a, ambiguousSponsor: false }
}

function extractSponsor(text: string): {
  sponsor?: string
  ambiguousSponsor: boolean
} {
  const colonRaw = [...text.matchAll(SPONSOR_COLON)].map((m) => normalizePartyName(m[1] ?? "")).filter(Boolean)
  const colonDistinct = [...new Set(colonRaw.map((s) => s.toLowerCase()))]

  if (colonDistinct.length > 1) {
    return { ambiguousSponsor: true }
  }
  if (colonDistinct.length === 1) {
    return { sponsor: colonRaw[0], ambiguousSponsor: false }
  }

  const agreementM = AGREEMENT_BETWEEN.exec(text)
  if (agreementM?.[1] && agreementM[2]) {
    return resolveSponsorFromTwoParties(agreementM[1], agreementM[2])
  }

  const betweenM = BETWEEN_AND_PARTIES.exec(text)
  if (betweenM?.[1] && betweenM[2]) {
    return resolveSponsorFromTwoParties(betweenM[1], betweenM[2])
  }

  return { ambiguousSponsor: false }
}

function extractContractInvoiceFrequency(text: string): string | undefined {
  const lower = lowerCaseSafe(text)
  for (const { pattern, label } of CONTRACT_FREQUENCY_PATTERNS) {
    if (lower.includes(pattern)) return label
  }
  return undefined
}

function extractIndemnification(text: string): boolean | undefined {
  const negated =
    /\b(shall|will|must)\s+not\s+[^.\n]{0,80}\bindemnif/i.test(text) ||
    /\b(no|without)\s+[^.\n]{0,50}\bindemnif/i.test(text) ||
    /\bindemnif[^.\n]{0,50}\b(excluded|disclaimed|not\s+applicable)\b/i.test(text)

  if (negated) return false
  if (/\bindemnif(y|ication)\b/i.test(text)) return true
  if (/\bagrees?\s+to\s+indemnif/i.test(text)) return true
  return undefined
}

function extractPublicationClause(text: string): boolean | undefined {
  const restricted =
    /\b(shall|must|will)\s+not\s+[^.\n]{0,100}\b(publish|publication)\b/i.test(text) ||
    /\bmay\s+not\s+[^.\n]{0,80}\b(publish|publication)\b/i.test(text) ||
    /\b(no|without)\s+[^.\n]{0,50}\bpublication\b/i.test(text) ||
    /\bpublication\s+(is\s+)?(prohibited|restricted|not\s+permitted|forbidden)\b/i.test(text) ||
    /\bnot\s+permitted\s+to\s+[^.\n]{0,40}\b(publish|publication)\b/i.test(text) ||
    /\bprohibit(s|ed|ing)?\s+[^.\n]{0,80}\bpublication\b/i.test(text) ||
    /\brestrict(s|ed|ing)?\s+[^.\n]{0,80}\bpublication\b/i.test(text)

  if (restricted) return false

  const affirmative =
    /\bpublication\s+rights?\b/i.test(text) ||
    /\bright\s+to\s+publish\b/i.test(text) ||
    /\bmay\s+publish\b/i.test(text) ||
    /\bpublication\s+of\s+(the\s+)?(results|data|findings)\b/i.test(text) ||
    /\bpublication\s+of\s+study\s+results\b/i.test(text) ||
    /\bpublication\s+of\s+[^.\n]{0,120}\s+is\s+(permitted|allowed)\b/i.test(text) ||
    /\bpublication\s+of\s+results\s+is\s+(permitted|allowed)\b/i.test(text) ||
    /\bpublication\s+is\s+(permitted|allowed)\b/i.test(text) ||
    /\b(?:is\s+|are\s+)?(permitted|allowed)\s+to\s+publish\b/i.test(text) ||
    /\bpublication\s+clause\b/i.test(text) ||
    /\bjournal\s+publication\b/i.test(text) ||
    /\bmanuscript\s+publication\b/i.test(text)

  if (affirmative) return true
  return undefined
}

function extractGoverningLaw(text: string): string | undefined {
  let m = text.match(GOVERNING_LAW_COLON)
  if (m?.[1]) return normalizeGoverningLawJurisdiction(m[1])

  m = text.match(GOVERNED_LAWS_OF)
  if (m?.[1]) return normalizeGoverningLawJurisdiction(m[1])

  return undefined
}

function buildContractRedFlags(fields: {
  paymentTerms?: string
  governingLaw?: string
  indemnification?: boolean
  publicationClause?: boolean
  ambiguousSponsor: boolean
}): string[] {
  const flags: string[] = []
  if (!fields.paymentTerms) flags.push("missing_payment_terms")
  if (!fields.governingLaw) flags.push("governing_law_not_found")
  if (fields.indemnification === undefined) flags.push("indemnification_unclear")
  if (fields.publicationClause === undefined) flags.push("publication_clause_unclear")
  if (fields.ambiguousSponsor) flags.push("ambiguous_sponsor")
  return flags
}

/**
 * Deterministic contract extraction: sponsor, cash terms, risk flags, governing law.
 */
export function extractContractFields(text: string): ContractExtraction {
  const { sponsor, ambiguousSponsor } = extractSponsor(text)
  const paymentTerms = extractPaymentTerms(text)
  const invoiceFrequency = extractContractInvoiceFrequency(text)
  const indemnification = extractIndemnification(text)
  const publicationClause = extractPublicationClause(text)
  const governingLaw = extractGoverningLaw(text)

  return {
    sponsor,
    paymentTerms,
    invoiceFrequency,
    indemnification,
    publicationClause,
    governingLaw,
    redFlags: buildContractRedFlags({
      paymentTerms,
      governingLaw,
      indemnification,
      publicationClause,
      ambiguousSponsor,
    }),
  }
}
