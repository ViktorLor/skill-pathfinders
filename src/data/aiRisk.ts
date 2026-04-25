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
  /** Wittgenstein 2025–2035 demand outlook for this skill, when known */
  outlook?: "rising" | "stable" | "declining";
  /** Plain-English Wittgenstein note tied to the projection */
  outlookNote?: string;
  /** US-baseline Frey-Osborne automation probability before LMIC adjustment, 0–100 */
  baselineExposure?: number;
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

// --- Dynamic risk computation -------------------------------------------------
// Produces an AI readiness assessment for a candidate-supplied skills profile,
// chaining three real datasets:
//   1. Frey-Osborne 2017 automation probabilities by SOC occupation
//   2. LMIC country modifier (Carbonero–Ernst–Weber 2018, World Bank STEP)
//   3. Wittgenstein 2025–2035 SSP2 education projections, mapped to skill
//      cluster outlook (rising / stable / declining)
// A curated overlay (TECH/TRADE/AGRI demo profiles) wins when present so
// hand-written rationales aren't lost.

import type { CandidateSkillProfile, CandidateTrack, SkillItem } from "@/types/unmapped";
import { FREY_OSBORNE_2017, FREY_OSBORNE_CITATION } from "./automation/freyOsborne";
import { lookupSocForSkill } from "./automation/skillToSoc";
import {
  COUNTRY_MODIFIERS,
  getCountryModifier,
  type CountryAutomationContext,
} from "./automation/countryModifier";
import {
  WITTGENSTEIN_CITATION,
  lookupWittgensteinOutlook,
  type SkillClusterOutlook,
} from "./automation/wittgenstein";

const KNOWN_SKILL_RISKS: Record<string, SkillAIRisk> = (() => {
  const merged: Record<string, SkillAIRisk> = {};
  for (const profile of [TECH_RISK_PROFILE, TRADE_RISK_PROFILE, AGRI_RISK_PROFILE]) {
    for (const [name, risk] of Object.entries(profile.bySkill)) {
      merged[name.toLowerCase()] = risk;
    }
  }
  return merged;
})();

const CATEGORY_RISK_DEFAULTS: Record<
  SkillItem["category"],
  Partial<Record<CandidateTrack, { exposure: number; level: AIRiskLevel; rationale: string }>> & {
    default: { exposure: number; level: AIRiskLevel; rationale: string };
  }
> = {
  technical: {
    tech: {
      exposure: 70,
      level: "high",
      rationale:
        "Routine technical tasks (code generation, scripting, documentation) are heavily exposed to LLM coding tools. Durable value is in design and integration.",
    },
    trade: {
      exposure: 45,
      level: "moderate",
      rationale:
        "Hands-on technical trade work is more durable than office tasks; AI is starting to assist diagnostics and quoting.",
    },
    agriculture: {
      exposure: 40,
      level: "moderate",
      rationale:
        "Field-applied technical knowledge stays human; AI is primarily entering record-keeping and image-based diagnostics.",
    },
    default: {
      exposure: 60,
      level: "moderate",
      rationale:
        "Technical skills face mixed exposure: routine pattern-matching is automatable, but applied judgment remains human.",
    },
  },
  tool: {
    tech: {
      exposure: 55,
      level: "moderate",
      rationale:
        "Tooling expertise is partially commoditised by AI assistants, but configuring and troubleshooting tools in production still requires human judgment.",
    },
    default: {
      exposure: 45,
      level: "moderate",
      rationale: "Operating tools is partly automatable, but maintenance and judgment remain human.",
    },
  },
  domain: {
    default: {
      exposure: 40,
      level: "moderate",
      rationale:
        "Domain knowledge is harder to automate than generic technical work, especially when tied to local context.",
    },
  },
  business: {
    default: {
      exposure: 50,
      level: "moderate",
      rationale:
        "Routine business workflows are increasingly drafted by AI, but stakeholder judgment, negotiation and trust-based relationships remain durable.",
    },
  },
  soft: {
    default: {
      exposure: 22,
      level: "low",
      rationale:
        "Interpersonal, leadership and communication work is among the most AI-resilient skill clusters in LMIC labor markets (ILO 2023).",
    },
  },
  language: {
    default: {
      exposure: 60,
      level: "moderate",
      rationale:
        "Written translation is highly automated by LLMs; spoken, in-person and culturally-grounded language work is more durable.",
    },
  },
};

function levelFromExposure(exposure: number): AIRiskLevel {
  if (exposure >= 65) return "high";
  if (exposure >= 40) return "moderate";
  return "low";
}

function attachOutlook(risk: SkillAIRisk, outlook: SkillClusterOutlook | null): SkillAIRisk {
  if (!outlook) return risk;
  return {
    ...risk,
    outlook: outlook.outlook,
    outlookNote: `Wittgenstein SSP2 2025–35: ${outlook.cluster} — ${outlook.rationale}`,
  };
}

/**
 * Look up Frey-Osborne SOC entries for a skill and return the average
 * automation probability (0–1). When the skill maps to multiple SOC codes,
 * we average — a single skill rarely lives in exactly one occupation.
 */
function freyOsborneProbabilityForSkill(skillName: string): {
  probability: number;
  occupations: string[];
  socCodes: string[];
} | null {
  const socs = lookupSocForSkill(skillName);
  if (!socs.length) return null;

  const matches = socs
    .map((soc) => FREY_OSBORNE_2017[soc])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  if (!matches.length) return null;

  const probability =
    matches.reduce((sum, entry) => sum + entry.probability, 0) / matches.length;
  return {
    probability,
    occupations: matches.map((m) => m.occupation),
    socCodes: matches.map((m) => m.socCode),
  };
}

function riskFromFreyOsborne(
  skillName: string,
  countryCtx: CountryAutomationContext,
): SkillAIRisk | null {
  const fo = freyOsborneProbabilityForSkill(skillName);
  if (!fo) return null;

  const baseline = Math.round(fo.probability * 100);
  const adjusted = Math.round(fo.probability * countryCtx.modifier * 100);
  const occupationLabel = fo.occupations[0];

  const isAdjusted = countryCtx.modifier !== 1.0;
  const adjustmentClause = isAdjusted
    ? ` Adjusted to ${adjusted}/100 for ${countryCtx.countryName} labor market context (modifier ×${countryCtx.modifier.toFixed(2)}, ${countryCtx.source}).`
    : "";

  return {
    level: levelFromExposure(adjusted),
    exposure: adjusted,
    baselineExposure: baseline,
    rationale: `Anchored to "${occupationLabel}" (SOC ${fo.socCodes[0]}) in Frey & Osborne 2017, automation probability ${fo.probability.toFixed(2)}.${adjustmentClause}`,
    source: `${FREY_OSBORNE_CITATION}${isAdjusted ? ` · ${countryCtx.source}` : ""}`,
  };
}

function inferRiskFromCategory(
  category: SkillItem["category"],
  track: CandidateTrack,
  countryCtx: CountryAutomationContext,
): SkillAIRisk {
  const bucket = CATEGORY_RISK_DEFAULTS[category];
  const cell = bucket[track] ?? bucket.default;
  const adjustedExposure = Math.round(cell.exposure * countryCtx.modifier);
  const isAdjusted = countryCtx.modifier !== 1.0;

  return {
    level: levelFromExposure(adjustedExposure),
    exposure: adjustedExposure,
    baselineExposure: cell.exposure,
    rationale: `${cell.rationale}${
      isAdjusted
        ? ` Calibrated to ${countryCtx.countryName} (×${countryCtx.modifier.toFixed(2)}).`
        : ""
    }`,
    source: `ILO 2023 · Frey-Osborne 2017 (category-level estimate)${
      isAdjusted ? ` · ${countryCtx.source}` : ""
    }`,
  };
}

const TRACK_ADJACENT_FALLBACK: Record<CandidateTrack, AdjacentSkill[]> = {
  tech: TECH_RISK_PROFILE.adjacent,
  trade: TRADE_RISK_PROFILE.adjacent,
  agriculture: AGRI_RISK_PROFILE.adjacent,
  other: [
    {
      name: "AI tool literacy",
      reason:
        "Becoming fluent with AI assistants protects the durable human parts of your work, regardless of sector.",
      outlook: "rising",
    },
    {
      name: "Cross-functional communication",
      reason:
        "Translation between technical, business and local stakeholders is a non-routine human task in growing demand.",
      outlook: "rising",
    },
  ],
};

const TRACK_HEADLINE: Record<CandidateTrack, string> = {
  tech: TECH_RISK_PROFILE.summary.headline,
  trade: TRADE_RISK_PROFILE.summary.headline,
  agriculture: AGRI_RISK_PROFILE.summary.headline,
  other:
    "AI exposure varies by task within this profile. Routine cognitive work is heavily exposed; in-person, judgment-based and locally-rooted work is more durable.",
};

function enrichAdjacentWithOutlook(adjacent: AdjacentSkill): AdjacentSkill {
  const outlook = lookupWittgensteinOutlook(adjacent.name);
  if (!outlook) return adjacent;
  // AdjacentSkill currently only carries "rising" | "stable"; map declining
  // up to stable for adjacent recommendations (we never recommend learning
  // a declining skill, so this rarely fires).
  const mapped: AdjacentSkill["outlook"] = outlook.outlook === "declining" ? "stable" : outlook.outlook;
  return {
    ...adjacent,
    outlook: mapped,
    reason: outlook.rationale ? `${adjacent.reason} ${outlook.rationale}` : adjacent.reason,
  };
}

export function computeRiskProfileForCandidateProfile(
  profile: CandidateSkillProfile,
  countryCode?: string,
): SkillRiskProfile {
  const allSkills = Object.values(profile.skills).flat();
  const track = profile.profile.track;
  const countryCtx = getCountryModifier(countryCode);

  const bySkill: Record<string, SkillAIRisk> = {};
  for (const skill of allSkills) {
    const curated = KNOWN_SKILL_RISKS[skill.name.toLowerCase()];
    const fromFreyOsborne = curated ? null : riskFromFreyOsborne(skill.name, countryCtx);
    const base = curated ?? fromFreyOsborne ?? inferRiskFromCategory(skill.category, track, countryCtx);
    bySkill[skill.name] = attachOutlook(base, lookupWittgensteinOutlook(skill.name));
  }

  const exposures = Object.values(bySkill).map((r) => r.exposure);
  const overallExposure = exposures.length
    ? Math.round(exposures.reduce((a, b) => a + b, 0) / exposures.length)
    : 50;
  const overallLevel = levelFromExposure(overallExposure);

  const resilient: string[] = [];
  for (const [name, risk] of Object.entries(bySkill)) {
    if (risk.level === "low" || risk.outlook === "rising") {
      resilient.push(name);
    }
  }
  const llmResilient = profile.automationAndReskilling?.resilientSkills ?? [];
  for (const name of llmResilient) {
    if (name && !resilient.includes(name)) resilient.push(name);
  }

  const heldSkillNames = new Set(allSkills.map((s) => s.name.toLowerCase()));
  const llmAdjacent: AdjacentSkill[] = (
    profile.automationAndReskilling?.recommendedLearningSkills ?? []
  )
    .filter((s) => s && !heldSkillNames.has(s.toLowerCase()))
    .map((s) => ({
      name: s,
      reason: "Recommended next-step skill from your interview answers and CV.",
      outlook: "rising" as const,
    }));

  const fallbackAdjacent = TRACK_ADJACENT_FALLBACK[track].filter(
    (a) => !heldSkillNames.has(a.name.toLowerCase()),
  );

  const adjacentByName = new Map<string, AdjacentSkill>();
  for (const a of [...llmAdjacent, ...fallbackAdjacent]) {
    const key = a.name.toLowerCase();
    if (!adjacentByName.has(key)) {
      adjacentByName.set(key, enrichAdjacentWithOutlook(a));
    }
  }
  const adjacent = Array.from(adjacentByName.values()).slice(0, 5);

  const isAdjusted = countryCtx.modifier !== 1.0;
  const headline = isAdjusted
    ? `${TRACK_HEADLINE[track]} Risk levels shown have been calibrated to ${countryCtx.countryName} via a ×${countryCtx.modifier.toFixed(2)} LMIC modifier (${countryCtx.source}). 2025–2035 outlook uses ${WITTGENSTEIN_CITATION}.`
    : `${TRACK_HEADLINE[track]} 2025–2035 outlook uses ${WITTGENSTEIN_CITATION}.`;

  return {
    summary: {
      overallLevel,
      overallExposure,
      headline,
    },
    bySkill,
    resilient: resilient.slice(0, 8),
    adjacent,
  };
}

// Re-export so consumers (UI, callers) can read the country list / modifiers
// without importing from the dataset module directly.
export { COUNTRY_MODIFIERS, type CountryAutomationContext };

