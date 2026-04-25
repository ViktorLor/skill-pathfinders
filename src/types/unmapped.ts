export interface CountryConfig {
  code: "GHA" | "BGD" | "NGA";
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

export type VerificationStatus = "confirmed" | "partial" | "no_evidence" | "challenged" | "pending";

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
