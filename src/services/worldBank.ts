/**
 * World Bank Open Data API client.
 *
 * Endpoint pattern:
 *   https://api.worldbank.org/v2/country/{ISO}/indicator/{INDICATOR}?format=json
 *
 * The API is public, no auth required. Callers should surface failures rather
 * than substituting static or cached data.
 */

const WORLD_BANK_API_BASE = "https://api.worldbank.org/v2";

export const WORLD_BANK_INDICATORS = {
  youthUnemployment: {
    id: "SL.UEM.1524.ZS",
    label: "Youth unemployment",
    unit: "%",
  },
  laborForceParticipation: {
    id: "SL.TLF.CACT.ZS",
    label: "Labor force participation",
    unit: "%",
  },
  wageAndSalariedShare: {
    id: "SL.EMP.MPYR.ZS",
    label: "Wage and salaried workers",
    unit: "%",
  },
  gdpPerCapita: {
    id: "NY.GDP.PCAP.CD",
    label: "GDP per capita",
    unit: "US$",
  },
  employmentAgriculture: {
    id: "SL.AGR.EMPL.ZS",
    label: "Employment in agriculture",
    unit: "%",
  },
  employmentIndustry: {
    id: "SL.IND.EMPL.ZS",
    label: "Employment in industry",
    unit: "%",
  },
  employmentServices: {
    id: "SL.SRV.EMPL.ZS",
    label: "Employment in services",
    unit: "%",
  },
  secondaryEnrollment: {
    id: "SE.SEC.ENRR",
    label: "Secondary school enrollment",
    unit: "%",
  },
  povertyLowerMiddleIncome: {
    id: "SI.POV.LMIC",
    label: "Poverty headcount at lower-middle-income line",
    unit: "%",
  },
} as const;

export const INDICATORS = {
  YOUTH_UNEMPLOYMENT: WORLD_BANK_INDICATORS.youthUnemployment.id,
  LABOR_FORCE_PARTICIPATION: WORLD_BANK_INDICATORS.laborForceParticipation.id,
  WAGE_AND_SALARIED_SHARE: WORLD_BANK_INDICATORS.wageAndSalariedShare.id,
  GDP_PER_CAPITA: WORLD_BANK_INDICATORS.gdpPerCapita.id,
  EMPLOY_AGRI: WORLD_BANK_INDICATORS.employmentAgriculture.id,
  EMPLOY_IND: WORLD_BANK_INDICATORS.employmentIndustry.id,
  EMPLOY_SRV: WORLD_BANK_INDICATORS.employmentServices.id,
} as const;

type WorldBankIndicatorKey = keyof typeof WORLD_BANK_INDICATORS;

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

export interface WorldBankIndicatorData extends IndicatorObservation {
  key: WorldBankIndicatorKey;
  unit: string;
}

export type YouthUnemploymentData = IndicatorObservation;

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

export function getWorldBankIndicatorSourceUrl(countryCode: string, indicatorId: string): string {
  const worldBankCode = normalizeCountryCode(countryCode);
  const params = new URLSearchParams({ format: "json", per_page: "80" });
  return `${WORLD_BANK_API_BASE}/country/${worldBankCode}/indicator/${indicatorId}?${params.toString()}`;
}

function buildIndicatorUrl(countryCode: string, indicatorId: string): string {
  return getWorldBankIndicatorSourceUrl(countryCode, indicatorId);
}

export function getYouthUnemploymentSourceUrl(countryCode: string): string {
  return getWorldBankIndicatorSourceUrl(countryCode, INDICATORS.YOUTH_UNEMPLOYMENT);
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

export async function getWorldBankIndicatorData(
  countryCode: string,
  indicatorKey: WorldBankIndicatorKey,
): Promise<WorldBankIndicatorData> {
  const indicator = WORLD_BANK_INDICATORS[indicatorKey];
  const observation = await fetchIndicator(countryCode, indicator.id);

  return {
    ...observation,
    key: indicatorKey,
    unit: indicator.unit,
  };
}

export function getYouthUnemploymentData(countryCode: string): Promise<YouthUnemploymentData> {
  return fetchIndicator(countryCode, INDICATORS.YOUTH_UNEMPLOYMENT);
}

export async function getYouthUnemployment(countryCode: string): Promise<string> {
  const data = await getYouthUnemploymentData(countryCode);
  return `Youth unemployment (${data.countryName}, ${data.year}): ${data.value.toFixed(1)}%`;
}

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
    year: Math.min(agri.year, ind.year, srv.year),
    agriculture: agri.value,
    industry: ind.value,
    services: srv.value,
    sourceUrl: agri.sourceUrl,
  };
}

export async function getCountryWdiSnapshot(countryCode: string) {
  const indicatorKeys = [
    "youthUnemployment",
    "laborForceParticipation",
    "wageAndSalariedShare",
    "gdpPerCapita",
    "employmentAgriculture",
    "employmentIndustry",
    "employmentServices",
    "secondaryEnrollment",
    "povertyLowerMiddleIncome",
  ] as const;

  const observations = await Promise.all(
    indicatorKeys.map((key) => getWorldBankIndicatorData(countryCode, key)),
  );

  return observations.reduce<
    Partial<Record<(typeof indicatorKeys)[number], WorldBankIndicatorData>>
  >((snapshot, observation) => {
    snapshot[observation.key] = observation;
    return snapshot;
  }, {});
}
