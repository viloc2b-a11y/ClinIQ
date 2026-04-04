import type { CounterofferLine, NegotiationPackage } from "./types"

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const CSV_HEADERS = [
  "lineCode",
  "label",
  "category",
  "visitName",
  "sponsorOffer",
  "internalCost",
  "recommendedCounteroffer",
  "gapAmount",
  "priority",
  "rationale",
  "riskFlag",
] as const

export function counterofferLinesToCsv(lines: CounterofferLine[]): string {
  const headerRow = CSV_HEADERS.join(",")
  const dataRows = lines.map((row) =>
    [
      row.lineCode,
      row.label,
      row.category,
      row.visitName,
      String(row.sponsorOffer),
      String(row.internalCost),
      String(row.recommendedCounteroffer),
      String(row.gapAmount),
      row.priority,
      row.rationale,
      row.riskFlag ? "true" : "false",
    ]
      .map(csvEscapeCell)
      .join(","),
  )
  return [headerRow, ...dataRows].join("\n")
}

export function negotiationPackageToJson(
  pkg: NegotiationPackage,
  space = 2,
): string {
  return `${JSON.stringify(pkg, null, space)}\n`
}
