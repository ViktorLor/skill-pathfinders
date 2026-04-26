import { useState } from "react";
import { Bot, ChevronDown, ChevronUp, Shield, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { SkillRiskProfile, AIRiskLevel } from "@/data/aiRisk";

const levelStyles: Record<
  AIRiskLevel,
  { bar: string; chip: string; label: string }
> = {
  low: {
    bar: "bg-teal",
    chip: "bg-teal/10 text-teal",
    label: "Low AI risk",
  },
  moderate: {
    bar: "bg-amber",
    chip: "bg-amber/15 text-amber",
    label: "Moderate AI risk",
  },
  high: {
    bar: "bg-danger",
    chip: "bg-danger/10 text-danger",
    label: "High AI risk",
  },
};

const outlookStyles: Record<
  NonNullable<SkillRiskProfile["bySkill"][string]["outlook"]>,
  { chip: string; icon: typeof TrendingUp; label: string }
> = {
  rising: {
    chip: "bg-greenT/10 text-greenT",
    icon: TrendingUp,
    label: "Rising 2025–35",
  },
  stable: {
    chip: "bg-muted text-muted-foreground",
    icon: TrendingUp,
    label: "Stable 2025–35",
  },
  declining: {
    chip: "bg-danger/10 text-danger",
    icon: TrendingDown,
    label: "Declining 2025–35",
  },
};

export function AIRiskLens({ profile }: { profile: SkillRiskProfile }) {
  const summary = levelStyles[profile.summary.overallLevel];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const riskEntries = Object.entries(profile.bySkill);
  const indexedSkillCount = profile.indexedSkillCount ?? riskEntries.length;
  const totalSkillCount = profile.totalSkillCount ?? riskEntries.length;
  const unindexedSkills = profile.unindexedSkills ?? [];

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/10 text-navy">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy">
              AI readiness &amp; displacement risk
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Calibrated for LMIC labor markets using Frey-Osborne automation
              probabilities, ILO task indices and World Bank STEP. Outlook
              uses Wittgenstein Centre 2025–2035 projections.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${summary.chip}`}
        >
          <Shield className="h-3.5 w-3.5" />
          Overall: {summary.label} · {profile.summary.overallExposure}/100
        </span>
      </div>

      <p className="mt-4 rounded-lg bg-muted/60 px-4 py-3 text-sm text-foreground">
        {profile.summary.headline}
      </p>

      {totalSkillCount > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-background px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground">
              Directly indexed skills: {indexedSkillCount}/{totalSkillCount}
            </p>
            {unindexedSkills.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                Unmatched skills stay in the profile-level estimate only.
              </span>
            )}
          </div>
          {unindexedSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unindexedSkills.slice(0, 10).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
              {unindexedSkills.length > 10 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  +{unindexedSkills.length - 10} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Per-skill exposure */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-navy">
          Matched per-skill exposure
        </h3>
        <div className="mt-3 space-y-3">
          {riskEntries.length === 0 && (
            <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              No extracted skills matched a direct automation or occupation
              index yet. The overall view uses the candidate's track,
              categories and 2025â€“2035 trajectory instead.
            </div>
          )}
          {riskEntries.map(([name, risk]) => {
            const s = levelStyles[risk.level];
            const outlook = risk.outlook ? outlookStyles[risk.outlook] : null;
            const OutlookIcon = outlook?.icon;
            const showBaseline =
              typeof risk.baselineExposure === "number" &&
              risk.baselineExposure !== risk.exposure;
            const deltaPct =
              typeof risk.changeIndex === "number"
                ? Math.round(risk.changeIndex * 100)
                : null;
            return (
              <div
                key={name}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{name}</span>
                    {outlook && OutlookIcon && (
                      <span
                        title={risk.outlookNote}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${outlook.chip}`}
                      >
                        <OutlookIcon className="h-3 w-3" />
                        {outlook.label}
                        {deltaPct !== null && deltaPct !== 0 && (
                          <span className="font-bold">
                            {" "}
                            {deltaPct > 0 ? "+" : ""}
                            {deltaPct}%
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.chip}`}
                  >
                    {s.label} · {risk.exposure}
                    {showBaseline && (
                      <span className="text-muted-foreground">
                        {" "}
                        (US baseline {risk.baselineExposure})
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${s.bar}`}
                    style={{ width: `${risk.exposure}%` }}
                  />
                </div>
                {risk.headline && (
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {risk.headline}
                  </p>
                )}
                {risk.chips && risk.chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {risk.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleExpanded(name)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-navy"
                  aria-expanded={expanded.has(name)}
                >
                  {expanded.has(name) ? (
                    <>
                      Hide sources <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Show sources <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
                {expanded.has(name) && (
                  <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {risk.rationale}
                    </p>
                    {risk.outlookNote && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {risk.outlookNote}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                      Source: {risk.source}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column: resilient + adjacent */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-teal/30 bg-teal/5 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-navy">
              Your resilient skills
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Skills you already have that are unlikely to be displaced by AI in
            the next decade.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.resilient.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-1 text-[11px] font-medium text-teal"
              >
                <Shield className="h-3 w-3" />
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-sky/30 bg-sky/5 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky" />
            <h3 className="text-sm font-semibold text-navy">
              Adjacent skills to learn
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Close to what you already do — small step to learn, big resilience
            gain.
          </p>
          <ul className="mt-3 space-y-2.5">
            {profile.adjacent.map((a) => (
              <li
                key={a.name}
                className="rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {a.name}
                  </span>
                  {a.outlook === "rising" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-greenT/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-greenT">
                      <TrendingUp className="h-3 w-3" />
                      Rising 2025–35
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {a.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {profile.trajectory && (
        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 text-navy" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-navy">
                Landscape 2025 → 2035
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {profile.trajectory.summary}
              </p>
            </div>
          </div>

          {(profile.trajectory.rising.length > 0 ||
            profile.trajectory.declining.length > 0) && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {profile.trajectory.rising.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-greenT">
                    Rising clusters in your portfolio
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {profile.trajectory.rising.map((t) => (
                      <li
                        key={`r-${t.skill}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-greenT/5 px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {t.skill}
                        </span>
                        <span className="inline-flex items-center gap-1 text-greenT">
                          <TrendingUp className="h-3 w-3" />
                          +{Math.round(t.changeIndex * 100)}% by 2035
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.trajectory.declining.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-danger">
                    Declining clusters in your portfolio
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {profile.trajectory.declining.map((t) => (
                      <li
                        key={`d-${t.skill}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-danger/5 px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {t.skill}
                        </span>
                        <span className="inline-flex items-center gap-1 text-danger">
                          <TrendingDown className="h-3 w-3" />
                          {Math.round(t.changeIndex * 100)}% by 2035
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground/80">
            Source: Wittgenstein Centre Human Capital Data Explorer (SSP2,
            2025–2035)
          </p>
        </div>
      )}
    </section>
  );
}
