import type { AgingEntry, ClaimItem, InvoicePackage } from "./types"

function csvCell(value: string | number | boolean | undefined): string {
  const s = value === undefined || value === null ? "" : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function claimItemsToCsv(items: ClaimItem[]): string {
  const headers = [
    "id",
    "studyId",
    "sponsorId",
    "subjectId",
    "visitName",
    "eventDate",
    "lineCode",
    "label",
    "amount",
    "status",
    "requiresReview",
    "exceptionReason",
    "supportNote",
    "eventLogId",
    "billableInstanceId",
  ]
  const lines = [headers.join(",")]
  for (const c of items) {
    lines.push(
      [
        csvCell(c.id),
        csvCell(c.studyId),
        csvCell(c.sponsorId),
        csvCell(c.subjectId),
        csvCell(c.visitName),
        csvCell(c.eventDate),
        csvCell(c.lineCode),
        csvCell(c.label),
        csvCell(c.amount),
        csvCell(c.status),
        csvCell(c.requiresReview),
        csvCell(c.exceptionReason),
        csvCell(c.supportNote),
        csvCell(c.eventLogId),
        csvCell(c.billableInstanceId),
      ].join(","),
    )
  }
  return `${lines.join("\n")}\n`
}

export function invoicePackageToJson(
  pkg: InvoicePackage | InvoicePackage[],
): string {
  return JSON.stringify(pkg, null, 2)
}

export function agingReportToCsv(entries: AgingEntry[]): string {
  const headers = [
    "id",
    "studyId",
    "sponsorId",
    "subjectId",
    "lineCode",
    "label",
    "amount",
    "status",
    "eventDate",
    "daysOutstanding",
    "requiresReview",
    "supportNote",
  ]
  const lines = [headers.join(",")]
  for (const a of entries) {
    lines.push(
      [
        csvCell(a.id),
        csvCell(a.studyId),
        csvCell(a.sponsorId),
        csvCell(a.subjectId),
        csvCell(a.lineCode),
        csvCell(a.label),
        csvCell(a.amount),
        csvCell(a.status),
        csvCell(a.eventDate),
        csvCell(a.daysOutstanding),
        csvCell(a.requiresReview),
        csvCell(a.supportNote),
      ].join(","),
    )
  }
  return `${lines.join("\n")}\n`
}
