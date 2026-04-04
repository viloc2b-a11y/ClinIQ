/**
 * Deterministic document intake core: parse/normalize in, typed extractions out.
 */

export type DocumentType = "budget" | "contract" | "invoice" | "protocol"

export type ProcessingStatus = "processed" | "needs_review"

export type BudgetExtraction = {
  lineItems: { description: string; amount: number }[]
  paymentTerms?: string
  invoiceFrequency?: string
}

export type ContractExtraction = {
  sponsor?: string
  paymentTerms?: string
  invoiceFrequency?: string
  indemnification?: boolean
  publicationClause?: boolean
  governingLaw?: string
  redFlags: string[]
}

export type InvoiceExtraction = {
  invoiceNumber?: string
  sponsor?: string
  invoiceDate?: string
  dueDate?: string
  totalAmount?: number
  paidAmount?: number
  referenceNumber?: string
}

export type ProtocolExtraction = {
  studyId?: string
  visits: { name: string; procedures: string[] }[]
  billableEvents: string[]
  conditionalEvents: string[]
}

export type ParsedFilePayload = {
  rawText: string
  normalizedText: string
  lineCount: number
  parseWarnings: string[]
  fileName?: string
}

export type DocumentRecord = {
  documentId: string
  documentType: DocumentType
  processingStatus: ProcessingStatus
  parsed: ParsedFilePayload
  budget?: BudgetExtraction
  contract?: ContractExtraction
  invoice?: InvoiceExtraction
  protocol?: ProtocolExtraction
  reviewFlags: string[]
  processedAt: string
}

export type ProcessDocumentInput = {
  documentType: DocumentType
  rawText: string
  fileName?: string
}

export type ParseFileInput = {
  rawText: string
  fileName?: string
}
