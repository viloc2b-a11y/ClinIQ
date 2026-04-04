"use client"

import { useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const DOCUMENT_TYPES = [
  "contract",
  "protocol",
  "budget",
  "invoice",
  "remittance",
  "other",
] as const

export type DocumentTypeOption = (typeof DOCUMENT_TYPES)[number]

type DocumentIngestPanelProps = {
  documentType: DocumentTypeOption
  onDocumentTypeChange: (t: DocumentTypeOption) => void
  uploadedFileName: string | null
  onFileSelected: (file: File | null) => void
  onProcessDocument: () => void
  onClearDocument: () => void
  onLoadArDemo: () => void
}

export function DocumentIngestPanel({
  documentType,
  onDocumentTypeChange,
  uploadedFileName,
  onFileSelected,
  onProcessDocument,
  onClearDocument,
  onLoadArDemo,
}: DocumentIngestPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="h-full border-dashed border-amber-500/40 bg-amber-500/[0.03]">
      <CardHeader>
        <CardTitle>Document ingest</CardTitle>
        <CardDescription>
          Placeholder pipeline — no parser. AR demo loads real engine output.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            File
          </label>
          <input
            ref={inputRef}
            type="file"
            className="block w-full text-xs file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              onFileSelected(f)
            }}
          />
          {uploadedFileName ? (
            <p className="mt-1 truncate text-xs text-foreground" title={uploadedFileName}>
              Selected: <span className="font-mono">{uploadedFileName}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No file selected</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Document type
          </label>
          <select
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            value={documentType}
            onChange={(e) =>
              onDocumentTypeChange(e.target.value as DocumentTypeOption)
            }
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onProcessDocument}>
            Process Document
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onFileSelected(null)
              if (inputRef.current) inputRef.current.value = ""
              onClearDocument()
            }}
          >
            Clear Document
          </Button>
          <Button type="button" size="sm" onClick={onLoadArDemo}>
            Load AR Demo Scenario
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
