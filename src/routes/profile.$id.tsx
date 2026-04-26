import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getCandidateById,
  getJobMatchesForTrack,
} from "@/data/mock";
import type {
  CandidateSkillProfile,
  JobMatch,
  SkillItem,
  SkillScore,
  TrackType,
} from "@/types/unmapped";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  MapPin,
  BarChart3,
  TrendingDown,
  ExternalLink,
  Bot,
  Shield,
  RefreshCcw,
  Loader2,
  Search,
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
} from "@/data/aiRisk";
import {
  deleteCandidateSkillProfileJson,
  readCandidateSkillProfileJson,
  type ProfileSnapshot,
} from "@/services/profileHandler";
import { Input } from "@/components/ui/input";
import {
  searchTavilyJobsForProfile,
  type TavilyJobSearchResult,
} from "@/services/tavilyJobs";

export const Route = createFileRoute("/profile/$id")({
  head: ({ params }) => {
    const c = getCandidateById(params.id);
    return {
      meta: [
        {
          title: c
            ? `${c.name} · Skill Passport · Unmapped`
            : "Profile · Unmapped",
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

const ESCO_OCCUPATION_BROWSER_URL = "https://esco.ec.europa.eu/en/classification/occupation-main";
const ISCO_08_BROWSER_URL = "https://isco.ilo.org/en/isco-08/codelist/";

const trackMeta: Record<
  TrackType,
  { label: string; bg: string; text: string; ring: string }
> = {
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

function ProfilePage() {
  const { id } = useParams({ from: "/profile/$id" });
  const candidate = getCandidateById(id);
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

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
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
              <h1 className="text-2xl font-bold text-navy">
                {candidate.name}
              </h1>
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
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${meta.ring}`}
                >
                  {meta.label}
                </span>
                {candidate.escoOccupation && (
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    ESCO {candidate.escoOccupation}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Skill Passport Score
            </span>
            <div
              className={`mt-1 text-5xl font-bold ${trustColor(candidate.trustScore)}`}
            >
              {candidate.trustScore}
              <span className="text-xl text-muted-foreground">/100</span>
            </div>
          </div>
        </div>
      </section>

      <TaxonomySection
        escoTitle={demoOccupation?.title}
        escoUri={undefined}
        iscoCode={demoOccupation?.code}
        iscoTitle={demoOccupation?.title}
      />

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
        <div className="mt-4 space-y-3">
          {candidate.skillScores.map((s) => (
            <SkillRow
              key={s.name}
              skill={s}
              aiRisk={riskProfile?.bySkill[s.name]}
            />
          ))}
        </div>
      </section>

      {/* AI risk lens */}
      {riskProfile && <AIRiskLens profile={riskProfile} />}

      {/* Experience */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Experience</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
          {candidate.experience.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-navy" />
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-foreground">{e.title}</h3>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {e.context}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {e.duration}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {e.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Job matches */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">
          Matched opportunities
        </h2>
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
  const initials = (profile.profile.roleName || "Candidate")
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
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-navy text-xl font-bold text-navy-foreground">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">
                {profile.profile.roleName || "Candidate profile"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {profile.profile.summary}
              </p>
              {profile.location && (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-medium capitalize text-navy">
                  {profile.profile.track}
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                  {profile.profile.seniority}
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  Employed: {profile.experience.hasJob ? "Yes" : "No"}
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  Relocate: {profile.willingToRelocate ? "Yes" : "No"}
                </span>
                {(profile.occupation.escoOccupationTitle || profile.occupation.iscoTitle) && (
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    {profile.occupation.escoOccupationTitle || profile.occupation.iscoTitle}
                  </span>
                )}
              </div>
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
      </section>

      <TaxonomySection
        escoTitle={profile.occupation.escoOccupationTitle}
        escoCode={profile.occupation.escoOccupationCode}
        escoUri={profile.occupation.escoOccupationUri}
        iscoCode={profile.occupation.iscoCode}
        iscoTitle={profile.occupation.iscoTitle}
        alternatives={profile.occupation.alternativeOccupationMatches}
      />

      {isIsoAlpha3 && (
        <section className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-sky/10 px-4 py-3 text-xs text-foreground">
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Skills from profile</h2>
        <div className="mt-4 space-y-3">
          {skills.map((skill) => (
            <DynamicSkillRow
              key={`${skill.category}-${skill.name}`}
              skill={skill}
              aiRisk={riskProfile.bySkill[skill.name]}
            />
          ))}
          {!skills.length && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              No skills were captured in this profile yet.
            </div>
          )}
        </div>
      </section>

      {skills.length > 0 && <AIRiskLens profile={riskProfile} />}

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <ProfileList
          title="Experience"
          items={[
            ...profile.experience.jobTitles,
            ...profile.experience.responsibilities,
            ...profile.experience.achievements,
          ]}
          empty="No experience details captured yet."
        />
        <ProfileList
          title="Education and training"
          items={[
            profile.education.highestLevel,
            ...profile.education.degrees,
            ...profile.education.certifications,
            ...profile.education.trainings,
          ].filter((v): v is string => Boolean(v))}
          empty="No education or training details captured yet."
        />
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy">Local job finder</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use Tavily to search current openings that fit this ESCO skill profile.
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

            {jobSearch && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">Tavily query: {jobSearch.query}</div>
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
    </main>
  );
}

function TaxonomySection({
  escoTitle,
  escoCode,
  escoUri,
  iscoCode,
  iscoTitle,
  alternatives = [],
}: {
  escoTitle?: string;
  escoCode?: string;
  escoUri?: string;
  iscoCode?: string;
  iscoTitle?: string;
  alternatives?: CandidateSkillProfile["occupation"]["alternativeOccupationMatches"];
}) {
  const hasPrimary = Boolean(escoTitle || escoUri || iscoCode || iscoTitle);
  const displayEscoCode = escoCode || deriveEscoCode(escoUri);

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">Official occupation classification</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The candidate occupation is shown against ESCO and ISCO-08 where a mapping is available.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OfficialLink href={ESCO_OCCUPATION_BROWSER_URL} label="ESCO browser" />
          <OfficialLink href={ISCO_08_BROWSER_URL} label="ISCO-08 browser" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TaxonomyCard
          label="ESCO occupation"
          title={escoTitle || "Not mapped yet"}
          code={displayEscoCode}
          href={escoUri && isHttpUrl(escoUri) ? escoUri : ESCO_OCCUPATION_BROWSER_URL}
          linkLabel="Open official ESCO"
        />
        <TaxonomyCard
          label="ISCO-08 occupation group"
          title={iscoTitle || "Not mapped yet"}
          code={iscoCode}
          href={ISCO_08_BROWSER_URL}
          linkLabel="Open official ISCO-08 list"
        />
      </div>

      {!hasPrimary && (
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          No official ESCO or ISCO mapping has been saved for this profile yet.
        </p>
      )}

      {alternatives.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">Alternative occupation matches</h3>
          <div className="mt-2 grid gap-2">
            {alternatives.slice(0, 3).map((match) => (
              <div
                key={`${match.title}-${match.iscoCode ?? match.escoUri ?? match.reason}`}
                className="rounded-md bg-muted px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{match.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(match.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{match.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TaxonomyCard({
  label,
  title,
  code,
  href,
  linkLabel,
}: {
  label: string;
  title: string;
  code?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 font-semibold text-foreground">{title}</div>
      {code && <div className="mt-1 break-all text-xs text-muted-foreground">{code}</div>}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-teal"
      >
        {linkLabel}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function OfficialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function deriveEscoCode(uri?: string) {
  if (!uri) return undefined;

  const parts = uri.split(/[\/#]/).filter(Boolean);
  return parts.at(-1);
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
  const score = skill.confidence === "high" ? 86 : skill.confidence === "medium" ? 68 : 45;
  const evidence = skill.evidence[0] ?? "Captured from the CV/profile interview.";
  const chip = aiRisk ? DYNAMIC_RISK_CHIP[aiRisk.level] : null;
  const ChipIcon = chip?.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{skill.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
            {skill.category}
          </span>
          {skill.proficiency && (
            <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-teal">
              {skill.proficiency}
            </span>
          )}
          {chip && ChipIcon && (
            <span
              title={aiRisk?.rationale}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip.cls}`}
            >
              <ChipIcon className="h-3 w-3" />
              {chip.label}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold capitalize text-foreground">
          {skill.confidence}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-teal" style={{ width: `${score}%` }} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{evidence}</p>
    </div>
  );
}

function ProfileList({
  title,
  items,
  empty,
  compact = false,
}: {
  title: string;
  items: string[];
  empty: string;
  compact?: boolean;
}) {
  const visibleItems = items.filter(Boolean);

  return (
    <div className={compact ? "" : "rounded-xl border border-border bg-card p-6"}>
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <div className="mt-3 space-y-2">
        {visibleItems.map((item) => (
          <div key={item} className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            {item}
          </div>
        ))}
        {!visibleItems.length && <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

function SkillRow({
  skill,
  aiRisk,
}: {
  skill: SkillScore;
  aiRisk?: SkillAIRisk;
}) {
  const cfg = (() => {
    switch (skill.status) {
      case "confirmed":
        return {
          bar: "bg-teal",
          badge: "bg-teal/10 text-teal",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: "Confirmed",
        };
      case "partial":
        return {
          bar: "bg-amber",
          badge: "bg-amber/15 text-amber",
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          label: "Partial",
        };
      case "no_evidence":
        return {
          bar: "bg-danger",
          badge: "bg-danger/10 text-danger",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "No evidence",
        };
      case "challenged":
        return {
          bar: "bg-purpleT",
          badge: "bg-purpleT/10 text-purpleT",
          icon: <Star className="h-3.5 w-3.5" />,
          label: "Challenge-verified",
        };
      default:
        return {
          bar: "bg-muted-foreground",
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

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{skill.name}</span>
          {riskChip && (
            <span
              title={aiRisk?.rationale}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskChip.cls}`}
            >
              {riskChip.icon}
              {riskChip.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {skill.score}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}
          >
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${cfg.bar}`}
          style={{ width: `${skill.score}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {detail && (
          <p className="text-xs text-muted-foreground">{detail}</p>
        )}
        {skill.verifiedBy && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            via {skill.verifiedBy}
          </span>
        )}
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

function JobCard({
  job,
  onApply,
}: {
  job: JobMatch;
  onApply: () => void;
}) {
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
          {job.company && (
            <p className="text-sm text-muted-foreground">{job.company}</p>
          )}
        </div>
        <Badge className="bg-navy/10 text-navy hover:bg-navy/10">
          {typeLabel[job.type]}
        </Badge>
      </div>

      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {job.location}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Match</span>
          <span className="font-semibold text-foreground">
            {job.matchScore}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-teal"
            style={{ width: `${job.matchScore}%` }}
          />
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

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {job.gapAnalysis}
      </p>

      {job.wageRange && (
        <p className="mt-2 text-xs font-medium text-foreground">
          {job.wageRange}
        </p>
      )}

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
