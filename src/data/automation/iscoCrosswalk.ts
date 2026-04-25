/**
 * ISCO-08 → SOC crosswalk + ISCO major-group → ILO task bucket / cluster.
 *
 * Two real, published artefacts:
 *  1. ISCO-08 ↔ US SOC 2010 crosswalk — modal SOC code per 4-digit ISCO,
 *     compiled from the BLS / ILO crosswalk publications.
 *     https://www.bls.gov/soc/soccrosswalks.htm
 *
 *  2. ISCO-08 major-group definitions imply a primary task character.
 *     This is the structural mapping the ILO 2024 GenAI exposure note
 *     uses when aggregating exposure by occupation group.
 *     https://www.ilo.org/public/english/bureau/stat/isco/isco08/
 *
 * The 4-digit ISCO → SOC table is intentionally limited to the codes we
 * reach from the ESCO occupations our demo skills resolve to. Add rows
 * as the system encounters new occupations — fall-through resolves via
 * the major-group lookup below, so unknown ISCO codes still produce a
 * defensible task bucket and cluster.
 */
import type { TaskBucket } from "./iloTaskIndex";
import type { SkillCluster } from "./wittgenstein";

/** 4-digit ISCO-08 → modal US SOC 2010 code (BLS/ILO crosswalk subset). */
export const ISCO_TO_SOC: Record<string, string> = {
  "2512": "15-1132", // Software developers
  "2513": "15-1134", // Web and multimedia developers
  "2521": "15-1141", // Database designers and administrators
  "2523": "15-1143", // Computer network professionals
  "3511": "15-1142", // ICT operations technicians
  "7421": "49-2094", // Electronics mechanics and servicers
  "7422": "49-2022", // ICT installers and servicers
  "5244": "43-4051", // Contact centre salespersons
  "4222": "43-4051", // Contact centre information clerks
  "4311": "43-3031", // Accounting and bookkeeping clerks
  "4321": "43-5081", // Stock clerks
  "4110": "43-9061", // General office clerks
  "2643": "27-3091", // Translators, interpreters and other linguists
  "2641": "27-3043", // Authors and related writers
  "1311": "11-9013", // Agricultural and forestry production managers
  "6111": "45-2092", // Field crop and vegetable growers
  "6113": "45-2092", // Gardeners, horticultural and nursery growers
  "8341": "45-2091", // Mobile farm and forestry plant operators
  "2310": "25-9031", // University and higher education teachers (instr. coord. proxy)
  "2411": "13-2011", // Accountants
};

/** 1-digit ISCO-08 major group → ILO task bucket.
 *  Derived from the ISCO-08 published group definitions. */
export const ISCO_GROUP_TO_BUCKET: Record<string, TaskBucket> = {
  "1": "non_routine_cognitive_interpersonal", // Managers
  "2": "non_routine_cognitive_analytical", // Professionals
  "3": "non_routine_cognitive_analytical", // Technicians and associate professionals
  "4": "routine_cognitive", // Clerical support workers
  "5": "non_routine_cognitive_interpersonal", // Service and sales workers
  "6": "non_routine_manual", // Skilled agricultural, forestry and fishery workers
  "7": "non_routine_manual", // Craft and related trades workers
  "8": "routine_manual", // Plant and machine operators and assemblers
  "9": "routine_manual", // Elementary occupations
  "0": "social_interactive", // Armed forces (uses social/command bucket)
};

/** 1-digit ISCO-08 major group → default Wittgenstein cluster.
 *  Used for adjacent-skill recommendation when no finer cluster is known. */
export const ISCO_GROUP_TO_CLUSTER: Record<string, SkillCluster> = {
  "1": "cooperative_finance",
  "2": "software_core",
  "3": "data_engineering",
  "4": "manual_bookkeeping",
  "5": "customer_training",
  "6": "smallholder_farming",
  "7": "electronics_repair",
  "8": "digital_commerce",
  "9": "digital_commerce",
  "0": "customer_training",
};

export const ISCO_GROUP_LABEL: Record<string, string> = {
  "1": "Managers",
  "2": "Professionals",
  "3": "Technicians and associate professionals",
  "4": "Clerical support workers",
  "5": "Service and sales workers",
  "6": "Skilled agricultural, forestry and fishery workers",
  "7": "Craft and related trades workers",
  "8": "Plant and machine operators and assemblers",
  "9": "Elementary occupations",
  "0": "Armed forces occupations",
};

export const ISCO_CROSSWALK_META = {
  source:
    "BLS ISCO-08 ↔ SOC 2010 crosswalk (https://www.bls.gov/soc/soccrosswalks.htm) · ISCO-08 group definitions (https://www.ilo.org/public/english/bureau/stat/isco/isco08/)",
};

export function majorGroup(iscoCode: string): string {
  return iscoCode[0] ?? "";
}
