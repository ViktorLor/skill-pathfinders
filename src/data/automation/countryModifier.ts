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
 * Country modifiers live with the rest of each country's config in
 * `src/data/countries.config.ts`. This module is a thin lookup wrapper
 * that returns sensible defaults when a profile carries a country code
 * we haven't featured (e.g. extracted from a CV).
 */

import {
  FEATURED_COUNTRIES,
  LMIC_DEFAULT_COUNTRY,
  US_BASELINE_COUNTRY,
} from "@/data/countries.config";

export interface CountryAutomationContext {
  countryCode: string;
  countryName: string;
  modifier: number;
  rationale: string;
  source: string;
}

export const COUNTRY_MODIFIERS: Record<string, CountryAutomationContext> = (() => {
  const map: Record<string, CountryAutomationContext> = {};
  for (const c of FEATURED_COUNTRIES) {
    map[c.code] = {
      countryCode: c.code,
      countryName: c.name,
      modifier: c.automationModifier,
      rationale: c.automationRationale,
      source: c.automationSource,
    };
  }
  map.LMIC_DEFAULT = {
    countryCode: LMIC_DEFAULT_COUNTRY.code,
    countryName: LMIC_DEFAULT_COUNTRY.name,
    modifier: LMIC_DEFAULT_COUNTRY.automationModifier,
    rationale: LMIC_DEFAULT_COUNTRY.automationRationale,
    source: LMIC_DEFAULT_COUNTRY.automationSource,
  };
  map.US_BASELINE = {
    countryCode: US_BASELINE_COUNTRY.code,
    countryName: US_BASELINE_COUNTRY.name,
    modifier: US_BASELINE_COUNTRY.automationModifier,
    rationale: US_BASELINE_COUNTRY.automationRationale,
    source: US_BASELINE_COUNTRY.automationSource,
  };
  return map;
})();

export function getCountryModifier(countryCode?: string): CountryAutomationContext {
  if (!countryCode) return COUNTRY_MODIFIERS.LMIC_DEFAULT;
  return COUNTRY_MODIFIERS[countryCode] ?? COUNTRY_MODIFIERS.LMIC_DEFAULT;
}
