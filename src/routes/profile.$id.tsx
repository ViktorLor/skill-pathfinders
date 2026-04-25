import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  getCandidateById,
  getJobMatchesForTrack,
} from "@/data/mock";
import type { JobMatch, SkillScore, TrackType } from "@/types/unmapped";
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
} from "lucide-react";
import { CoverLetterModal } from "@/components/profile/CoverLetterModal";
import { AIRiskLens } from "@/components/profile/AIRiskLens";
import {
  getRiskProfileForCandidate,
  type SkillAIRisk,
} from "@/data/aiRisk";

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
  const [activeJob, setActiveJob] = useState<JobMatch | null>(null);

  if (!candidate) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-navy">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't find a passport with that id.
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
