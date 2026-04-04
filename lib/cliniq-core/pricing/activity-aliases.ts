export type ActivityAliasEntry = {
  canonicalKey: string
  aliases: string[]
}

export const ACTIVITY_ALIASES: ActivityAliasEntry[] = [
  {
    canonicalKey: "ecg",
    aliases: ["ecg", "ekg", "electrocardiogram", "12 lead ecg", "cardiac monitoring"],
  },
  {
    canonicalKey: "mri",
    aliases: ["mri", "magnetic resonance imaging", "brain mri", "contrast mri", "non contrast mri"],
  },
  {
    canonicalKey: "ct",
    aliases: ["ct scan", "computed tomography"],
  },
  {
    canonicalKey: "xray",
    aliases: ["xray", "x-ray", "radiograph"],
  },
  {
    canonicalKey: "ultrasound",
    aliases: ["ultrasound", "sonogram"],
  },
  {
    canonicalKey: "blood draw",
    aliases: ["blood draw", "venipuncture", "phlebotomy", "sample collection", "specimen collection"],
  },
  {
    canonicalKey: "lab test",
    aliases: ["laboratory", "lab test", "blood test"],
  },
  {
    canonicalKey: "urinalysis",
    aliases: ["urinalysis", "urine test", "urine collection"],
  },
  {
    canonicalKey: "pregnancy test",
    aliases: ["pregnancy test", "urine pregnancy", "serum pregnancy"],
  },
  {
    canonicalKey: "physical exam",
    aliases: ["physical exam", "physical examination"],
  },
  {
    canonicalKey: "vital signs",
    aliases: [
      "vital signs",
      "vitals",
      "blood pressure",
      "heart rate",
      "temperature",
      "respiratory rate",
    ],
  },
  {
    canonicalKey: "spirometry",
    aliases: ["spirometry", "pulmonary function test", "pft"],
  },
  {
    canonicalKey: "questionnaire",
    aliases: ["questionnaire", "patient reported outcome", "assessment form"],
  },
  {
    canonicalKey: "cognitive assessment",
    aliases: ["cognitive assessment", "neurocognitive testing", "memory test"],
  },
  {
    canonicalKey: "biopsy",
    aliases: ["biopsy", "tissue biopsy", "skin biopsy"],
  },
  {
    canonicalKey: "drug administration",
    aliases: ["drug administration", "administration", "study drug administration", "ip administration"],
  },
  {
    canonicalKey: "infusion",
    aliases: ["infusion", "iv infusion", "drug infusion"],
  },
  {
    canonicalKey: "dosing",
    aliases: ["dose", "dosing", "study drug dosing", "ip dosing"],
  },
  {
    canonicalKey: "pk sample",
    aliases: ["pk sample", "pharmacokinetic sample", "pk blood draw", "pk collection"],
  },
  {
    canonicalKey: "ae review",
    aliases: ["adverse event review", "ae review", "safety review"],
  },
  {
    canonicalKey: "conmed review",
    aliases: ["concomitant medication review", "conmed review", "medication review"],
  },
  {
    canonicalKey: "eligibility review",
    aliases: ["eligibility review", "inclusion exclusion review", "screening review"],
  },
  {
    canonicalKey: "randomization",
    aliases: ["randomization", "randomisation"],
  },
  {
    canonicalKey: "screen failure",
    aliases: ["screen failure", "screen fail visit"],
  },
  {
    canonicalKey: "closeout visit",
    aliases: ["closeout", "close-out", "study closeout", "final visit"],
  },
]
