import type {
  CandidateSkillProfile,
  CredentialCategory,
  EducationCredentialMapping,
  EducationTaxonomyLevel,
} from "@/types/unmapped";

type EducationInput = Partial<CandidateSkillProfile["education"]>;

const EDUCATION_LABELS: Record<EducationTaxonomyLevel, string> = {
  no_formal: "No formal education",
  primary: "Primary education",
  lower_secondary: "Lower secondary education",
  upper_secondary: "Upper secondary education",
  vocational: "Vocational or trade training",
  certificate: "Short certificate",
  diploma: "Diploma or advanced diploma",
  bachelor: "Bachelor degree",
  postgraduate: "Postgraduate degree",
  unknown: "Unknown education level",
};

const CREDENTIAL_LABELS: Record<CredentialCategory, string> = {
  none: "No credential captured",
  school: "School credential",
  vocational_training: "Vocational/trade credential",
  short_certificate: "Short certificate",
  diploma: "Diploma",
  degree: "Degree",
  postgraduate_degree: "Postgraduate degree",
  unknown: "Unknown credential",
};

const LEVEL_TO_MAPPING: Record<
  EducationTaxonomyLevel,
  Omit<EducationCredentialMapping, "rationale" | "confidence">
> = {
  no_formal: {
    taxonomyLevel: "no_formal",
    taxonomyLabel: EDUCATION_LABELS.no_formal,
    credentialCategory: "none",
    credentialLabel: CREDENTIAL_LABELS.none,
    estimatedSkillLevel: "foundational",
  },
  primary: {
    taxonomyLevel: "primary",
    taxonomyLabel: EDUCATION_LABELS.primary,
    credentialCategory: "school",
    credentialLabel: CREDENTIAL_LABELS.school,
    estimatedSkillLevel: "basic",
  },
  lower_secondary: {
    taxonomyLevel: "lower_secondary",
    taxonomyLabel: EDUCATION_LABELS.lower_secondary,
    credentialCategory: "school",
    credentialLabel: CREDENTIAL_LABELS.school,
    estimatedSkillLevel: "basic",
  },
  upper_secondary: {
    taxonomyLevel: "upper_secondary",
    taxonomyLabel: EDUCATION_LABELS.upper_secondary,
    credentialCategory: "school",
    credentialLabel: CREDENTIAL_LABELS.school,
    estimatedSkillLevel: "intermediate",
  },
  vocational: {
    taxonomyLevel: "vocational",
    taxonomyLabel: EDUCATION_LABELS.vocational,
    credentialCategory: "vocational_training",
    credentialLabel: CREDENTIAL_LABELS.vocational_training,
    estimatedSkillLevel: "intermediate",
  },
  certificate: {
    taxonomyLevel: "certificate",
    taxonomyLabel: EDUCATION_LABELS.certificate,
    credentialCategory: "short_certificate",
    credentialLabel: CREDENTIAL_LABELS.short_certificate,
    estimatedSkillLevel: "intermediate",
  },
  diploma: {
    taxonomyLevel: "diploma",
    taxonomyLabel: EDUCATION_LABELS.diploma,
    credentialCategory: "diploma",
    credentialLabel: CREDENTIAL_LABELS.diploma,
    estimatedSkillLevel: "advanced",
  },
  bachelor: {
    taxonomyLevel: "bachelor",
    taxonomyLabel: EDUCATION_LABELS.bachelor,
    credentialCategory: "degree",
    credentialLabel: CREDENTIAL_LABELS.degree,
    estimatedSkillLevel: "advanced",
  },
  postgraduate: {
    taxonomyLevel: "postgraduate",
    taxonomyLabel: EDUCATION_LABELS.postgraduate,
    credentialCategory: "postgraduate_degree",
    credentialLabel: CREDENTIAL_LABELS.postgraduate_degree,
    estimatedSkillLevel: "specialized",
  },
  unknown: {
    taxonomyLevel: "unknown",
    taxonomyLabel: EDUCATION_LABELS.unknown,
    credentialCategory: "unknown",
    credentialLabel: CREDENTIAL_LABELS.unknown,
    estimatedSkillLevel: "unknown",
  },
};

export function mapEducationCredential(input: EducationInput): EducationCredentialMapping {
  const evidenceText = collectEducationText(input);
  const normalized = normalizeEducationText(evidenceText);
  const taxonomyLevel = detectTaxonomyLevel(normalized);
  const mapping = LEVEL_TO_MAPPING[taxonomyLevel];
  const hasCredentialItems =
    Boolean(input.degrees?.length) ||
    Boolean(input.certifications?.length) ||
    Boolean(input.trainings?.length);

  return {
    ...mapping,
    confidence: taxonomyLevel === "unknown" ? "low" : hasCredentialItems ? "high" : "medium",
    rationale:
      taxonomyLevel === "unknown"
        ? "No education or credential evidence was captured yet."
        : `Estimated from education entry: ${evidenceText.slice(0, 140)}`,
  };
}

export function withEducationCredentialMapping(
  profile: CandidateSkillProfile,
): CandidateSkillProfile {
  return {
    ...profile,
    education: {
      ...profile.education,
      credentialMapping: mapEducationCredential(profile.education),
    },
  };
}

function collectEducationText(input: EducationInput) {
  return [
    input.highestLevel,
    ...(input.degrees ?? []),
    ...(input.fieldsOfStudy ?? []),
    ...(input.certifications ?? []),
    ...(input.trainings ?? []),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");
}

function normalizeEducationText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function detectTaxonomyLevel(value: string): EducationTaxonomyLevel {
  if (!value) return "unknown";
  if (/\b(no formal|none|no school|did not attend)\b/.test(value)) return "no_formal";
  if (/\b(phd|doctorate|doctoral|master|msc|ma |mba|postgraduate|graduate degree)\b/.test(value)) {
    return "postgraduate";
  }
  if (/\b(bachelor|bsc|ba |undergraduate|university degree|college degree)\b/.test(value)) {
    return "bachelor";
  }
  if (/\b(diploma|advanced diploma|associate)\b/.test(value)) return "diploma";
  if (/\b(certificate|certification|certified|short course|bootcamp|itil|cisco|aws)\b/.test(value)) {
    return "certificate";
  }
  if (/\b(vocational|technical school|trade school|apprentice|apprenticeship|tvet|polytechnic)\b/.test(value)) {
    return "vocational";
  }
  if (/\b(high school|senior secondary|upper secondary|secondary|shs|ssce|wassce|a level)\b/.test(value)) {
    return "upper_secondary";
  }
  if (/\b(junior secondary|middle school|lower secondary|jhs|o level)\b/.test(value)) {
    return "lower_secondary";
  }
  if (/\b(primary|elementary|basic school)\b/.test(value)) return "primary";

  return "unknown";
}
