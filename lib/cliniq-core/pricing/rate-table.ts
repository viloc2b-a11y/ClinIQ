export type RateTableEntry = {
  activityKey: string
  category: "lab" | "cardiology" | "imaging" | "procedure" | "visit" | "other"
  baseRate: number
}

/** Canonical keys align with `ACTIVITY_ALIASES` where applicable; order is stable for deterministic scans. */
export const RATE_TABLE: RateTableEntry[] = [
  { activityKey: "ecg", category: "cardiology", baseRate: 125 },
  { activityKey: "mri", category: "imaging", baseRate: 800 },
  { activityKey: "ct", category: "imaging", baseRate: 600 },
  { activityKey: "xray", category: "imaging", baseRate: 180 },
  { activityKey: "ultrasound", category: "imaging", baseRate: 250 },
  { activityKey: "blood draw", category: "lab", baseRate: 60 },
  { activityKey: "lab test", category: "lab", baseRate: 90 },
  { activityKey: "urinalysis", category: "lab", baseRate: 45 },
  { activityKey: "pregnancy test", category: "lab", baseRate: 55 },
  { activityKey: "physical exam", category: "visit", baseRate: 150 },
  { activityKey: "vital signs", category: "visit", baseRate: 40 },
  { activityKey: "spirometry", category: "procedure", baseRate: 175 },
  { activityKey: "questionnaire", category: "procedure", baseRate: 75 },
  { activityKey: "cognitive assessment", category: "procedure", baseRate: 220 },
  { activityKey: "biopsy", category: "procedure", baseRate: 650 },
  { activityKey: "drug administration", category: "procedure", baseRate: 140 },
  { activityKey: "infusion", category: "procedure", baseRate: 350 },
  { activityKey: "dosing", category: "procedure", baseRate: 125 },
  { activityKey: "pk sample", category: "lab", baseRate: 110 },
  { activityKey: "ae review", category: "visit", baseRate: 80 },
  { activityKey: "conmed review", category: "visit", baseRate: 70 },
  { activityKey: "eligibility review", category: "visit", baseRate: 95 },
  { activityKey: "randomization", category: "visit", baseRate: 180 },
  { activityKey: "screen failure", category: "visit", baseRate: 160 },
  { activityKey: "closeout visit", category: "visit", baseRate: 200 },
]
