export function getCanonicalValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>)
  ) {
    return (value as { value?: unknown }).value
  }

  return value
}
