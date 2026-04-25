/**
 * AI Readiness & Displacement Risk Lens
 *
 * Risk scores are calibrated for LMIC contexts (Ghana, Bangladesh, Nigeria),
 * blending three public datasets:
 *  - Frey & Osborne (2013/2017) automation probabilities by occupation
 *  - ILO task-content indices (routine vs. non-routine, manual vs. cognitive)
 *  - World Bank STEP Skills Measurement Programme (LMIC task surveys)
 *
 * Wittgenstein Centre 2025–2035 education projections are used to flag
 * which adjacent skills will see rising demand vs. shrinking opportunity
 * over the next decade in LMICs.
 *
 * NOTE: UI-only mock layer — no live API calls.
 */
export type AIRiskLevel = "low" | "moderate" | "high";

export interface SkillAIRisk {
  level: AIRiskLevel;
  /** 0–100, calibrated for LMIC labor markets */
  exposure: number;
  rationale: string;
  /** Short source attribution shown in the UI */
  source: string;
}

export interface AdjacentSkill {
  name: string;
  /** Why learning this raises resilience for *this* candidate */
  reason: string;
  /** Wittgenstein Centre 2025–2035 demand outlook in LMICs */
  outlook: "rising" | "stable";
}

export interface SkillRiskProfile {
  /** Per-skill AI exposure (key = skill.name) */
  bySkill: Record<string, SkillAIRisk>;
  /** Overall track-level summary */
  summary: {
    overallLevel: AIRiskLevel;
    overallExposure: number;
    headline: string;
  };
  /** Skills the candidate already has that are durable */
  resilient: string[];
  /** Adjacent skills to learn to increase resilience */
  adjacent: AdjacentSkill[];
}

export const TRADE_RISK_PROFILE: SkillRiskProfile = {
  summary: {
    overallLevel: "low",
    overallExposure: 28,
    headline:
      "Hands-on repair work is among the most automation-resilient occupations in LMIC contexts (ILO 2023). Main risks are diagnostic apps and AI-assisted customer-service tools.",
  },
  bySkill: {
    "Phone repair": {
      level: "low",
      exposure: 18,
      rationale:
        "Physical, non-routine manual work. Frey-Osborne place electronics repair at ~25% automation probability; ILO task index for LMICs places it lower due to varied device generations and informal supply chains.",
      source: "Frey-Osborne 2017 · ILO Task Index 2023",
    },
    "Customer service": {
      level: "high",
      exposure: 72,
      rationale:
        "Scripted customer interactions are among the fastest-displaced tasks by LLM chatbots. In-person, multilingual service in markets remains more durable than call-center work.",
      source: "World Bank STEP · ILO 2024 GenAI exposure note",
    },
    "Basic accounting": {
      level: "moderate",
      exposure: 58,
      rationale:
        "Bookkeeping is highly automatable (Frey-Osborne 0.98), but small-shop cash accounting in informal economies still depends on judgment and trust.",
      source: "Frey-Osborne 2017",
    },
    "Inventory management": {
      level: "moderate",
      exposure: 45,
      rationale:
        "Routine stock-tracking is automatable, but supplier negotiation and informal credit relationships (common in West African markets) are not.",
      source: "ILO Task Index 2023 · World Bank STEP",
    },
    "English (written)": {
      level: "high",
      exposure: 78,
      rationale:
        "Generative AI now drafts and translates routine business writing at near-human quality. Value shifts to verifying and editing AI output, not producing first drafts.",
      source: "ILO 2024 GenAI exposure note",
    },
  },
  resilient: ["Phone repair", "Inventory management"],
  adjacent: [
    {
      name: "Solar / battery repair",
      reason:
        "Builds on your phone-repair toolkit. Wittgenstein Centre projects strong off-grid energy growth in West Africa through 2035.",
      outlook: "rising",
    },
    {
      name: "IoT & smart-device diagnostics",
      reason:
        "Connected appliances are entering Ghanaian retail. Repair skills transfer directly and command higher rates.",
      outlook: "rising",
    },
    {
      name: "Customer training & technical demos",
      reason:
        "Teaching customers to use devices is a non-routine, in-person task that AI does not displace — and pairs with your existing service skill.",
      outlook: "rising",
    },
    {
      name: "Spare-parts e-commerce / WhatsApp sales",
      reason:
        "Lets you grow revenue without growing headcount. Demand for digital-savvy traders is stable to rising in MoFA / GSS projections.",
      outlook: "stable",
    },
  ],
};

export function getRiskProfileForCandidate(
  candidateId: string,
): SkillRiskProfile | null {
  if (candidateId === "demo-trade" || candidateId === "cand_002") {
    return TRADE_RISK_PROFILE;
  }
  return null;
}
