/**
 * World Bank Open Data API client.
 *
 * Endpoint pattern:
 *   https://api.worldbank.org/v2/country/{ISO}/indicator/{INDICATOR}?format=json
 *
 * The API is public, no auth required. Each indicator returns a series of
 * observations sorted newest-first; we pick the most recent non-null value.
 *
 * All functions throw on network or shape errors — callers should surface
 * the failure rather than silently substituting cached data, in line with
 * the project's "ensure the API works, no fallback" stance.
 */

const WORLD_BANK_API_BASE = "https://api.worldbank.org/v2";

const WORLD_BANK_COUNTRY_ALIASES: Record<string, string> = {
  GHA: "GH",
  BGD: "BD",
  NGA: "NG",
  KEN: "KE",
};

interface WorldBankIndicatorMeta {
  id: string;
  value: string;
}

interface WorldBankCountryMeta {
  id: string;
  value: string;
}

interface WorldBankObservation {
  indicator: WorldBankIndicatorMeta;
  country: WorldBankCountryMeta;
  countryiso3code: string;
  date: string;
  value: number | null;
}

export interface IndicatorObservation {
  countryCode: string;
  countryName: string;
  indicatorId: string;
  indicatorName: string;
  year: number;
  value: number;
  sourceUrl: string;
}

function normalizeCountryCode(countryCode: string): string {
  const normalized = countryCode.trim().toUpperCase();
  return WORLD_BANK_COUNTRY_ALIASES[normalized] ?? normalized;
}

function isObservation(value: unknown): value is WorldBankObservation {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<WorldBankObservation>;
  return (
    typeof row.date === "string" &&
    (typeof row.value === "number" || row.value === null) &&
    !!row.country &&
    !!row.indicator
  );
}

function buildIndicatorUrl(countryCode: string, indicatorId: string): string {
  const wbCode = normalizeCountryCode(countryCode);
  const params = new URLSearchParams({ format: "json", per_page: "80" });
  return `${WORLD_BANK_API_BASE}/country/${wbCode}/indicator/${indicatorId}?${params.toString()}`;
}

/**
 * Fetch the most recent non-null observation for an indicator + country.
 */
export async function fetchIndicator(
  countryCode: string,
  indicatorId: string,
): Promise<IndicatorObservation> {
  const sourceUrl = buildIndicatorUrl(countryCode, indicatorId);
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `World Bank request failed (${indicatorId}): ${response.status} ${response.statusText}`,
    );
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
    throw new Error(`World Bank response missing observations for ${indicatorId}`);
  }
  const latest = payload[1].filter(isObservation).find((row) => typeof row.value === "number");
  if (!latest || latest.value === null) {
    throw new Error(`No value found for ${indicatorId} in ${countryCode}`);
  }
  return {
    countryCode: latest.countryiso3code,
    countryName: latest.country.value,
    indicatorId: latest.indicator.id,
    indicatorName: latest.indicator.value,
    year: Number(latest.date),
    value: latest.value,
    sourceUrl,
  };
}

// --- Indicator constants -----------------------------------------------------

export const INDICATORS = {
  YOUTH_UNEMPLOYMENT: "SL.UEM.1524.ZS",
  LABOR_FORCE_PARTICIPATION: "SL.TLF.CACT.ZS",
  WAGE_AND_SALARIED_SHARE: "SL.EMP.MPYR.ZS",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",
  EMPLOY_AGRI: "SL.AGR.EMPL.ZS",
  EMPLOY_IND: "SL.IND.EMPL.ZS",
  EMPLOY_SRV: "SL.SRV.EMPL.ZS",
} as const;

// --- Backwards-compatible legacy exports -------------------------------------

export type YouthUnemploymentData = IndicatorObservation;

export function getYouthUnemploymentSourceUrl(countryCode: string): string {
  return buildIndicatorUrl(countryCode, INDICATORS.YOUTH_UNEMPLOYMENT);
}

export function getYouthUnemploymentData(countryCode: string): Promise<YouthUnemploymentData> {
  return fetchIndicator(countryCode, INDICATORS.YOUTH_UNEMPLOYMENT);
}

export async function getYouthUnemployment(countryCode: string): Promise<string> {
  const data = await getYouthUnemploymentData(countryCode);
  return `Youth unemployment (${data.countryName}, ${data.year}): ${data.value.toFixed(1)}%`;
}

// --- New live signals --------------------------------------------------------

export function getLaborForceParticipation(countryCode: string): Promise<IndicatorObservation> {
  return fetchIndicator(countryCode, INDICATORS.LABOR_FORCE_PARTICIPATION);
}

export function getWageAndSalariedShare(countryCode: string): Promise<IndicatorObservation> {
  return fetchIndicator(countryCode, INDICATORS.WAGE_AND_SALARIED_SHARE);
}

export function getGdpPerCapita(countryCode: string): Promise<IndicatorObservation> {
  return fetchIndicator(countryCode, INDICATORS.GDP_PER_CAPITA);
}

export interface EmploymentBySector {
  countryCode: string;
  countryName: string;
  year: number;
  agriculture: number;
  industry: number;
  services: number;
  sourceUrl: string;
}

export async function getEmploymentBySector(countryCode: string): Promise<EmploymentBySector> {
  const [agri, ind, srv] = await Promise.all([
    fetchIndicator(countryCode, INDICATORS.EMPLOY_AGRI),
    fetchIndicator(countryCode, INDICATORS.EMPLOY_IND),
    fetchIndicator(countryCode, INDICATORS.EMPLOY_SRV),
  ]);
  return {
    countryCode: agri.countryCode,
    countryName: agri.countryName,
    // Use the oldest of the three years so the trio is internally consistent.
    year: Math.min(agri.year, ind.year, srv.year),
    agriculture: agri.value,
    industry: ind.value,
    services: srv.value,
    sourceUrl: agri.sourceUrl,
  };
}
