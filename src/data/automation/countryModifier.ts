/**
 * Income-group × task-bucket multiplier on the blended Frey-Osborne / ILO
 * exposure score. Encodes the readme requirement that automation risk
 * "looks different in Kampala than in Kuala Lumpur".
 *
 * Universal: works for any country. The income group is resolved at
 * runtime from the World Bank API (services/worldBank.ts), so this table
 * stays geography-agnostic — only the four WB income tiers carry weights.
 *
 * Logic, in plain terms:
 *  - GenAI-driven cognitive exposure is near-uniform across geography —
 *    cloud LLMs don't care where you work.
 *  - Manual / mechanization exposure scales with capital intensity:
 *    HIC ≈ 1.0 (Frey-Osborne already calibrated to US wages),
 *    UMC ≈ 0.85, LMC ≈ 0.70, LIC ≈ 0.55. World Bank STEP confirms
 *    realised displacement in routine-manual occupations is far below
 *    Frey-Osborne predictions in low- and lower-middle-income countries.
 *  - Social / interpersonal work is durable everywhere; modifier ≈ 1.
 */
import type { TaskBucket } from "./iloTaskIndex";
import type { IncomeGroup } from "@/services/worldBank";

export const INCOME_GROUP_MODIFIER: Record<IncomeGroup, Record<TaskBucket, number>> = {
  HIC: {
    routine_cognitive: 1.0,
    routine_manual: 1.0,
    non_routine_cognitive_analytical: 1.0,
    non_routine_cognitive_interpersonal: 1.0,
    non_routine_manual: 1.0,
    social_interactive: 1.0,
  },
  UMC: {
    routine_cognitive: 1.0,
    routine_manual: 0.85,
    non_routine_cognitive_analytical: 0.97,
    non_routine_cognitive_interpersonal: 1.0,
    non_routine_manual: 0.85,
    social_interactive: 1.0,
  },
  LMC: {
    routine_cognitive: 1.0,
    routine_manual: 0.7,
    non_routine_cognitive_analytical: 0.95,
    non_routine_cognitive_interpersonal: 1.0,
    non_routine_manual: 0.7,
    social_interactive: 1.0,
  },
  LIC: {
    routine_cognitive: 1.0,
    routine_manual: 0.55,
    non_routine_cognitive_analytical: 0.92,
    non_routine_cognitive_interpersonal: 1.0,
    non_routine_manual: 0.55,
    social_interactive: 1.0,
  },
};

export const INCOME_GROUP_LABEL: Record<IncomeGroup, string> = {
  HIC: "High income",
  UMC: "Upper-middle income",
  LMC: "Lower-middle income",
  LIC: "Low income",
};

const DEFAULT_GROUP: IncomeGroup = "LMC";

export function getModifierForIncomeGroup(group: IncomeGroup | null): Record<TaskBucket, number> {
  return INCOME_GROUP_MODIFIER[group ?? DEFAULT_GROUP];
}

export const COUNTRY_MODIFIER_META = {
  source:
    "World Bank API (live income-group lookup) · World Bank STEP Skills Measurement Programme (Ghana 2013, Bangladesh 2014, Kenya 2013) for the LMIC dampening calibration.",
  url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519",
};
