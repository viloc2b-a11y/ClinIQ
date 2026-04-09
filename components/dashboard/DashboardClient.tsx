"use client"

import { useCallback, useState } from "react"

import type { ArDemoScenarioResult } from "@/lib/cliniq-core/ar/demo-scenario"

import { ActionBar } from "@/components/dashboard/ActionBar"
import {
  DocumentIngestPanel,
  type DocumentTypeOption,
} from "@/components/dashboard/DocumentIngestPanel"
import { DocumentViewer } from "@/components/dashboard/DocumentViewer"
import { StructuredOutputPanel } from "@/components/dashboard/StructuredOutputPanel"

type PlaceholderStructuredOutput = {
  type: string
  status: string
  notes: string
}

type DashboardClientProps = {
  asOfDate: string
  initialArDemo: ArDemoScenarioResult
}

export function DashboardClient({ asOfDate, initialArDemo }: DashboardClientProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] =
    useState<DocumentTypeOption>("contract")
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [structuredOutput, setStructuredOutput] =
    useState<PlaceholderStructuredOutput | null>(null)
  const [demoData, setDemoData] = useState<ArDemoScenarioResult | null>(initialArDemo)
  const [reviewed, setReviewed] = useState(false)

  const uploadedFileName = uploadedFile?.name ?? null

  const processDocument = useCallback(() => {
    const name = uploadedFile?.name ?? "untitled"
    setExtractedText(`Sample extracted text for [${name}]`)
    setStructuredOutput({
      type: documentType,
      status: "processed",
      notes: "Placeholder extraction (no parser yet)",
    })
  }, [uploadedFile, documentType])

  const clearDocument = useCallback(() => {
    setExtractedText(null)
    setStructuredOutput(null)
  }, [])

  const loadArDemo = useCallback(() => {
    setDemoData(initialArDemo)
  }, [initialArDemo])

  const handleCopySummary = useCallback(async () => {
    if (!demoData) {
      console.log("[Copy Summary] No AR demo loaded.")
      return
    }
    const c = demoData.commandSummary
    const lines = [
      `asOfDate: ${c.asOfDate}`,
      `totalOutstandingAr: ${c.totalOutstandingAr}`,
      `totalHighRiskAr: ${c.totalHighRiskAr}`,
      `totalMediumRiskAr: ${c.totalMediumRiskAr}`,
      `totalLowRiskAr: ${c.totalLowRiskAr}`,
      `overdueInvoiceCount: ${c.overdueInvoiceCount}`,
      `shortPaidInvoiceCount: ${c.shortPaidInvoiceCount}`,
      `invoicesRequiringActionNow: ${c.invoicesRequiringActionNow}`,
    ]
    const text = lines.join("\n")
    try {
      await navigator.clipboard.writeText(text)
      console.log("[Copy Summary] Copied to clipboard:\n", text)
    } catch {
      console.log("[Copy Summary] Clipboard unavailable; payload:\n", text)
    }
  }, [demoData])

  const handleExportJson = useCallback(() => {
    const payload = {
      asOfDate,
      arDemo: demoData,
      document: {
        fileName: uploadedFileName,
        documentType,
        extractedText,
        structuredOutput,
      },
      reviewed,
    }
    console.log("[Export JSON]", JSON.stringify(payload, null, 2))
  }, [
    asOfDate,
    demoData,
    uploadedFileName,
    documentType,
    extractedText,
    structuredOutput,
    reviewed,
  ])

  const handleQueueRowClick = useCallback(
    (invoiceId: string, recommendedAction: string) => {
      console.log("[Queue row]", invoiceId, recommendedAction)
    },
    [],
  )

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 bg-background/80 px-4 py-5 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
            AR &amp; collections
          </p>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Documents and collections</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Upload and preview on the left; collections and risk on the right (demo data, as of{" "}
            <span className="font-mono text-foreground/90">{asOfDate}</span>).
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 p-4 sm:px-6 lg:grid-cols-12 lg:gap-3 lg:py-6">
        <div className="lg:col-span-3">
          <DocumentIngestPanel
            documentType={documentType}
            onDocumentTypeChange={setDocumentType}
            uploadedFileName={uploadedFileName}
            onFileSelected={setUploadedFile}
            onProcessDocument={processDocument}
            onClearDocument={clearDocument}
            onLoadArDemo={loadArDemo}
          />
        </div>

        <div className="lg:col-span-4">
          <DocumentViewer
            uploadedFileName={uploadedFileName}
            documentType={documentType}
            extractedText={extractedText}
          />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-5">
          <StructuredOutputPanel
            asOfDate={asOfDate}
            demoData={demoData}
            onQueueRowClick={handleQueueRowClick}
          />
          <ActionBar
            reviewed={reviewed}
            onMarkReviewed={() => setReviewed((v) => !v)}
            onCopySummary={handleCopySummary}
            onExportJson={handleExportJson}
            copyDisabled={!demoData}
          />
        </div>
      </div>
    </div>
  )
}
