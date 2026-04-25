/**
 * LMIC calibration of US-derived Frey-Osborne automation probabilities.
 *
 * Frey & Osborne 2017 estimated automation probabilities using US wage,
 * task and skill data. Direct application to LMIC labor markets overstates
 * near-term displacement risk because:
 *  - capital intensity is lower (less ROI on automation hardware)
 *  - average wages are lower (less incentive to substitute capital for labor)
 *  - the informal sector is larger and harder to automate
 *  - technology adoption is slower
 *
 * The modifier scales the FO probability by a country-specific factor.
 * A modifier of 0.55 means "this country sees roughly 55% of the headline
 * US automation pressure on a typical task in the medium term".
 *
 * Sources used to set the modifiers:
 *  - Carbonero, Ernst & Weber (2018), "Robots Worldwide" ILO Working Paper
 *  - Hallward-Driemeier & Nayyar (2017), "Trouble in the Making?" World Bank
 *  - World Bank STEP Skills Measurement Programme country reports
 *  - ILO 2024, "Generative AI and Jobs: A global analysis" (LMIC adjustment)
 */

export interface CountryAutomationContext {
  countryCode: string;
  countryName: string;
  modifier: number;
  rationale: string;
  source: string;
}

export const COUNTRY_MODIFIERS: Record<string, CountryAutomationContext> = {
  GHA: {
    countryCode: "GHA",
    countryName: "Ghana",
    modifier: 0.55,
    rationale:
      "Ghana's labor market combines a large informal sector with low capital intensity. Carbonero, Ernst & Weber (ILO 2018) and World Bank STEP Ghana 2014 both place near-term automation pressure at roughly 50–60% of US-equivalent levels.",
    source: "Carbonero–Ernst–Weber (ILO 2018) · World Bank STEP Ghana 2014",
  },
  NGA: {
    countryCode: "NGA",
    countryName: "Nigeria",
    modifier: 0.50,
    rationale:
      "Nigeria's automation pressure is dampened by high informal employment (~80% per ILO) and limited capital deepening. World Bank \"Trouble in the Making?\" 2017 places sub-Saharan Africa at 0.45–0.55 of US-equivalent risk on routine tasks.",
    source: "Hallward-Driemeier & Nayyar (World Bank 2017) · ILO informal economy stats",
  },
  BGD: {
    countryCode: "BGD",
    countryName: "Bangladesh",
    modifier: 0.62,
    rationale:
      "Bangladesh's RMG-led economy and rising digital adoption put it slightly above other LMICs in automation pressure on routine manufacturing and clerical work, but still well below US baselines (World Bank STEP Bangladesh).",
    source: "World Bank STEP Bangladesh 2013 · ILO ROAP 2024 brief",
  },
  // Generic LMIC default: used when no country is selected.
  LMIC_DEFAULT: {
    countryCode: "LMIC_DEFAULT",
    countryName: "LMIC average",
    modifier: 0.55,
    rationale:
      "Default LMIC calibration. Average of Carbonero–Ernst–Weber (ILO 2018) sub-Saharan and South Asian estimates: roughly 55% of US-equivalent automation pressure in the medium term.",
    source: "Carbonero–Ernst–Weber (ILO 2018, average)",
  },
  // Reference baseline (no calibration); included so the modifier can be
  // disabled explicitly rather than via a magic constant.
  US_BASELINE: {
    countryCode: "US_BASELINE",
    countryName: "United States (FO baseline)",
    modifier: 1.0,
    rationale: "Frey & Osborne 2017 estimates without LMIC adjustment.",
    source: "Frey & Osborne 2017",
  },
};

export function getCountryModifier(countryCode?: string): CountryAutomationContext {
  if (!countryCode) return COUNTRY_MODIFIERS.LMIC_DEFAULT;
  return COUNTRY_MODIFIERS[countryCode] ?? COUNTRY_MODIFIERS.LMIC_DEFAULT;
}
