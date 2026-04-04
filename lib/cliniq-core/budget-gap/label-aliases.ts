/**
 * Maps sponsor-style wording to stable tokens so internal vs sponsor rows align.
 * Applied per field (category, visitName, label) before the match key is built.
 * Longer / more specific patterns are applied first.
 */
const ALIAS_REPLACEMENTS: { pattern: RegExp; token: string }[] = [
  { pattern: /\bregulatory\s+amendment\s+review\b/gi, token: "__reg_amend__" },
  { pattern: /\bamendment\s+admin\b/gi, token: "__reg_amend__" },

  { pattern: /\bscreen\s+failure\b/gi, token: "__screen_fail__" },
  { pattern: /\bscreen\s+fail\b/gi, token: "__screen_fail__" },
  /** "Screening visit" is one token; \bscreen\s+visit\b misses the "ing" form. */
  { pattern: /\bscreening(?:\s+visit)?\b/gi, token: "__screening__" },
  { pattern: /\bscreen\s+visit\b/gi, token: "__screening__" },

  { pattern: /\bstart\s*-\s*up\b/gi, token: "__startup__" },
  { pattern: /\bstartup\b/gi, token: "__startup__" },
  { pattern: /\bsite\s+activation\b/gi, token: "__startup__" },

  { pattern: /\bfollow\s*-\s*up\b/gi, token: "__followup__" },
  { pattern: /\bfollow\s+up\b/gi, token: "__followup__" },
  { pattern: /\bfu\b/gi, token: "__followup__" },

  { pattern: /\bclose\s*-\s*out\b/gi, token: "__closeout__" },
  { pattern: /\bcloseout\b/gi, token: "__closeout__" },
  { pattern: /\barchiving\b/gi, token: "__closeout__" },
  { pattern: /\barchive\b/gi, token: "__closeout__" },

  { pattern: /\brandomization\b/gi, token: "__randomize__" },
  { pattern: /\bbaseline\b/gi, token: "__randomize__" },

  { pattern: /\bspecimen\s+processing\b/gi, token: "__lab_ship__" },
  { pattern: /\blab\s+handling\b/gi, token: "__lab_ship__" },
  { pattern: /\bdry\s+ice\b/gi, token: "__lab_ship__" },
  { pattern: /\bshipping\b/gi, token: "__lab_ship__" },

  { pattern: /\bdrug\s+accountability\b/gi, token: "__pharm__" },
  { pattern: /\bip\s+handling\b/gi, token: "__pharm__" },
  { pattern: /\bpharmacy\b/gi, token: "__pharm__" },

  { pattern: /\bscr\b/gi, token: "__screening__" },
  { pattern: /\bsf\b/gi, token: "__screen_fail__" },
]

/**
 * Replace known sponsor/internal synonyms with canonical tokens, then collapse whitespace.
 */
export function applyBudgetLabelAliases(raw: string): string {
  let t = raw.trim()
  for (const { pattern, token } of ALIAS_REPLACEMENTS) {
    t = t.replace(pattern, ` ${token} `)
  }
  return t
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
