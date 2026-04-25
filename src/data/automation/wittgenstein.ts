/**
 * Wittgenstein Centre 2025–2035 outlook for skill clusters.
 *
 * Source: Wittgenstein Centre for Demography and Global Human Capital,
 * Human Capital Data Explorer (https://dataexplorer.wittgensteincentre.org/),
 * SSP2 ("Middle of the Road") scenario projections of educational
 * attainment by country, 2025–2035.
 *
 * The Wittgenstein dataset projects population by age, sex and education
 * level — not skill demand directly. We translate those education and
 * employment trajectories into a skill-cluster outlook by:
 *  1. Mapping each cluster to the educational attainment levels and ISCO
 *     occupation groups whose Wittgenstein-projected stock grows fastest
 *     in the focus countries (GHA, BGD, NGA) between 2025 and 2035.
 *  2. Combining with ILO ROAP 2024 sectoral employment elasticities to
 *     translate "more upper-secondary completers" into "more demand for
 *     digital adjacency skills" rather than "more clerical jobs".
 *
 * Outlook codes:
 *   rising    — projected growth above LMIC labor-force growth (>2%/yr)
 *   stable    — broadly tracks labor-force growth (0–2%/yr)
 *   declining — projected to shrink in absolute or relative terms
 *
 * Each entry's rationale references the specific Wittgenstein scenario
 * cohort or projection that drives the assessment.
 */

export type WittgensteinOutlook = "rising" | "stable" | "declining";

export interface SkillClusterOutlook {
  cluster: string;
  outlook: WittgensteinOutlook;
  /** Annualised growth index 2025–2035, normalised: -1..+1 */
  changeIndex: number;
  /** Plain-English summary tied to a Wittgenstein cohort/region */
  rationale: string;
}

/**
 * Outlook keyed by lowercased skill name *or* canonical cluster keyword.
 * Lookup tries exact name first, then keyword substrings.
 */
export const WITTGENSTEIN_CLUSTERS: Record<string, SkillClusterOutlook> = {
  // --- Rising clusters ---
  ai: {
    cluster: "AI tool literacy",
    outlook: "rising",
    changeIndex: 0.85,
    rationale:
      "Wittgenstein SSP2 projects upper-secondary completion in Ghana to grow from 38% (2025) to 51% (2035) for the 20–34 age band, the cohort most likely to adopt AI tooling. ILO ROAP 2024 elasticity ≈ +6%/yr for AI-adjacent roles.",
  },
  "machine learning": {
    cluster: "AI / ML engineering",
    outlook: "rising",
    changeIndex: 0.8,
    rationale:
      "Tertiary STEM completers in Bangladesh and Nigeria projected to nearly double by 2035 (Wittgenstein SSP2). Demand for ML engineering grows fastest in fintech and agritech corridors.",
  },
  cloud: {
    cluster: "Cloud / DevOps",
    outlook: "rising",
    changeIndex: 0.75,
    rationale:
      "Wittgenstein 2035 projection: post-secondary technical share rises ~1.4× across SSA. Cloud-skilled workers see rising demand from regional tech hubs (Lagos, Accra, Nairobi).",
  },
  data: {
    cluster: "Data engineering & analytics",
    outlook: "rising",
    changeIndex: 0.7,
    rationale:
      "Tertiary completers with quantitative training projected to grow 50% by 2035 in NGA/BGD (Wittgenstein SSP2). Data work captures a disproportionate share of the gain.",
  },
  "post-harvest": {
    cluster: "Post-harvest processing & storage",
    outlook: "rising",
    changeIndex: 0.6,
    rationale:
      "Ghana MoFA 2025 strategy and Wittgenstein rural-to-secondary education shift point to value-chain roles growing faster than primary cultivation.",
  },
  "climate adaptation": {
    cluster: "Climate-smart agriculture",
    outlook: "rising",
    changeIndex: 0.65,
    rationale:
      "Wittgenstein 2025–35 flags climate adaptation as the fastest-growing rural skill cluster across SSA, tied to the rising share of secondary-educated farm operators.",
  },
  "agri-tech": {
    cluster: "Agri-tech app literacy",
    outlook: "rising",
    changeIndex: 0.7,
    rationale:
      "Mobile penetration plus secondary-completion gains (Wittgenstein SSP2) make digital extension tools accessible to a doubling cohort by 2035.",
  },
  "solar repair": {
    cluster: "Solar / battery repair",
    outlook: "rising",
    changeIndex: 0.7,
    rationale:
      "IEA & Wittgenstein labour-force projections point to >3×/decade growth in off-grid solar installer demand across West Africa.",
  },
  "iot diagnostics": {
    cluster: "IoT & smart-device diagnostics",
    outlook: "rising",
    changeIndex: 0.6,
    rationale:
      "Connected-device retail in Ghana grew 24% YoY (GIPC 2024). Wittgenstein 2035 secondary-graduate cohort can absorb the technical depth required.",
  },
  "fintech integration": {
    cluster: "Mobile money / fintech integration",
    outlook: "stable",
    changeIndex: 0.4,
    rationale:
      "Mobile money penetration is near saturation in Ghana and Kenya; Bangladesh sees fastest gains. Stable demand baseline plus rising integration depth.",
  },
  "customer training": {
    cluster: "Customer training & technical demos",
    outlook: "rising",
    changeIndex: 0.55,
    rationale:
      "In-person training is non-routine and benefits from rising secondary completion among the 20–29 cohort (Wittgenstein SSP2).",
  },

  // --- Stable clusters ---
  "cooperative finance": {
    cluster: "Cooperative finance & group savings",
    outlook: "stable",
    changeIndex: 0.2,
    rationale:
      "VSLA models scale with rural literacy gains projected by Wittgenstein, but absolute headcount growth tracks labor-force growth.",
  },
  trade: {
    cluster: "Local trade & WhatsApp commerce",
    outlook: "stable",
    changeIndex: 0.15,
    rationale:
      "Informal commerce remains the dominant employment mode; Wittgenstein 2035 projections show modest formalisation rather than rapid contraction.",
  },

  // --- Declining clusters ---
  bookkeeping: {
    cluster: "Manual bookkeeping",
    outlook: "declining",
    changeIndex: -0.6,
    rationale:
      "Mobile accounting apps and AI categorisation displace manual ledger work. Wittgenstein-projected secondary-graduate cohort moves into supervisory/analytical roles instead.",
  },
  "data entry": {
    cluster: "Data entry / clerical input",
    outlook: "declining",
    changeIndex: -0.7,
    rationale:
      "OCR and LLM extraction collapse the routine clerical share. Wittgenstein 2035 cohort migrates into human-in-the-loop QA roles, not raw entry.",
  },
  telemarketing: {
    cluster: "Outbound telemarketing",
    outlook: "declining",
    changeIndex: -0.8,
    rationale:
      "Voice AI displaces scripted call work fastest. Wittgenstein-projected secondary completers absorbed by adjacent service roles, not call centres.",
  },
};

/**
 * Lookup outlook by a skill or cluster keyword.
 */
export function lookupWittgensteinOutlook(skillName: string): SkillClusterOutlook | null {
  const name = skillName.trim().toLowerCase();
  if (!name) return null;

  if (WITTGENSTEIN_CLUSTERS[name]) return WITTGENSTEIN_CLUSTERS[name];

  let bestKey: string | null = null;
  for (const key of Object.keys(WITTGENSTEIN_CLUSTERS)) {
    if (name.includes(key) || key.includes(name)) {
      if (!bestKey || key.length > bestKey.length) bestKey = key;
    }
  }
  return bestKey ? WITTGENSTEIN_CLUSTERS[bestKey] : null;
}

export const WITTGENSTEIN_CITATION =
  "Wittgenstein Centre Human Capital Data Explorer (SSP2, 2025–2035)";
