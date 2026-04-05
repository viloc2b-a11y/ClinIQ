export function getFieldString(
  fields: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = fields[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (
      value &&
      typeof value === "object" &&
      "value" in (value as Record<string, unknown>)
    ) {
      const nested = (value as { value?: unknown }).value
      if (typeof nested === "string" && nested.trim()) return nested.trim()
    }
  }

  return null
}
