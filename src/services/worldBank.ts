const YOUTH_UNEMPLOYMENT_INDICATOR = "SL.UEM.1524.ZS";
const WORLD_BANK_API_BASE = "https://api.worldbank.org/v2";

const WORLD_BANK_COUNTRY_ALIASES: Record<string, string> = {
  GHA: "GH",
  BGD: "BD",
  NGA: "NG",
};

interface WorldBankIndicator {
  id: string;
  value: string;
}

interface WorldBankCountry {
  id: string;
  value: string;
}

interface WorldBankObservation {
  indicator: WorldBankIndicator;
  country: WorldBankCountry;
  countryiso3code: string;
  date: string;
  value: number | null;
}

export interface YouthUnemploymentData {
  countryCode: string;
  countryName: string;
  year: number;
  value: number;
  indicatorId: string;
  indicatorName: string;
  sourceUrl: string;
}

function normalizeCountryCode(countryCode: string) {
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

export function getYouthUnemploymentSourceUrl(countryCode: string) {
  const worldBankCode = normalizeCountryCode(countryCode);
  const params = new URLSearchParams({
    format: "json",
    per_page: "80",
  });

  return `${WORLD_BANK_API_BASE}/country/${worldBankCode}/indicator/${YOUTH_UNEMPLOYMENT_INDICATOR}?${params.toString()}`;
}

export async function getYouthUnemploymentData(
  countryCode: string,
): Promise<YouthUnemploymentData> {
  const sourceUrl = getYouthUnemploymentSourceUrl(countryCode);
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `World Bank request failed with ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as unknown;
  console.log("World Bank youth unemployment response", payload);

  if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
    throw new Error("World Bank response did not include observations");
  }

  const latestObservation = payload[1]
    .filter(isObservation)
    .find((row) => typeof row.value === "number");

  if (!latestObservation || latestObservation.value === null) {
    throw new Error("No youth unemployment value found for this country");
  }

  return {
    countryCode: latestObservation.countryiso3code,
    countryName: latestObservation.country.value,
    year: Number(latestObservation.date),
    value: latestObservation.value,
    indicatorId: latestObservation.indicator.id,
    indicatorName: latestObservation.indicator.value,
    sourceUrl,
  };
}

export async function getYouthUnemployment(
  countryCode: string,
): Promise<string> {
  const data = await getYouthUnemploymentData(countryCode);
  return `Youth unemployment (${data.countryName}, ${data.year}): ${data.value.toFixed(1)}%`;
}
