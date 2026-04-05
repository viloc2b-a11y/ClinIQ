import type { HardenedRecord } from "./types"

function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "")
}

const KEY_MAP: Record<string, string> = {
  visit: "visitName",
  visit_name: "visitName",
  procedure: "activityDescription",
  activity: "activityDescription",
  event: "activityDescription",
  fee: "unitPrice",
  amount: "unitPrice",
  schedule: "visitName",
}

export function normalizeHardenedRecords(records: HardenedRecord[]): HardenedRecord[] {
  return records.map((record) => {
    const nextFields: HardenedRecord["fields"] = {}

    for (const [key, value] of Object.entries(record.fields)) {
      const normalizedKey = normalizeKey(key)
      const mappedKey = KEY_MAP[normalizedKey] || normalizedKey
      nextFields[mappedKey] = value
    }

    return {
      ...record,
      fields: nextFields,
    }
  })
}
