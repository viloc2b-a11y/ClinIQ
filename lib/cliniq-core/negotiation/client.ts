/**
 * Client-safe exports for the negotiation UI.
 * Avoids importing server-only ingestion modules that depend on `node:*` APIs.
 */

export { buildNegotiationPackage } from "./build-package"
export { counterofferLinesToCsv, negotiationPackageToJson } from "./export-format"
export { generateEmailDraft } from "./email-draft"
export { NEGOTIATION_ENGINE_INPUT_SESSION_KEY } from "./handoff"
export type { NegotiationStrategy } from "./types"

