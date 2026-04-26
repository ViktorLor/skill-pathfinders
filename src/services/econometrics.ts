import {
  getGdpPerCapita,
  getLaborForceParticipation,
  getWageAndSalariedShare,
  getYouthUnemployment as getWorldBankYouthUnemployment,
  type IndicatorObservation,
} from "@/services/worldBank";

/**
 * Wage signal for a country.
 *
 * No direct wage-by-occupation series exists in the World Bank API. We use
 * a two-part live composite that the user can read off the screen:
 *  - "Wage & salaried workers, % of employment" (SL.EMP.MPYR.ZS): a higher
 *    share means more formal-sector wage opportunities (vs. own-account /
 *    contributing family workers).
 *  - "GDP per capita, current US$" (NY.GDP.PCAP.CD): a coarse proxy for
 *    overall wage levels in the economy.
 *
 * The optional `iscoCode` is accepted for API compatibility with future
 * occupation-resolved wage series (ILOSTAT EAR_4MTH_SEX_OCU_CUR_NB_A) but
 * is ignored by the current World Bank-backed implementation.
 */
export async function getWageSignal(
  _iscoCode: string,
  countryCode: string,
): Promise<string> {
  const [share, gdp] = await Promise.all([
    getWageAndSalariedShare(countryCode),
    getGdpPerCapita(countryCode),
  ]);
  return `Formal wage share ${share.value.toFixed(1)}% · GDP/capita US$${Math.round(gdp.value).toLocaleString()} (${share.countryName}, ${Math.min(share.year, gdp.year)})`;
}

export async function getYouthUnemployment(countryCode: string): Promise<string> {
  return getWorldBankYouthUnemployment(countryCode);
}

/**
 * Two live econometric signals for the candidate's country, structured for
 * rendering on the profile page.
 */
export interface ProfileEconometricSignals {
  wageShare: IndicatorObservation;
  laborForceParticipation: IndicatorObservation;
}

export async function getProfileEconometricSignals(
  countryCode: string,
): Promise<ProfileEconometricSignals> {
  const [wageShare, laborForceParticipation] = await Promise.all([
    getWageAndSalariedShare(countryCode),
    getLaborForceParticipation(countryCode),
  ]);
  return { wageShare, laborForceParticipation };
}
