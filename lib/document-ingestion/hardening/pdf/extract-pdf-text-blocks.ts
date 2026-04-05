export type PdfTextBlock = {
  pageNumber: number
  text: string
}

export function extractPdfTextBlocks(params: {
  pages: Array<{ text?: string | null }>
}): PdfTextBlock[] {
  return params.pages.map((page, index) => ({
    pageNumber: index + 1,
    text: (page.text || "").trim(),
  }))
}
