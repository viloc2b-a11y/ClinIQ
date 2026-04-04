/**
 * One-off helper: prints SQL VALUES for extended 25 fees (global + demo).
 * Run: node scripts/emit-extended-fee-seed.mjs >> tmp.sql
 * Not part of production build; optional maintenance.
 */
const fees = [
  ["SF-IRB-001", "IRB Initial Submission & Review", "startup", "one_time", 2500, 1500, 4000, null, "IRB initial submission & review", "regulatory", "irb_log", "immediate", "net_30", "high", true, true, true, 5, "Includes preparation, submission, correspondence, and completion of the initial IRB review process required to activate the study.", "operational_billable", "range_based"],
  ["SF-PHARM-001", "Pharmacy Setup & IP Accountability", "startup", "one_time", 3500, 2000, 5500, null, "Pharmacy setup & IP accountability", "setup", "pharmacy_log", "immediate", "net_30", "high", true, true, true, 5, "Covers investigational product setup, accountability workflow preparation, temperature log readiness, and pharmacy-related study activation tasks.", "operational_billable", "range_based"],
  ["SF-SIV-001", "Site Initiation Visit + Training", "startup", "one_time", 1800, 1000, 3000, null, "Site initiation visit + training", "training", "siv_log", "immediate", "net_30", "high", true, true, true, 5, "Covers site initiation visit execution, staff training, and documentation required prior to first patient activity.", "operational_billable", "range_based"],
  ["SF-REG-001", "Regulatory Document Preparation", "startup", "one_time", 1200, 600, 2200, null, "Regulatory document preparation", "regulatory", "regulatory_log", "immediate", "net_30", "medium_high", true, true, true, 5, "Covers compilation, quality review, and submission of regulatory documents required for site activation and sponsor oversight.", "operational_billable", "range_based"],
  ["PP-RAND-001", "Randomization / Baseline Visit", "per_patient_visit", "per_visit", 520, 350, 750, null, "Randomization / baseline visit", "visit", "visit_log", "monthly", "net_30", "high", true, true, true, 30, "Covers the randomization and baseline assessment visit performed per protocol after eligibility confirmation.", "operational_billable", "range_based"],
  ["PP-EOS-001", "End of Study / EOS Visit", "per_patient_visit", "per_visit", 500, 320, 720, null, "End of study / EOS visit", "visit", "visit_log", "monthly", "net_30", "medium_high", true, true, true, 30, "Covers end-of-study visit activities, final assessments, and documentation required for protocol completion.", "operational_billable", "range_based"],
  ["PP-UNS-001", "Unscheduled / Early Termination Visit", "per_patient_visit", "per_visit", 425, 275, 650, null, "Unscheduled / early termination visit", "unscheduled_visit", "visit_log", "immediate", "net_30", "medium", true, true, true, 10, "Covers unscheduled or early termination visits driven by patient status, safety, or sponsor-directed schedule changes.", "operational_billable", "range_based"],
  ["INV-SAE-001", "SAE Reporting & Review Fee", "invoiceable", "per_sae", 275, 150, 450, null, "SAE reporting & review", "safety", "sae_log", "monthly", "net_30", "medium_high", true, true, true, 30, "Covers SAE intake, medical review, regulatory reporting coordination, and sponsor correspondence per reported event.", "operational_billable", "per_event_estimated"],
  ["INV-DRY-001", "Dry Ice, Shipping & Specimen Handling", "pass_through", "per_shipment", 85, 40, 200, null, "Dry ice, shipping & specimen handling", "shipment", "shipment_log", "monthly_or_batch", "net_30", "medium_high", true, true, true, 30, "Reimburses dry ice, courier, packaging, and chain-of-custody handling for outbound specimen shipments.", "operational_billable", "cost_plus_markup"],
  ["INV-PHARM-001", "Pharmacy / IP Preparation & Dispensing", "invoiceable", "per_visit_or_dose", 95, 50, 180, null, "Pharmacy / IP preparation & dispensing", "pharmacy", "pharmacy_log", "monthly", "net_30", "medium_high", true, true, true, 30, "Covers investigational product preparation, labeling checks, dispensing, and pharmacy documentation tied to patient visits.", "operational_billable", "range_based"],
  ["INV-CONC-001", "Patient Concierge / Reminder Fee", "invoiceable", "per_patient_month", 120, 60, 220, null, "Patient concierge / reminder fee", "monthly_management", "patient_mgmt_log", "monthly", "net_30", "medium", true, true, true, 30, "Covers proactive scheduling support, visit reminders, and lightweight care navigation to protect retention and compliance.", "operational_billable", "per_event_estimated"],
  ["INV-MON-001", "On-site Monitoring Visit Support", "invoiceable", "per_visit", 650, 400, 950, null, "On-site monitoring visit support", "monitoring", "monitoring_log", "monthly", "net_30", "medium", true, true, true, 30, "Covers coordination, space, copies, and staff time required to host and support on-site monitoring visits.", "operational_billable", "range_based"],
  ["INV-QUERY-001", "Query Resolution Fee", "invoiceable", "per_batch_or_hour", 175, 75, 350, null, "Query resolution fee", "query_resolution", "edc_query_log", "monthly", "net_30", "medium", true, true, true, 30, "Covers investigation, source verification, and closure of data queries generated in the EDC or related systems.", "operational_billable", "per_event_estimated"],
  ["INV-ARC-001", "Long-term Archiving Fee", "closeout", "one_time", 4500, 2500, 7500, null, "Long-term archiving fee", "closeout", "closeout_log", "at_closeout", "net_30", "high", true, true, true, 15, "Covers long-term storage, indexing, and retrieval readiness for essential study records after database lock.", "operational_billable", "range_based"],
  ["INV-CLO-001", "Study Close-out Fee", "closeout", "one_time", 2800, 1500, 4500, null, "Study close-out fee", "closeout", "monitoring_log", "at_closeout", "net_30", "medium_high", true, true, true, 15, "Covers final close-out activities, reconciliations, and handoffs required to complete the study at site level.", "operational_billable", "range_based"],
  ["ADMIN-OVER-001", "Administrative / Overhead Fee", "administrative", "percent_of_total", null, null, null, 10.0, "Administrative / overhead fee", "budget_rule", "budget_engine", "monthly", "net_30", "medium", true, false, false, null, "Reflects site operational overhead required to support compliant execution, including facilities, utilities, insurance, and core administrative infrastructure.", "pricing_rule", "percent_of_total"],
  ["ADMIN-IRB-001", "Annual IRB Continuing Review", "administrative", "per_year", 800, 500, 1300, null, "Annual IRB continuing review", "annual_review", "irb_log", "annual", "net_30", "medium", true, true, true, 15, "Covers annual continuing review preparation, submission, and follow-up correspondence required to maintain IRB approval.", "operational_billable", "range_based"],
  ["ADMIN-TECH-001", "Technology Setup / CTMS-eReg Access Fee", "startup", "one_time", 900, 400, 1600, null, "Technology setup / CTMS-eReg access", "setup", "tech_access_log", "immediate", "net_30", "medium", true, true, true, 5, "Covers CTMS/eReg provisioning, account setup, training coordination, and validation of technology access for the study team.", "operational_billable", "range_based"],
  ["RECR-ADV-001", "Recruitment / Advertising Support Fee", "invoiceable", "one_time_or_campaign", 2400, 1000, 5000, null, "Recruitment / advertising support", "recruitment_campaign", "recruitment_log", "immediate", "net_30", "medium", true, true, true, 10, "Covers advertising setup, vendor coordination, pre-screening support, and campaign tracking tied to recruitment goals.", "operational_billable", "range_based"],
  ["CONT-BUF-001", "Contingency Buffer (Imprevistos)", "contingency", "percent_of_total", null, null, null, 5.0, "Contingency buffer", "budget_rule", "budget_engine", "at_signature", "net_30", "medium", true, false, false, null, "Provides a negotiated contingency allowance for unplanned operational tasks not explicitly itemized in the per-event schedule.", "negotiation_only", "percent_of_total"],
  ["PASS-LAB-001", "External Lab Processing Fee", "pass_through", "per_test", 120, 40, 280, null, "External lab processing fee", "lab_processing", "lab_log", "monthly", "net_30", "medium", true, true, true, 30, "Passes through external laboratory processing charges with agreed handling for collection, shipping, and reconciliation.", "operational_billable", "cost_plus_markup"],
  ["PASS-TRAV-001", "Patient Travel / Stipend Reimbursement", "pass_through", "per_visit", 150, 50, 400, null, "Patient travel / stipend reimbursement", "patient_visit_completed", "visit_log", "monthly", "net_30", "medium", true, true, true, 30, "Reimburses patient travel, parking, and stipend amounts executed per sponsor-approved policy and visit attendance.", "operational_billable", "cost_plus_markup"],
  ["INV-IMAG-001", "Central Imaging / ECG Reading Submission", "invoiceable", "per_submission", 210, 90, 450, null, "Central imaging / ECG submission", "central_submission", "imaging_log", "monthly", "net_30", "medium", true, true, true, 30, "Covers upload, QC, transmission, and vendor fees for central imaging or ECG reads per protocol requirements.", "operational_billable", "range_based"],
  ["INV-DEV-001", "Device / Wearable Management Fee", "invoiceable", "per_patient", 280, 120, 520, null, "Device / wearable management fee", "device_issued", "device_log", "monthly", "net_30", "medium", true, true, true, 30, "Covers device provisioning, training, sync support, and accountability tracking for patient-worn equipment during the study.", "operational_billable", "range_based"],
  ["INF-ADJ-001", "Inflation Adjustment Clause", "contingency", "percent_per_year", null, null, null, 2.5, "Inflation adjustment clause", "annual_adjustment", "budget_engine", "annual", "net_30", "medium", true, false, false, null, "Documents an agreed annual uplift mechanism for applicable pass-through and service rates in line with contracted inflation terms.", "negotiation_only", "annual_uplift"],
]

function esc(s) {
  return String(s).replace(/'/g, "''")
}

function row(templateId, seriesPrefix, seq, f, demoBump) {
  const [
    code, name, cat, unit, dr, rl, rh, pct, tname, ttype, tsrc, bcycle, pterms, pri,
    svis, auto, invreq, maxd, just, eng, strat,
  ] = f
  const id = `${seriesPrefix}${String(seq).padStart(12, "0")}`
  const numOrNull = (v, bump) => {
    if (v == null) return "NULL"
    const x = bump ? Math.round(v * 1.04 * 100) / 100 : v
    return x
  }
  const drs = dr == null ? "NULL" : numOrNull(dr, demoBump)
  const low = rl == null ? "NULL" : numOrNull(rl, demoBump)
  const high = rh == null ? "NULL" : numOrNull(rh, demoBump)
  const pcts = pct == null ? "NULL" : pct
  const maxds = maxd == null ? "NULL" : maxd
  return `(
  '${id}',
  '${templateId}',
  '${esc(code)}',
  '${esc(name)}',
  '${esc(cat)}',
  '${esc(unit)}',
  ${drs},
  ${low},
  ${high},
  ${pcts},
  '${esc(tname)}',
  '${esc(ttype)}',
  '${esc(tsrc)}',
  '${esc(bcycle)}',
  '${esc(pterms)}',
  '${esc(pri)}',
  ${svis},
  ${auto},
  ${invreq},
  ${maxds},
  '${esc(just)}',
  true,
  '${eng}',
  '${strat}'
)`
}

console.log("-- Extended 25 fees — global starter template")
console.log(
  "INSERT INTO public.site_fee_template_items (\n  id, template_id, fee_code, fee_name, category, unit,\n  default_rate, range_low, range_high, percent_rate,\n  trigger_name, trigger_type, trigger_source,\n  billing_cycle, payment_terms, priority,\n  sponsor_visible, auto_create_billable, invoice_required,\n  max_days_to_invoice, justification_template, is_active,\n  engine_behavior, default_rate_strategy\n) VALUES\n" +
    fees.map((f, i) => row("a0000000-0000-4000-8000-000000000001", "f1000000-0000-4000-8000-", 6 + i, f, false)).join(",\n") +
    ";\n",
)

console.log("-- Extended 25 fees — demo site template (~4% rate bump on numeric anchors)")
console.log(
  "INSERT INTO public.site_fee_template_items (\n  id, template_id, fee_code, fee_name, category, unit,\n  default_rate, range_low, range_high, percent_rate,\n  trigger_name, trigger_type, trigger_source,\n  billing_cycle, payment_terms, priority,\n  sponsor_visible, auto_create_billable, invoice_required,\n  max_days_to_invoice, justification_template, is_active,\n  engine_behavior, default_rate_strategy\n) VALUES\n" +
    fees.map((f, i) => row("a0000000-0000-4000-8000-000000000002", "f2000000-0000-4000-8000-", 6 + i, f, true)).join(",\n") +
    ";\n",
)
