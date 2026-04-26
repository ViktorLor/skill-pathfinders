/**
 * Country configuration registry.
 *
 * This file is the single source of truth for every country the platform
 * recognises. Adding a new country to the demo selector / dashboard data
 * requires only an entry here — no other code changes.
 *
 * Profiles are NOT restricted to this list: any ISO-3166-1 alpha-3 country
 * code can appear on a `CandidateSkillProfile` (e.g. extracted from a CV).
 * Codes that aren't in this registry fall back to `LMIC_DEFAULT_COUNTRY`
 * for automation calibration.
 */

import type { CountryConfig } from "@/types/unmapped";

export interface FeaturedCountry extends CountryConfig {
  /**
   * Frey-Osborne automation probability multiplier for this labor market.
   * 1.0 = no LMIC adjustment; values <1 dampen US-derived FO probabilities
   * to reflect lower capital intensity, larger informal sectors and slower
   * tech adoption in LMICs.
   */
  automationModifier: number;
  automationRationale: string;
  automationSource: string;
}

export const FEATURED_COUNTRIES: FeaturedCountry[] = [
  {
    code: "GHA",
    name: "Ghana",
    flag: "🇬🇭",
    language: "en",
    currency: "GHS",
    currencySymbol: "₵",
    iloCountryCode: "GHA",
    wbCountryCode: "GH",
    sectors: ["ICT", "Trade & Retail", "Agriculture", "Construction", "Textiles"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (ICT): GHS 2,400/mo",
    youthUnemployment: "Youth unemployment: 12.4%",
    automationModifier: 0.55,
    automationRationale:
      "Ghana's labor market combines a large informal sector with low capital intensity. Carbonero, Ernst & Weber (ILO 2018) and World Bank STEP Ghana 2014 both place near-term automation pressure at roughly 50–60% of US-equivalent levels.",
    automationSource: "Carbonero–Ernst–Weber (ILO 2018) · World Bank STEP Ghana 2014",
  },
  {
    code: "BGD",
    name: "Bangladesh",
    flag: "🇧🇩",
    language: "en",
    currency: "BDT",
    currencySymbol: "৳",
    iloCountryCode: "BGD",
    wbCountryCode: "BD",
    sectors: ["Garment & Textiles", "Agriculture", "ICT", "Construction", "Fishing"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (Textiles): BDT 8,200/mo",
    youthUnemployment: "Youth unemployment: 10.6%",
    automationModifier: 0.62,
    automationRationale:
      "Bangladesh's RMG-led economy and rising digital adoption put it slightly above other LMICs in automation pressure on routine manufacturing and clerical work, but still well below US baselines (World Bank STEP Bangladesh).",
    automationSource: "World Bank STEP Bangladesh 2013 · ILO ROAP 2024 brief",
  },
  {
    code: "NGA",
    name: "Nigeria",
    flag: "🇳🇬",
    language: "en",
    currency: "NGN",
    currencySymbol: "₦",
    iloCountryCode: "NGA",
    wbCountryCode: "NG",
    sectors: ["ICT", "Trade & Retail", "Agriculture", "Finance", "Construction"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (ICT): NGN 180,000/mo",
    youthUnemployment: "Youth unemployment: 19.2%",
    automationModifier: 0.50,
    automationRationale:
      "Nigeria's automation pressure is dampened by high informal employment (~80% per ILO) and limited capital deepening. World Bank \"Trouble in the Making?\" 2017 places sub-Saharan Africa at 0.45–0.55 of US-equivalent risk on routine tasks.",
    automationSource: "Hallward-Driemeier & Nayyar (World Bank 2017) · ILO informal economy stats",
  },
  {
    code: "KEN",
    name: "Kenya",
    flag: "🇰🇪",
    language: "en",
    currency: "KES",
    currencySymbol: "KSh",
    iloCountryCode: "KEN",
    wbCountryCode: "KE",
    sectors: ["ICT", "Agriculture", "Tourism", "Finance", "Trade & Retail"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (ICT): KES 65,000/mo",
    youthUnemployment: "Youth unemployment: 13.9%",
    automationModifier: 0.55,
    automationRationale:
      "Kenya's mobile-money-led service economy is more digitally adopted than many SSA peers, but a large informal sector and lower capital intensity keep automation pressure well below US baselines (Carbonero–Ernst–Weber ILO 2018).",
    automationSource: "Carbonero–Ernst–Weber (ILO 2018) · World Bank STEP Kenya pilot",
  },
];

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = Object.fromEntries(
  FEATURED_COUNTRIES.map((c) => [c.code, c]),
);

/**
 * Default LMIC calibration applied to any country code not in the registry
 * (e.g. when a CV mentions a country we haven't featured yet).
 */
export const LMIC_DEFAULT_COUNTRY = {
  code: "LMIC_DEFAULT",
  name: "LMIC average",
  automationModifier: 0.55,
  automationRationale:
    "Default LMIC calibration. Average of Carbonero–Ernst–Weber (ILO 2018) sub-Saharan and South Asian estimates: roughly 55% of US-equivalent automation pressure in the medium term.",
  automationSource: "Carbonero–Ernst–Weber (ILO 2018, average)",
} as const;

export const US_BASELINE_COUNTRY = {
  code: "US_BASELINE",
  name: "United States (FO baseline)",
  automationModifier: 1.0,
  automationRationale: "Frey & Osborne 2017 estimates without LMIC adjustment.",
  automationSource: "Frey & Osborne 2017",
} as const;

export function getFeaturedCountry(code: string): FeaturedCountry | null {
  return FEATURED_COUNTRIES.find((c) => c.code === code) ?? null;
}

export function isFeaturedCountry(code: string): boolean {
  return FEATURED_COUNTRIES.some((c) => c.code === code);
}
