/**
 * Sponsor-facing external justifications (one sentence, neutral, no negotiation tactics).
 */

export type ProtocolContext = {
  complexity_multiplier?: number
  pre_screen_hours?: number
  consent_minutes?: number
}

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n)
}

export function getExternalJustification(
  feeCode: string,
  protocolContext?: ProtocolContext,
): string {
  const ctx = protocolContext ?? {}

  switch (feeCode) {
    case "SF-START-001":
      return "Reflects site activation, startup coordination, and required regulatory preparation before enrollment begins."
    case "PP-SCR-001":
      return "Reflects the operational effort required for informed consent, screening procedures, and associated study documentation."
    case "INV-SF-001": {
      const h = ctx.pre_screen_hours
      if (isNum(h)) {
        return `Reflects the operational effort associated with pre-screening (~${h} hours), screening procedures, and non-randomized subject handling.`
      }
      return "Reflects the operational effort associated with pre-screening, screening procedures, and non-randomized subject handling."
    }
    case "INV-AMD-001":
      return "Reflects the regulatory review, documentation updates, and staff retraining required for protocol amendments."
    case "INV-DRY-001":
      return "Reflects specimen handling, shipment materials, courier coordination, and associated administrative processing."
    case "INV-ARC-001":
      return "Reflects long-term secure document retention required under regulatory recordkeeping standards."
    case "PP-FUP-001":
      return "Reflects scheduled follow-up visit activities, assessments, and documentation consistent with the protocol."
    case "PP-RAND-001":
    case "PP-EOS-001":
      return "Reflects patient visit execution, assessments, and source documentation for this protocol milestone."
    case "PP-UNS-001":
      return "Reflects unscheduled or early-termination visit effort, coordination, and documentation."
    case "INV-PHARM-001":
      return "Reflects investigational product preparation, dispensing, and pharmacy accountability tasks tied to study visits."
    case "INV-SAE-001":
      return "Reflects safety reporting, medical review, and regulatory correspondence associated with adverse events."
    case "INV-CONC-001":
      return "Reflects patient scheduling support, reminders, and light care navigation to support retention."
    case "INV-MON-001":
      return "Reflects on-site monitoring support including logistics, copies, and staff coordination."
    case "INV-QUERY-001":
      return "Reflects data query investigation, source verification, and resolution effort in study systems."
    case "INV-CLO-001":
      return "Reflects study closeout activities, reconciliations, and handoffs required to complete the study at site level."
    case "SF-IRB-001":
    case "IRB-INIT-001":
      return "Reflects IRB submission, correspondence, and review activities required for study activation."
    case "SF-PHARM-001":
      return "Reflects pharmacy setup, investigational product accountability readiness, and related activation tasks."
    case "SF-SIV-001":
      return "Reflects site initiation visit delivery, training, and documentation prior to enrollment."
    case "SF-REG-001":
      return "Reflects regulatory document compilation, quality review, and submission for site activation."
    case "ADMIN-IRB-001":
      return "Reflects annual continuing IRB review preparation, submission, and follow-up correspondence."
    case "ADMIN-TECH-001":
      return "Reflects technology provisioning, access setup, and validation for CTMS and eRegulatory workflows."
    case "RECR-ADV-001":
      return "Reflects recruitment campaign coordination, vendor alignment, and pre-screening support."
    case "PASS-LAB-001":
    case "PASS-TRAV-001":
      return "Reflects pass-through costs for external services executed under sponsor-approved policies."
    case "INV-IMAG-001":
      return "Reflects central imaging or ECG read submission, quality checks, and transmission activities."
    case "INV-DEV-001":
      return "Reflects device provisioning, training, sync support, and accountability for patient-worn equipment."
    case "ADMIN-OVER-001":
    case "CONT-BUF-001":
    case "INF-ADJ-001":
      return "Reflects contracted budget terms for administrative, contingency, or indexation components as negotiated."
    default:
      return "Reflects site operational effort and execution requirements for this study activity."
  }
}
