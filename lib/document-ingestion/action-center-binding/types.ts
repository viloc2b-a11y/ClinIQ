export type ActionCenterBindingStatus =
  | "persisted"
  | "skipped"
  | "failed"

export type PersistableActionSeed = {
  seedId: string
  type: string
  title: string
  estimatedValue: number
  sourceTrace?: Record<string, unknown> | null
}

export type ActionCenterBindingResult = {
  data: {
    persistableSeeds: PersistableActionSeed[]
    writePayload: {
      items: Array<{
        id: string
        type: string
        title: string
        estimatedValue: number
        sourceTrace?: Record<string, unknown> | null
      }>
    } | null
    writeResult: unknown | null
    verificationResult: unknown | null
  }
  summary: {
    status: ActionCenterBindingStatus
    totalSeeds: number
    attemptedWrite: boolean
    verified: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
