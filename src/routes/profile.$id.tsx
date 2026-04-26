import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getCandidateById, getJobMatchesForTrack } from "@/data/mock";
import type {
  CandidateProfile,
  CandidateSkillProfile,
  JobMatch,
  SkillItem,
  SkillScore,
  TrackType,
} from "@/types/unmapped";
import { getIsoCountry } from "@/data/isoCountries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  MapPin,
  Phone,
  BarChart3,
  TrendingDown,
  ExternalLink,
  Bot,
  Shield,
  RefreshCcw,
  Loader2,
  Search,
  Printer,
  Link2,
  Check,
} from "lucide-react";
import { useCountry } from "@/context/CountryContext";
import {
  getLaborForceParticipation,
  getWageAndSalariedShare,
  getYouthUnemploymentData,
} from "@/services/worldBank";
import { CoverLetterModal } from "@/components/profile/CoverLetterModal";
import { AIRiskLens } from "@/components/profile/AIRiskLens";
import {
  computeRiskProfileForCandidateProfile,
  getRiskProfileForCandidate,
  type SkillAIRisk,
  type SkillRiskProfile,
} from "@/data/aiRisk";
import {
  deleteCandidateSkillProfileJson,
  readCandidateSkillProfileJson,
  type ProfileSnapshot,
} from "@/services/profileHandler";
import { Input } from "@/components/ui/input";
import {
  searchTavilyJobsForProfile,
  type LocalLaborMarketInsight,
  type TavilyJobSearchResult,
} from "@/services/tavilyJobs";

export const Route = createFileRoute("/profile/$id")({
  head: ({ params }) => {
    const c = getCandidateById(params.id);
    return {
      meta: [
        {
          title: c ? `${c.name} · Skill Passport · Unmapped` : "Profile · Unmapped",
        },
        {
          name: "description",
          content: c
            ? `${c.name}'s verified Unmapped Skill Passport — ${c.escoOccupation ?? ""}.`
            : "Verified skill passport.",
        },
      ],
    };
  },
  component: ProfilePage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p>Profile not found.</p>
      <Link to="/" className="text-navy underline">
        Back home
      </Link>
    </div>
  ),
});

const loadProfileSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data: { profileId: string }) => data)
  .handler(async ({ data }) => readCandidateSkillProfileJson(data.profileId));

const deleteProfileSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data: { profileId: string; accountId?: string }) => data)
  .handler(async ({ data }) => deleteCandidateSkillProfileJson(data.profileId, data.accountId));

const searchLocalJobs = createServerFn({ method: "POST" })
  .inputValidator((data: { profile: CandidateSkillProfile; location: string }) => data)
  .handler(async ({ data }) => searchTavilyJobsForProfile(data));

const ISCO_08_CODELIST_URL = "https://isco.ilo.org/en/isco-08/codelist/";
const ISCO_08_WEBSITE_LABEL = "isco.ilo.org";

const trackMeta: Record<TrackType, { label: string; bg: string; text: string; ring: string }> = {
  tech: {
    label: "Tech Track",
    bg: "bg-navy",
    text: "text-navy-foreground",
    ring: "bg-navy/10 text-navy",
  },
  trade: {
    label: "Trade Track",
    bg: "bg-sky",
    text: "text-sky-foreground",
    ring: "bg-sky/10 text-sky",
  },
  agriculture: {
    label: "Agriculture Track",
    bg: "bg-greenT",
    text: "text-greenT-foreground",
    ring: "bg-greenT/10 text-greenT",
  },
};

function trustColor(score: number) {
  if (score >= 75) return "text-greenT";
  if (score >= 50) return "text-amber";
  return "text-danger";
}

// --- Skill Passport (printable + shareable) ---------------------------------

const PASSPORT_PRINT_STYLES = `
#skill-passport { display: none; }
@media print {
  html, body { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
  body > *:not(#skill-passport) { display: none !important; }
  #skill-passport {
    display: block !important;
    padding: 16pt 18pt;
    color: #000 !important;
    background: #fff !important;
    font-family: ui-serif, Georgia, "Times New Roman", serif;
    font-size: 10.5pt;
    line-height: 1.45;
  }
  #skill-passport .sp-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 18pt; }
  #skill-passport .sp-label { font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: #444 !important; }
  #skill-passport h1 { font-size: 22pt; font-weight: 700; margin: 0; line-height: 1.1; }
  #skill-passport h2 { font-size: 11pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3pt; margin: 14pt 0 8pt; }
  #skill-passport h3 { font-size: 10pt; font-weight: 700; margin: 6pt 0 3pt; }
  #skill-passport .sp-meta { font-size: 9pt; color: #333 !important; margin-top: 4pt; }
  #skill-passport .sp-pill { display: inline-block; border: 1px solid #000; padding: 1.5pt 6pt; margin: 1pt 2pt 1pt 0; border-radius: 3pt; font-size: 9.5pt; }
  #skill-passport .sp-classification { margin-top: 6pt; padding: 6pt 8pt; border: 1px solid #000; border-radius: 3pt; font-size: 9pt; }
  #skill-passport .sp-header { border-bottom: 2pt solid #000; padding-bottom: 10pt; }
  #skill-passport ul { margin: 0; padding-left: 14pt; }
  #skill-passport li { margin-top: 2pt; }
  #skill-passport .sp-footer { margin-top: 18pt; padding-top: 8pt; border-top: 1px solid #000; font-size: 8.5pt; color: #333 !important; }
  #skill-passport .sp-badge { border: 1pt solid #000; padding: 4pt 8pt; border-radius: 3pt; text-align: center; font-size: 8.5pt; }
  #skill-passport .sp-badge strong { display: block; font-size: 11pt; letter-spacing: 0.08em; }
  #skill-passport section { page-break-inside: avoid; }
  #skill-passport h2 { page-break-after: avoid; }
  @page { margin: 12mm; }
}
`;

interface PassportData {
  name: string;
  roleTitle: string;
  trackLabel?: string;
  location?: string;
  countryName?: string;
  iscoCode?: string;
  iscoTitle?: string;
  skillsByCategory: { category: string; skills: string[] }[];
  totalYears?: number;
  industries: string[];
  jobTitles: string[];
  responsibilities: string[];
  educationLevel?: string;
  educationSkillLevel?: string;
  credentialLabel?: string;
  educationItems: string[];
  riskLevel?: string;
  riskHeadline?: string;
  profileUrl: string;
  generatedAt: Date;
}

function PassportStyles() {
  return <style dangerouslySetInnerHTML={{ __html: PASSPORT_PRINT_STYLES }} />;
}

function formatPassportDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^.+?[.!?](?=\s|$)/);
  return (match?.[0] ?? trimmed).trim();
}

function PassportDocument({ data }: { data: PassportData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const classificationParts: string[] = [];
  if (data.iscoCode) classificationParts.push(`ISCO-08 ${data.iscoCode}`);
  if (data.iscoTitle && !data.iscoCode) classificationParts.push(data.iscoTitle);
  else if (data.iscoTitle) classificationParts.push(data.iscoTitle);
  const hasClassification = classificationParts.length > 0;

  const locationLine = [data.location, data.countryName].filter(Boolean).join(", ");

  if (!mounted || typeof document === "undefined") return null;

  const passport = (
    <div id="skill-passport" aria-hidden="true">
      <header className="sp-header">
        <div className="sp-row">
          <div style={{ flex: 1 }}>
            <div className="sp-label">Skill Passport</div>
            <h1 style={{ marginTop: 4 }}>{data.name}</h1>
            <div style={{ fontSize: "12pt", marginTop: 4 }}>
              {data.roleTitle}
              {data.trackLabel ? ` · ${data.trackLabel}` : ""}
            </div>
            <div className="sp-meta">
              {locationLine && `${locationLine} · `}
              {`Generated ${formatPassportDate(data.generatedAt)}`}
            </div>
          </div>
          <div className="sp-badge" style={{ flex: "0 0 auto" }}>
            <span className="sp-label">Verified by</span>
            <strong>UNMAPPED</strong>
            <span style={{ fontSize: "8pt" }}>unmapped.io</span>
          </div>
        </div>

        {hasClassification && (
          <div className="sp-classification">
            <div className="sp-label">ISCO-08 occupation classification</div>
            <div style={{ marginTop: 2 }}>{classificationParts.join(" · ")}</div>
          </div>
        )}
      </header>

      {data.skillsByCategory.length > 0 && (
        <section>
          <h2>Skills</h2>
          {data.skillsByCategory.map((group) => (
            <div key={group.category} style={{ marginTop: 6 }}>
              <h3>{group.category}</h3>
              <div>
                {group.skills.map((s) => (
                  <span key={s} className="sp-pill">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {(typeof data.totalYears === "number" ||
        data.industries.length > 0 ||
        data.jobTitles.length > 0 ||
        data.responsibilities.length > 0) && (
        <section>
          <h2>Experience</h2>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
            {typeof data.totalYears === "number" && (
              <div>
                <div className="sp-label">Total years</div>
                <div>
                  {data.totalYears} {data.totalYears === 1 ? "year" : "years"}
                </div>
              </div>
            )}
            {data.industries.length > 0 && (
              <div>
                <div className="sp-label">Industries</div>
                <div>{data.industries.join(", ")}</div>
              </div>
            )}
          </div>
          {data.jobTitles.length > 0 && (
            <>
              <h3>Recent roles</h3>
              <div>
                {data.jobTitles.slice(0, 3).map((t) => (
                  <span key={t} className="sp-pill">
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
          {data.responsibilities.length > 0 && (
            <>
              <h3>Selected responsibilities</h3>
              <ul>
                {data.responsibilities.slice(0, 4).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {(data.educationLevel || data.educationItems.length > 0) && (
        <section>
          <h2>Education</h2>
          {data.educationLevel && (
            <div style={{ marginTop: 4 }}>
              <span className="sp-label">Highest level: </span>
              {data.educationLevel}
            </div>
          )}
          {(data.educationSkillLevel || data.credentialLabel) && (
            <div style={{ marginTop: 4 }}>
              <span className="sp-label">Mapped credential: </span>
              {[
                data.credentialLabel,
                data.educationSkillLevel && `${data.educationSkillLevel} skill level`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
          {data.educationItems.length > 0 && (
            <ul style={{ marginTop: 4 }}>
              {data.educationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {data.riskLevel && data.riskHeadline && (
        <section>
          <h2>AI Readiness</h2>
          <div style={{ marginTop: 4 }}>
            <strong style={{ textTransform: "capitalize" }}>{data.riskLevel}</strong>
            {` overall risk. ${data.riskHeadline}`}
          </div>
          <div className="sp-meta" style={{ marginTop: 4 }}>
            Source: Frey-Osborne 2017 · ILO Task Index · Wittgenstein Centre 2025–2035
          </div>
        </section>
      )}

      <footer className="sp-footer">
        {`This passport was generated by Unmapped — open skills infrastructure for unmapped youth. Generated ${formatPassportDate(data.generatedAt)}.`}
        <br />
        {data.profileUrl}
      </footer>
    </div>
  );

  return createPortal(passport, document.body);
}

function PassportActions({ profileUrl }: { profileUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(profileUrl || window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy profile link", err);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="rounded-md"
      >
        <Printer className="h-4 w-4" />
        Print passport
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="rounded-md"
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-greenT" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Copy link
          </>
        )}
      </Button>
    </div>
  );
}

function useProfileUrl(): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.href);
  }, []);
  return url;
}

function staticPassportData(
  candidate: CandidateProfile,
  riskProfile: SkillRiskProfile | null,
  profileUrl: string,
): PassportData {
  const demoOccupation = parseDemoOccupation(candidate.escoOccupation);
  return {
    name: candidate.name,
    roleTitle: demoOccupation?.title ?? candidate.country.sectors[0] ?? "Skill profile",
    trackLabel: trackMeta[candidate.track].label,
    location: candidate.location,
    countryName: candidate.country.name,
    iscoCode: demoOccupation?.code,
    iscoTitle: demoOccupation?.title,
    skillsByCategory: [
      {
        category: "Verified skills",
        skills: candidate.skillScores.map((s) => s.name),
      },
    ],
    industries: [],
    jobTitles: candidate.experience.map((e) => e.title),
    responsibilities: candidate.experience.map((e) => e.description),
    educationItems: [],
    riskLevel: riskProfile?.summary.overallLevel,
    riskHeadline: riskProfile ? firstSentence(riskProfile.summary.headline) : undefined,
    profileUrl,
    generatedAt: new Date(),
  };
}

function dynamicPassportData(
  snapshot: ProfileSnapshot,
  riskProfile: SkillRiskProfile | null,
  profileUrl: string,
): PassportData {
  const profile = snapshot.profile;
  const skills = profile.skills;
  const skillsByCategory = (
    [
      ["Technical", skills.technical],
      ["Tools", skills.tools],
      ["Domain", skills.domain],
      ["Business", skills.business],
      ["Soft", skills.soft],
      ["Languages", skills.languages],
    ] as const
  )
    .map(([category, items]) => ({
      category,
      skills: (items ?? []).map((s) => s.escoPreferredLabel?.trim() || s.name).filter(Boolean),
    }))
    .filter((g) => g.skills.length > 0);

  const educationItems = [
    ...(profile.education.degrees ?? []),
    ...(profile.education.certifications ?? []),
    ...(profile.education.trainings ?? []),
  ].filter((s): s is string => Boolean(s && s.trim()));
  const educationMapping = profile.education.credentialMapping;

  const countryName = profile.country
    ? (getIsoCountry(profile.country)?.name ?? profile.country)
    : undefined;

  return {
    name: profile.profile.roleName?.trim() || "Skill profile",
    roleTitle:
      profile.occupation.escoOccupationTitle ||
      profile.occupation.iscoTitle ||
      profile.profile.roleName,
    trackLabel:
      profile.profile.track === "tech" ||
      profile.profile.track === "trade" ||
      profile.profile.track === "agriculture"
        ? trackMeta[profile.profile.track].label
        : `${profile.profile.track[0]?.toUpperCase()}${profile.profile.track.slice(1)} track`,
    location: profile.location,
    countryName,
    iscoCode: profile.occupation.iscoCode || undefined,
    iscoTitle: profile.occupation.iscoTitle || undefined,
    skillsByCategory,
    totalYears: profile.experience.totalYears,
    industries: profile.experience.industries ?? [],
    jobTitles: profile.experience.jobTitles ?? [],
    responsibilities: profile.experience.responsibilities ?? [],
    educationLevel: profile.education.highestLevel,
    educationSkillLevel: educationMapping?.estimatedSkillLevel,
    credentialLabel: educationMapping?.credentialLabel,
    educationItems,
    riskLevel: riskProfile?.summary.overallLevel,
    riskHeadline: riskProfile ? firstSentence(riskProfile.summary.headline) : undefined,
    profileUrl,
    generatedAt: new Date(),
  };
}

function ProfilePage() {
  const { id } = useParams({ from: "/profile/$id" });
  const candidate = getCandidateById(id);
  const profileUrl = useProfileUrl();
  const [dynamicSnapshot, setDynamicSnapshot] = useState<ProfileSnapshot | null>(null);
  const [dynamicLoading, setDynamicLoading] = useState(!candidate);
  const [dynamicError, setDynamicError] = useState("");
  const [activeJob, setActiveJob] = useState<JobMatch | null>(null);

  useEffect(() => {
    if (candidate) {
      setDynamicLoading(false);
      return;
    }

    let cancelled = false;
    setDynamicLoading(true);
    setDynamicError("");

    loadProfileSnapshot({ data: { profileId: id } })
      .then((snapshot) => {
        if (!cancelled) setDynamicSnapshot(snapshot);
      })
      .catch((err) => {
        if (!cancelled) {
          setDynamicError(err instanceof Error ? err.message : "Could not load profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setDynamicLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [candidate, id]);

  if (!candidate && dynamicLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </main>
    );
  }

  if (!candidate && dynamicSnapshot) {
    return <DynamicProfilePage snapshot={dynamicSnapshot} />;
  }

  if (!candidate) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-navy">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">
          {dynamicError || "We couldn't find a passport with that id."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
        >
          Back home
        </Link>
      </main>
    );
  }

  const meta = trackMeta[candidate.track];
  const jobs = getJobMatchesForTrack(candidate.track);
  const riskProfile = getRiskProfileForCandidate(candidate.id);
  const demoOccupation = parseDemoOccupation(candidate.escoOccupation);
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const passportData = staticPassportData(candidate, riskProfile, profileUrl);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <PassportStyles />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Share or print your passport — works at copy shops, on WhatsApp, anywhere.
        </p>
        <PassportActions profileUrl={profileUrl} />
      </div>
      {/* Header */}
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 flex-none items-center justify-center rounded-full text-xl font-bold ${meta.bg} ${meta.text}`}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">{candidate.name}</h1>
              <OfficialIscoClassification
                className="mt-2"
                iscoCode={demoOccupation?.code}
                iscoTitle={demoOccupation?.title}
              />
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                {candidate.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {candidate.location}
                  </span>
                )}
                {candidate.age && <span>· {candidate.age} years old</span>}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${meta.ring}`}>
                  {meta.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Skill Passport Score
            </span>
            <div className={`mt-1 text-5xl font-bold ${trustColor(candidate.trustScore)}`}>
              {candidate.trustScore}
              <span className="text-xl text-muted-foreground">/100</span>
            </div>
          </div>
        </div>
        <OfficialIscoFootnote />
      </section>

      {/* Econometric signals */}
      <section className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-sky/10 px-4 py-3 text-xs text-foreground">
        {candidate.avgWageInSector && (
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-sky" />
            {candidate.avgWageInSector}
          </span>
        )}
        {candidate.youthUnemploymentRate && (
          <span className="inline-flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-sky" />
            {candidate.youthUnemploymentRate}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
          Source:{" "}
          <a
            href="https://ilostat.ilo.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sky"
          >
            ILO
          </a>{" "}
          /{" "}
          <a
            href="https://databank.worldbank.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sky"
          >
            World Bank
          </a>
        </span>
      </section>

      {/* Skills */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Verified skills</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {candidate.skillScores.map((s) => (
            <SkillRow key={s.name} skill={s} aiRisk={riskProfile?.bySkill[s.name]} />
          ))}
        </div>
      </section>

      {/* AI risk lens */}
      {riskProfile && <AIRiskLens profile={riskProfile} />}

      {/* Job matches */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Matched opportunities</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} onApply={() => setActiveJob(j)} />
          ))}
        </div>
      </section>

      {activeJob && (
        <CoverLetterModal
          candidate={candidate}
          job={activeJob}
          onClose={() => setActiveJob(null)}
        />
      )}
      <PassportDocument data={passportData} />
    </main>
  );
}

function DynamicProfilePage({ snapshot }: { snapshot: ProfileSnapshot }) {
  const navigate = useNavigate();
  const { country } = useCountry();
  const profile = snapshot.profile;
  const skills = Object.values(profile.skills).flat();
  const effectiveCountryCode = profile.country?.trim() || country.code;
  const riskProfile = computeRiskProfileForCandidateProfile(profile, effectiveCountryCode);
  const educationMapping = profile.education.credentialMapping;
  const profileUrl = useProfileUrl();
  const passportData = dynamicPassportData(snapshot, riskProfile, profileUrl);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [jobLocation, setJobLocation] = useState(profile.location ?? "");
  const [jobSearch, setJobSearch] = useState<TavilyJobSearchResult | null>(null);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);
  const [jobSearchError, setJobSearchError] = useState("");
  const [signals, setSignals] = useState<{
    wageShare?: { value: number; year: number; countryName: string };
    laborForce?: { value: number; year: number; countryName: string };
    youthUnemployment?: { value: number; year: number; countryName: string };
    error?: string;
  }>({});

  const isIsoAlpha3 = /^[A-Z]{3}$/.test(effectiveCountryCode);

  useEffect(() => {
    if (!isIsoAlpha3) {
      setSignals({});
      return;
    }
    let cancelled = false;
    setSignals({});
    Promise.all([
      getWageAndSalariedShare(effectiveCountryCode),
      getLaborForceParticipation(effectiveCountryCode),
      getYouthUnemploymentData(effectiveCountryCode),
    ])
      .then(([wageShare, lfp, youth]) => {
        if (cancelled) return;
        setSignals({ wageShare, laborForce: lfp, youthUnemployment: youth });
      })
      .catch((err) => {
        if (cancelled) return;
        setSignals({
          error: err instanceof Error ? err.message : "Failed to load World Bank signals.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveCountryCode, isIsoAlpha3]);
  const displayName = profile.fullName?.trim() || "Candidate";
  const initials = (profile.fullName || profile.profile.roleName || "Candidate")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const retakeQuestionnaire = async () => {
    const confirmed = window.confirm(
      "Retake the questionnaire? This will delete your saved profile data and SQL entry.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const accountId = window.localStorage.getItem("accountId") || undefined;
      await deleteProfileSnapshot({
        data: {
          profileId: snapshot.profileId,
          accountId,
        },
      });
      navigate({ to: "/" });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the saved profile.");
    } finally {
      setIsDeleting(false);
    }
  };

  const runJobSearch = async () => {
    const location = jobLocation.trim();
    if (!location) {
      setJobSearchError("Enter a city, region, or country before searching.");
      return;
    }

    setJobSearchLoading(true);
    setJobSearchError("");
    setJobSearch(null);

    try {
      const result = await searchLocalJobs({
        data: {
          profile,
          location,
        },
      });
      setJobSearch(result);
    } catch (err) {
      setJobSearchError(err instanceof Error ? err.message : "Tavily could not find jobs.");
    } finally {
      setJobSearchLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <PassportStyles />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Share or print your passport — works at copy shops, on WhatsApp, anywhere.
        </p>
        <PassportActions profileUrl={profileUrl} />
      </div>
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-navy text-xl font-bold text-navy-foreground">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">{displayName}</h1>
              <div className="mt-1 text-sm font-medium text-foreground">
                {profile.profile.roleName || "Candidate profile"}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {profile.profile.summary}
              </p>
              <OfficialIscoClassification
                className="mt-3"
                iscoCode={profile.occupation.iscoCode}
                iscoTitle={profile.occupation.iscoTitle}
              />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.telephoneNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {profile.telephoneNumber}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-medium capitalize text-navy">
                  {profile.profile.track}
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                  {profile.profile.seniority}
                </span>
                {educationMapping && (
                  <span className="rounded-md bg-teal/10 px-2.5 py-1 text-xs font-medium capitalize text-teal">
                    Education skill: {educationMapping.estimatedSkillLevel}
                  </span>
                )}
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  Employed: {profile.experience.hasJob ? "Yes" : "No"}
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  Relocate: {profile.willingToRelocate ? "Yes" : "No"}
                </span>
              </div>
              {educationMapping && (
                <EducationSummary
                  mapping={educationMapping}
                  totalYears={profile.experience.totalYears}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Profile Status
            </span>
            <div className="mt-2 rounded-md bg-teal/10 px-3 py-1 text-sm font-semibold capitalize text-teal">
              {snapshot.status}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={retakeQuestionnaire}
              disabled={isDeleting}
              className="mt-4 rounded-md"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Retake questionnaire
            </Button>
          </div>
        </div>

        {deleteError && (
          <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {deleteError}
          </div>
        )}
        <OfficialIscoFootnote />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Skills from profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => (
            <DynamicSkillRow
              key={`${skill.category}-${skill.name}`}
              skill={skill}
              aiRisk={riskProfile.bySkill[skill.name]}
            />
          ))}
          {!skills.length && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
              No skills were captured in this profile yet.
            </div>
          )}
        </div>
      </section>

      {skills.length > 0 && <AIRiskLens profile={riskProfile} />}

      {isIsoAlpha3 && (
        <section className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-sky/10 px-4 py-3 text-xs text-foreground">
          {signals.wageShare && (
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-sky" />
              {`Formal wage share ${signals.wageShare.value.toFixed(1)}% (${signals.wageShare.countryName}, ${signals.wageShare.year})`}
            </span>
          )}
          {signals.laborForce && (
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-sky" />
              {`Labor force participation ${signals.laborForce.value.toFixed(1)}% (${signals.laborForce.countryName}, ${signals.laborForce.year})`}
            </span>
          )}
          {signals.youthUnemployment && (
            <span className="inline-flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-sky" />
              {`Youth unemployment ${signals.youthUnemployment.value.toFixed(1)}% (${signals.youthUnemployment.countryName}, ${signals.youthUnemployment.year})`}
            </span>
          )}
          {!signals.wageShare && !signals.laborForce && !signals.youthUnemployment && (
            <span className="text-muted-foreground">
              {signals.error
                ? `World Bank: ${signals.error}`
                : `Loading World Bank signals for ${effectiveCountryCode}…`}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
            Source:{" "}
            <a
              href="https://api.worldbank.org/v2"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sky"
            >
              World Bank WDI
            </a>
          </span>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy">Local job finder</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use Tavily to search current openings that fit this skill profile.
            </p>
          </div>
          {!showJobSearch && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowJobSearch(true)}
              className="rounded-md"
            >
              <Search className="h-4 w-4" />
              Find local jobs
            </Button>
          )}
        </div>

        {showJobSearch && (
          <div className="mt-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={jobLocation}
                onChange={(event) => setJobLocation(event.target.value)}
                placeholder="City, region, or country"
                aria-label="Job search location"
                className="sm:max-w-sm"
              />
              <Button
                type="button"
                onClick={runJobSearch}
                disabled={jobSearchLoading}
                className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
              >
                {jobSearchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search jobs
              </Button>
            </div>

            {jobSearchError && (
              <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {jobSearchError}
              </div>
            )}

            {jobSearch?.answer && (
              <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {jobSearch.answer}
              </p>
            )}

            {jobSearch?.marketInsight && (
              <LaborMarketInsightCard insight={jobSearch.marketInsight} />
            )}

            {jobSearch?.marketInsightError && (
              <div className="mt-4 rounded-md border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-foreground">
                Market insight unavailable: {jobSearch.marketInsightError}
              </div>
            )}

            {jobSearch && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">Tavily query: {jobSearch.query}</div>
                {jobSearch.marketInsight && (
                  <JobOpportunityMetrics insight={jobSearch.marketInsight} />
                )}
                {jobSearch.jobs.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {jobSearch.jobs.map((job) => (
                      <LiveJobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    No job listings were returned for that location. Try a nearby city or a broader
                    region.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
      <PassportDocument data={passportData} />
    </main>
  );
}

function OfficialIscoClassification({
  iscoCode,
  iscoTitle,
  className = "",
}: {
  iscoCode?: string;
  iscoTitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm text-foreground">
        <span className="font-semibold">Official ISCO-08 Classification:</span>{" "}
        {iscoTitle || "Not mapped yet"}
        {iscoCode && (
          <>
            <span className="mx-1 text-muted-foreground">·</span>
            <span className="font-semibold">ID Code:</span> {iscoCode}
          </>
        )}
      </div>
    </div>
  );
}

function OfficialIscoFootnote() {
  return (
    <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
      Footnote: ISCO-08 codes can be looked up on the{" "}
      <a
        href={ISCO_08_CODELIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-sky"
      >
        official ISCO website
      </a>{" "}
      ({ISCO_08_WEBSITE_LABEL}).
    </p>
  );
}

function EducationSummary({
  mapping,
  totalYears,
}: {
  mapping: NonNullable<CandidateSkillProfile["education"]["credentialMapping"]>;
  totalYears?: number;
}) {
  return (
    <div className="mt-4 grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <EducationSummaryItem
        label="YOE"
        value={typeof totalYears === "number" ? `${totalYears}` : "Unknown"}
        title="Years of experience"
      />
      <EducationSummaryItem
        label="Education level"
        value={mapping.taxonomyLevel}
        title={mapping.taxonomyLabel}
      />
      <EducationSummaryItem
        label="Education skill"
        value={mapping.estimatedSkillLevel}
        title={`${mapping.estimatedSkillLevel} skill level`}
      />
      <EducationSummaryItem
        label="Credential"
        value={mapping.credentialCategory}
        title={mapping.credentialLabel}
      />
    </div>
  );
}

function EducationSummaryItem({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title: string;
}) {
  return (
    <div title={title} className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold capitalize text-foreground">
        {value.replaceAll("_", " ")}
      </div>
    </div>
  );
}

function parseDemoOccupation(value?: string) {
  if (!value) return null;

  const [code, ...titleParts] = value.split("·").map((part) => part.trim());
  return {
    code: /^\d{1,4}$/.test(code) ? code : undefined,
    title: titleParts.join(" · ") || value,
  };
}

const DYNAMIC_RISK_CHIP: Record<
  SkillAIRisk["level"],
  { cls: string; icon: typeof Bot; label: string }
> = {
  low: { cls: "bg-teal/10 text-teal", icon: Shield, label: "AI-resilient" },
  moderate: { cls: "bg-amber/15 text-amber", icon: Bot, label: "Some AI risk" },
  high: { cls: "bg-danger/10 text-danger", icon: Bot, label: "At AI risk" },
};

function DynamicSkillRow({ skill, aiRisk }: { skill: SkillItem; aiRisk?: SkillAIRisk }) {
  const evidence = skill.evidence[0] ?? "Captured from the CV/profile interview.";
  const chip = aiRisk ? DYNAMIC_RISK_CHIP[aiRisk.level] : null;
  const ChipIcon = chip?.icon;
  const title = [
    evidence,
    aiRisk?.rationale ? `AI: ${aiRisk.rationale}` : "",
    skill.escoPreferredLabel ? `ESCO: ${skill.escoPreferredLabel}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div title={title} className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">{skill.name}</span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
          {skill.confidence}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
          {skill.category}
        </span>
        {skill.proficiency && (
          <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-medium capitalize text-teal">
            {skill.proficiency}
          </span>
        )}
        {chip && ChipIcon && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${chip.cls}`}
          >
            <ChipIcon className="h-3 w-3" />
            {chip.label}
          </span>
        )}
      </div>
    </div>
  );
}

function SkillRow({ skill, aiRisk }: { skill: SkillScore; aiRisk?: SkillAIRisk }) {
  const cfg = (() => {
    switch (skill.status) {
      case "confirmed":
        return {
          badge: "bg-teal/10 text-teal",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: "Confirmed",
        };
      case "partial":
        return {
          badge: "bg-amber/15 text-amber",
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          label: "Partial",
        };
      case "no_evidence":
        return {
          badge: "bg-danger/10 text-danger",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "No evidence",
        };
      case "challenged":
        return {
          badge: "bg-purpleT/10 text-purpleT",
          icon: <Star className="h-3.5 w-3.5" />,
          label: "Challenge-verified",
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground",
          icon: null,
          label: "Pending",
        };
    }
  })();

  const detail = skill.flags[0] ?? skill.evidence[0] ?? "";

  const riskChip = (() => {
    if (!aiRisk) return null;
    const map = {
      low: {
        cls: "bg-teal/10 text-teal",
        icon: <Shield className="h-3 w-3" />,
        label: "AI-resilient",
      },
      moderate: {
        cls: "bg-amber/15 text-amber",
        icon: <Bot className="h-3 w-3" />,
        label: "Some AI risk",
      },
      high: {
        cls: "bg-danger/10 text-danger",
        icon: <Bot className="h-3 w-3" />,
        label: "At AI risk",
      },
    } as const;
    return map[aiRisk.level];
  })();
  const title = [detail, aiRisk?.rationale ? `AI: ${aiRisk.rationale}` : ""]
    .filter(Boolean)
    .join("\n");

  return (
    <div title={title} className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">{skill.name}</span>
        <span className="shrink-0 text-sm font-semibold text-foreground">{skill.score}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}
        >
          {cfg.icon}
          {cfg.label}
        </span>
        {riskChip && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${riskChip.cls}`}
          >
            {riskChip.icon}
            {riskChip.label}
          </span>
        )}
        {skill.verifiedBy && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            via {skill.verifiedBy}
          </span>
        )}
      </div>
    </div>
  );
}

function LaborMarketInsightCard({ insight }: { insight: LocalLaborMarketInsight }) {
  const modeLabel: Record<LocalLaborMarketInsight["commonWorkMode"], string> = {
    mostly_formal: "Mostly formal",
    mixed: "Mixed market",
    mostly_self_employed: "Mostly self-employed",
    mostly_gig: "Mostly gig-based",
    unclear: "Unclear",
  };
  const selfEmploymentTone = insight.selfEmployment.suitable
    ? "bg-teal/10 text-teal"
    : "bg-muted text-muted-foreground";

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground">
            LLM labor-market read
          </div>
          <h3 className="mt-1 font-semibold text-foreground">
            {insight.occupationTitle} in {insight.location}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{insight.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="rounded-full bg-sky/10 px-2.5 py-1 text-xs font-semibold text-sky">
            {modeLabel[insight.commonWorkMode]}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selfEmploymentTone}`}>
            {insight.selfEmployment.suitable
              ? "Freelance route worth showing"
              : "Freelance route weak"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InsightMiniPanel title="Pay expectation">
          <p className="text-sm font-semibold text-foreground">{insight.salaryExpectation.range}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {insight.salaryExpectation.currency} / {insight.salaryExpectation.period}; confidence{" "}
            {insight.salaryExpectation.confidence}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {insight.salaryExpectation.notes}
          </p>
        </InsightMiniPanel>

        <InsightMiniPanel title="Formal work">
          <p className="text-sm font-semibold capitalize text-foreground">
            {insight.formalEmployment.availability}
          </p>
          <CompactList
            items={insight.formalEmployment.typicalEmployers}
            empty="No typical employers identified."
          />
        </InsightMiniPanel>

        <InsightMiniPanel title="Self-employment">
          <p className="text-sm font-semibold capitalize text-foreground">
            {insight.selfEmployment.viability}; confidence {insight.selfEmployment.confidence}
          </p>
          <CompactList
            items={insight.selfEmployment.starterOffers}
            empty="No starter offers identified."
          />
        </InsightMiniPanel>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InsightList title="How the work is done" items={insight.howWorkIsDone} />
        <InsightList title="Customer channels" items={insight.selfEmployment.customerChannels} />
        <InsightList title="Reasons to show freelance" items={insight.selfEmployment.reasons} />
        <InsightList
          title="Risks and barriers"
          items={[...insight.selfEmployment.risks, ...insight.credentialsOrBarriers]}
        />
      </div>

      {insight.evidence.length > 0 && (
        <div className="mt-5 rounded-md bg-muted px-3 py-2">
          <div className="text-xs font-semibold text-foreground">Evidence used</div>
          <CompactList items={insight.evidence} empty="" />
        </div>
      )}
    </div>
  );
}

function InsightMiniPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <CompactList items={items} empty="No details returned." />
    </div>
  );
}

function CompactList({ items, empty }: { items: string[]; empty: string }) {
  const visible = items.filter(Boolean).slice(0, 5);
  if (!visible.length) return <p className="mt-2 text-xs text-muted-foreground">{empty}</p>;

  return (
    <ul className="mt-2 space-y-1.5">
      {visible.map((item) => (
        <li key={item} className="text-xs leading-relaxed text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  );
}

function JobOpportunityMetrics({ insight }: { insight: LocalLaborMarketInsight }) {
  const averagePay = insight.economicMetrics.averagePay;
  const employment = insight.economicMetrics.employmentInAgeGroup;

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="text-xs font-medium uppercase text-muted-foreground">Avg pay in market</div>
        <p className="mt-1 text-sm font-semibold text-foreground">{averagePay.value}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {averagePay.currency} / {averagePay.period}; confidence {averagePay.confidence}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{averagePay.notes}</p>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="text-xs font-medium uppercase text-muted-foreground">
          Employment in age group
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground">{employment.value}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {employment.ageGroup}; confidence {employment.confidence}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{employment.notes}</p>
      </div>
    </div>
  );
}

function LiveJobCard({ job }: { job: JobMatch }) {
  const typeLabel: Record<JobMatch["type"], string> = {
    formal: "Formal employment",
    "self-employment": "Self-employment",
    gig: "Gig",
    training: "Training pathway",
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{job.title}</h3>
          {job.company && <p className="text-sm capitalize text-muted-foreground">{job.company}</p>}
        </div>
        <Badge className="bg-navy/10 text-navy hover:bg-navy/10">{typeLabel[job.type]}</Badge>
      </div>

      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {job.location}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Profile fit</span>
          <span className="font-semibold text-foreground">{job.matchScore}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-teal" style={{ width: `${job.matchScore}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.matchedSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal"
          >
            {skill}
          </span>
        ))}
        {job.missingSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            Check {skill}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{job.gapAnalysis}</p>

      <div className="mt-auto pt-4">
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
        >
          Open listing
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function JobCard({ job, onApply }: { job: JobMatch; onApply: () => void }) {
  const typeLabel: Record<JobMatch["type"], string> = {
    formal: "Formal employment",
    "self-employment": "Self-employment",
    gig: "Gig",
    training: "Training pathway",
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{job.title}</h3>
          {job.company && <p className="text-sm text-muted-foreground">{job.company}</p>}
        </div>
        <Badge className="bg-navy/10 text-navy hover:bg-navy/10">{typeLabel[job.type]}</Badge>
      </div>

      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {job.location}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Match</span>
          <span className="font-semibold text-foreground">{job.matchScore}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-teal" style={{ width: `${job.matchScore}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.matchedSkills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal"
          >
            ✓ {s}
          </span>
        ))}
        {job.missingSkills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{job.gapAnalysis}</p>

      {job.wageRange && <p className="mt-2 text-xs font-medium text-foreground">{job.wageRange}</p>}

      <div className="mt-auto flex items-center justify-between pt-4">
        <Button
          onClick={onApply}
          size="sm"
          className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
        >
          Generate cover letter
        </Button>
        <a
          href={job.sourceUrl}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
        >
          Source <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
