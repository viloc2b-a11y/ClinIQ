import { extractBudgetFields } from "./extractors/budget"
import { extractContractFields } from "./extractors/contract"
import { extractInvoiceFields } from "./extractors/invoice"
import { extractProtocolFields } from "./extractors/protocol"
import { parseFile } from "./parse-file"
import type {
  BudgetExtraction,
  ContractExtraction,
  DocumentRecord,
  InvoiceExtraction,
  ParsedFilePayload,
  ProtocolExtraction,
  ProcessDocumentInput,
  ProcessingStatus,
} from "./types"

function warningToReviewFlag(w: string): string {
  return `normalize_${w}`
}

export function evaluateProcessingStatus(
  parsed: ParsedFilePayload,
  reviewFlags: string[],
): ProcessingStatus {
  if (parsed.parseWarnings.includes("empty_input")) {
    return "needs_review"
  }
  if (reviewFlags.length > 0) {
    return "needs_review"
  }
  return "processed"
}

export function processDocument(input: ProcessDocumentInput): DocumentRecord {
  const documentId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const parsed = parseFile({
    rawText: input.rawText,
    fileName: input.fileName,
  })

  const reviewFlags: string[] = parsed.parseWarnings.map(warningToReviewFlag)

  let budget: BudgetExtraction | undefined
  let contract: ContractExtraction | undefined
  let invoice: InvoiceExtraction | undefined
  let protocol: ProtocolExtraction | undefined

  switch (input.documentType) {
    case "budget": {
      budget = extractBudgetFields(parsed.normalizedText)
      if (budget.lineItems.length === 0) {
        reviewFlags.push("no_line_items_detected")
      }
      if (!budget.paymentTerms) {
        reviewFlags.push("missing_payment_terms")
      }
      break
    }
    case "contract": {
      contract = extractContractFields(parsed.normalizedText)
      reviewFlags.push(...contract.redFlags)
      break
    }
    case "invoice": {
      invoice = extractInvoiceFields(parsed.normalizedText)
      if (!invoice.invoiceNumber) {
        reviewFlags.push("missing_invoice_number")
      }
      if (invoice.totalAmount === undefined) {
        reviewFlags.push("missing_total_amount")
      }
      break
    }
    case "protocol": {
      protocol = extractProtocolFields(parsed.normalizedText)
      break
    }
    default: {
      const _exhaustive: never = input.documentType
      throw new Error(`Unsupported document type: ${_exhaustive}`)
    }
  }

  const processingStatus = evaluateProcessingStatus(parsed, reviewFlags)

  return {
    documentId,
    documentType: input.documentType,
    processingStatus,
    parsed,
    budget,
    contract,
    invoice,
    protocol,
    reviewFlags,
    processedAt: new Date().toISOString(),
  }
}
