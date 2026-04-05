import type {
  ActionCenterOperationStatus,
  ActionCenterVerifySummary,
  ActionCenterWriteSummary,
} from "./types"

export function getWriteStatus(input: {
  ok: boolean
  partial: boolean
  attempted: number
  written: number
}): ActionCenterOperationStatus {
  if (input.ok && !input.partial && input.attempted === input.written) {
    return "success"
  }

  if (input.partial || (input.written > 0 && input.written < input.attempted)) {
    return "partial"
  }

  return "failed"
}

export function getVerifyStatus(input: { missing: string[] }): ActionCenterOperationStatus {
  return input.missing.length === 0 ? "success" : "verification_failed"
}

export function getWriteAndVerifyStatus(input: {
  write: Pick<ActionCenterWriteSummary, "status">
  verify: Pick<ActionCenterVerifySummary, "status">
}): ActionCenterOperationStatus {
  if (input.write.status === "failed") {
    return "failed"
  }

  if (input.write.status === "partial") {
    return "partial"
  }

  if (input.verify.status === "verification_failed") {
    return "verification_failed"
  }

  return "success"
}
