import { Bot, Shield, Sparkles, TrendingUp } from "lucide-react";
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

export function AIRiskLens({ profile }: { profile: SkillRiskProfile }) {
  const summary = levelStyles[profile.summary.overallLevel];

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

      {/* Per-skill exposure */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-navy">
          Per-skill exposure
        </h3>
        <div className="mt-3 space-y-3">
          {Object.entries(profile.bySkill).map(([name, risk]) => {
            const s = levelStyles[risk.level];
            return (
              <div
                key={name}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-foreground">{name}</div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.chip}`}
                  >
                    {s.label} · {risk.exposure}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${s.bar}`}
                    style={{ width: `${risk.exposure}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {risk.rationale}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                  Source: {risk.source}
                </p>
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
    </section>
  );
}
