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
  /** Plain-English one-sentence summary for the candidate (always visible) */
  headline?: string;
  /** Compact data chips like "FO 0.98", "73% routine", "+45% by 2035" */
  chips?: string[];
  /**
   * Detailed rationale (citations, full clauses). Surfaced behind a "Sources"
   * disclosure in the UI so the candidate doesn't see a wall of text by default.
   */
  rationale: string;
  /** Short source attribution shown alongside the rationale in the disclosure */
  source: string;
  /** Wittgenstein 2025–2035 demand outlook for this skill, when known */
  outlook?: "rising" | "stable" | "declining";
  /** Plain-English Wittgenstein note tied to the projection */
  outlookNote?: string;
  /** Annualised growth index 2025–2035, normalised: -1..+1 */
  changeIndex?: number;
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

export interface TrajectoryEntry {
  skill: string;
  cluster: string;
  outlook: "rising" | "stable" | "declining";
  changeIndex: number;
}

export interface SkillRiskProfile {
  /** Per-skill AI exposure (key = skill.name) */
  bySkill: Record<string, SkillAIRisk>;
  /** Number of extracted skills with a direct curated or occupation-index match */
  indexedSkillCount?: number;
  /** Number of extracted skills considered for the profile-level summary */
  totalSkillCount?: number;
  /** Skills kept out of per-skill exposure because no direct index match exists */
  unindexedSkills?: string[];
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
  /**
   * Wittgenstein 2025–2035 trajectory snapshot for the candidate's skills:
   * which clusters are rising vs. declining over the next decade.
   */
  trajectory?: {
    rising: TrajectoryEntry[];
    declining: TrajectoryEntry[];
    summary: string;
  };
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
  let base: SkillRiskProfile | null = null;
  if (candidateId === "demo-trade" || candidateId === "cand_002") base = TRADE_RISK_PROFILE;
  else if (candidateId === "demo-tech" || candidateId === "cand_001") base = TECH_RISK_PROFILE;
  else if (candidateId === "demo-agri" || candidateId === "cand_003") base = AGRI_RISK_PROFILE;
  if (!base) return null;

  const bySkill: Record<string, SkillAIRisk> = {};
  for (const [name, risk] of Object.entries(base.bySkill)) {
    bySkill[name] = ensurePresentationFields(risk);
  }
  return { ...base, bySkill };
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
import {
  getIloTaskShares,
  ILO_TASK_INDEX_CITATION,
  type IloTaskShares,
} from "./automation/iloTaskIndex";

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
  const deltaPct = Math.round(outlook.changeIndex * 100);
  const deltaChip =
    deltaPct === 0
      ? null
      : `${deltaPct > 0 ? "+" : ""}${deltaPct}% by 2035`;
  const chips =
    deltaChip && !(risk.chips ?? []).some((c) => c.includes("by 2035"))
      ? [...(risk.chips ?? []), deltaChip]
      : risk.chips;
  return {
    ...risk,
    outlook: outlook.outlook,
    outlookNote: `Wittgenstein SSP2 2025–35: ${outlook.cluster} — ${outlook.rationale}`,
    changeIndex: outlook.changeIndex,
    chips,
  };
}

/**
 * Look up Frey-Osborne SOC entries for a skill and return the average
 * automation probability (0–1). When the skill maps to multiple SOC codes,
 * we average — a single skill rarely lives in exactly one occupation.
 */
interface FreyOsborneProbabilityMatch {
  probability: number;
  occupations: string[];
  socCodes: string[];
  iscoCodes: string[];
  matchedTerm?: string;
}

function freyOsborneProbabilityForSocCodes(
  socs: string[],
  matchedTerm?: string,
): FreyOsborneProbabilityMatch | null {
  if (!socs.length) return null;

  const uniqueSocs = Array.from(new Set(socs));
  const matches = uniqueSocs
    .map((soc) => FREY_OSBORNE_2017[soc])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  if (!matches.length) return null;

  const probability =
    matches.reduce((sum, entry) => sum + entry.probability, 0) / matches.length;
  return {
    probability,
    occupations: matches.map((m) => m.occupation),
    socCodes: matches.map((m) => m.socCode),
    iscoCodes: matches
      .map((m) => m.iscoCode)
      .filter((c): c is string => Boolean(c)),
    matchedTerm,
  };
}

function freyOsborneProbabilityForSkill(skillName: string): FreyOsborneProbabilityMatch | null {
  const socs = lookupSocForSkill(skillName);
  return freyOsborneProbabilityForSocCodes(socs, skillName);
}

function freyOsborneProbabilityForSkillTerms(
  terms: Array<string | undefined>,
): FreyOsborneProbabilityMatch | null {
  const seen = new Set<string>();
  for (const term of terms) {
    const cleaned = term?.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const match = freyOsborneProbabilityForSkill(cleaned);
    if (match) return match;
  }
  return null;
}

function normalizeIscoCode(value?: string) {
  const digits = value?.replace(/[^0-9]/g, "") ?? "";
  return digits.length >= 4 ? digits.slice(0, 4) : "";
}

function freyOsborneProbabilityForIsco(iscoCode?: string): FreyOsborneProbabilityMatch | null {
  const normalizedIsco = normalizeIscoCode(iscoCode);
  if (!normalizedIsco) return null;

  const socs = Object.values(FREY_OSBORNE_2017)
    .filter((entry) => normalizeIscoCode(entry.iscoCode) === normalizedIsco)
    .map((entry) => entry.socCode);
  return freyOsborneProbabilityForSocCodes(socs, `ISCO ${normalizedIsco}`);
}

function occupationTitle(profile: CandidateSkillProfile) {
  return (
    profile.occupation.escoOccupationTitle?.trim() ||
    profile.occupation.iscoTitle?.trim() ||
    profile.profile.roleName?.trim() ||
    "mapped occupation"
  );
}

function riskFromFreyOsborneMatch(
  fo: FreyOsborneProbabilityMatch,
  countryCtx: CountryAutomationContext,
  anchorLabel?: string,
): SkillAIRisk {
  const baseline = Math.round(fo.probability * 100);
  const adjusted = Math.round(fo.probability * countryCtx.modifier * 100);
  const occupationLabel = fo.occupations[0];

  const isAdjusted = countryCtx.modifier !== 1.0;
  const adjustmentClause = isAdjusted
    ? ` Adjusted to ${adjusted}/100 for ${countryCtx.countryName} labor market context (modifier ×${countryCtx.modifier.toFixed(2)}, ${countryCtx.source}).`
    : "";

  const iloShares = getIloTaskShares(fo.iscoCodes[0]);
  const iloClause = iloShares ? ` ${describeIloShares(iloShares)}` : "";
  const iloSourceClause = iloShares ? ` · ${ILO_TASK_INDEX_CITATION}` : "";

  const level = levelFromExposure(adjusted);
  const chips: string[] = [`Auto risk ${baseline}% (Frey-Osborne)`];
  if (iloShares) {
    const routinePct = Math.round(
      (iloShares.routineCognitive + iloShares.routineManual) * 100,
    );
    chips.push(`${routinePct}% routine (ILO)`);
  }
  if (isAdjusted) {
    chips.push(`${countryCtx.countryName} adjustment ×${countryCtx.modifier.toFixed(2)}`);
  }

  const anchorClause = anchorLabel
    ? ` Anchored from ESCO/ISCO role "${anchorLabel}".`
    : fo.matchedTerm
      ? ` Matched from "${fo.matchedTerm}".`
      : "";

  return {
    level,
    exposure: adjusted,
    baselineExposure: baseline,
    headline: composeHeadline(level),
    chips,
    rationale: `Anchored to "${occupationLabel}" (SOC ${fo.socCodes[0]}) in Frey & Osborne 2017, automation probability ${fo.probability.toFixed(2)}.${anchorClause}${adjustmentClause}${iloClause}`,
    source: `${FREY_OSBORNE_CITATION}${iloSourceClause}${isAdjusted ? ` · ${countryCtx.source}` : ""}`,
  };
}

function riskFromEscoOccupation(
  profile: CandidateSkillProfile,
  countryCtx: CountryAutomationContext,
): SkillAIRisk | null {
  const codeMatch =
    freyOsborneProbabilityForIsco(profile.occupation.iscoCode) ??
    freyOsborneProbabilityForIsco(profile.automationAndReskilling?.automationRiskOccupationCode);
  const title = occupationTitle(profile);
  const titleMatch =
    codeMatch ??
    freyOsborneProbabilityForSkillTerms([
      profile.occupation.escoOccupationTitle,
      profile.occupation.iscoTitle,
      profile.profile.roleName,
      profile.profile.normalizedRoleName,
      ...(profile.experience.jobTitles ?? []),
    ]);

  return titleMatch ? riskFromFreyOsborneMatch(titleMatch, countryCtx, title) : null;
}

function describeIloShares(shares: IloTaskShares): string {
  const routine = Math.round((shares.routineCognitive + shares.routineManual) * 100);
  const nonRoutine = Math.round(
    (shares.nonRoutineAnalytic + shares.nonRoutineInteractive + shares.nonRoutineManual) * 100,
  );
  return `ILO 2021 Task Index for ISCO ${shares.iscoCode} (${shares.title}): ${routine}% routine, ${nonRoutine}% non-routine task content.`;
}

/**
 * Compose a one-sentence plain-English headline from level + outlook.
 * The candidate sees this; the dense rationale lives behind a "Sources" toggle.
 */
function composeHeadline(
  level: AIRiskLevel,
  outlook?: SkillClusterOutlook["outlook"],
): string {
  if (level === "high") {
    if (outlook === "declining")
      return "AI is doing most of this work — pivot toward judgment-heavy roles.";
    if (outlook === "rising")
      return "Routine parts automate fast, but the field is growing — focus on the human-judgment layer.";
    return "Routine parts automate fast — durable value is in oversight and integration.";
  }
  if (level === "moderate") {
    if (outlook === "declining")
      return "Mixed exposure plus shrinking demand — start building adjacent skills now.";
    if (outlook === "rising")
      return "Mixed exposure but rising demand — focus on the non-routine parts.";
    return "Mixed exposure — automation handles routine pieces; judgment stays human.";
  }
  if (outlook === "declining")
    return "Resilient work but demand may shrink — keep an eye on adjacent skills.";
  if (outlook === "rising")
    return "Strong durable skill — demand is growing through 2035.";
  return "AI-resilient: non-routine, in-person work AI cannot easily replace.";
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

  const iloShares = getIloTaskShares(fo.iscoCodes[0]);
  const iloClause = iloShares ? ` ${describeIloShares(iloShares)}` : "";
  const iloSourceClause = iloShares ? ` · ${ILO_TASK_INDEX_CITATION}` : "";

  const level = levelFromExposure(adjusted);
  const chips: string[] = [`Auto risk ${baseline}% (Frey-Osborne)`];
  if (iloShares) {
    const routinePct = Math.round(
      (iloShares.routineCognitive + iloShares.routineManual) * 100,
    );
    chips.push(`${routinePct}% routine (ILO)`);
  }
  if (isAdjusted) {
    chips.push(`${countryCtx.countryName} adjustment ×${countryCtx.modifier.toFixed(2)}`);
  }

  return {
    level,
    exposure: adjusted,
    baselineExposure: baseline,
    headline: composeHeadline(level),
    chips,
    rationale: `Anchored to "${occupationLabel}" (SOC ${fo.socCodes[0]}) in Frey & Osborne 2017, automation probability ${fo.probability.toFixed(2)}.${adjustmentClause}${iloClause}`,
    source: `${FREY_OSBORNE_CITATION}${iloSourceClause}${isAdjusted ? ` · ${countryCtx.source}` : ""}`,
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
  const level = levelFromExposure(adjustedExposure);

  const chips: string[] = ["Category-level estimate"];
  if (isAdjusted) {
    chips.push(`${countryCtx.countryName} adjustment ×${countryCtx.modifier.toFixed(2)}`);
  }

  return {
    level,
    exposure: adjustedExposure,
    baselineExposure: cell.exposure,
    headline: composeHeadline(level),
    chips,
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

/**
 * For curated risks (TECH/TRADE/AGRI mock profiles) the rationale is
 * already handwritten prose. Synthesize a headline from its first sentence
 * if no headline was set, so the UI's plain-English layer always has content.
 */
function ensurePresentationFields(risk: SkillAIRisk): SkillAIRisk {
  if (risk.headline && risk.chips) return risk;
  const headline =
    risk.headline ??
    (() => {
      const firstSentence = risk.rationale.split(/(?<=[.!?])\s+/)[0]?.trim();
      return firstSentence && firstSentence.length <= 180
        ? firstSentence
        : composeHeadline(risk.level, risk.outlook);
    })();
  return {
    ...risk,
    headline,
    chips: risk.chips ?? [],
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

interface AdjacentSkillRule {
  name: string;
  tracks?: CandidateTrack[];
  triggers: string[];
  categories?: SkillItem["category"][];
  reason: string;
  fallback?: boolean;
}

interface ScoredAdjacentSkill extends AdjacentSkill {
  score: number;
  matchedSkills: string[];
}

const ADJACENT_SKILL_RULES: AdjacentSkillRule[] = [
  {
    name: "TypeScript",
    tracks: ["tech"],
    triggers: ["javascript", "react", "node", "frontend", "web development"],
    reason:
      "Direct next step from JavaScript or React work; it improves reliability and makes AI-generated code easier to review.",
  },
  {
    name: "Cloud deployment",
    tracks: ["tech"],
    triggers: ["node", "backend", "api", "javascript", "react", "web development"],
    reason:
      "Moves the candidate from writing app code into deploying, operating and integrating production systems.",
  },
  {
    name: "API security",
    tracks: ["tech"],
    triggers: ["node", "api", "backend", "express", "javascript"],
    reason:
      "Builds on backend/API work and shifts value toward security judgment that is harder to automate.",
  },
  {
    name: "Testing automation",
    tracks: ["tech"],
    triggers: ["react", "javascript", "frontend", "qa", "web development"],
    reason:
      "Pairs with coding skills while strengthening verification, debugging and release confidence.",
  },
  {
    name: "Data engineering & analytics",
    tracks: ["tech", "other"],
    triggers: ["postgresql", "sql", "database", "excel", "data", "analytics"],
    reason:
      "Uses existing data or database skills and points toward higher-demand analytical workflows.",
  },
  {
    name: "AI-tool orchestration (LLM APIs, RAG)",
    tracks: ["tech"],
    triggers: ["javascript", "node", "python", "api", "react", "data"],
    reason:
      "Turns existing technical skills into building and supervising AI-enabled workflows.",
  },
  {
    name: "Solar / battery repair",
    tracks: ["trade"],
    triggers: ["phone repair", "electronics", "repair", "electrical", "battery", "hardware"],
    reason:
      "Builds on hands-on repair skills and moves toward a growing energy-maintenance market.",
  },
  {
    name: "IoT & smart-device diagnostics",
    tracks: ["trade"],
    triggers: ["phone repair", "electronics", "repair", "diagnostics", "hardware"],
    reason:
      "Extends repair experience into connected devices, where local troubleshooting remains valuable.",
  },
  {
    name: "Spare-parts e-commerce / WhatsApp sales",
    tracks: ["trade"],
    triggers: ["inventory", "sales", "customer service", "retail", "repair"],
    reason:
      "Connects inventory, sales or repair experience to a practical digital commerce channel.",
  },
  {
    name: "Customer training & technical demos",
    tracks: ["trade", "other"],
    triggers: ["customer service", "sales", "training", "support", "communication"],
    reason:
      "Uses communication strengths in non-routine, in-person work that AI does not easily replace.",
  },
  {
    name: "Mobile bookkeeping",
    tracks: ["trade", "agriculture", "other"],
    triggers: ["bookkeeping", "accounting", "cash", "inventory", "record keeping"],
    reason:
      "Upgrades routine manual records into app-supported financial tracking and decision-making.",
  },
  {
    name: "Agri-tech app literacy (PlantVillage, Esoko)",
    tracks: ["agriculture"],
    triggers: ["crop", "farming", "agriculture", "pest", "irrigation", "cultivation"],
    reason:
      "Builds on farm knowledge while using digital tools for diagnosis, prices and extension advice.",
  },
  {
    name: "Post-harvest processing & storage",
    tracks: ["agriculture"],
    triggers: ["crop", "cultivation", "harvest", "farming", "agriculture"],
    reason:
      "Adds value beyond field work and is less exposed than routine record-keeping tasks.",
  },
  {
    name: "Climate-smart agriculture (drought-resilient varieties)",
    tracks: ["agriculture"],
    triggers: ["crop", "cultivation", "irrigation", "soil", "farming", "agriculture"],
    reason:
      "Connects existing farming skills to climate adaptation and resilient production methods.",
  },
  {
    name: "Farm data analysis",
    tracks: ["agriculture"],
    triggers: ["record keeping", "bookkeeping", "excel", "data", "yield", "farm"],
    reason:
      "Turns routine farm records into planning, pricing and yield decisions.",
  },
  {
    name: "Cooperative finance & group savings (VSLA)",
    tracks: ["agriculture"],
    triggers: ["cooperative", "community", "finance", "leadership", "management"],
    reason:
      "Extends cooperative or leadership work into practical financial coordination.",
  },
  {
    name: "AI tool literacy",
    tracks: ["other"],
    triggers: ["admin", "writing", "communication", "customer service", "data entry", "office"],
    categories: ["business", "soft", "language"],
    reason:
      "Helps the candidate use AI on routine writing, admin and research tasks instead of competing with it.",
  },
  {
    name: "Data quality & human-in-the-loop QA",
    tracks: ["other", "tech"],
    triggers: ["data entry", "quality", "excel", "admin", "support", "testing"],
    reason:
      "Moves routine input work toward checking, correcting and supervising automated outputs.",
  },
  {
    name: "CRM and digital customer records",
    tracks: ["other", "trade"],
    triggers: ["customer service", "sales", "admin", "reception", "support"],
    reason:
      "Builds on service experience and makes customer workflows more portable across employers.",
  },
];

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

function normalizeSkillText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function skillMatchesTrigger(skill: SkillItem, trigger: string) {
  const needle = normalizeSkillText(trigger);
  const haystack = [
    skill.name,
    skill.normalizedName,
    skill.escoPreferredLabel ?? "",
    ...(skill.evidence ?? []),
  ]
    .map(normalizeSkillText)
    .join(" ");
  return haystack.includes(needle) || needle.includes(normalizeSkillText(skill.name));
}

function heldSkillMatchesName(heldSkillNames: Set<string>, candidateName: string) {
  const normalizedCandidate = normalizeSkillText(candidateName);
  for (const held of heldSkillNames) {
    const normalizedHeld = normalizeSkillText(held);
    if (normalizedHeld === normalizedCandidate) return true;
    if (normalizedHeld.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedHeld)) {
      return true;
    }
  }
  return false;
}

function scoreOutlook(skillName: string) {
  const outlook = lookupWittgensteinOutlook(skillName);
  if (!outlook) return { outlook: "stable" as const, score: 0 };
  if (outlook.outlook === "rising") return { outlook: "rising" as const, score: 12 };
  return { outlook: "stable" as const, score: 4 };
}

function addScoredAdjacent(
  recommendations: Map<string, ScoredAdjacentSkill>,
  adjacent: AdjacentSkill,
  score: number,
  matchedSkills: string[],
) {
  const enriched = enrichAdjacentWithOutlook(adjacent);
  const key = normalizeSkillText(enriched.name);
  const existing = recommendations.get(key);
  const mergedScore = score + (enriched.outlook === "rising" ? 8 : 2);
  if (!existing || mergedScore > existing.score) {
    recommendations.set(key, {
      ...enriched,
      score: mergedScore,
      matchedSkills,
    });
  }
}

function buildAdjacentSkills(
  profile: CandidateSkillProfile,
  bySkill: Record<string, SkillAIRisk>,
): AdjacentSkill[] {
  const allSkills = Object.values(profile.skills).flat();
  const track = profile.profile.track;
  const heldSkillNames = new Set(allSkills.map((s) => s.name.toLowerCase()));
  const recommendations = new Map<string, ScoredAdjacentSkill>();

  for (const rule of ADJACENT_SKILL_RULES) {
    if (rule.tracks && !rule.tracks.includes(track)) continue;
    if (heldSkillMatchesName(heldSkillNames, rule.name)) continue;

    const matchedSkills = allSkills.filter((skill) => {
      const categoryMatch = rule.categories?.includes(skill.category) ?? false;
      return categoryMatch || rule.triggers.some((trigger) => skillMatchesTrigger(skill, trigger));
    });
    if (!matchedSkills.length) continue;

    const highRiskMatches = matchedSkills.filter((skill) => bySkill[skill.name]?.level === "high").length;
    const categoryBreadth = new Set(matchedSkills.map((skill) => skill.category)).size;
    const outlook = scoreOutlook(rule.name);
    const score =
      25 +
      matchedSkills.length * 9 +
      highRiskMatches * 12 +
      categoryBreadth * 3 +
      outlook.score;
    const matchedNames = matchedSkills.slice(0, 3).map((skill) => skill.name);
    const reason =
      matchedNames.length > 0
        ? `${rule.reason} Matched from: ${matchedNames.join(", ")}.`
        : rule.reason;
    addScoredAdjacent(
      recommendations,
      {
        name: rule.name,
        reason,
        outlook: outlook.outlook,
      },
      score,
      matchedNames,
    );
  }

  for (const name of profile.automationAndReskilling?.recommendedLearningSkills ?? []) {
    if (!name || heldSkillMatchesName(heldSkillNames, name)) continue;
    const outlook = scoreOutlook(name);
    addScoredAdjacent(
      recommendations,
      {
        name,
        reason:
          "Suggested from the candidate profile, then ranked behind directly matched next-step skills.",
        outlook: outlook.outlook,
      },
      12 + outlook.score,
      [],
    );
  }

  const minimumRulesBeforeFallback = recommendations.size >= 3;
  const fallbackScore = minimumRulesBeforeFallback ? 2 : 16;
  for (const fallback of TRACK_ADJACENT_FALLBACK[track]) {
    if (heldSkillMatchesName(heldSkillNames, fallback.name)) continue;
    addScoredAdjacent(recommendations, fallback, fallbackScore, []);
  }

  return Array.from(recommendations.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((adjacent) => ({
      name: adjacent.name,
      reason: adjacent.reason,
      outlook: adjacent.outlook,
    }));
}

export function computeRiskProfileForCandidateProfile(
  profile: CandidateSkillProfile,
  countryCode?: string,
): SkillRiskProfile {
  const allSkills = Object.values(profile.skills).flat();
  const track = profile.profile.track;
  const countryCtx = getCountryModifier(countryCode);

  const bySkill: Record<string, SkillAIRisk> = {};
  const summaryRisks: SkillAIRisk[] = [];
  const unindexedSkills: string[] = [];
  const occupationRisk = riskFromEscoOccupation(profile, countryCtx);
  if (occupationRisk) {
    summaryRisks.push(occupationRisk);
  }
  for (const skill of allSkills) {
    const curated = KNOWN_SKILL_RISKS[skill.name.toLowerCase()];
    const fromFreyOsborne = curated
      ? null
      : freyOsborneProbabilityForSkillTerms([
          skill.name,
          skill.normalizedName,
          skill.escoPreferredLabel,
          ...(skill.evidence ?? []),
        ]);
    const outlook = lookupWittgensteinOutlook(skill.escoPreferredLabel ?? skill.name);
    const indexedBase = curated ?? fromFreyOsborne;

    if (indexedBase) {
      const indexedRisk = ensurePresentationFields(
        attachOutlook(
          "probability" in indexedBase
            ? riskFromFreyOsborneMatch(indexedBase, countryCtx)
            : indexedBase,
          outlook,
        ),
      );
      bySkill[skill.name] = indexedRisk;
      summaryRisks.push(indexedRisk);
      continue;
    }

    unindexedSkills.push(skill.name);
    const fallbackRisk = inferRiskFromCategory(skill.category, track, countryCtx);
    summaryRisks.push(ensurePresentationFields(attachOutlook(fallbackRisk, outlook)));
  }

  const exposures = summaryRisks.map((r) => r.exposure);
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
  if (occupationRisk?.level === "low" && !resilient.includes(occupationTitle(profile))) {
    resilient.push(occupationTitle(profile));
  }
  const llmResilient = profile.automationAndReskilling?.resilientSkills ?? [];
  for (const name of llmResilient) {
    if (name && !resilient.includes(name)) resilient.push(name);
  }

  const adjacent = buildAdjacentSkills(profile, bySkill);

  const isAdjusted = countryCtx.modifier !== 1.0;
  const indexedSkillCount = Object.keys(bySkill).length;
  const coverageClause =
    allSkills.length && indexedSkillCount < allSkills.length
      ? ` Direct per-skill indexes are shown for ${indexedSkillCount} of ${allSkills.length} extracted skills; unmatched skills are included only in the broader profile estimate.`
      : "";
  const occupationClause = occupationRisk
    ? ` Overall exposure is anchored to the mapped ESCO/ISCO role "${occupationTitle(profile)}".`
    : "";
  const headline = isAdjusted
    ? `${TRACK_HEADLINE[track]} Risk levels shown have been calibrated to ${countryCtx.countryName} via a ×${countryCtx.modifier.toFixed(2)} LMIC modifier (${countryCtx.source}). 2025–2035 outlook uses ${WITTGENSTEIN_CITATION}.`
    : `${TRACK_HEADLINE[track]} 2025–2035 outlook uses ${WITTGENSTEIN_CITATION}.`;

  // Build Wittgenstein 2025–2035 trajectory snapshot for the candidate's skills.
  const coveredHeadline = `${headline}${occupationClause}${coverageClause}`;

  const rising: TrajectoryEntry[] = [];
  const declining: TrajectoryEntry[] = [];
  for (const skill of allSkills) {
    const outlook = lookupWittgensteinOutlook(skill.name);
    if (!outlook) continue;
    const entry: TrajectoryEntry = {
      skill: skill.name,
      cluster: outlook.cluster,
      outlook: outlook.outlook,
      changeIndex: outlook.changeIndex,
    };
    if (outlook.outlook === "rising") rising.push(entry);
    else if (outlook.outlook === "declining") declining.push(entry);
  }
  rising.sort((a, b) => b.changeIndex - a.changeIndex);
  declining.sort((a, b) => a.changeIndex - b.changeIndex);

  let trajectorySummary: string;
  if (!rising.length && !declining.length) {
    trajectorySummary = `No Wittgenstein 2025–2035 cluster matched the candidate's skills directly. Adjacent-skill recommendations below still draw on ${WITTGENSTEIN_CITATION}.`;
  } else if (rising.length && !declining.length) {
    trajectorySummary = `${rising.length} of the candidate's skills sit in clusters projected to grow through 2035 in ${countryCtx.countryName}. The portfolio leans toward areas where demand is expanding.`;
  } else if (!rising.length && declining.length) {
    trajectorySummary = `${declining.length} of the candidate's skills sit in clusters projected to shrink through 2035 in ${countryCtx.countryName}. Reskilling toward the adjacent skills below is recommended.`;
  } else {
    trajectorySummary = `Mixed trajectory: ${rising.length} skill(s) in rising clusters and ${declining.length} in declining clusters through 2035 (${countryCtx.countryName}, ${WITTGENSTEIN_CITATION}).`;
  }

  return {
    summary: {
      overallLevel,
      overallExposure,
      headline: coveredHeadline,
    },
    bySkill,
    indexedSkillCount,
    totalSkillCount: allSkills.length,
    unindexedSkills,
    resilient: resilient.slice(0, 8),
    adjacent,
    trajectory: {
      rising,
      declining,
      summary: trajectorySummary,
    },
  };
}

// Re-export so consumers (UI, callers) can read the country list / modifiers
// without importing from the dataset module directly.
export { COUNTRY_MODIFIERS, type CountryAutomationContext };

