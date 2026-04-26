import type { CandidateSkillProfile, JobMatch, SkillItem } from "@/types/unmapped";
import { getCountryWdiSnapshot, type WorldBankIndicatorData } from "@/services/worldBank";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const COUNTRY_NAMES: Record<string, string> = {
  BGD: "bangladesh",
  GHA: "ghana",
  KEN: "kenya",
  NGA: "nigeria",
};

const COUNTRY_CODES_BY_NAME = Object.fromEntries(
  Object.entries(COUNTRY_NAMES).map(([code, name]) => [name, code]),
) as Record<string, string>;

const TRACK_JOB_TERMS: Partial<Record<CandidateSkillProfile["profile"]["track"], string[]>> = {
  agriculture: [
    "farm worker",
    "farm hand",
    "agricultural worker",
    "agricultural labourer",
    "agricultural laborer",
    "crop worker",
    "oil palm worker",
    "palm oil worker",
    "plantation worker",
    "harvest worker",
  ],
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
  marketInsight?: LocalLaborMarketInsight;
  marketInsightError?: string;
}

export interface LocalLaborMarketInsight {
  occupationTitle: string;
  country: string;
  location: string;
  commonWorkMode: "mostly_formal" | "mixed" | "mostly_self_employed" | "mostly_gig" | "unclear";
  summary: string;
  howWorkIsDone: string[];
  salaryExpectation: {
    range: string;
    period: "hour" | "day" | "week" | "month" | "project" | "unknown";
    currency: string;
    confidence: "low" | "medium" | "high";
    notes: string;
  };
  economicMetrics: {
    averagePay: {
      label: string;
      value: string;
      period: "hour" | "day" | "week" | "month" | "year" | "project" | "unknown";
      currency: string;
      confidence: "low" | "medium" | "high";
      notes: string;
    };
    employmentInAgeGroup: {
      label: string;
      value: string;
      ageGroup: string;
      confidence: "low" | "medium" | "high";
      notes: string;
    };
  };
  selfEmployment: {
    suitable: boolean;
    viability: "poor" | "possible" | "good" | "unclear";
    confidence: "low" | "medium" | "high";
    reasons: string[];
    risks: string[];
    starterOffers: string[];
    customerChannels: string[];
  };
  formalEmployment: {
    availability: "scarce" | "available" | "common" | "unclear";
    typicalEmployers: string[];
  };
  credentialsOrBarriers: string[];
  evidence: string[];
}

export async function searchTavilyJobsForProfile({
  profile,
  location,
}: TavilyJobSearchInput): Promise<TavilyJobSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Tavily API key in .env as TAVILY_API_KEY.");
  }

  const queryContext = buildJobSearchQuery(profile, location);
  const country = chooseTavilyCountry(profile, location);

  const response = await fetch(TAVILY_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryContext.query,
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
  const { insight: marketInsight, error: marketInsightError } = await buildMarketInsight({
    profile,
    location,
    query: queryContext.query,
    answer: payload.answer,
    tavilyResults: payload.results ?? [],
  });

  return {
    query: queryContext.query,
    answer: payload.answer,
    jobs,
    marketInsight,
    marketInsightError,
  };
}

async function buildMarketInsight({
  profile,
  location,
  query,
  answer,
  tavilyResults,
}: {
  profile: CandidateSkillProfile;
  location: string;
  query: string;
  answer?: string;
  tavilyResults: TavilySearchResult[];
}): Promise<{ insight?: LocalLaborMarketInsight; error?: string }> {
  const apiKey = process.env.APIKEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "Missing OpenAI API key in .env as APIKEY or OPENAI_API_KEY." };
  }

  try {
    const [wdiSnapshot] = await Promise.all([getWdiSnapshotForProfile(profile)]);
    const result = await callOpenAIForMarketInsight(apiKey, {
      profile,
      location,
      query,
      answer,
      tavilyResults,
      wdiSnapshot,
    });
    return { insight: normalizeMarketInsight(result, profile, location) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "OpenAI could not build a local labor insight.",
    };
  }
}

async function getWdiSnapshotForProfile(profile: CandidateSkillProfile) {
  const countryCode = profile.country?.trim().toUpperCase();
  if (!countryCode || !/^[A-Z]{3}$/.test(countryCode)) return undefined;

  try {
    return await getCountryWdiSnapshot(countryCode);
  } catch {
    return undefined;
  }
}

async function callOpenAIForMarketInsight(
  apiKey: string,
  input: {
    profile: CandidateSkillProfile;
    location: string;
    query: string;
    answer?: string;
    tavilyResults: TavilySearchResult[];
    wdiSnapshot?: Partial<Record<string, WorldBankIndicatorData>>;
  },
) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You assess local labor-market options from an ESCO/ISCO skill profile. Use only the provided profile, search snippets, and economic indicators. Be practical, conservative, and explicit when evidence is weak. Do not invent precise salary numbers; use ranges only when the evidence supports them, otherwise give a cautious qualitative expectation.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Explain how this occupation is commonly done in the location, expected salary/pay pattern, formal vs gig/self-employment availability, whether an entrepreneur/freelancer route should be shown next to job listings, and two economic metrics for the job-opportunity area: average pay for this role and an estimate of how many people in the candidate's likely age/youth group are employed in this occupation or closest available occupation group. If exact occupation-by-age-by-area data is unavailable, say so and provide the closest cautious proxy instead of inventing precision.",
              profile: summarizeProfileForInsight(input.profile),
              location: input.location,
              tavilyQuery: input.query,
              tavilyAnswer: input.answer,
              tavilyEvidence: input.tavilyResults.slice(0, 8).map((result) => ({
                title: result.title,
                url: result.url,
                snippet: result.content,
                score: result.score,
                publishedDate: result.published_date,
              })),
              economicIndicators: summarizeWdiSnapshot(input.wdiSnapshot),
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "local_labor_market_insight",
          strict: false,
          schema: marketInsightSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI market insight failed: ${errorText}`);
  }

  const result = await response.json();
  return JSON.parse(extractResponseText(result)) as Partial<LocalLaborMarketInsight>;
}

function summarizeProfileForInsight(profile: CandidateSkillProfile) {
  return {
    location: profile.location,
    country: profile.country,
    role: profile.profile.roleName,
    normalizedRole: profile.profile.normalizedRoleName,
    track: profile.profile.track,
    seniority: profile.profile.seniority,
    summary: profile.profile.summary,
    occupation: {
      iscoCode: profile.occupation.iscoCode,
      iscoTitle: profile.occupation.iscoTitle,
      escoOccupationCode: profile.occupation.escoOccupationCode,
      escoOccupationTitle: profile.occupation.escoOccupationTitle,
      escoOccupationUri: profile.occupation.escoOccupationUri,
    },
    experience: {
      hasJob: profile.experience.hasJob,
      totalYears: profile.experience.totalYears,
      relevantYears: profile.experience.relevantYears,
      jobTitles: profile.experience.jobTitles,
      industries: profile.experience.industries,
      responsibilities: profile.experience.responsibilities.slice(0, 8),
      achievements: profile.experience.achievements.slice(0, 5),
    },
    education: profile.education,
    skills: getProfileSkills(profile)
      .slice(0, 16)
      .map((skill) => ({
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
        yearsExperience: skill.yearsExperience,
        confidence: skill.confidence,
        escoPreferredLabel: skill.escoPreferredLabel,
        escoSkillType: skill.escoSkillType,
      })),
  };
}

function summarizeWdiSnapshot(snapshot?: Partial<Record<string, WorldBankIndicatorData>>) {
  if (!snapshot) return undefined;
  return Object.values(snapshot)
    .filter((value): value is WorldBankIndicatorData => Boolean(value))
    .map((indicator) => ({
      label: indicator.indicatorName,
      value: indicator.value,
      unit: indicator.unit,
      year: indicator.year,
      country: indicator.countryName,
      sourceUrl: indicator.sourceUrl,
    }));
}

const stringArraySchema = { type: "array", items: { type: "string" } };

const marketInsightSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "occupationTitle",
    "country",
    "location",
    "commonWorkMode",
    "summary",
    "howWorkIsDone",
    "salaryExpectation",
    "economicMetrics",
    "selfEmployment",
    "formalEmployment",
    "credentialsOrBarriers",
    "evidence",
  ],
  properties: {
    occupationTitle: { type: "string" },
    country: { type: "string" },
    location: { type: "string" },
    commonWorkMode: {
      type: "string",
      enum: ["mostly_formal", "mixed", "mostly_self_employed", "mostly_gig", "unclear"],
    },
    summary: { type: "string" },
    howWorkIsDone: stringArraySchema,
    salaryExpectation: {
      type: "object",
      additionalProperties: false,
      required: ["range", "period", "currency", "confidence", "notes"],
      properties: {
        range: { type: "string" },
        period: {
          type: "string",
          enum: ["hour", "day", "week", "month", "project", "unknown"],
        },
        currency: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        notes: { type: "string" },
      },
    },
    economicMetrics: {
      type: "object",
      additionalProperties: false,
      required: ["averagePay", "employmentInAgeGroup"],
      properties: {
        averagePay: {
          type: "object",
          additionalProperties: false,
          required: ["label", "value", "period", "currency", "confidence", "notes"],
          properties: {
            label: { type: "string" },
            value: { type: "string" },
            period: {
              type: "string",
              enum: ["hour", "day", "week", "month", "year", "project", "unknown"],
            },
            currency: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            notes: { type: "string" },
          },
        },
        employmentInAgeGroup: {
          type: "object",
          additionalProperties: false,
          required: ["label", "value", "ageGroup", "confidence", "notes"],
          properties: {
            label: { type: "string" },
            value: { type: "string" },
            ageGroup: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            notes: { type: "string" },
          },
        },
      },
    },
    selfEmployment: {
      type: "object",
      additionalProperties: false,
      required: [
        "suitable",
        "viability",
        "confidence",
        "reasons",
        "risks",
        "starterOffers",
        "customerChannels",
      ],
      properties: {
        suitable: { type: "boolean" },
        viability: { type: "string", enum: ["poor", "possible", "good", "unclear"] },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        reasons: stringArraySchema,
        risks: stringArraySchema,
        starterOffers: stringArraySchema,
        customerChannels: stringArraySchema,
      },
    },
    formalEmployment: {
      type: "object",
      additionalProperties: false,
      required: ["availability", "typicalEmployers"],
      properties: {
        availability: { type: "string", enum: ["scarce", "available", "common", "unclear"] },
        typicalEmployers: stringArraySchema,
      },
    },
    credentialsOrBarriers: stringArraySchema,
    evidence: stringArraySchema,
  },
};

function buildJobSearchQuery(profile: CandidateSkillProfile, location: string) {
  const role =
    profile.occupation.escoOccupationTitle ||
    profile.occupation.iscoTitle ||
    profile.profile.normalizedRoleName ||
    profile.profile.roleName ||
    "entry level worker";
  const alternateRoles = buildAlternateJobTerms(profile, role);
  const skills = getProfileSkills(profile)
    .slice(0, 8)
    .map((skill) => skill.name)
    .join(", ");
  const locationPart = location.trim() || profile.location || profile.country || "near me";
  const profileCountry = normalizeCountryName(profile.country);
  const locationCountry = inferCountryCodeFromLocation(locationPart);
  const profileCountryCode = inferCountryCodeFromLocation(profile.country);
  const profileCountrySuggestion =
    profileCountry && locationCountry !== profileCountryCode
      ? `also consider nearby or profile country: ${profileCountry}`
      : "";

  const query = [
    `${role} jobs hiring`,
    alternateRoles.length ? `similar titles: ${alternateRoles.join(" OR ")}` : "",
    locationPart,
    profileCountrySuggestion,
    skills ? `skills: ${skills}` : "",
    profile.profile.track !== "other" ? profile.profile.track : "",
    "job vacancy OR hiring OR recruitment OR apply",
  ]
    .filter(Boolean)
    .join(" ");

  return { query };
}

function buildAlternateJobTerms(profile: CandidateSkillProfile, role: string) {
  const terms = [
    profile.profile.roleName,
    profile.profile.normalizedRoleName,
    profile.occupation.iscoTitle,
    ...(profile.occupation.alternativeOccupationMatches ?? []).map((match) => match.title),
    ...(TRACK_JOB_TERMS[profile.profile.track] ?? []),
  ];
  const normalizedRole = role.toLowerCase();
  const seen = new Set([normalizedRole]);
  return terms
    .map((term) => term?.trim())
    .filter((term): term is string => Boolean(term))
    .filter((term) => {
      const key = term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
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
  _matchedSkills: string[],
  _missingSkills: string[],
  _profile: CandidateSkillProfile,
) {
  return result.content ? ` ${truncate(result.content, 160)}` : "";
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

function chooseTavilyCountry(profile: CandidateSkillProfile, location: string) {
  const locationCountry = normalizeCountryForTavily(inferCountryCodeFromLocation(location));
  if (locationCountry) return locationCountry;
  return normalizeCountryForTavily(profile.country);
}

function inferCountryCodeFromLocation(location?: string) {
  const normalized = location?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (/^[a-z]{3}$/i.test(normalized)) return normalized.toUpperCase();
  const matchedName = Object.keys(COUNTRY_CODES_BY_NAME).find((countryName) =>
    new RegExp(`\\b${escapeRegExp(countryName)}\\b`, "i").test(normalized),
  );
  return matchedName ? COUNTRY_CODES_BY_NAME[matchedName] : undefined;
}

function normalizeCountryForTavily(country?: string) {
  if (!country) return undefined;
  const normalized = country.trim().toLowerCase();
  const code = /^[a-z]{3}$/i.test(country)
    ? country.trim().toUpperCase()
    : COUNTRY_CODES_BY_NAME[normalized];
  return code ? COUNTRY_NAMES[code] : undefined;
}

function normalizeCountryName(country?: string) {
  if (!country) return undefined;
  return normalizeCountryForTavily(country);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeMarketInsight(
  insight: Partial<LocalLaborMarketInsight>,
  profile: CandidateSkillProfile,
  location: string,
): LocalLaborMarketInsight {
  return {
    occupationTitle:
      cleanText(insight.occupationTitle) ||
      profile.occupation.escoOccupationTitle ||
      profile.occupation.iscoTitle ||
      profile.profile.roleName ||
      "Occupation",
    country: cleanText(insight.country) || profile.country || "Unknown",
    location: cleanText(insight.location) || location || profile.location || "Local",
    commonWorkMode: enumValue(insight.commonWorkMode, [
      "mostly_formal",
      "mixed",
      "mostly_self_employed",
      "mostly_gig",
      "unclear",
    ]),
    summary: cleanText(insight.summary) || "The local labor-market picture is unclear.",
    howWorkIsDone: cleanStringArray(insight.howWorkIsDone),
    salaryExpectation: {
      range: cleanText(insight.salaryExpectation?.range) || "Not enough evidence for a range",
      period: enumValue(insight.salaryExpectation?.period, [
        "hour",
        "day",
        "week",
        "month",
        "project",
        "unknown",
      ]),
      currency: cleanText(insight.salaryExpectation?.currency) || "unknown",
      confidence: enumValue(insight.salaryExpectation?.confidence, ["high", "medium", "low"]),
      notes: cleanText(insight.salaryExpectation?.notes) || "Use this as a directional estimate.",
    },
    economicMetrics: {
      averagePay: {
        label: cleanText(insight.economicMetrics?.averagePay?.label) || "Average pay",
        value:
          cleanText(insight.economicMetrics?.averagePay?.value) ||
          cleanText(insight.salaryExpectation?.range) ||
          "Not enough evidence",
        period: enumValue(insight.economicMetrics?.averagePay?.period, [
          "hour",
          "day",
          "week",
          "month",
          "year",
          "project",
          "unknown",
        ]),
        currency:
          cleanText(insight.economicMetrics?.averagePay?.currency) ||
          cleanText(insight.salaryExpectation?.currency) ||
          "unknown",
        confidence: enumValue(insight.economicMetrics?.averagePay?.confidence, [
          "high",
          "medium",
          "low",
        ]),
        notes:
          cleanText(insight.economicMetrics?.averagePay?.notes) ||
          "Based on available listings and labor-market snippets.",
      },
      employmentInAgeGroup: {
        label:
          cleanText(insight.economicMetrics?.employmentInAgeGroup?.label) ||
          "People employed in age group",
        value:
          cleanText(insight.economicMetrics?.employmentInAgeGroup?.value) ||
          "Not enough evidence",
        ageGroup:
          cleanText(insight.economicMetrics?.employmentInAgeGroup?.ageGroup) ||
          "youth or working-age group",
        confidence: enumValue(insight.economicMetrics?.employmentInAgeGroup?.confidence, [
          "high",
          "medium",
          "low",
        ]),
        notes:
          cleanText(insight.economicMetrics?.employmentInAgeGroup?.notes) ||
          "Exact occupation-by-age employment counts are often unavailable for local areas.",
      },
    },
    selfEmployment: {
      suitable: Boolean(insight.selfEmployment?.suitable),
      viability: enumValue(insight.selfEmployment?.viability, [
        "poor",
        "possible",
        "good",
        "unclear",
      ]),
      confidence: enumValue(insight.selfEmployment?.confidence, ["high", "medium", "low"]),
      reasons: cleanStringArray(insight.selfEmployment?.reasons),
      risks: cleanStringArray(insight.selfEmployment?.risks),
      starterOffers: cleanStringArray(insight.selfEmployment?.starterOffers),
      customerChannels: cleanStringArray(insight.selfEmployment?.customerChannels),
    },
    formalEmployment: {
      availability: enumValue(insight.formalEmployment?.availability, [
        "scarce",
        "available",
        "common",
        "unclear",
      ]),
      typicalEmployers: cleanStringArray(insight.formalEmployment?.typicalEmployers),
    },
    credentialsOrBarriers: cleanStringArray(insight.credentialsOrBarriers),
    evidence: cleanStringArray(insight.evidence),
  };
}

function enumValue<const T extends string>(value: unknown, allowed: readonly T[]): T {
  return allowed.includes(value as T) ? (value as T) : allowed.at(-1)!;
}

function cleanStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item)).filter((item) => item.length > 0)
    : [];
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

type OpenAIResponseContent = {
  text?: unknown;
};

type OpenAIResponseItem = {
  content?: OpenAIResponseContent[];
};

type OpenAIResponseResult = {
  output_text?: unknown;
  output?: OpenAIResponseItem[];
};

function extractResponseText(result: OpenAIResponseResult) {
  if (typeof result.output_text === "string") return result.output_text;

  const text = result.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((content) => content.text)
    ?.filter((text): text is string => typeof text === "string")
    ?.join("");

  if (!text) throw new Error("OpenAI response did not contain structured text.");
  return text;
}
