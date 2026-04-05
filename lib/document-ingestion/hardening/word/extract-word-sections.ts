export type WordSection = {
  sectionIndex: number
  text: string
}

export function extractWordSections(params: {
  paragraphs: string[]
}): WordSection[] {
  return params.paragraphs
    .map((p, index) => ({
      sectionIndex: index,
      text: (p || "").trim(),
    }))
    .filter((p) => p.text.length > 0)
}
