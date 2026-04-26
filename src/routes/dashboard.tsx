import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCountry } from "@/context/CountryContext";
import { FEATURED_COUNTRIES } from "@/data/countries.config";
import {
  getEmploymentBySector,
  getLaborForceParticipation,
  getYouthUnemploymentData,
  type EmploymentBySector,
  type IndicatorObservation,
} from "@/services/worldBank";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Users, Briefcase, AlertCircle, Gauge } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Regional Skills Intelligence Dashboard · Unmapped" },
      {
        name: "description",
        content:
          "Live policy view of verified youth skills across Ghana, Bangladesh and Nigeria.",
      },
    ],
  }),
  component: DashboardPage,
});

const TRACK_DISTRIBUTION = [
  { label: "Tech", value: 23, color: "bg-navy" },
  { label: "Trade", value: 51, color: "bg-sky" },
  { label: "Agriculture", value: 26, color: "bg-greenT" },
];

const SKILLS = {
  tech: ["JavaScript", "React", "Python", "Node.js", "SQL"],
  trade: [
    "Phone repair",
    "Customer service",
    "Inventory",
    "Basic accounting",
    "Tailoring",
  ],
  agri: [
    "Crop cultivation",
    "Irrigation",
    "Pest control",
    "Cooperative mgmt",
    "Record keeping",
  ],
};

function DashboardPage() {
  const { country, setCountryCode } = useCountry();
  const [youthUnemployment, setYouthUnemployment] = useState("Loading World Bank data…");
  const [laborForce, setLaborForce] = useState<IndicatorObservation | null>(null);
  const [employmentBySector, setEmploymentBySector] = useState<EmploymentBySector | null>(null);
  const [signalsError, setSignalsError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setYouthUnemployment("Loading World Bank data…");
    setLaborForce(null);
    setEmploymentBySector(null);
    setSignalsError("");

    Promise.all([
      getYouthUnemploymentData(country.wbCountryCode),
      getLaborForceParticipation(country.wbCountryCode),
      getEmploymentBySector(country.wbCountryCode),
    ])
      .then(([youth, lfp, sector]) => {
        if (!isCurrent) return;
        setYouthUnemployment(`${youth.value.toFixed(1)}% (${youth.countryName}, ${youth.year})`);
        setLaborForce(lfp);
        setEmploymentBySector(sector);
      })
      .catch((error) => {
        console.error("Failed to load World Bank econometric signals", error);
        if (!isCurrent) return;
        setSignalsError(
          error instanceof Error ? error.message : "Could not load World Bank data.",
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [country]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Regional Skills Intelligence Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified youth skills + econometric signals from ILO &amp; World
            Bank.
          </p>
        </div>
        <Select value={country.code} onValueChange={setCountryCode}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEATURED_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metric cards */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={<Users className="h-5 w-5 text-navy" />}
          label="Profiles verified this month"
          value="1,247"
        />
        <Metric
          icon={<AlertCircle className="h-5 w-5 text-amber" />}
          label="Youth unemployment"
          value={youthUnemployment}
          sub="World Bank WDI · SL.UEM.1524.ZS"
        />
        <Metric
          icon={<Briefcase className="h-5 w-5 text-sky" />}
          label="Labor force participation (15+)"
          value={
            laborForce
              ? `${laborForce.value.toFixed(1)}% (${laborForce.countryName}, ${laborForce.year})`
              : signalsError || "Loading…"
          }
          sub="World Bank WDI · SL.TLF.CACT.ZS"
        />
        <Metric
          icon={<Gauge className="h-5 w-5 text-greenT" />}
          label="Avg. trust score"
          value="74/100"
        />
      </section>

      {/* Track distribution */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-navy">
          Track distribution
        </h2>
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {TRACK_DISTRIBUTION.map((t) => (
            <div
              key={t.label}
              className={t.color}
              style={{ width: `${t.value}%` }}
              title={`${t.label}: ${t.value}%`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {TRACK_DISTRIBUTION.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${t.color}`} />
              {t.label} {t.value}%
            </span>
          ))}
        </div>
      </section>

      {/* Top skills */}
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SkillsCard
          title="Top tech skills"
          color="border-navy"
          skills={SKILLS.tech}
        />
        <SkillsCard
          title="Top trade skills"
          color="border-sky"
          skills={SKILLS.trade}
        />
        <SkillsCard
          title="Top agri skills"
          color="border-greenT"
          skills={SKILLS.agri}
        />
      </section>

      {/* Econometrics */}
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BarChart
          title={
            employmentBySector
              ? `Employment by sector (%) · ${employmentBySector.countryName} ${employmentBySector.year}`
              : "Employment by sector (loading World Bank…)"
          }
          data={
            employmentBySector
              ? [
                  { label: "Agriculture", value: Math.round(employmentBySector.agriculture) },
                  { label: "Industry", value: Math.round(employmentBySector.industry) },
                  { label: "Services", value: Math.round(employmentBySector.services) },
                ]
              : []
          }
          color="bg-amber"
          unit="%"
          max={100}
        />
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-navy">Live signals · World Bank WDI</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Three indicators load live from{" "}
            <a
              href="https://api.worldbank.org/v2"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sky"
            >
              api.worldbank.org/v2
            </a>{" "}
            for {country.name} on every country switch:
          </p>
          <ul className="mt-4 space-y-2 text-xs">
            <li>
              <span className="font-medium text-foreground">Youth unemployment</span>{" "}
              <span className="text-muted-foreground">(SL.UEM.1524.ZS)</span> ·{" "}
              {youthUnemployment}
            </li>
            <li>
              <span className="font-medium text-foreground">Labor force participation</span>{" "}
              <span className="text-muted-foreground">(SL.TLF.CACT.ZS)</span> ·{" "}
              {laborForce
                ? `${laborForce.value.toFixed(1)}% (${laborForce.year})`
                : "Loading…"}
            </li>
            <li>
              <span className="font-medium text-foreground">Employment by sector</span>{" "}
              <span className="text-muted-foreground">
                (SL.AGR.EMPL.ZS / SL.IND.EMPL.ZS / SL.SRV.EMPL.ZS)
              </span>{" "}
              · {employmentBySector
                ? `agriculture ${Math.round(employmentBySector.agriculture)}%, industry ${Math.round(employmentBySector.industry)}%, services ${Math.round(employmentBySector.services)}% (${employmentBySector.year})`
                : "Loading…"}
            </li>
          </ul>
          {signalsError && (
            <p className="mt-3 rounded-md bg-danger/5 px-3 py-2 text-xs text-danger">
              {signalsError}
            </p>
          )}
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Data represents verified profiles on Unmapped + live World Bank WDI
        econometric signals. World Bank refreshes WDI series annually.
      </p>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-navy">{value}</div>
      {sub && (
        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

function SkillsCard({
  title,
  color,
  skills,
}: {
  title: string;
  color: string;
  skills: string[];
}) {
  return (
    <div className={`rounded-xl border-l-4 ${color} bg-card p-5 shadow-sm`}>
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      <ol className="mt-3 space-y-1.5 text-sm text-foreground">
        {skills.map((s, i) => (
          <li key={s} className="flex items-baseline gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {i + 1}.
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function BarChart({
  title,
  data,
  color,
  unit,
  max,
}: {
  title: string;
  data: { label: string; value: number }[];
  color: string;
  unit: string;
  max: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground">{d.label}</span>
              <span className="font-medium text-muted-foreground">
                {d.value.toLocaleString()}
                {unit}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${color}`}
                style={{ width: `${Math.min(100, (d.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground">
        Source: ILO ILOSTAT + World Bank WDI
      </p>
    </div>
  );
}
