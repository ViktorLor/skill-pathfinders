import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CountryCombobox } from "@/components/CountryCombobox";
import { useCountry } from "@/context/CountryContext";
import { getCountryWdiSnapshot, type WorldBankIndicatorData } from "@/services/worldBank";
import { AlertCircle, Database } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Country Indicators - Unmapped" },
      {
        name: "description",
        content: "Live World Bank WDI indicators for ISO countries.",
      },
    ],
  }),
  component: DashboardPage,
});

type WdiSnapshot = Awaited<ReturnType<typeof getCountryWdiSnapshot>>;

interface LiveBarSignal {
  label: string;
  value: number;
  detail: string;
  sourceUrl: string;
}

function DashboardPage() {
  const { country, setCountryCode } = useCountry();
  const [wdiSnapshot, setWdiSnapshot] = useState<WdiSnapshot>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setWdiSnapshot({});
    setIsLoading(true);
    setLoadError(null);

    getCountryWdiSnapshot(country.wbCountryCode)
      .then((snapshot) => {
        if (!isCurrent) return;
        setWdiSnapshot(snapshot);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load World Bank WDI snapshot", error);
        if (!isCurrent) return;
        setLoadError(
          error instanceof Error ? error.message : "World Bank WDI data could not be loaded.",
        );
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [country.wbCountryCode]);

  const wdiCards = useMemo(() => buildWdiCards(wdiSnapshot), [wdiSnapshot]);
  const wdiSectorShares = useMemo(() => buildWdiSectorShares(wdiSnapshot), [wdiSnapshot]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Live Country Indicators</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only data fetched live from the World Bank WDI service is shown here.
          </p>
        </div>
        <CountryCombobox
          value={country.code}
          onChange={setCountryCode}
          className="w-full sm:w-72"
        />
      </div>

      {loadError && (
        <div className="mt-8 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 font-medium text-navy">
            <AlertCircle className="h-5 w-5 text-amber" />
            {loadError}
          </div>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy">
          <Database className="h-5 w-5 text-teal" />
          World Bank WDI snapshot for {country.name}
        </div>
        {isLoading ? (
          <LoadingState message="Fetching live WDI indicators..." />
        ) : wdiCards.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wdiCards.map((indicator) => (
              <IndicatorCard key={indicator.indicatorId} indicator={indicator} />
            ))}
          </div>
        ) : (
          <EmptyState message="No live WDI indicators were returned for this country." />
        )}
      </section>

      <section className="mt-8">
        <BarChart
          title="Live WDI employment structure"
          data={wdiSectorShares}
          color="bg-navy"
          unit="%"
          max={100}
          isLoading={isLoading}
        />
      </section>
    </main>
  );
}

function IndicatorCard({ indicator }: { indicator: WorldBankIndicatorData }) {
  return (
    <a
      href={indicator.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg bg-muted/50 p-3 transition hover:bg-muted"
    >
      <div className="text-xs text-muted-foreground">{indicator.indicatorName}</div>
      <div className="mt-1 text-lg font-bold text-navy">{formatWdiValue(indicator)}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">
        {indicator.countryName}, {indicator.year}
      </div>
    </a>
  );
}

function BarChart({
  title,
  data,
  color,
  unit,
  max,
  isLoading,
}: {
  title: string;
  data: LiveBarSignal[];
  color: string;
  unit: string;
  max: number;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      {isLoading ? (
        <LoadingState message="Fetching live employment indicators..." />
      ) : data.length > 0 ? (
        <div className="mt-4 space-y-3">
          {data.map((item) => (
            <a
              key={item.label}
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-foreground">{item.label}</span>
                <span className="shrink-0 font-medium text-muted-foreground">
                  {item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  {unit}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${color}`}
                  style={{ width: `${Math.min(100, (item.value / max) * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{item.detail}</div>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState message="No live sector employment indicators were returned for this country." />
      )}
      <p className="mt-4 text-[10px] text-muted-foreground">
        Source: World Bank WDI API. Values are fetched live for the selected country.
      </p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{message}</div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{message}</div>
  );
}

function buildWdiCards(snapshot: WdiSnapshot) {
  return [
    snapshot.youthUnemployment,
    snapshot.laborForceParticipation,
    snapshot.wageAndSalariedShare,
    snapshot.gdpPerCapita,
    snapshot.secondaryEnrollment,
    snapshot.povertyLowerMiddleIncome,
  ].filter(Boolean) as WorldBankIndicatorData[];
}

function buildWdiSectorShares(snapshot: WdiSnapshot): LiveBarSignal[] {
  return [
    ["Agriculture", snapshot.employmentAgriculture],
    ["Industry", snapshot.employmentIndustry],
    ["Services", snapshot.employmentServices],
  ]
    .filter(([, indicator]) => Boolean(indicator))
    .map(([label, indicator]) => {
      const value = indicator as WorldBankIndicatorData;
      return {
        label: String(label),
        value: value.value,
        detail: `${value.countryName}, ${value.year}`,
        sourceUrl: value.sourceUrl,
      };
    });
}

function formatWdiValue(indicator: WorldBankIndicatorData) {
  if (indicator.unit === "US$") {
    return `${indicator.unit}${Math.round(indicator.value).toLocaleString()}`;
  }

  return `${indicator.value.toFixed(1)}${indicator.unit}`;
}
