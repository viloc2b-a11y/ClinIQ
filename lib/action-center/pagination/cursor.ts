type CursorPayload = {
  createdAt: string
  id: string
}

export function encodeActionCenterCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64")
}

export function decodeActionCenterCursor(cursor: string | undefined): CursorPayload | null {
  if (!cursor) {
    return null
  }

  try {
    const json = Buffer.from(cursor, "base64").toString("utf8")
    const parsed = JSON.parse(json) as unknown

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as CursorPayload).createdAt !== "string" ||
      typeof (parsed as CursorPayload).id !== "string"
    ) {
      return null
    }

    return parsed as CursorPayload
  } catch {
    return null
  }
}
