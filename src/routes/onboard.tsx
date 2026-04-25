import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readCandidateSkillProfileJson, type ProfileSnapshot } from "@/services/profileHandler";
import type { CandidateSkillProfile, SkillItem } from "@/types/unmapped";

export const Route = createFileRoute("/onboard")({
  head: () => ({
    meta: [{ title: "Profile review · Unmapped" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    profileId: typeof search.profileId === "string" ? search.profileId : "",
  }),
  component: DynamicOnboarding,
});

const loadProfileSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data: { profileId: string }) => data)
  .handler(async ({ data }) => readCandidateSkillProfileJson(data.profileId));

const ESCO_OCCUPATION_BROWSER_URL = "https://esco.ec.europa.eu/en/classification/occupation-main";
const ISCO_08_BROWSER_URL = "https://isco.ilo.org/en/isco-08/codelist/";

function DynamicOnboarding() {
  const { profileId } = Route.useSearch();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(profileId));
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      setError("No profile was selected.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    loadProfileSnapshot({ data: { profileId } })
      .then((result) => {
        if (!cancelled) setSnapshot(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
        <div className="inline-flex items-center rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading profile
        </div>
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-navy">Profile unavailable</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button asChild className="mt-6 rounded-md bg-navy text-navy-foreground hover:bg-navy/90">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    );
  }

  const profile = snapshot.profile;
  const skills = getAllSkills(profile);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Dynamic profile review
            </div>
            <h1 className="mt-4 text-3xl font-bold text-navy">
              {profile.profile.roleName || "Candidate profile"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {profile.profile.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-navy/10 text-navy hover:bg-navy/10">
                {profile.profile.track}
              </Badge>
              <Badge variant="secondary">{profile.profile.seniority}</Badge>
              <Badge variant="secondary">{profile.profile.confidence} confidence</Badge>
            </div>
          </div>

          <Button
            onClick={() => navigate({ to: "/profile/$id", params: { id: snapshot.profileId } })}
            className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
          >
            Open profile overview
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <FileText className="h-5 w-5" />
            Skills from the filled profile
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {skills.map((skill) => (
              <SkillPreview key={`${skill.category}-${skill.name}`} skill={skill} />
            ))}
            {!skills.length && (
              <p className="text-sm text-muted-foreground">
                No skills were captured yet. Go back to the profile interview and answer a few more
                questions.
              </p>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <BriefcaseBusiness className="h-5 w-5" />
            Profile facts
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <Fact label="Occupation" value={profile.occupation.escoOccupationTitle || profile.occupation.iscoTitle || "Not mapped yet"} />
            <LinkedFact
              label="ESCO"
              value={profile.occupation.escoOccupationTitle || "Open official ESCO occupations"}
              href={
                profile.occupation.escoOccupationUri &&
                isHttpUrl(profile.occupation.escoOccupationUri)
                  ? profile.occupation.escoOccupationUri
                  : ESCO_OCCUPATION_BROWSER_URL
              }
            />
            <LinkedFact
              label="ISCO-08"
              value={
                profile.occupation.iscoCode
                  ? `${profile.occupation.iscoCode} ${profile.occupation.iscoTitle ?? ""}`.trim()
                  : "Open official ISCO-08 list"
              }
              href={ISCO_08_BROWSER_URL}
            />
            <Fact label="Experience" value={formatYears(profile.experience.totalYears)} />
            <Fact label="Industries" value={profile.experience.industries.join(", ") || "Not captured"} />
            <Fact label="Education" value={profile.education.highestLevel || "Not captured"} />
            <Fact label="Saved status" value={snapshot.status} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function SkillPreview({ skill }: { skill: SkillItem }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{skill.name}</h3>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{skill.category}</p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {skill.proficiency || "unknown"}
        </Badge>
      </div>
      {skill.evidence[0] && <p className="mt-3 text-xs text-muted-foreground">{skill.evidence[0]}</p>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value}</div>
    </div>
  );
}

function LinkedFact({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md bg-muted px-3 py-2 hover:bg-muted/80"
    >
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 inline-flex items-center gap-1 text-foreground">
        {value}
        <ExternalLink className="h-3 w-3" />
      </div>
    </a>
  );
}

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function getAllSkills(profile: CandidateSkillProfile) {
  return Object.values(profile.skills).flat();
}

function formatYears(years?: number) {
  if (typeof years !== "number") return "Not captured";
  return `${years} ${years === 1 ? "year" : "years"}`;
}
