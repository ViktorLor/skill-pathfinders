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

export const TECH_RISK_PROFILE: SkillRiskProfile = {
  summary: {
    overallLevel: "moderate",
    overallExposure: 62,
    headline:
      "Software development sees the highest GenAI exposure of any occupation (ILO 2024), but in LMIC markets demand is still rising. Value shifts from writing boilerplate to system design, integration and AI-tool orchestration.",
  },
  bySkill: {
    JavaScript: {
      level: "high",
      exposure: 74,
      rationale:
        "Routine JS coding (CRUD, UI scaffolding) is heavily automated by Copilot/Claude. Frey-Osborne underestimates this — recent ILO GenAI exposure index places software writing in the top decile.",
      source: "ILO 2024 GenAI exposure note · Frey-Osborne 2017",
    },
    React: {
      level: "high",
      exposure: 70,
      rationale:
        "Component scaffolding is largely AI-generated today. Durable value is in architecture, accessibility and product judgment — not raw JSX.",
      source: "ILO 2024 GenAI exposure note",
    },
    "Node.js": {
      level: "moderate",
      exposure: 55,
      rationale:
        "API glue code is automatable, but production reliability, security and integration with payment/SMS providers in LMIC contexts still need human judgment.",
      source: "World Bank STEP · ILO Task Index 2023",
    },
    AWS: {
      level: "low",
      exposure: 32,
      rationale:
        "Cloud architecture and cost-optimization remain non-routine cognitive work. Demand is rising fastest in African tech hubs (Wittgenstein Centre 2025–35).",
      source: "Frey-Osborne 2017 · Wittgenstein 2024",
    },
    PostgreSQL: {
      level: "moderate",
      exposure: 48,
      rationale:
        "AI writes SQL well, but schema design, performance tuning and data modeling stay with engineers. Stable demand projected through 2035.",
      source: "ILO Task Index 2023",
    },
  },
  resilient: ["AWS", "PostgreSQL"],
  adjacent: [
    {
      name: "Cloud / DevOps (AWS, Cloudflare)",
      reason:
        "Builds on your Node.js base. Infrastructure work is far less AI-displaced than frontend code and pays a premium across African remote markets.",
      outlook: "rising",
    },
    {
      name: "AI-tool orchestration (LLM APIs, RAG)",
      reason:
        "Companies need engineers who can wire LLMs into products responsibly. Direct extension of your JS/Node skills.",
      outlook: "rising",
    },
    {
      name: "Data engineering & analytics",
      reason:
        "Pipelines and dashboards for fintech/agritech are growing fast in Ghana and Nigeria. PostgreSQL is the entry point.",
      outlook: "rising",
    },
    {
      name: "Mobile money / fintech integration",
      reason:
        "MTN MoMo, Paystack, Flutterwave APIs require local context and judgment — non-routine work AI can't replace.",
      outlook: "stable",
    },
  ],
};

export const AGRI_RISK_PROFILE: SkillRiskProfile = {
  summary: {
    overallLevel: "low",
    overallExposure: 24,
    headline:
      "Smallholder farming is among the most AI-resilient livelihoods in LMICs (ILO 2023). Risks come from precision-ag tools displacing record-keeping and price-discovery middlemen — not field work itself.",
  },
  bySkill: {
    "Crop cultivation": {
      level: "low",
      exposure: 12,
      rationale:
        "Highly non-routine, context-dependent manual work. Frey-Osborne place field crop farming at <10% automation probability; mechanization in LMICs is constrained by smallholder plot sizes.",
      source: "Frey-Osborne 2017 · ILO Task Index 2023",
    },
    "Irrigation management": {
      level: "low",
      exposure: 22,
      rationale:
        "Smart-irrigation sensors are emerging, but installation, repair and judgment under variable rainfall remain human work — and rising in demand.",
      source: "ILO Task Index 2023 · Wittgenstein 2024",
    },
    "Pest control": {
      level: "moderate",
      exposure: 45,
      rationale:
        "AI image-recognition apps (e.g. PlantVillage Nuru) now diagnose pests from a phone photo. Field application and integrated pest management decisions remain human.",
      source: "World Bank STEP · CGIAR digital ag review",
    },
    "Record keeping": {
      level: "high",
      exposure: 78,
      rationale:
        "Mobile bookkeeping apps and AI auto-categorization are displacing manual ledgers fast. The skill that survives is interpreting the numbers, not recording them.",
      source: "ILO 2024 GenAI exposure note",
    },
    "Cooperative management": {
      level: "low",
      exposure: 20,
      rationale:
        "Trust-building, negotiation and group facilitation are non-routine social work. Wittgenstein Centre projects rising demand for cooperative leaders as LMIC value chains formalize.",
      source: "Wittgenstein 2024 · ILO Task Index 2023",
    },
  },
  resilient: [
    "Crop cultivation",
    "Irrigation management",
    "Cooperative management",
  ],
  adjacent: [
    {
      name: "Agri-tech app literacy (PlantVillage, Esoko)",
      reason:
        "Use AI tools instead of competing with them. Boosts yields and unlocks extension-officer roles.",
      outlook: "rising",
    },
    {
      name: "Post-harvest processing & storage",
      reason:
        "Adds margin to your existing crops and is far less automated than field work. Strong policy push in MoFA Ghana 2025 strategy.",
      outlook: "rising",
    },
    {
      name: "Climate-smart agriculture (drought-resilient varieties)",
      reason:
        "Builds directly on cultivation know-how. Wittgenstein 2025–35 flags climate adaptation as the fastest-growing rural skill cluster.",
      outlook: "rising",
    },
    {
      name: "Cooperative finance & group savings (VSLA)",
      reason:
        "Extends your cooperative role into financial leadership — non-routine, trust-based work AI can't replace.",
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
  if (candidateId === "demo-tech" || candidateId === "cand_001") {
    return TECH_RISK_PROFILE;
  }
  if (candidateId === "demo-agri" || candidateId === "cand_003") {
    return AGRI_RISK_PROFILE;
  }
  return null;
}

