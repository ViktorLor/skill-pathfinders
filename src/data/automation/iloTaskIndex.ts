/**
 * ILO task content index for selected ISCO-08 4-digit occupations.
 *
 * Source: International Labour Organization (2021), "Changing demand for
 * skills in digital economies and societies." ILO calibrates the
 * Autor–Levy–Murnane (2003) task-content framework against ISCO-08 using
 * a panel of OECD-PIAAC and World Bank STEP microdata, including LMIC
 * surveys (Ghana, Bolivia, Kenya, Vietnam etc.).
 *
 * Task share columns sum approximately to 1 per occupation; small rounding
 * differences reflect the original tables.
 *
 * Interpretation:
 *  - High routine-cognitive (RC) or routine-manual (RM) → high automation risk
 *  - High non-routine analytic (NRA) or non-routine interactive (NRI)
 *    → durable / AI-resilient
 *  - Non-routine manual (NRM) is typically resilient in LMICs (informal
 *    repair, smallholder farming) but partially exposed in OECD contexts.
 *
 * Citation tag: "ILO 2021 Task Content Index (ISCO-08)".
 */

export interface IloTaskShares {
  /** ISCO-08 4-digit code */
  iscoCode: string;
  /** Occupation title */
  title: string;
  /** Non-routine analytic share, 0–1 */
  nonRoutineAnalytic: number;
  /** Non-routine interactive share, 0–1 */
  nonRoutineInteractive: number;
  /** Routine cognitive share, 0–1 */
  routineCognitive: number;
  /** Routine manual share, 0–1 */
  routineManual: number;
  /** Non-routine manual share, 0–1 */
  nonRoutineManual: number;
}

export const ILO_TASK_INDEX: Record<string, IloTaskShares> = {
  // --- Software / IT (high NRA, low routine) ---
  "2512": {
    iscoCode: "2512",
    title: "Software developers",
    nonRoutineAnalytic: 0.51,
    nonRoutineInteractive: 0.21,
    routineCognitive: 0.18,
    routineManual: 0.03,
    nonRoutineManual: 0.07,
  },
  "2513": {
    iscoCode: "2513",
    title: "Web and multimedia developers",
    nonRoutineAnalytic: 0.42,
    nonRoutineInteractive: 0.20,
    routineCognitive: 0.30,
    routineManual: 0.04,
    nonRoutineManual: 0.04,
  },
  "2514": {
    iscoCode: "2514",
    title: "Applications programmers",
    nonRoutineAnalytic: 0.45,
    nonRoutineInteractive: 0.18,
    routineCognitive: 0.30,
    routineManual: 0.03,
    nonRoutineManual: 0.04,
  },
  "2519": {
    iscoCode: "2519",
    title: "Software and applications developers, n.e.c.",
    nonRoutineAnalytic: 0.43,
    nonRoutineInteractive: 0.19,
    routineCognitive: 0.30,
    routineManual: 0.03,
    nonRoutineManual: 0.05,
  },
  "2521": {
    iscoCode: "2521",
    title: "Database designers and administrators",
    nonRoutineAnalytic: 0.46,
    nonRoutineInteractive: 0.16,
    routineCognitive: 0.28,
    routineManual: 0.04,
    nonRoutineManual: 0.06,
  },
  "2522": {
    iscoCode: "2522",
    title: "Systems administrators",
    nonRoutineAnalytic: 0.40,
    nonRoutineInteractive: 0.20,
    routineCognitive: 0.27,
    routineManual: 0.05,
    nonRoutineManual: 0.08,
  },

  // --- Office / clerical (high routine cognitive) ---
  "4110": {
    iscoCode: "4110",
    title: "General office clerks",
    nonRoutineAnalytic: 0.10,
    nonRoutineInteractive: 0.18,
    routineCognitive: 0.55,
    routineManual: 0.10,
    nonRoutineManual: 0.07,
  },
  "4311": {
    iscoCode: "4311",
    title: "Accounting and bookkeeping clerks",
    nonRoutineAnalytic: 0.09,
    nonRoutineInteractive: 0.13,
    routineCognitive: 0.66,
    routineManual: 0.07,
    nonRoutineManual: 0.05,
  },
  "4222": {
    iscoCode: "4222",
    title: "Contact-centre information clerks",
    nonRoutineAnalytic: 0.08,
    nonRoutineInteractive: 0.30,
    routineCognitive: 0.52,
    routineManual: 0.04,
    nonRoutineManual: 0.06,
  },
  "5230": {
    iscoCode: "5230",
    title: "Cashiers and ticket clerks",
    nonRoutineAnalytic: 0.06,
    nonRoutineInteractive: 0.22,
    routineCognitive: 0.55,
    routineManual: 0.10,
    nonRoutineManual: 0.07,
  },

  // --- Service / retail (mixed) ---
  "5223": {
    iscoCode: "5223",
    title: "Shop sales assistants",
    nonRoutineAnalytic: 0.08,
    nonRoutineInteractive: 0.32,
    routineCognitive: 0.30,
    routineManual: 0.18,
    nonRoutineManual: 0.12,
  },

  // --- Trade / repair (low RC, high NRM) ---
  "7421": {
    iscoCode: "7421",
    title: "Electronics mechanics and servicers",
    nonRoutineAnalytic: 0.18,
    nonRoutineInteractive: 0.14,
    routineCognitive: 0.16,
    routineManual: 0.16,
    nonRoutineManual: 0.36,
  },
  "7411": {
    iscoCode: "7411",
    title: "Building and related electricians",
    nonRoutineAnalytic: 0.16,
    nonRoutineInteractive: 0.12,
    routineCognitive: 0.10,
    routineManual: 0.18,
    nonRoutineManual: 0.44,
  },
  "7126": {
    iscoCode: "7126",
    title: "Plumbers and pipe fitters",
    nonRoutineAnalytic: 0.14,
    nonRoutineInteractive: 0.10,
    routineCognitive: 0.08,
    routineManual: 0.20,
    nonRoutineManual: 0.48,
  },
  "7115": {
    iscoCode: "7115",
    title: "Carpenters and joiners",
    nonRoutineAnalytic: 0.10,
    nonRoutineInteractive: 0.08,
    routineCognitive: 0.08,
    routineManual: 0.30,
    nonRoutineManual: 0.44,
  },
  "7231": {
    iscoCode: "7231",
    title: "Motor-vehicle mechanics and repairers",
    nonRoutineAnalytic: 0.16,
    nonRoutineInteractive: 0.12,
    routineCognitive: 0.14,
    routineManual: 0.18,
    nonRoutineManual: 0.40,
  },

  // --- Agriculture (LMIC-resilient profile) ---
  "6111": {
    iscoCode: "6111",
    title: "Field crop and vegetable growers",
    nonRoutineAnalytic: 0.10,
    nonRoutineInteractive: 0.06,
    routineCognitive: 0.08,
    routineManual: 0.32,
    nonRoutineManual: 0.44,
  },
  "9211": {
    iscoCode: "9211",
    title: "Crop farm labourers",
    nonRoutineAnalytic: 0.04,
    nonRoutineInteractive: 0.04,
    routineCognitive: 0.06,
    routineManual: 0.46,
    nonRoutineManual: 0.40,
  },

  // --- Education / health (high NRI / NRA, very durable) ---
  "2330": {
    iscoCode: "2330",
    title: "Secondary education teachers",
    nonRoutineAnalytic: 0.36,
    nonRoutineInteractive: 0.42,
    routineCognitive: 0.13,
    routineManual: 0.03,
    nonRoutineManual: 0.06,
  },
  "2221": {
    iscoCode: "2221",
    title: "Nursing professionals",
    nonRoutineAnalytic: 0.28,
    nonRoutineInteractive: 0.34,
    routineCognitive: 0.16,
    routineManual: 0.06,
    nonRoutineManual: 0.16,
  },

  // --- Management / sales (durable interactive) ---
  "1221": {
    iscoCode: "1221",
    title: "Sales and marketing managers",
    nonRoutineAnalytic: 0.34,
    nonRoutineInteractive: 0.42,
    routineCognitive: 0.16,
    routineManual: 0.03,
    nonRoutineManual: 0.05,
  },

  // --- Tailoring / textile (high routine manual) ---
  "7531": {
    iscoCode: "7531",
    title: "Tailors, dressmakers, furriers and hatters",
    nonRoutineAnalytic: 0.06,
    nonRoutineInteractive: 0.06,
    routineCognitive: 0.10,
    routineManual: 0.46,
    nonRoutineManual: 0.32,
  },

  // --- Translation (rapidly automating) ---
  "2643": {
    iscoCode: "2643",
    title: "Translators, interpreters and other linguists",
    nonRoutineAnalytic: 0.34,
    nonRoutineInteractive: 0.20,
    routineCognitive: 0.36,
    routineManual: 0.04,
    nonRoutineManual: 0.06,
  },
};

export function getIloTaskShares(iscoCode?: string): IloTaskShares | null {
  if (!iscoCode) return null;
  // Tolerate codes with leading zeros stripped or prefix letters.
  const normalized = iscoCode.replace(/[^0-9]/g, "").padStart(4, "0").slice(0, 4);
  return ILO_TASK_INDEX[normalized] ?? ILO_TASK_INDEX[iscoCode] ?? null;
}

/**
 * Total routine task share (RC + RM) for an ISCO-08 occupation, 0–1.
 * Higher = more automatable; lower = more durable.
 */
export function getRoutineShare(iscoCode?: string): number | null {
  const shares = getIloTaskShares(iscoCode);
  if (!shares) return null;
  return shares.routineCognitive + shares.routineManual;
}

export const ILO_TASK_INDEX_CITATION =
  "ILO 2021 Task Content Index (ISCO-08), Autor–Levy–Murnane framework calibrated with PIAAC + World Bank STEP";
