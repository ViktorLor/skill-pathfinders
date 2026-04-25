/**
 * ESCO (European Skills, Competences, Qualifications and Occupations) v1
 * REST API — public, key-less, CORS-enabled.
 *
 * Docs: https://esco.ec.europa.eu/en/use-esco/download
 * API:  https://ec.europa.eu/esco/api/
 *
 * We use ESCO to resolve a candidate's skill (a freeform string and/or an
 * existing ESCO concept URI) to a concrete occupation with an ISCO-08
 * code. Downstream, ISCO is what unlocks Frey-Osborne (via the SOC
 * crosswalk) and the ILO task bucket (via the ISCO major-group structure).
 */

const ESCO_BASE = "https://ec.europa.eu/esco/api";

export interface EscoOccupation {
  uri: string;
  title: string;
  /** 4-digit ISCO-08 code, e.g. "2512" */
  iscoCode: string;
}

interface EscoSearchHit {
  uri?: string;
  className?: string;
  title?: string;
}

interface EscoSearchResponse {
  _embedded?: { results?: EscoSearchHit[] };
}

interface EscoResource {
  uri?: string;
  title?: string;
  code?: string;
  preferredLabel?: { en?: string };
  _links?: {
    broaderIscoGroup?: Array<{ uri?: string; title?: string }>;
    hasOccupation?: Array<{ uri?: string; title?: string }>;
    isOptionalForOccupation?: Array<{ uri?: string; title?: string }>;
    isEssentialForOccupation?: Array<{ uri?: string; title?: string }>;
  };
}

const occupationCache = new Map<string, EscoOccupation | null>();
const skillToOccupationCache = new Map<string, EscoOccupation | null>();

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function extractIscoFromOccupationResource(res: EscoResource): string | null {
  const broader = res._links?.broaderIscoGroup ?? [];
  for (const b of broader) {
    const m = b.uri?.match(/\/(\d{4})$/);
    if (m) return m[1];
  }
  if (res.code && /^\d{4}$/.test(res.code)) return res.code;
  return null;
}

async function loadOccupationByUri(uri: string): Promise<EscoOccupation | null> {
  if (occupationCache.has(uri)) return occupationCache.get(uri)!;
  const res = await fetchJson<EscoResource>(
    `${ESCO_BASE}/resource/occupation?uri=${encodeURIComponent(uri)}`,
  );
  if (!res) {
    occupationCache.set(uri, null);
    return null;
  }
  const isco = extractIscoFromOccupationResource(res);
  if (!isco) {
    occupationCache.set(uri, null);
    return null;
  }
  const occ: EscoOccupation = {
    uri,
    title: res.preferredLabel?.en ?? res.title ?? "Unknown occupation",
    iscoCode: isco,
  };
  occupationCache.set(uri, occ);
  return occ;
}

export async function findOccupationForSkill(
  skillName: string,
  escoCode?: string,
): Promise<EscoOccupation | null> {
  if (escoCode) {
    const direct = await fetchJson<EscoResource>(
      `${ESCO_BASE}/resource/occupation?uri=${encodeURIComponent(
        `http://data.europa.eu/esco/occupation/${escoCode}`,
      )}`,
    );
    if (direct) {
      const isco = extractIscoFromOccupationResource(direct);
      if (isco) {
        return {
          uri: direct.uri ?? "",
          title: direct.preferredLabel?.en ?? direct.title ?? skillName,
          iscoCode: isco,
        };
      }
    }
  }

  const cacheKey = skillName.trim().toLowerCase();
  if (skillToOccupationCache.has(cacheKey)) {
    return skillToOccupationCache.get(cacheKey)!;
  }

  const skillSearch = await fetchJson<EscoSearchResponse>(
    `${ESCO_BASE}/search?language=en&type=skill&text=${encodeURIComponent(skillName)}`,
  );
  const skillHit = skillSearch?._embedded?.results?.[0];
  if (skillHit?.uri) {
    const skillResource = await fetchJson<EscoResource>(
      `${ESCO_BASE}/resource/skill?uri=${encodeURIComponent(skillHit.uri)}`,
    );
    const occLinks = [
      ...(skillResource?._links?.isEssentialForOccupation ?? []),
      ...(skillResource?._links?.isOptionalForOccupation ?? []),
      ...(skillResource?._links?.hasOccupation ?? []),
    ];
    for (const link of occLinks) {
      if (!link.uri) continue;
      const occ = await loadOccupationByUri(link.uri);
      if (occ) {
        skillToOccupationCache.set(cacheKey, occ);
        return occ;
      }
    }
  }

  const occSearch = await fetchJson<EscoSearchResponse>(
    `${ESCO_BASE}/search?language=en&type=occupation&text=${encodeURIComponent(skillName)}`,
  );
  const occHit = occSearch?._embedded?.results?.[0];
  if (occHit?.uri) {
    const occ = await loadOccupationByUri(occHit.uri);
    skillToOccupationCache.set(cacheKey, occ);
    return occ;
  }

  skillToOccupationCache.set(cacheKey, null);
  return null;
}

export const ESCO_META = {
  source: "ESCO v1.1.1 (European Skills, Competences, Qualifications and Occupations)",
  url: "https://ec.europa.eu/esco/api/",
};
