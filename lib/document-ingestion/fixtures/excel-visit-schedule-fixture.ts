import type { DocumentFixture } from "./types"

export function buildExcelVisitScheduleFixture(): DocumentFixture {
  return {
    id: "fixture-excel-visit-schedule",
    type: "excel_visit_schedule",
    fileName: "visit-schedule.xlsx",
    sourceType: "excel",
    workbook: {
      Visits: [
        ["Timepoint", "Activity", "Fee", "Qty"],
        ["Screening", "Consent", 0, 1],
        ["Baseline", "Vitals", 0, 1],
        ["Day 7", "Safety Labs", 0, 1],
      ],
    },
    metadata: {
      description: "Visit schedule workbook for canonical visit-oriented parsing",
      tags: ["excel", "visit-schedule", "schedule", "timepoint"],
    },
  }
}
