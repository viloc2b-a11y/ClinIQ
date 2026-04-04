import type { ProtocolExtraction } from "../types"

const PROTOCOL_ID = /Protocol\s*:\s*([^\n]+)/i
const STUDY_ID = /Study\s+ID\s*:\s*([^\n]+)/i

function cleanStudyId(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/[.:;]+$/g, "").trim()
}

function extractStudyId(text: string): string | undefined {
  let bestIdx = Number.POSITIVE_INFINITY
  let best: string | undefined
  for (const re of [STUDY_ID, PROTOCOL_ID]) {
    const m = new RegExp(re.source, re.flags).exec(text)
    if (m?.[1] != null && m.index !== undefined) {
      const v = cleanStudyId(m[1])
      if (v && m.index < bestIdx) {
        bestIdx = m.index
        best = v
      }
    }
  }
  return best
}

function isVisitLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  const lower = t.toLowerCase()
  if (lower.includes("visit")) return true
  if (/visit\s*\d+/i.test(t)) return true
  if (/week\s*\d+/i.test(t)) return true
  if (/\bbaseline\b/i.test(t)) return true
  if (/\bscreening\b/i.test(t)) return true
  if (/follow[- ]?up/i.test(t)) return true
  return false
}

function stripProcedurePrefix(line: string): string {
  return line
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .trim()
}

function isBillableProcedure(proc: string): boolean {
  const lower = proc.toLowerCase()
  return (
    lower.includes("lab") ||
    lower.includes("blood") ||
    lower.includes("imaging") ||
    lower.includes("mri") ||
    lower.includes("x-ray") ||
    lower.includes("xray") ||
    lower.includes("ecg") ||
    lower.includes("exam")
  )
}

function isConditionalProcedure(proc: string): boolean {
  const lower = proc.toLowerCase()
  return /\bif\b/.test(lower) || lower.includes("as needed") || lower.includes("optional")
}

function pushDedupe(arr: string[], seen: Set<string>, value: string): void {
  const key = value.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  arr.push(value)
}

/**
 * Deterministic protocol / SoA extraction: visits, procedures, billable vs conditional cues.
 */
export function extractProtocolFields(text: string): ProtocolExtraction {
  const studyId = extractStudyId(text)

  const visits: { name: string; procedures: string[] }[] = []
  let currentName: string | null = null
  let currentProcs: string[] = []

  const flush = () => {
    if (currentName !== null) {
      visits.push({ name: currentName, procedures: currentProcs })
      currentProcs = []
    }
  }

  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line) continue

    if (isVisitLine(line)) {
      flush()
      currentName = line.trim()
      continue
    }

    if (currentName !== null) {
      const proc = stripProcedurePrefix(line)
      if (proc) currentProcs.push(proc)
    }
  }
  flush()

  const billableEvents: string[] = []
  const conditionalEvents: string[] = []
  const billSeen = new Set<string>()
  const condSeen = new Set<string>()

  for (const v of visits) {
    for (const p of v.procedures) {
      if (isBillableProcedure(p)) pushDedupe(billableEvents, billSeen, p)
      if (isConditionalProcedure(p)) pushDedupe(conditionalEvents, condSeen, p)
    }
  }

  return {
    studyId,
    visits,
    billableEvents,
    conditionalEvents,
  }
}
