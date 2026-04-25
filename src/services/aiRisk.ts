/**
 * AI Readiness & Displacement Risk engine.
 *
 * Pure-ish function: given a candidate's skill list (with optional ESCO
 * codes) and a World Bank income group, compute a per-skill exposure
 * score plus an overall readiness summary, resilient-skill list and
 * adjacent-skill recommendations.
 *
 * Pipeline per skill:
 *   skill.name (+ escoCode?) ─ESCO API─▶ ESCO occupation ─▶ ISCO-08 code
 *   ISCO ─BLS crosswalk─▶ SOC ─Frey-Osborne─▶ p_FO  (0..1)
 *   ISCO major group ─ISCO-08 defs─▶ ILO task bucket ─▶ p_ILO (0..1)
 *   exposure = clamp(round( (0.4·p_FO + 0.6·p_ILO) · modifier · 100 ))
 *
 * Adjacent skills come from the Wittgenstein cluster outlook for the
 * candidate's region — we surface "rising" and "stable" clusters the
 * candidate doesn't already have coverage in.
 */
import type { SkillRiskProfile, AIRiskLevel, AdjacentSkill, SkillAIRisk } from "@/data/aiRisk";
import type { SkillScore } from "@/types/unmapped";
import { findOccupationForSkill, type EscoOccupation } from "./esco";
import { lookupFreyOsborne } from "@/data/automation/freyOsborne";
import {
  ILO_TASK_EXPOSURE,
  ILO_BUCKET_LABEL,
  type TaskBucket,
} from "@/data/automation/iloTaskIndex";
import {
  ISCO_TO_SOC,
  ISCO_GROUP_TO_BUCKET,
  ISCO_GROUP_TO_CLUSTER,
  ISCO_GROUP_LABEL,
  majorGroup,
} from "@/data/automation/iscoCrosswalk";
import { getModifierForIncomeGroup } from "@/data/automation/countryModifier";
import {
  WITTGENSTEIN_OUTLOOK,
  COUNTRY_REGION,
  type Region,
  type SkillCluster,
  type ClusterOutlook,
} from "@/data/automation/wittgenstein";
import type { IncomeGroup } from "./worldBank";

const FO_WEIGHT = 0.4;
const ILO_WEIGHT = 0.6;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function bucketLevel(exposure: number): AIRiskLevel {
  if (exposure >= 60) return "high";
  if (exposure >= 35) return "moderate";
  return "low";
}

function regionFor(countryCode: string): Region {
  return COUNTRY_REGION[countryCode.toUpperCase()] ?? "SSA";
}

interface ResolvedSkill {
  name: string;
  occupation: EscoOccupation | null;
  socCode: string | null;
  taskBucket: TaskBucket;
  cluster: SkillCluster;
}

async function resolveSkill(skill: SkillScore): Promise<ResolvedSkill> {
  const occ = await findOccupationForSkill(skill.name, skill.escoCode);
  if (!occ) {
    return {
      name: skill.name,
      occupation: null,
      socCode: null,
      taskBucket: "non_routine_cognitive_analytical",
      cluster: "software_core",
    };
  }
  const isco = occ.iscoCode;
  const group = majorGroup(isco);
  return {
    name: skill.name,
    occupation: occ,
    socCode: ISCO_TO_SOC[isco] ?? null,
    taskBucket: ISCO_GROUP_TO_BUCKET[group] ?? "non_routine_cognitive_analytical",
    cluster: ISCO_GROUP_TO_CLUSTER[group] ?? "software_core",
  };
}

function scoreSkill(resolved: ResolvedSkill, modifier: Record<TaskBucket, number>): SkillAIRisk {
  const fo = resolved.socCode ? lookupFreyOsborne(resolved.socCode) : null;
  const pFO = fo?.probability ?? null;
  const pILO = ILO_TASK_EXPOSURE[resolved.taskBucket];
  const blended = pFO !== null ? FO_WEIGHT * pFO + ILO_WEIGHT * pILO : pILO;
  const exposure = clamp(blended * 100 * modifier[resolved.taskBucket]);
  const level = bucketLevel(exposure);

  const occLabel = resolved.occupation
    ? `${resolved.occupation.title} (ISCO ${resolved.occupation.iscoCode})`
    : "no ESCO match";
  const groupLabel = resolved.occupation
    ? ISCO_GROUP_LABEL[majorGroup(resolved.occupation.iscoCode)]
    : null;
  const bucketLabel = ILO_BUCKET_LABEL[resolved.taskBucket];

  const rationaleParts: string[] = [];
  rationaleParts.push(`Resolved via ESCO to ${occLabel}${groupLabel ? ` — ${groupLabel}` : ""}.`);
  rationaleParts.push(`Task character: ${bucketLabel}.`);
  if (pFO !== null && fo) {
    rationaleParts.push(
      `Frey-Osborne computerisation probability for ${fo.title}: ${Math.round(pFO * 100)}%.`,
    );
  } else {
    rationaleParts.push(
      "No Frey-Osborne match for this ISCO code — exposure derived from the ILO task bucket alone.",
    );
  }

  const sourceParts = [
    "ESCO v1.1.1",
    pFO !== null ? "Frey-Osborne 2017" : null,
    "ILO 2024 GenAI exposure note",
    "World Bank income classification",
  ].filter(Boolean) as string[];

  return {
    level,
    exposure,
    rationale: rationaleParts.join(" "),
    source: sourceParts.join(" · "),
  };
}

function pickAdjacentSkills(
  region: Region,
  ownClusters: Set<SkillCluster>,
  limit = 4,
): AdjacentSkill[] {
  const regionTable = WITTGENSTEIN_OUTLOOK[region] ?? {};
  const candidates = (Object.entries(regionTable) as [SkillCluster, ClusterOutlook][])
    .filter(([cluster, info]) => info.outlook !== "shrinking" && !ownClusters.has(cluster))
    .sort((a, b) => {
      const order = { rising: 0, stable: 1, shrinking: 2 } as const;
      return order[a[1].outlook] - order[b[1].outlook];
    });

  return candidates.slice(0, limit).map(([cluster, info]) => ({
    name: clusterDisplayName(cluster),
    reason: info.rationale,
    outlook: info.outlook === "shrinking" ? "stable" : info.outlook,
  }));
}

function clusterDisplayName(cluster: SkillCluster): string {
  const map: Record<SkillCluster, string> = {
    software_core: "Software development core",
    cloud_devops: "Cloud / DevOps",
    data_engineering: "Data engineering & analytics",
    ai_orchestration: "AI-tool orchestration (LLM APIs, RAG)",
    fintech_integration: "Fintech / mobile-money integration",
    electronics_repair: "Electronics & device repair",
    iot_diagnostics: "IoT & smart-device diagnostics",
    customer_training: "Customer training & technical demos",
    digital_commerce: "Digital commerce (WhatsApp / social sales)",
    smallholder_farming: "Smallholder farming",
    agritech_apps: "Agri-tech app literacy",
    post_harvest: "Post-harvest processing & storage",
    climate_smart_ag: "Climate-smart agriculture",
    cooperative_finance: "Cooperative finance & group savings",
    scripted_writing: "Scripted writing",
    manual_bookkeeping: "Manual bookkeeping",
  };
  return map[cluster];
}

function buildHeadline(
  level: AIRiskLevel,
  countryCode: string,
  incomeGroup: IncomeGroup | null,
): string {
  const intro =
    level === "low"
      ? "This skill mix is broadly AI-resilient"
      : level === "moderate"
        ? "This skill mix has meaningful AI exposure"
        : "This skill mix faces high AI displacement risk";
  const calibration = incomeGroup
    ? `, calibrated for ${incomeGroup} (${countryCode}) labor markets`
    : ` for ${countryCode}`;
  return `${intro}${calibration}. Exposure blends Frey-Osborne 2017 with the ILO 2024 GenAI task framework; outlook draws on Wittgenstein Centre 2025–2035 projections.`;
}

export async function computeRiskProfile(
  skills: SkillScore[],
  incomeGroup: IncomeGroup | null,
  countryCode: string,
): Promise<SkillRiskProfile> {
  const modifier = getModifierForIncomeGroup(incomeGroup);
  const resolved = await Promise.all(skills.map(resolveSkill));

  const bySkill: Record<string, SkillAIRisk> = {};
  for (const r of resolved) {
    bySkill[r.name] = scoreSkill(r, modifier);
  }

  const exposures = Object.values(bySkill).map((r) => r.exposure);
  const overallExposure = exposures.length
    ? Math.round(exposures.reduce((a, b) => a + b, 0) / exposures.length)
    : 0;
  const overallLevel = bucketLevel(overallExposure);

  const resilient = resolved.filter((r) => bySkill[r.name].exposure < 35).map((r) => r.name);

  const ownClusters = new Set(resolved.map((r) => r.cluster));
  const adjacent = pickAdjacentSkills(regionFor(countryCode), ownClusters);

  return {
    summary: {
      overallLevel,
      overallExposure,
      headline: buildHeadline(overallLevel, countryCode, incomeGroup),
    },
    bySkill,
    resilient,
    adjacent,
  };
}
