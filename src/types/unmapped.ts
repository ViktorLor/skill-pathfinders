export interface CountryConfig {
  /** ISO 3166-1 alpha-3 code. Any code is allowed (CVs may mention any country). */
  code: string;
  name: string;
  flag: string;
  language: string;
  currency: string;
  currencySymbol: string;
  iloCountryCode: string;
  wbCountryCode: string;
  sectors: string[];
  opportunityTypes: ("formal" | "self-employment" | "gig" | "training")[];
  avgWageSignal?: string;
  youthUnemployment?: string;
}

export type TrackType = "tech" | "trade" | "agriculture";

export type CandidateTrack = TrackType | "other";

export type CandidateSeniority =
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "manager"
  | "executive"
  | "unknown";

export type CandidateConfidence = "high" | "medium" | "low";

export interface SkillItem {
  name: string;
  normalizedName: string;
  category: "technical" | "tool" | "domain" | "business" | "soft" | "language";
  proficiency?: "basic" | "intermediate" | "advanced" | "expert" | "unknown";
  yearsExperience?: number;
  evidence: string[];
  escoSkillUri?: string;
  escoPreferredLabel?: string;
  escoSkillType?: "skill/competence" | "knowledge" | "language" | "transversal" | "unknown";
  confidence: CandidateConfidence;
}

export interface CandidateSkillProfile {
  fullName?: string;
  telephoneNumber?: string;
  location?: string;
  country?: string;
  willingToRelocate?: boolean;
  profile: {
    roleName: string;
    normalizedRoleName: string;
    summary: string;
    seniority: CandidateSeniority;
    track: CandidateTrack;
    confidence: CandidateConfidence;
  };
  occupation: {
    iscoCode?: string;
    iscoTitle?: string;
    escoOccupationCode?: string;
    escoOccupationUri?: string;
    escoOccupationTitle?: string;
    alternativeOccupationMatches: Array<{
      title: string;
      iscoCode?: string;
      escoUri?: string;
      confidence: number;
      reason: string;
    }>;
  };
  experience: {
    hasJob?: boolean;
    totalYears?: number;
    relevantYears?: number;
    industries: string[];
    jobTitles: string[];
    companies: string[];
    responsibilities: string[];
    achievements: string[];
  };
  education: {
    highestLevel?: string;
    degrees: string[];
    fieldsOfStudy: string[];
    certifications: string[];
    trainings: string[];
  };
  skills: {
    technical: SkillItem[];
    tools: SkillItem[];
    domain: SkillItem[];
    business: SkillItem[];
    soft: SkillItem[];
    languages: SkillItem[];
  };
  evidence: Array<{
    claim: string;
    sourceText: string;
    confidence: CandidateConfidence;
  }>;
  automationAndReskilling?: {
    automationRiskOccupationCode?: string;
    automationRiskScore?: number;
    riskDrivers: string[];
    resilientSkills: string[];
    missingRecommendedSkills: string[];
    recommendedLearningSkills: string[];
  };
}

export type VerificationStatus =
  | "confirmed"
  | "partial"
  | "no_evidence"
  | "challenged"
  | "pending";

export interface SkillScore {
  name: string;
  escoCode?: string;
  score: number;
  status: VerificationStatus;
  yearsClaimed?: number;
  yearsFound?: number;
  evidence: string[];
  flags: string[];
  verifiedBy?: "github" | "portfolio" | "interview" | "challenge" | "community";
}

export interface CandidateProfile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  country: CountryConfig;
  track: TrackType;
  trustScore: number;
  escoOccupation?: string;
  skillScores: SkillScore[];
  experience: {
    title: string;
    context: string;
    duration: string;
    description: string;
  }[];
  pipelineStatus: "pending" | "interviewing" | "verifying" | "complete" | "error";
  avgWageInSector?: string;
  youthUnemploymentRate?: string;
}

export interface JobMatch {
  id: string;
  title: string;
  company?: string;
  location: string;
  type: "formal" | "self-employment" | "gig" | "training";
  matchScore: number;
  matchStatus: "strong_match" | "good_match" | "possible" | "stretch";
  matchedSkills: string[];
  missingSkills: string[];
  gapAnalysis: string;
  wageRange?: string;
  sourceUrl: string;
}
