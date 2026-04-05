"""Inspection Readiness Engine — FDA/ICH-aligned. Internal practice label per product."""
from __future__ import annotations

import copy
from typing import Any

INSPECTION_CATEGORIES: list[dict[str, str]] = [
    {"id": "A", "name": "Regulatory Binder Completeness"},
    {"id": "B", "name": "Informed Consent Compliance"},
    {"id": "C", "name": "Delegation / PI Oversight"},
    {"id": "D", "name": "Protocol Deviations Handling"},
    {"id": "E", "name": "Source Documentation Readiness"},
    {"id": "F", "name": "CRF / EDC / Audit Trail"},
    {"id": "G", "name": "Investigational Product Accountability"},
    {"id": "H", "name": "Safety Reporting"},
    {"id": "I", "name": "Staff Training"},
    {"id": "J", "name": "Inspection Logistics"},
]

INSPECTION_SOURCES: list[dict[str, Any]] = [
    {"id": "fda_bimo", "label": "FDA BIMO Program", "excerpt": "Clinical investigators must maintain accurate records and make them available for agency inspection.", "type": "FDA BIMO", "credibility_weight": 1.0},
    {"id": "cfr_11", "label": "21 CFR Part 11", "excerpt": "Electronic records and signatures must be trustworthy, reliable, and equivalent to paper records where used.", "type": "21 CFR Part 11", "credibility_weight": 1.0},
    {"id": "cfr_50", "label": "21 CFR Part 50", "excerpt": "Informed consent must be prospectively obtained and documented before participation in research procedures.", "type": "21 CFR Part 50", "credibility_weight": 1.0},
    {"id": "cfr_312", "label": "21 CFR Part 312", "excerpt": "Investigators are responsible for investigational product control, accountability, and disposition records.", "type": "21 CFR Part 312", "credibility_weight": 1.0},
    {"id": "ich_e6", "label": "ICH E6(R2) GCP", "excerpt": "Source data should be attributable, legible, contemporaneous, original, accurate, and complete.", "type": "ICH E6(R2)", "credibility_weight": 1.0},
    {"id": "sponsor_framework_internal", "label": "Sponsor Inspection Framework (internal reference)", "excerpt": "Industry-typical inspection readiness themes: documentation, traceability, delegation, and deviation management.", "type": "Sponsor Inspection Framework (internal reference)", "credibility_weight": 0.85},
]

CHECKLIST_SEED: list[dict[str, Any]] = [{'category': 'A',
  'evidence_expected': 'Dated IRB approvals, version-controlled protocol/amendments, enrollment-to-version matrix.',
  'failure_modes': ['missing documentation', 'version mismatch', 'late entry', 'undocumented correction'],
  'id': 'chk_001',
  'label': 'Regulatory binder contains current IRB/EC approval(s), executed protocol, and amendments matching the '
           'enrollment version',
  'recommended_action': 'Corrective: Retrieve and file current approvals and executed protocol pages; align binder '
                        'index. Preventive: Version control checks at each amendment effective date.',
  'severity_weight': 4,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'A',
  'evidence_expected': 'Signed 1572, facility addenda, dated PI signature, crosswalk to delegation log.',
  'failure_modes': ['missing documentation', 'version mismatch', 'inconsistent staff roles'],
  'id': 'chk_002',
  'label': 'FDA Form 1572 (or non-US equivalent) complete, signed, and consistent with delegated staff and facilities '
           'in use',
  'recommended_action': 'Corrective: Execute updated 1572 or amendment as applicable; file with regulatory binder. '
                        'Preventive: Quarterly 1572-to-delegation reconciliation.',
  'severity_weight': 5,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'A',
  'evidence_expected': 'Signed disclosure forms, updates after new financial interests.',
  'failure_modes': ['missing documentation', 'late entry'],
  'id': 'chk_003',
  'label': 'Financial disclosure / conflict-of-interest documentation current for investigators per IRB and sponsor '
           'requirements',
  'recommended_action': 'Corrective: Obtain missing disclosures; document effective dates. Preventive: Disclosure '
                        'renewal tied to amendments and new sub-investigator onboarding.',
  'severity_weight': 3,
  'source_id': 'sponsor_framework_internal',
  'status': 'incomplete'},
 {'category': 'A',
  'evidence_expected': 'Executed CTAs, insurance certificates, two-year CV updates.',
  'failure_modes': ['missing documentation', 'version mismatch'],
  'id': 'chk_004',
  'label': 'Clinical trial agreements, insurance/indemnity, and CVs for PI/sub-investigators filed and current',
  'recommended_action': 'Corrective: File outstanding agreements and CVs; date-stamp receipt. Preventive: CV '
                        'expiration tickler aligned with monitoring visits.',
  'severity_weight': 4,
  'source_id': 'fda_bimo',
  'status': 'incomplete'},
 {'category': 'B',
  'evidence_expected': 'Signed ICF with IRB stamp/version, consent notes per SOP, time of first procedure.',
  'failure_modes': ['missing documentation', 'version mismatch', 'late entry', 'inconsistent staff roles'],
  'id': 'chk_005',
  'label': 'Correct IRB-approved ICF version signed and dated before any study-specific procedures; consent process '
           'reflected in source',
  'recommended_action': 'Corrective: Obtain compliant re-consent if applicable; document timeline narrative. '
                        'Preventive: Pre-visit ICF version verification checklist.',
  'severity_weight': 5,
  'source_id': 'cfr_50',
  'status': 'incomplete'},
 {'category': 'B',
  'evidence_expected': 'Amendment approval, subject re-signatures, archived prior versions.',
  'failure_modes': ['version mismatch', 'missing documentation', 'late entry'],
  'id': 'chk_006',
  'label': 'Re-consent and ICF amendments obtained when required; prior version retention demonstrable',
  'recommended_action': 'Corrective: Close gaps for subjects on outdated ICFs per IRB-approved process. Preventive: '
                        'Amendment go-live huddle and binder/EMR flag.',
  'severity_weight': 5,
  'source_id': 'cfr_50',
  'status': 'incomplete'},
 {'category': 'B',
  'evidence_expected': 'HIPAA auth or waiver in regulatory file with source pointers.',
  'failure_modes': ['missing documentation', 'undocumented correction'],
  'id': 'chk_007',
  'label': 'Authorization for use/release of PHI (or local equivalent) where health records support eligibility or '
           'endpoints',
  'recommended_action': 'Corrective: Execute missing authorizations; document in source. Preventive: Screening '
                        'checklist gate for PHI-dependent assessments.',
  'severity_weight': 4,
  'source_id': 'cfr_50',
  'status': 'incomplete'},
 {'category': 'B',
  'evidence_expected': 'Addenda in binder, signed where required, linked to procedures performed.',
  'failure_modes': ['missing documentation', 'version mismatch'],
  'id': 'chk_008',
  'label': 'Supplemental consent or addenda (optional procedures, genetics, imaging) IRB-approved and filed when '
           'applicable',
  'recommended_action': 'Corrective: Obtain IRB-approved addenda and signatures. Preventive: Procedure-to-consent '
                        'matrix by visit.',
  'severity_weight': 3,
  'source_id': 'cfr_50',
  'status': 'incomplete'},
 {'category': 'C',
  'evidence_expected': 'Signed log, task dictionary, EDC role assignments, CV/training for delegates.',
  'failure_modes': ['missing documentation', 'undocumented correction', 'inconsistent staff roles'],
  'id': 'chk_009',
  'label': 'Delegation of authority log current, signed, and aligned with tasks performed (including e-system roles)',
  'recommended_action': 'Corrective: Update log and training; remove undocumented performers. Preventive: Monthly '
                        'delegation vs. EDC role report.',
  'severity_weight': 5,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'C',
  'evidence_expected': 'Signed visit reviews, safety notes, eligibility sign-off where required.',
  'failure_modes': ['missing documentation', 'late entry'],
  'id': 'chk_010',
  'label': 'PI oversight documented (progress, safety, eligibility) per site SOP and protocol expectations',
  'recommended_action': 'Corrective: Document PI review per policy; add narrative where needed. Preventive: PI review '
                        'triggers in visit workflow.',
  'severity_weight': 5,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'C',
  'evidence_expected': 'Medical licenses, certifications, scope for sub-investigators.',
  'failure_modes': ['missing documentation', 'inconsistent staff roles'],
  'id': 'chk_011',
  'label': 'Qualifications and licensure for medical decisions or regulated assessments are on file',
  'recommended_action': 'Corrective: File licenses; restrict delegation until qualified. Preventive: License '
                        'expiration dashboard.',
  'severity_weight': 4,
  'source_id': 'fda_bimo',
  'status': 'incomplete'},
 {'category': 'C',
  'evidence_expected': 'Written coverage, contact tree, dated acknowledgments.',
  'failure_modes': ['missing documentation', 'inconsistent staff roles'],
  'id': 'chk_012',
  'label': 'Coverage plan for PI absence and urgent medical decisions per protocol and GCP',
  'recommended_action': 'Corrective: Document coverage; communicate to staff. Preventive: Annual rehearsal after '
                        'staffing changes.',
  'severity_weight': 3,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'D',
  'evidence_expected': 'Deviation log, dated entries, PI assessment, subject impact notes.',
  'failure_modes': ['missing documentation', 'late entry', 'undocumented correction'],
  'id': 'chk_013',
  'label': 'Protocol deviations identified, characterized, and logged contemporaneously with significance assessment',
  'recommended_action': 'Corrective: Log unrecorded events; obtain PI assessment. Preventive: Deviation awareness '
                        'huddle within 24–48 hours.',
  'severity_weight': 5,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'D',
  'evidence_expected': 'Submission receipts, correspondence, IRB acknowledgment.',
  'failure_modes': ['late entry', 'missing documentation'],
  'id': 'chk_014',
  'label': 'IRB and sponsor notifications for reportable deviations within required timelines with receipts',
  'recommended_action': 'Corrective: Submit overdue notifications with justification memo. Preventive: Deviation '
                        'reporting SLA tracker.',
  'severity_weight': 5,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'D',
  'evidence_expected': 'CAPA forms, root cause, effectiveness checks.',
  'failure_modes': ['missing documentation', 'undocumented correction'],
  'id': 'chk_015',
  'label': 'CAPA for systemic deviation trends documented with owners and dates',
  'recommended_action': 'Corrective: Open CAPA where trends exist; assign owners. Preventive: Trend review at QA '
                        'meetings.',
  'severity_weight': 4,
  'source_id': 'sponsor_framework_internal',
  'status': 'incomplete'},
 {'category': 'D',
  'evidence_expected': 'Source worksheets, IP log, CRF fields, query closure.',
  'failure_modes': ['version mismatch', 'late entry', 'inconsistent staff roles'],
  'id': 'chk_016',
  'label': 'IMP dosing or visit-window deviations reconciled across source, accountability, and CRF',
  'recommended_action': 'Corrective: Align records via queries and source clarification. Preventive: Visit prep '
                        'cross-check of window and dosing.',
  'severity_weight': 4,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'E',
  'evidence_expected': 'Dated entries, signatures, printouts with attribution, correction methodology.',
  'failure_modes': ['missing documentation', 'late entry', 'undocumented correction'],
  'id': 'chk_017',
  'label': 'Source data ALCOA for key visits and endpoints',
  'recommended_action': 'Corrective: Remediate ALCOA gaps per policy. Preventive: Source documentation SOP training '
                        'and audits.',
  'severity_weight': 5,
  'source_id': 'fda_bimo',
  'status': 'needs_review'},
 {'category': 'E',
  'evidence_expected': 'Certification statements, copy procedures, QA acknowledgment if required.',
  'failure_modes': ['missing documentation', 'undocumented correction'],
  'id': 'chk_018',
  'label': 'Certified copies traceable and meet ALCOA expectations where originals are not onsite',
  'recommended_action': 'Corrective: Obtain compliant certifications. Preventive: Template certification language and '
                        'training.',
  'severity_weight': 4,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'E',
  'evidence_expected': 'Lab reports, transfer logs, query resolution linking to source.',
  'failure_modes': ['late entry', 'version mismatch'],
  'id': 'chk_019',
  'label': 'External data (central labs, imaging, ECG) reconciled to source and CRF with query trail',
  'recommended_action': 'Corrective: Close reconciliation queries; file reports. Preventive: Central data receipt log.',
  'severity_weight': 4,
  'source_id': 'fda_bimo',
  'status': 'incomplete'},
 {'category': 'E',
  'evidence_expected': 'Policy adherence in sampled pages, training records.',
  'failure_modes': ['undocumented correction', 'late entry'],
  'id': 'chk_020',
  'label': 'Source corrections follow controlled procedures (single-line strike, init/date, reason)',
  'recommended_action': 'Corrective: Document acceptable corrections per policy. Preventive: Correction coaching for '
                        'staff.',
  'severity_weight': 5,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'F',
  'evidence_expected': 'Audit trail export, user-ID mapping to delegation, query log.',
  'failure_modes': ['version mismatch', 'undocumented correction', 'inconsistent staff roles'],
  'id': 'chk_021',
  'label': 'EDC/CRF entries traceable to source; audit trail reviewable for inspectors',
  'recommended_action': 'Corrective: Resolve orphaned edits; align user roles. Preventive: Weekly audit trail spot '
                        'check.',
  'severity_weight': 5,
  'source_id': 'cfr_11',
  'status': 'incomplete'},
 {'category': 'F',
  'evidence_expected': 'EDC validation excerpts, account provisioning SOP, training.',
  'failure_modes': ['inconsistent staff roles', 'missing documentation'],
  'id': 'chk_022',
  'label': 'Electronic signatures and credentials meet Part 11–equivalent controls (unique ID, password policy)',
  'recommended_action': 'Corrective: Disable shared accounts; reset credentials. Preventive: Quarterly account review.',
  'severity_weight': 4,
  'source_id': 'cfr_11',
  'status': 'incomplete'},
 {'category': 'F',
  'evidence_expected': 'Query metrics, escalation emails, closure dates.',
  'failure_modes': ['late entry', 'missing documentation'],
  'id': 'chk_023',
  'label': 'Query management timely; aging queries risk-assessed and escalated',
  'recommended_action': 'Corrective: Close aged queries; document barriers. Preventive: Query SLA dashboard.',
  'severity_weight': 3,
  'source_id': 'cfr_11',
  'status': 'incomplete'},
 {'category': 'F',
  'evidence_expected': 'User guides, training logs, helpdesk tickets for critical issues.',
  'failure_modes': ['missing documentation', 'version mismatch'],
  'id': 'chk_024',
  'label': 'ePRO/eDiary or other eClinical tools under risk-based controls with training evidence',
  'recommended_action': 'Corrective: File validation/UAT summaries and training. Preventive: Device issuance log '
                        'linked to training.',
  'severity_weight': 3,
  'source_id': 'cfr_11',
  'status': 'incomplete'},
 {'category': 'G',
  'evidence_expected': 'Packing lists, temp monitors, pharmacy sign-off, inventory locations.',
  'failure_modes': ['missing documentation', 'late entry', 'undocumented correction'],
  'id': 'chk_025',
  'label': 'IP shipment receipt, quarantine/release, and storage conditions documented',
  'recommended_action': 'Corrective: Reconstruct chain from carrier and pharmacy notes. Preventive: Receiving '
                        'checklist tied to temp alarm response.',
  'severity_weight': 5,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'G',
  'evidence_expected': 'Accountability logs, subject diary cross-check, reconciliation memos.',
  'failure_modes': ['missing documentation', 'late entry'],
  'id': 'chk_026',
  'label': 'Dispensing, dosing, and return reconciliation per protocol with periodic inventory checks',
  'recommended_action': 'Corrective: Resolve discrepancies with pharmacy/CRC review. Preventive: Visit-close '
                        'reconciliation rule.',
  'severity_weight': 5,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'G',
  'evidence_expected': 'Excursion reports, sponsor direction, quarantine labels.',
  'failure_modes': ['undocumented correction', 'missing documentation'],
  'id': 'chk_027',
  'label': 'Temperature excursions investigated; product disposition documented',
  'recommended_action': 'Corrective: Obtain sponsor disposition and file. Preventive: Alarm response SOP with '
                        'timestamps.',
  'severity_weight': 5,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'G',
  'evidence_expected': 'Destruction certs, return manifests, witness logs.',
  'failure_modes': ['missing documentation', 'late entry'],
  'id': 'chk_028',
  'label': 'Destruction or return of unused IP documented with certificates or shipping records',
  'recommended_action': 'Corrective: Retrieve certificates from vendor or sponsor. Preventive: Destruction scheduling '
                        'tied to closeout.',
  'severity_weight': 4,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'H',
  'evidence_expected': 'SAE worksheets, causality, submission receipts, follow-ups.',
  'failure_modes': ['missing documentation', 'late entry'],
  'id': 'chk_029',
  'label': 'SAEs and expedited reports within timelines; supporting narratives complete',
  'recommended_action': 'Corrective: Submit late reports with timeline justification. Preventive: Same-day sponsor '
                        'notification rule for SAE awareness.',
  'severity_weight': 5,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'H',
  'evidence_expected': 'Reporting forms, outcome tracking, IRB updates.',
  'failure_modes': ['missing documentation', 'inconsistent staff roles'],
  'id': 'chk_030',
  'label': 'Pregnancy and special safety follow-ups per protocol and IRB expectations',
  'recommended_action': 'Corrective: Complete outstanding follow-ups; file outcomes. Preventive: Safety calendar for '
                        'recurring reports.',
  'severity_weight': 4,
  'source_id': 'cfr_312',
  'status': 'incomplete'},
 {'category': 'H',
  'evidence_expected': 'Email logs, letters, binder or safety file index.',
  'failure_modes': ['missing documentation', 'version mismatch'],
  'id': 'chk_031',
  'label': 'Safety correspondence with sponsor/CRO filed and cross-referenced',
  'recommended_action': 'Corrective: Centralize correspondence with index. Preventive: Safety mailbox archiving SOP.',
  'severity_weight': 3,
  'source_id': 'fda_bimo',
  'status': 'incomplete'},
 {'category': 'I',
  'evidence_expected': 'Certificates, expiry dates, training matrix.',
  'failure_modes': ['missing documentation', 'inconsistent staff roles'],
  'id': 'chk_032',
  'label': 'GCP and human-subjects training current for staff performing regulated tasks',
  'recommended_action': 'Corrective: Retrain and document before further tasks. Preventive: Monthly training expiry '
                        'report.',
  'severity_weight': 4,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'I',
  'evidence_expected': 'Amendment training logs, acknowledgment, quiz if used.',
  'failure_modes': ['missing documentation', 'late entry'],
  'id': 'chk_033',
  'label': 'Protocol- and amendment-specific training with attendance or sign-off',
  'recommended_action': 'Corrective: Deliver amendment training; file roster. Preventive: Amendment go-live training '
                        'gate.',
  'severity_weight': 4,
  'source_id': 'ich_e6',
  'status': 'incomplete'},
 {'category': 'I',
  'evidence_expected': 'Calibration certs, maintenance logs, out-of-service tags.',
  'failure_modes': ['missing documentation', 'undocumented correction'],
  'id': 'chk_034',
  'label': 'Equipment for regulated assessments calibrated or qualified per SOP with certificates',
  'recommended_action': 'Corrective: Quarantine equipment until calibration verified. Preventive: Calibration due-date '
                        'tracking.',
  'severity_weight': 3,
  'source_id': 'sponsor_framework_internal',
  'status': 'incomplete'},
 {'category': 'J',
  'evidence_expected': 'Floor plan, file index, dry-run notes, IT guest access tested.',
  'failure_modes': ['missing documentation', 'inconsistent staff roles'],
  'id': 'chk_035',
  'label': 'Inspection workspace, retrieval paths rehearsed; index current',
  'recommended_action': 'Corrective: Update index; assign runners. Preventive: Quarterly mock retrieval drill.',
  'severity_weight': 3,
  'source_id': 'sponsor_framework_internal',
  'status': 'incomplete'},
 {'category': 'J',
  'evidence_expected': 'SOP section, staff briefing, redaction supplies.',
  'failure_modes': ['missing documentation', 'inconsistent staff roles'],
  'id': 'chk_036',
  'label': 'Confidentiality controls for subject identifiers during inspector review defined',
  'recommended_action': 'Corrective: Brief staff on PHI minimization. Preventive: Inspector workstation setup '
                        'checklist.',
  'severity_weight': 3,
  'source_id': 'sponsor_framework_internal',
  'status': 'incomplete'}]

DOCUMENT_MATRIX_SEED: list[dict[str, Any]] = [{'category': 'A',
  'completeness_score': 0,
  'expected_document': 'Regulatory binder index / table of contents',
  'id': 'doc_001',
  'status': 'missing'},
 {'category': 'A',
  'completeness_score': 0,
  'expected_document': 'IRB approval letter(s) and continuing review (current)',
  'id': 'doc_002',
  'status': 'missing'},
 {'category': 'A',
  'completeness_score': 0,
  'expected_document': 'Executed protocol and all amendments (version-controlled)',
  'id': 'doc_003',
  'status': 'missing'},
 {'category': 'A',
  'completeness_score': 0,
  'expected_document': 'FDA Form 1572 and financial disclosure forms',
  'id': 'doc_004',
  'status': 'missing'},
 {'category': 'B',
  'completeness_score': 0,
  'expected_document': 'Current IRB-stamped ICF template(s) on file',
  'id': 'doc_005',
  'status': 'missing'},
 {'category': 'B',
  'completeness_score': 0,
  'expected_document': 'Signed subject ICFs (readiness sample set)',
  'id': 'doc_006',
  'status': 'missing'},
 {'category': 'B',
  'completeness_score': 0,
  'expected_document': 'HIPAA authorization / PHI release (where applicable)',
  'id': 'doc_007',
  'status': 'missing'},
 {'category': 'C',
  'completeness_score': 0,
  'expected_document': 'Signed delegation of authority log',
  'id': 'doc_008',
  'status': 'missing'},
 {'category': 'C',
  'completeness_score': 0,
  'expected_document': 'CVs and licenses for PI and sub-investigators',
  'id': 'doc_009',
  'status': 'missing'},
 {'category': 'D',
  'completeness_score': 0,
  'expected_document': 'Protocol deviation / note-to-file log',
  'id': 'doc_010',
  'status': 'missing'},
 {'category': 'D',
  'completeness_score': 0,
  'expected_document': 'IRB/sponsor deviation notification receipts',
  'id': 'doc_011',
  'status': 'missing'},
 {'category': 'E',
  'completeness_score': 0,
  'expected_document': 'Source documents for screening and key visits (indexed)',
  'id': 'doc_012',
  'status': 'missing'},
 {'category': 'E',
  'completeness_score': 0,
  'expected_document': 'Certified copy policy / sample certifications',
  'id': 'doc_013',
  'status': 'missing'},
 {'category': 'F',
  'completeness_score': 0,
  'expected_document': 'EDC audit trail export or on-screen retrieval SOP',
  'id': 'doc_014',
  'status': 'missing'},
 {'category': 'F',
  'completeness_score': 0,
  'expected_document': 'Query log / query aging report',
  'id': 'doc_015',
  'status': 'missing'},
 {'category': 'G',
  'completeness_score': 0,
  'expected_document': 'IP accountability log (site and subject level)',
  'id': 'doc_016',
  'status': 'missing'},
 {'category': 'G',
  'completeness_score': 0,
  'expected_document': 'Temperature monitoring records for IP storage',
  'id': 'doc_017',
  'status': 'missing'},
 {'category': 'G',
  'completeness_score': 0,
  'expected_document': 'IP destruction or return certificates',
  'id': 'doc_018',
  'status': 'missing'},
 {'category': 'H',
  'completeness_score': 0,
  'expected_document': 'SAE worksheets and expedited reporting receipts',
  'id': 'doc_019',
  'status': 'missing'},
 {'category': 'I',
  'completeness_score': 0,
  'expected_document': 'GCP and protocol training records (matrix)',
  'id': 'doc_020',
  'status': 'missing'},
 {'category': 'I',
  'completeness_score': 0,
  'expected_document': 'Equipment calibration certificates (as applicable)',
  'id': 'doc_021',
  'status': 'missing'},
 {'category': 'J',
  'completeness_score': 0,
  'expected_document': 'Inspection day roster and document retrieval map',
  'id': 'doc_022',
  'status': 'missing'},
 {'category': 'A',
  'completeness_score': 0,
  'expected_document': 'Monitoring visit letter / follow-up log (recent)',
  'id': 'doc_023',
  'status': 'missing'},
 {'category': 'E',
  'completeness_score': 0,
  'expected_document': 'Laboratory normal ranges and certification (central/local)',
  'id': 'doc_024',
  'status': 'missing'}]

INSPECTION_SIMULATION_QUESTIONS: list[dict[str, Any]] = [
    {"role": "PI", "category": "Consent process", "question": "Walk me through how informed consent was obtained for this subject and where that is evidenced in the record.", "intent": "Verify consent process documentation and timing versus procedures.", "expected_evidence": "Signed ICF version, consent discussion notes, date/time of first protocol procedure.", "red_flag_answers": ["We always use the old form; it is basically the same.", "Consent was verbal first; we signed later.", "I am not sure who obtained consent."], "strong_answer_example": "The IRB-approved version dated ___ was signed on ___ before any study procedures; the consent note is in the source at ___."},
    {"role": "CRC", "category": "Data traceability", "question": "Show me how you verified this subject met all inclusion criteria at screening.", "intent": "Test source-supported eligibility and traceability to CRF.", "expected_evidence": "Screening labs, medical history source, eligibility checklist, EDC query trail if applicable.", "red_flag_answers": ["It is in the EDC only.", "We did not keep screening notes."], "strong_answer_example": "Inclusion/exclusion are verified in source pages ___ and cross-checked to CRF field ___ on date ___."},
    {"role": "PI", "category": "Deviation handling", "question": "Describe how this protocol deviation was identified, documented, assessed, and reported.", "intent": "Assess deviation management and regulatory reporting discipline.", "expected_evidence": "Deviation log entry, PI assessment, IRB/sponsor notifications, CAPA if assigned.", "red_flag_answers": ["We fixed it quietly; no need to report.", "I do not recall that event."], "strong_answer_example": "Identified on ___; logged as DEV-___; assessed per SOP; IRB notified ___; sponsor acknowledged ___."},
    {"role": "Coordinator", "category": "Data traceability", "question": "How do you ensure data entered in the EDC matches source documentation?", "intent": "Probe ALCOA+ and Part 11-aligned practices.", "expected_evidence": "SDV plan, query resolution, audit trail review, staff training on data entry.", "red_flag_answers": ["We enter from memory at end of week.", "Source is optional for non-key data."], "strong_answer_example": "Source is reviewed at visit; EDC entered same day; queries resolved within ___ days; audit trail reviewed weekly."},
    {"role": "CRC", "category": "Staff responsibilities", "question": "Who performed this assessment and how was the task delegated?", "intent": "Match execution to delegation log and qualifications.", "expected_evidence": "Delegation log, CV, training file, dated source signature or electronic attribution.", "red_flag_answers": ["Whoever was available.", "Delegation log is outdated but we know who did it."], "strong_answer_example": "Task ___ is delegated to ___ per log dated ___; training file shows competency dated ___."},
    {"role": "PI", "category": "PI oversight", "question": "How do you maintain oversight of subject safety between visits?", "intent": "Evaluate ongoing PI responsibility under GCP.", "expected_evidence": "Safety review SOP, communication logs, delegation for medical review, escalation criteria.", "red_flag_answers": ["The sponsor monitors that.", "I only see patients on visit days."], "strong_answer_example": "We review labs/AEs per SOP section ___; CRC escalates per threshold ___; I document review in source ___."},
    {"role": "Coordinator", "category": "IP accountability", "question": "How do you reconcile investigational product counts after each visit?", "intent": "Test IP accountability and reconciliation discipline.", "expected_evidence": "Accountability logs, dispensing/return signatures, pharmacy reconciliation notes.", "red_flag_answers": ["We estimate left over drug.", "Shipment receipts are not kept."], "strong_answer_example": "Per SOP ___, we reconcile subject diary, dispensing log, and site inventory after each visit; discrepancies trigger form ___."},
    {"role": "CRC", "category": "Deviation handling", "question": "What actions were taken after this issue was identified, and how was effectiveness checked?", "intent": "CAPA and effectiveness — inspection-style follow-through.", "expected_evidence": "Root cause, corrective action, training/retraining, dated verification.", "red_flag_answers": ["We told staff to be careful.", "No follow-up was needed."], "strong_answer_example": "Root cause ___; action ___; staff retrained ___; effectiveness verified on ___ via audit/metrics."},
]



def _regulatory_finding_title(label: str, severity: str, *, st: str) -> str:
    lab = label.strip()
    if len(lab) > 92:
        lab = lab[:89] + "..."
    if st == "needs_review":
        return (
            "At the time of review, expected documentation could not be confirmed to demonstrate that: "
            + lab
        )
    if severity == "critical":
        return "Available records do not demonstrate that: " + lab
    if severity == "major":
        return (
            "Supporting documentation was not available for review in a manner that demonstrates compliance with: "
            + lab
        )
    return (
        "The following expected GCP control does not demonstrate full alignment in the materials reviewed, or was not available for review: "
        + lab
    )



def _source_by_id(sources: list[dict[str, Any]], sid: str | None) -> dict[str, Any] | None:
    return next((s for s in sources if s.get("id") == sid), None)


def _finding_severity(item: dict[str, Any]) -> str:
    st = item.get("status", "")
    w = int(item.get("severity_weight", 1))
    if st in ("complete", "not_applicable"):
        return "none"
    if st == "needs_review":
        tier = 2 if w >= 5 else 1 if w >= 3 else 0
    else:
        tier = 3 if w >= 5 else 2 if w >= 3 else 1 if w >= 2 else 0
    if tier >= 3:
        return "critical"
    if tier >= 2:
        return "major"
    return "minor"


def _impact_for_category(cat: str) -> str:
    m = {"A": "regulatory compliance", "B": "subject safety", "C": "regulatory compliance", "D": "data integrity", "E": "data integrity", "F": "data integrity", "G": "subject safety", "H": "subject safety", "I": "regulatory compliance", "J": "regulatory compliance"}
    return m.get(cat, "regulatory compliance")


def generate_inspection_findings(checklist: list[dict[str, Any]], sources: list[dict[str, Any]]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for item in checklist:
        if item.get("status") not in ("incomplete", "needs_review"):
            continue
        sev = _finding_severity(item)
        if sev == "none":
            continue
        cat = item.get("category") or ""
        src = _source_by_id(sources, item.get("source_id"))
        label = str(item.get("label", ""))
        title = _regulatory_finding_title(label, sev, st=item.get("status", ""))
        impact = _impact_for_category(cat)
        risk_statement = "This may impact validity of submitted data and inspection confidence if unresolved."
        if impact == "subject safety":
            risk_statement = "This may impact subject protection and safety oversight narratives during inspection."
        item_capa = (item.get("recommended_action") or "").strip()
        if item_capa:
            capa = item_capa
        else:
            capa = (
                f"Corrective: Close the evidence gap for item {item.get('id')} (retrieve or complete documentation, align versions, contemporaneous entry). "
                f"Preventive: Targeted QA sampling and training focused on {', '.join((item.get('failure_modes') or [])[:2])}."
            )
        ev_close = item.get("evidence_expected") or "Complete, contemporaneous source documentation and cross-referenced regulatory files."
        findings.append(
            {
                "item_id": item["id"],
                "category": cat,
                "title": title,
                "gap": label,
                "severity": sev,
                "impact": impact,
                "risk_statement": risk_statement,
                "recommended_action": capa,
                "evidence_required_to_close": ev_close,
                "failure_modes": item.get("failure_modes") or [],
                "source": src,
                "_sort_weight": int(item.get("severity_weight", 1)),
            }
        )
    severity_rank = {"critical": 0, "major": 1, "minor": 2}
    findings.sort(key=lambda f: (severity_rank.get(f["severity"], 9), -f["_sort_weight"]))
    for f in findings:
        del f["_sort_weight"]
    return findings


def _category_base_score(items: list[dict[str, Any]]) -> float:
    tw = sw = 0.0
    for it in items:
        w = float(it.get("severity_weight", 1))
        tw += w
        st = it.get("status", "")
        if st == "complete":
            sw += w
        elif st == "needs_review":
            sw += w * 0.5
        elif st == "not_applicable":
            tw -= w
    if tw <= 0:
        return 100.0
    return 100.0 * sw / tw


def compute_category_scores(checklist: list[dict[str, Any]], findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_cat: dict[str, list[dict[str, Any]]] = {}
    for it in checklist:
        by_cat.setdefault(str(it.get("category") or ""), []).append(it)
    out: list[dict[str, Any]] = []
    for cat in INSPECTION_CATEGORIES:
        cid = cat["id"]
        items = by_cat.get(cid, [])
        if not items:
            continue
        base = _category_base_score(items)
        cat_findings = [f for f in findings if f.get("category") == cid]
        critical_cap = any(f.get("severity") == "critical" for f in cat_findings)
        if critical_cap:
            base = min(base, 40.0)
        for _ in range(sum(1 for f in cat_findings if f.get("severity") == "major")):
            base *= 0.88
        base -= sum(1 for f in cat_findings if f.get("severity") == "minor") * 3.0
        base = max(0.0, min(100.0, base))
        out.append({"id": cid, "name": cat["name"], "score": int(round(base)), "critical_cap_applied": critical_cap})
    return out


def compute_overall_risk(category_rows: list[dict[str, Any]]) -> tuple[int, str]:
    if not category_rows:
        return 100, "low"
    scores = [int(c["score"]) for c in category_rows]
    overall = int(round(sum(scores) / len(scores)))
    if overall >= 80:
        return overall, "low"
    if overall >= 50:
        return overall, "medium"
    return overall, "high"


def compute_inspection_run(checklist: list[dict[str, Any]]) -> dict[str, Any]:
    findings = generate_inspection_findings(checklist, INSPECTION_SOURCES)
    categories = compute_category_scores(checklist, findings)
    overall, risk = compute_overall_risk(categories)
    severity_rank = {"critical": 0, "major": 1, "minor": 2}
    sorted_f = sorted(findings, key=lambda f: (severity_rank.get(f.get("severity"), 9), -len(f.get("gap") or "")))
    drivers = [{"title": f.get("title"), "severity": f.get("severity"), "item_id": f.get("item_id"), "impact": f.get("impact")} for f in sorted_f[:3]]
    immediate = [{"title": f.get("title"), "severity": f.get("severity"), "impact": f.get("impact"), "item_id": f.get("item_id")} for f in findings if f.get("severity") in ("critical", "major")]
    score_block: dict[str, Any] = {"overall": overall, "risk_level": risk, "categories": categories, "inspection_risk_drivers": drivers, "immediate_attention_required": immediate}
    return {"score": score_block, "findings": findings}


def build_inspection_pack_markdown(state: dict[str, Any]) -> str:
    sc = state.get("score") or {}
    findings = state.get("findings") or []
    docs = state.get("documents") or []
    lines: list[str] = [
        "# ClinIQ — Inspection Readiness Pack",
        "",
        f"*Generated: {state.get('last_updated', '')}*",
        "",
        "## 1. Inspection Readiness Summary",
        "",
        f"- **Overall score:** {sc.get('overall', '—')}",
        f"- **Risk level:** {sc.get('risk_level', '—')}",
        "",
        "### Category scores",
        "",
    ]
    for c in sc.get("categories") or []:
        cap = " (critical cap applied)" if c.get("critical_cap_applied") else ""
        lines.append(f"- **{c.get('id')} {c.get('name')}:** {c.get('score')}{cap}")
    if docs:
        lines += ["", "### Document matrix snapshot", ""]
        for d in docs:
            lines.append(
                f"- **[{d.get('category', '')}]** {d.get('expected_document', '')} — "
                f"status: *{d.get('status', '')}*; completeness: **{d.get('completeness_score', 0)}%**"
            )
    lines += ["", "## 2. Top Risk Drivers", ""]
    drivers = sc.get("inspection_risk_drivers") or []
    if not drivers:
        lines.append("- None ranked (run inspection check or resolve findings).")
    for i, d in enumerate(drivers, 1):
        lines.append(f"{i}. **{str(d.get('severity', '')).upper()}** — {d.get('title', '')} *(impact: {d.get('impact', '')})*")
    lines += ["", "## 3. Immediate Attention Required", ""]
    imm = sc.get("immediate_attention_required") or []
    if not imm:
        lines.append("- No critical or major findings at export.")
    for f in imm:
        lines.append(f"- **{str(f.get('severity', '')).upper()}** [{f.get('impact', '')}]: {f.get('title', '')}")
    lines += ["", "## 4. Open Gaps Log", ""]
    if not findings:
        lines.append("- No open gaps recorded at export.")
    for f in findings:
        lines.append(
            f"- **{f.get('item_id', '')}** ({f.get('severity', '')}): {f.get('title', f.get('gap', ''))}"
        )
    lines += ["", "## 5. Recommended Actions", ""]
    if not findings:
        lines.append("- None.")
    else:
        for f in findings:
            lines.append(f"- **{f.get('item_id', '')}:** {f.get('recommended_action', '')}")
    lines.append("")
    return "\n".join(lines)


def default_inspection_state() -> dict[str, Any]:
    return {
        "site_id": "demo-site",
        "study_id": "optional",
        "last_updated": "",
        "score": {"overall": 0, "risk_level": "high", "categories": [], "inspection_risk_drivers": [], "immediate_attention_required": []},
        "findings": [],
        "checklist": copy.deepcopy(CHECKLIST_SEED),
        "documents": copy.deepcopy(DOCUMENT_MATRIX_SEED),
        "simulation_sessions": [],
        "audit_pack": {},
    }
