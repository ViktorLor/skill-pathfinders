/**
 * World Bank Open Data API client.
 * Public, key-less, CORS-enabled. Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 *
 * Two responsibilities:
 *  1. Income-group classification (used by the AI risk engine to calibrate
 *     automation exposure for the candidate's country).
 *  2. Indicator fetches (youth unemployment, wages, etc. — used by the
 *     dashboard's econometric signals).
 *
 * In-memory caching keeps repeat lookups within a session free.
 */

const WORLD_BANK_API_BASE = "https://api.worldbank.org/v2";
const YOUTH_UNEMPLOYMENT_INDICATOR = "SL.UEM.1524.ZS";

const WORLD_BANK_COUNTRY_ALIASES: Record<string, string> = {
  GHA: "GH",
  BGD: "BD",
  NGA: "NG",
};

function normalizeCountryCode(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  return WORLD_BANK_COUNTRY_ALIASES[normalized] ?? normalized;
}

// ── Income group ────────────────────────────────────────────────────────────

export type IncomeGroup = "LIC" | "LMC" | "UMC" | "HIC";

const INCOME_GROUP_CODES = new Set<IncomeGroup>(["LIC", "LMC", "UMC", "HIC"]);
const incomeGroupCache = new Map<string, IncomeGroup | null>();

interface WBCountryResponse {
  incomeLevel?: { id?: string };
}

export async function fetchIncomeGroup(countryCode: string): Promise<IncomeGroup | null> {
  const code = countryCode.trim().toUpperCase();
  if (incomeGroupCache.has(code)) return incomeGroupCache.get(code)!;

  try {
    const res = await fetch(
      `${WORLD_BANK_API_BASE}/country/${encodeURIComponent(code)}?format=json`,
    );
    if (!res.ok) {
      incomeGroupCache.set(code, null);
      return null;
    }
    const body = (await res.json()) as [unknown, WBCountryResponse[]];
    const id = body?.[1]?.[0]?.incomeLevel?.id?.toUpperCase();
    const group = id && INCOME_GROUP_CODES.has(id as IncomeGroup) ? (id as IncomeGroup) : null;
    incomeGroupCache.set(code, group);
    return group;
  } catch {
    incomeGroupCache.set(code, null);
    return null;
  }
}

// ── Generic indicator fetch ─────────────────────────────────────────────────

export interface WBIndicatorPoint {
  year: number;
  value: number | null;
}

export async function fetchIndicator(
  countryCode: string,
  indicator: string,
  yearsBack = 5,
): Promise<WBIndicatorPoint[]> {
  const url = `${WORLD_BANK_API_BASE}/country/${encodeURIComponent(
    normalizeCountryCode(countryCode),
  )}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=${yearsBack}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as [
    unknown,
    Array<{ date: string; value: number | null }> | null,
  ];
  const rows = body?.[1] ?? [];
  return rows.map((r) => ({ year: Number(r.date), value: r.value }));
}

// ── Youth unemployment (typed convenience) ──────────────────────────────────

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
    throw new Error(`World Bank request failed with ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as unknown;

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

export async function getYouthUnemployment(countryCode: string): Promise<string> {
  const data = await getYouthUnemploymentData(countryCode);
  return `Youth unemployment (${data.countryName}, ${data.year}): ${data.value.toFixed(1)}%`;
}

export const WORLD_BANK_META = {
  source: "World Bank Open Data API · Country & Lending Groups (FY classification)",
  url: "https://api.worldbank.org/v2/",
};
