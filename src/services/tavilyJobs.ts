import type { CandidateSkillProfile, JobMatch, SkillItem } from "@/types/unmapped";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

const COUNTRY_NAMES: Record<string, string> = {
  BGD: "bangladesh",
  GHA: "ghana",
  KEN: "kenya",
  NGA: "nigeria",
};

interface TavilySearchResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
}

interface TavilySearchResponse {
  answer?: string;
  results?: TavilySearchResult[];
}

export interface TavilyJobSearchInput {
  profile: CandidateSkillProfile;
  location: string;
}

export interface TavilyJobSearchResult {
  query: string;
  jobs: JobMatch[];
  answer?: string;
}

export async function searchTavilyJobsForProfile({
  profile,
  location,
}: TavilyJobSearchInput): Promise<TavilyJobSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Tavily API key in .env as TAVILY_API_KEY.");
  }

  const query = buildJobSearchQuery(profile, location);
  const country = normalizeCountryForTavily(profile.country);

  const response = await fetch(TAVILY_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      topic: "general",
      search_depth: "basic",
      max_results: 8,
      include_answer: "basic",
      include_raw_content: false,
      include_images: false,
      ...(country ? { country } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily job search failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as TavilySearchResponse;
  const allSkills = getProfileSkills(profile);
  const jobs = (payload.results ?? [])
    .filter((result) => result.url && result.title)
    .map((result, index) => resultToJobMatch(result, index, profile, allSkills, location))
    .filter((job): job is JobMatch => Boolean(job))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  return {
    query,
    answer: payload.answer,
    jobs,
  };
}

function buildJobSearchQuery(profile: CandidateSkillProfile, location: string) {
  const role =
    profile.occupation.escoOccupationTitle ||
    profile.occupation.iscoTitle ||
    profile.profile.normalizedRoleName ||
    profile.profile.roleName ||
    "entry level worker";
  const skills = getProfileSkills(profile)
    .slice(0, 8)
    .map((skill) => skill.name)
    .join(", ");
  const locationPart = location.trim() || profile.location || profile.country || "near me";

  return [
    `"${role}" jobs hiring`,
    locationPart,
    skills ? `skills: ${skills}` : "",
    profile.profile.track !== "other" ? profile.profile.track : "",
    "apply job vacancy local",
  ]
    .filter(Boolean)
    .join(" ");
}

function getProfileSkills(profile: CandidateSkillProfile): SkillItem[] {
  return Object.values(profile.skills)
    .flat()
    .filter((skill) => skill.name.trim())
    .sort((a, b) => confidenceValue(b.confidence) - confidenceValue(a.confidence));
}

function resultToJobMatch(
  result: TavilySearchResult,
  index: number,
  profile: CandidateSkillProfile,
  skills: SkillItem[],
  fallbackLocation: string,
): JobMatch | null {
  if (!result.title || !result.url) return null;

  const haystack = `${result.title} ${result.content ?? ""}`.toLowerCase();
  const matchedSkills = skills
    .filter((skill) => haystack.includes(skill.name.toLowerCase()))
    .slice(0, 5)
    .map((skill) => skill.name);
  const missingSkills = inferMissingSkills(skills, matchedSkills);
  const relevance = Math.round((result.score ?? 0.55) * 100);
  const matchScore = clamp(
    Math.max(45, relevance) + matchedSkills.length * 6 - missingSkills.length * 3,
    48,
    94,
  );

  return {
    id: `tavily-${index}-${hashUrl(result.url)}`,
    title: cleanJobTitle(result.title),
    company: inferCompany(result),
    location: inferLocation(
      result,
      fallbackLocation || profile.location || profile.country || "Local",
    ),
    type: inferOpportunityType(result),
    matchScore,
    matchStatus: matchStatus(matchScore),
    matchedSkills,
    missingSkills,
    gapAnalysis: buildGapAnalysis(result, matchedSkills, missingSkills, profile),
    sourceUrl: result.url,
  };
}

function inferMissingSkills(skills: SkillItem[], matchedSkills: string[]) {
  const matched = new Set(matchedSkills.map((skill) => skill.toLowerCase()));
  return skills
    .filter((skill) => !matched.has(skill.name.toLowerCase()))
    .slice(0, 2)
    .map((skill) => skill.name);
}

function cleanJobTitle(title: string) {
  return (
    title
      .replace(/\s*\|\s*.*$/, "")
      .replace(/\s*-\s*Jobs?.*$/i, "")
      .trim() || title
  );
}

function inferCompany(result: TavilySearchResult) {
  if (!result.url) return undefined;
  try {
    const host = new URL(result.url).hostname.replace(/^www\./, "");
    return host.split(".")[0]?.replace(/[-_]/g, " ");
  } catch {
    return undefined;
  }
}

function inferLocation(result: TavilySearchResult, fallback: string) {
  const text = `${result.title ?? ""} ${result.content ?? ""}`;
  const remote = /\bremote\b/i.test(text);
  return remote ? `${fallback} or remote` : fallback;
}

function inferOpportunityType(result: TavilySearchResult): JobMatch["type"] {
  const text = `${result.title ?? ""} ${result.content ?? ""}`.toLowerCase();
  if (text.includes("training") || text.includes("apprentice") || text.includes("internship")) {
    return "training";
  }
  if (text.includes("freelance") || text.includes("contract") || text.includes("gig")) return "gig";
  return "formal";
}

function buildGapAnalysis(
  result: TavilySearchResult,
  matchedSkills: string[],
  missingSkills: string[],
  profile: CandidateSkillProfile,
) {
  const basis = matchedSkills.length
    ? `Matches ${matchedSkills.join(", ")} from this ESCO skill profile.`
    : `Relevant to ${profile.occupation.escoOccupationTitle || profile.profile.roleName}.`;
  const gap = missingSkills.length
    ? `Check the listing for ${missingSkills.join(", ")} before applying.`
    : "No obvious skill gap was detected from the listing summary.";
  const sourceNote = result.content ? ` Tavily found: ${truncate(result.content, 120)}` : "";

  return `${basis} ${gap}${sourceNote}`;
}

function matchStatus(score: number): JobMatch["matchStatus"] {
  if (score >= 82) return "strong_match";
  if (score >= 68) return "good_match";
  if (score >= 56) return "possible";
  return "stretch";
}

function confidenceValue(confidence: SkillItem["confidence"]) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

function normalizeCountryForTavily(country?: string) {
  if (!country) return undefined;
  return COUNTRY_NAMES[country.trim().toUpperCase()];
}

function truncate(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashUrl(url: string) {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
