import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCountry } from "@/context/CountryContext";
import { getYouthUnemploymentData } from "@/services/worldBank";
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

const UNEMP_BY_SECTOR = [
  { label: "ICT", value: 12 },
  { label: "Trade & Retail", value: 18 },
  { label: "Agriculture", value: 34 },
  { label: "Construction", value: 22 },
  { label: "Textiles", value: 15 },
];

const WAGE_BY_OCC = [
  { label: "Software dev (2512)", value: 2400 },
  { label: "Electronics repair (7521)", value: 980 },
  { label: "Field crop farmer (6111)", value: 600 },
  { label: "Tailor (7531)", value: 850 },
];

function DashboardPage() {
  const { country, setCountryCode } = useCountry();
  const [youthUnemployment, setYouthUnemployment] = useState(
    country.youthUnemployment ?? "Loading World Bank data...",
  );

  useEffect(() => {
    let isCurrent = true;
    setYouthUnemployment(country.youthUnemployment ?? "Loading World Bank data...");

    getYouthUnemploymentData(country.wbCountryCode)
      .then((data) => {
        if (!isCurrent) return;
        setYouthUnemployment(
          `${data.value.toFixed(1)}% (${data.countryName}, ${data.year})`,
        );
      })
      .catch((error) => {
        console.error("Failed to load World Bank youth unemployment", error);
        if (!isCurrent) return;
        setYouthUnemployment(country.youthUnemployment ?? "Data unavailable");
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
        <Select
          value={country.code}
          onValueChange={(v) => setCountryCode(v as "GHA" | "BGD" | "NGA")}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GHA">🇬🇭 Ghana</SelectItem>
            <SelectItem value="BGD">🇧🇩 Bangladesh</SelectItem>
            <SelectItem value="NGA">🇳🇬 Nigeria</SelectItem>
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
          icon={<Briefcase className="h-5 w-5 text-sky" />}
          label="Most common occupation"
          value="Electronics Repair"
          sub="ESCO 7521"
        />
        <Metric
          icon={<AlertCircle className="h-5 w-5 text-amber" />}
          label="Youth unemployment"
          value={youthUnemployment}
          sub="World Bank WDI"
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
          title="Youth unemployment by sector (%)"
          data={UNEMP_BY_SECTOR}
          color="bg-amber"
          unit="%"
          max={40}
        />
        <BarChart
          title={`Avg. wage by occupation (${country.currency}/mo)`}
          data={WAGE_BY_OCC}
          color="bg-teal"
          unit=""
          max={2800}
        />
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Data represents verified profiles on Unmapped + ILO/World Bank
        econometric signals. Updated monthly.
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
