/**
 * Live ESCO API resolver.
 *
 * Used to fill in `escoOccupationCode`, `escoOccupationUri`,
 * `escoOccupationTitle`, `iscoCode` and `iscoTitle` for profiles where
 * the LLM didn't return them (the non-CV / interview-only path).
 *
 * API docs: https://esco.ec.europa.eu/en/use-esco/esco-rest-api
 *
 * The API is public, no auth required.
 */

const ESCO_API_BASE = "https://ec.europa.eu/esco/api";
const ESCO_LANGUAGE = "en";

export interface EscoOccupationResolution {
  escoOccupationTitle: string;
  escoOccupationUri: string;
  escoOccupationCode: string;
  iscoCode?: string;
  iscoTitle?: string;
  alternativeOccupationMatches: Array<{
    title: string;
    iscoCode?: string;
    escoUri?: string;
    confidence: number;
    reason: string;
  }>;
}

interface EscoSearchResult {
  title?: string;
  preferredLabel?: { [lang: string]: string } | string;
  uri?: string;
  className?: string;
  code?: string;
  _links?: {
    self?: { uri?: string; title?: string };
    broaderIscoGroup?: Array<{ uri?: string; title?: string; code?: string }>;
  };
}

interface EscoSearchResponse {
  total?: number;
  _embedded?: {
    results?: EscoSearchResult[];
  };
}

interface EscoResourceResponse {
  title?: string;
  preferredLabel?: { [lang: string]: string };
  code?: string;
  uri?: string;
  _links?: {
    broaderIscoGroup?: Array<{ uri?: string; title?: string; code?: string }>;
  };
}

function pickPreferredLabel(label: EscoSearchResult["preferredLabel"]): string | undefined {
  if (!label) return undefined;
  if (typeof label === "string") return label;
  return label[ESCO_LANGUAGE] ?? Object.values(label)[0];
}

/**
 * Extract the ISCO 4-digit code from an ESCO ISCO group URI.
 * Example: "http://data.europa.eu/esco/isco/C2512" → "2512".
 */
function extractIscoCodeFromUri(uri?: string): string | undefined {
  if (!uri) return undefined;
  const match = uri.match(/isco\/C?(\d{1,4})/i);
  return match?.[1];
}

/**
 * Extract the ESCO concept identifier from a full ESCO URI.
 * Example: "http://data.europa.eu/esco/occupation/abc123" → "abc123".
 */
function extractEscoCodeFromUri(uri?: string): string {
  if (!uri) return "";
  const tail = uri.split("/").filter(Boolean).at(-1);
  return tail ?? "";
}

async function escoSearch(query: string, limit = 5): Promise<EscoSearchResult[]> {
  const url = new URL(`${ESCO_API_BASE}/search`);
  url.searchParams.set("language", ESCO_LANGUAGE);
  url.searchParams.set("type", "occupation");
  url.searchParams.set("text", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`ESCO search failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as EscoSearchResponse;
  return json._embedded?.results ?? [];
}

async function escoFetchOccupation(uri: string): Promise<EscoResourceResponse | null> {
  const url = new URL(`${ESCO_API_BASE}/resource/occupation`);
  url.searchParams.set("uri", uri);
  url.searchParams.set("language", ESCO_LANGUAGE);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as EscoResourceResponse;
}

/**
 * Resolve a free-text role name to an ESCO occupation entry, including the
 * ISCO-08 group it belongs to. Returns null if no usable match was found.
 */
export async function resolveEscoOccupation(
  query: string,
): Promise<EscoOccupationResolution | null> {
  const cleaned = query.trim();
  if (!cleaned) return null;

  const results = await escoSearch(cleaned, 5);
  const top = results[0];
  if (!top?.uri) return null;

  const topTitle = pickPreferredLabel(top.preferredLabel) ?? top.title ?? cleaned;
  const topEscoCode = top.code ?? extractEscoCodeFromUri(top.uri);

  let iscoCode: string | undefined;
  let iscoTitle: string | undefined;

  // The search endpoint doesn't always include broaderIscoGroup, so resolve
  // the full occupation resource for the top hit when needed.
  let detail: EscoResourceResponse | null = null;
  if (!top._links?.broaderIscoGroup?.length) {
    detail = await escoFetchOccupation(top.uri);
  }
  const broader = detail?._links?.broaderIscoGroup ?? top._links?.broaderIscoGroup ?? [];
  if (broader.length) {
    iscoCode = broader[0].code ?? extractIscoCodeFromUri(broader[0].uri);
    iscoTitle = broader[0].title;
  }

  const alternatives = results.slice(1, 4).map((r, idx) => {
    const altTitle = pickPreferredLabel(r.preferredLabel) ?? r.title ?? "";
    return {
      title: altTitle,
      iscoCode: extractIscoCodeFromUri(r._links?.broaderIscoGroup?.[0]?.uri),
      escoUri: r.uri,
      // The ESCO API doesn't return a similarity score; approximate via rank.
      confidence: Math.max(0.4, 0.85 - 0.1 * idx),
      reason: `Ranked #${idx + 2} ESCO match for "${cleaned}".`,
    };
  });

  return {
    escoOccupationTitle: topTitle,
    escoOccupationUri: top.uri,
    escoOccupationCode: topEscoCode,
    iscoCode,
    iscoTitle,
    alternativeOccupationMatches: alternatives,
  };
}

// Legacy stub kept so existing imports don't break.
export async function mapSkillToESCO(skillName: string): Promise<string> {
  const resolution = await resolveEscoOccupation(skillName);
  if (!resolution) return "0000 - Unmapped";
  return `${resolution.iscoCode ?? "0000"} - ${resolution.escoOccupationTitle}`;
}
