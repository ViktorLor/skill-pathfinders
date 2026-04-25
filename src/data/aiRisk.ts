/**
 * Shared types for the AI Readiness & Displacement Risk lens.
 *
 * The actual scoring lives in services/aiRisk.ts and is computed at
 * runtime from a candidate's skill list using:
 *   - ESCO API (skill → ISCO occupation)
 *   - BLS ISCO/SOC crosswalk
 *   - Frey-Osborne 2017 computerisation probabilities
 *   - ILO 2024 GenAI exposure task framework
 *   - World Bank income-group classification (live API)
 *   - Wittgenstein Centre 2025–2035 projections (cluster outlook)
 */
export type AIRiskLevel = "low" | "moderate" | "high";

export interface SkillAIRisk {
  level: AIRiskLevel;
  /** 0–100, calibrated for the candidate's labor-market income group. */
  exposure: number;
  rationale: string;
  /** Short source attribution shown in the UI. */
  source: string;
}

export interface AdjacentSkill {
  name: string;
  /** Why learning this raises resilience for *this* candidate. */
  reason: string;
  /** Wittgenstein Centre 2025–2035 demand outlook in the candidate's region. */
  outlook: "rising" | "stable";
}

export interface SkillRiskProfile {
  /** Per-skill AI exposure (key = skill.name). */
  bySkill: Record<string, SkillAIRisk>;
  /** Overall track-level summary. */
  summary: {
    overallLevel: AIRiskLevel;
    overallExposure: number;
    headline: string;
  };
  /** Skills the candidate already has that are durable. */
  resilient: string[];
  /** Adjacent skills to learn to increase resilience. */
  adjacent: AdjacentSkill[];
}
