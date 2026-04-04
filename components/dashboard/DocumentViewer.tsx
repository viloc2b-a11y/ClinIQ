"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import type { DocumentTypeOption } from "./DocumentIngestPanel"

type DocumentViewerProps = {
  uploadedFileName: string | null
  documentType: DocumentTypeOption
  extractedText: string | null
}

export function DocumentViewer({
  uploadedFileName,
  documentType,
  extractedText,
}: DocumentViewerProps) {
  const hasContext = Boolean(uploadedFileName || extractedText)

  return (
    <Card className="flex h-full min-h-[280px] flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CardTitle>Document viewer</CardTitle>
          <Badge variant="outline">Source context</Badge>
        </div>
        <CardDescription>
          What you loaded and what the placeholder extractor returned.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {!hasContext ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            No document loaded
          </div>
        ) : (
          <>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">File name: </span>
                <span className="font-mono text-xs">
                  {uploadedFileName ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Type: </span>
                <Badge variant="secondary">{documentType}</Badge>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <span className="mb-1 text-xs font-medium text-muted-foreground">
                Extracted text (placeholder)
              </span>
              <pre className="max-h-[min(420px,50vh)] flex-1 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                {extractedText ?? (
                  <span className="text-muted-foreground italic">
                    Run &quot;Process Document&quot; to fill placeholder text.
                  </span>
                )}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
