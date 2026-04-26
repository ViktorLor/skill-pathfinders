import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CountryCombobox } from "@/components/CountryCombobox";
import { useCountry } from "@/context/CountryContext";
import {
  getPolicyOccupationProfileGroup,
  getPolicyProfileAggregates,
  type PolicyAggregateRow,
  type PolicyOccupationProfileGroup,
  type PolicyProfileAggregates,
} from "@/services/policyAggregates";
import { getCountryWdiSnapshot, getReturnsToEducation, type ReturnsToEducation, type WorldBankIndicatorData } from "@/services/worldBank";
import type { CountryConfig } from "@/types/unmapped";
import {
  AlertCircle,
  Briefcase,
  Database,
  ExternalLink,
  Heart,
  ListChecks,
  Sparkles,
  Users,
} from "lucide-react";

const loadPolicyProfileAggregates = createServerFn({ method: "GET" }).handler(() =>
  getPolicyProfileAggregates(),
);

const loadPolicyOccupationProfileGroup = createServerFn({ method: "POST" })
  .inputValidator((data: { iscoCode: string; onlyUnemployed?: boolean }) => data)
  .handler(async ({ data }) => getPolicyOccupationProfileGroup(data));

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
type DashboardView = "youth" | "policymaker";

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
  const [view, setView] = useState<DashboardView>("youth");
  const [returnsToEducation, setReturnsToEducation] = useState<ReturnsToEducation | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setWdiSnapshot({});
    setIsLoading(true);
    setLoadError(null);
    setReturnsToEducation(null);

    Promise.allSettled([
      getCountryWdiSnapshot(country.wbCountryCode),
      getReturnsToEducation(country.wbCountryCode),
    ]).then(([snapshotResult, educationResult]) => {
        if (!isCurrent) return;
        if (snapshotResult.status === "fulfilled") {
          setWdiSnapshot(snapshotResult.value);
        } else {
          setLoadError(
            snapshotResult.reason instanceof Error
              ? snapshotResult.reason.message
              : "World Bank WDI data could not be loaded.",
          );
        }
        if (educationResult.status === "fulfilled") {
          setReturnsToEducation(educationResult.value);
        }
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
          <h1 className="text-2xl font-bold text-navy">
            {view === "youth"
              ? "Your country at a glance"
              : "Regional Skills Intelligence Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "youth"
              ? "Live signals from the World Bank, framed for someone planning their work."
              : "Aggregate WDI signals with full source attribution for policy and program teams."}
          </p>
        </div>
        <CountryCombobox
          value={country.code}
          onChange={setCountryCode}
          className="w-full sm:w-72"
        />
      </div>

      <ViewToggle value={view} onChange={setView} />

      {loadError && (
        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 font-medium text-navy">
            <AlertCircle className="h-5 w-5 text-amber" />
            {loadError}
          </div>
        </div>
      )}

      {view === "youth" ? (
        <YouthView
          country={country}
          snapshot={wdiSnapshot}
          sectorShares={wdiSectorShares}
          isLoading={isLoading}
        />
      ) : (
        <PolicymakerView
          country={country}
          cards={wdiCards}
          sectorShares={wdiSectorShares}
          snapshot={wdiSnapshot}
          isLoading={isLoading}
          returnsToEducation={returnsToEducation}
        />
      )}
    </main>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: DashboardView;
  onChange: (v: DashboardView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard audience"
      className="mt-6 inline-flex rounded-lg border border-border bg-muted/40 p-1"
    >
      <ToggleButton
        active={value === "youth"}
        onClick={() => onChange("youth")}
        icon={<Heart className="h-4 w-4" />}
        label="Youth view"
        sub="For someone like me"
      />
      <ToggleButton
        active={value === "policymaker"}
        onClick={() => onChange("policymaker")}
        icon={<Briefcase className="h-4 w-4" />}
        label="Policymaker view"
        sub="Aggregate signals"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition ${
        active
          ? "bg-card text-navy shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="flex flex-col items-start leading-tight">
        <span className="font-semibold">{label}</span>
        <span className="text-[10px] font-normal text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

// --- Youth view --------------------------------------------------------------

function YouthView({
  country,
  snapshot,
  sectorShares,
  isLoading,
}: {
  country: CountryConfig;
  snapshot: WdiSnapshot;
  sectorShares: LiveBarSignal[];
  isLoading: boolean;
}) {
  const youthUnemp = snapshot.youthUnemployment;
  const wageShare = snapshot.wageAndSalariedShare;
  const labor = snapshot.laborForceParticipation;
  const sectorInterpretation = useMemo(
    () => interpretSectorShares(country.name, sectorShares),
    [country.name, sectorShares],
  );

  return (
    <>
      <section className="mt-6 rounded-xl border border-teal/30 bg-teal/5 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-teal" />
          <div>
            <h2 className="text-base font-semibold text-navy">
              What this means for you
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {isLoading
                ? `Loading the latest signals from the World Bank for ${country.name}…`
                : composeYouthCallout(country.name, youthUnemp, wageShare)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <YouthFact
          label="Young people without a job"
          value={
            youthUnemp
              ? `${youthUnemp.value.toFixed(1)}%`
              : isLoading
                ? "Loading…"
                : "Not available"
          }
          plain={
            youthUnemp
              ? `In ${country.name}, about ${formatRoundedPct(youthUnemp.value)} of people aged 15–24 who want a job don't have one yet (${youthUnemp.year}).`
              : "World Bank youth unemployment data isn't available for this country right now."
          }
        />
        <YouthFact
          label="Workers with formal pay"
          value={
            wageShare
              ? `${wageShare.value.toFixed(1)}%`
              : isLoading
                ? "Loading…"
                : "Not available"
          }
          plain={
            wageShare
              ? `Roughly ${formatRoundedPct(wageShare.value)} of workers in ${country.name} have wage or salaried employment (${wageShare.year}). Most of the rest run their own work, day-to-day or seasonal.`
              : "World Bank formal-wage share isn't available for this country right now."
          }
        />
        <YouthFact
          label="People active in the workforce"
          value={
            labor
              ? `${labor.value.toFixed(1)}%`
              : isLoading
                ? "Loading…"
                : "Not available"
          }
          plain={
            labor
              ? `${formatRoundedPct(labor.value)} of adults in ${country.name} are working or actively looking for work (${labor.year}).`
              : "World Bank labor force participation isn't available for this country right now."
          }
        />
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy">
          Where the jobs are in {country.name}
        </h3>
        {isLoading ? (
          <LoadingState message="Fetching live employment indicators…" />
        ) : sectorShares.length > 0 ? (
          <>
            <div className="mt-4 space-y-3">
              {sectorShares.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-foreground">{item.label}</span>
                    <span className="shrink-0 font-medium text-muted-foreground">
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-navy"
                      style={{ width: `${Math.min(100, item.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-foreground">
              {sectorInterpretation}
            </p>
          </>
        ) : (
          <EmptyState message="No live sector employment indicators were returned for this country." />
        )}
      </section>
    </>
  );
}

function YouthFact({
  label,
  value,
  plain,
}: {
  label: string;
  value: string;
  plain: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-navy">{value}</div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plain}</p>
    </div>
  );
}

// --- Policymaker view --------------------------------------------------------

function PolicymakerView({
  country,
  cards,
  sectorShares,
  snapshot,
  isLoading,
  returnsToEducation,
}: {
  country: CountryConfig;
  cards: WorldBankIndicatorData[];
  sectorShares: LiveBarSignal[];
  snapshot: WdiSnapshot;
  isLoading: boolean;
  returnsToEducation: ReturnsToEducation | null;
}) {
  const [profileAggregates, setProfileAggregates] = useState<PolicyProfileAggregates | null>(null);
  const [aggregateError, setAggregateError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PolicyOccupationProfileGroup | null>(null);
  const [selectedGroupError, setSelectedGroupError] = useState<string | null>(null);
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setAggregateError(null);

    loadPolicyProfileAggregates()
      .then((aggregates) => {
        if (!isCurrent) return;
        setProfileAggregates(aggregates);
      })
      .catch((error) => {
        console.error("Failed to load policy profile aggregates", error);
        if (!isCurrent) return;
        setAggregateError(
          error instanceof Error ? error.message : "Profile aggregates could not be loaded.",
        );
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function handleSelectUnemployedGroup(row: PolicyAggregateRow) {
    setSelectedGroup(null);
    setSelectedGroupError(null);
    setIsGroupLoading(true);

    loadPolicyOccupationProfileGroup({
      data: { iscoCode: row.iscoCode, onlyUnemployed: true },
    })
      .then((group) => {
        setSelectedGroup(group);
        setIsGroupLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load occupation profile group", error);
        setSelectedGroupError(
          error instanceof Error ? error.message : "Occupation profile group could not be loaded.",
        );
        setIsGroupLoading(false);
      });
  }

  return (
    <>
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={<Users className="h-5 w-5 text-navy" />}
          label="Profiles in aggregate"
          value={formatCount(profileAggregates?.totalProfiles)}
          sub={profileAggregates?.sourceLabel ?? "Loading platform aggregate"}
        />
        <Metric
          icon={<Database className="h-5 w-5 text-teal" />}
          label="Unique ISCO/ESCO profiles"
          value={formatCount(profileAggregates?.uniqueOccupations)}
          sub="Grouped by normalized occupation"
        />
        <Metric
          icon={<Briefcase className="h-5 w-5 text-amber" />}
          label="Not employed"
          value={formatCount(profileAggregates?.unemployedProfiles)}
          sub="Filtered from profiles shown"
        />
        <Metric
          icon={<ListChecks className="h-5 w-5 text-navy" />}
          label="Ranked lists"
          value={profileAggregates ? `Top ${profileAggregates.rowLimit}` : "Loading"}
          sub="No individual profile data shown"
        />
      </section>

      {selectedGroup || isGroupLoading || selectedGroupError ? (
        <OccupationProfileGroupView
          group={selectedGroup}
          error={selectedGroupError}
          isLoading={isGroupLoading}
          onBack={() => {
            setSelectedGroup(null);
            setSelectedGroupError(null);
            setIsGroupLoading(false);
          }}
        />
      ) : (
        <ProfileAggregateSection
          aggregates={profileAggregates}
          error={aggregateError}
          onSelectUnemployedGroup={handleSelectUnemployedGroup}
        />
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          title="Live WDI employment structure"
          data={sectorShares}
          color="bg-navy"
          unit="%"
          max={100}
          isLoading={isLoading}
        />
        <ReturnsToEducationCard data={returnsToEducation} isLoading={isLoading} />
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-navy">All loaded WDI signals</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Every value below is fetched live from the World Bank Indicators API for{" "}
          {country.name} when you switch country.
        </p>
        {isLoading ? (
          <LoadingState message="Fetching live WDI indicators…" />
        ) : cards.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Indicator</th>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-right font-medium">Year</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((indicator) => (
                  <tr key={indicator.indicatorId} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{indicator.indicatorName}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {indicator.indicatorId}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-foreground">
                      {formatWdiValue(indicator)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {indicator.year}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={indicator.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-navy hover:text-teal"
                      >
                        api.worldbank.org
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No live WDI indicators were returned for this country." />
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">
          Source: World Bank Indicators API · https://api.worldbank.org/v2 · WDI series
          refreshed annually.
        </p>
      </section>
    </>
  );
}

function ProfileAggregateSection({
  aggregates,
  error,
  onSelectUnemployedGroup,
}: {
  aggregates: PolicyProfileAggregates | null;
  error: string | null;
  onSelectUnemployedGroup: (row: PolicyAggregateRow) => void;
}) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AggregateList
        title="Aggregate: all profiles"
        description="Most common occupation groups among the profiles shown."
        rows={aggregates?.iscoEscoTop10 ?? []}
        valueLabel="Profiles"
        valueKey="profiles"
        rowLimit={aggregates?.rowLimit ?? 10}
        isLoading={!aggregates && !error}
        error={error}
      />
      <AggregateList
        title="Aggregate: not employed profiles"
        description="Occupation groups after filtering to profiles marked not currently employed."
        rows={aggregates?.unemploymentTop10 ?? []}
        valueLabel="Not employed"
        valueKey="unemployedProfiles"
        rowLimit={aggregates?.rowLimit ?? 10}
        onRowClick={onSelectUnemployedGroup}
        isLoading={!aggregates && !error}
        error={error}
      />
    </section>
  );
}

function AggregateList({
  title,
  description,
  rows,
  valueLabel,
  valueKey,
  rowLimit,
  onRowClick,
  isLoading,
  error,
}: {
  title: string;
  description: string;
  rows: PolicyAggregateRow[];
  valueLabel: string;
  valueKey: "profiles" | "unemployedProfiles";
  rowLimit: number;
  onRowClick?: (row: PolicyAggregateRow) => void;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Top {rowLimit}
        </span>
      </div>
      {isLoading ? (
        <LoadingState message="Fetching profile aggregates..." />
      ) : error ? (
        <EmptyState message={error} />
      ) : rows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Profile group</th>
                <th className="px-3 py-2 text-right font-medium">{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${title}-${row.code}`} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-muted-foreground">{row.rank}</td>
                  <td className="px-3 py-2">
                    {onRowClick ? (
                      <button
                        type="button"
                        onClick={() => onRowClick(row)}
                        className="text-left font-medium text-navy underline-offset-2 hover:text-teal hover:underline"
                      >
                        {row.title}
                      </button>
                    ) : (
                      <div className="font-medium text-foreground">{row.title}</div>
                    )}
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {row.code} · {row.shareLabel}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-navy">
                    {row[valueKey].toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No aggregate profile rows are available yet." />
      )}
    </div>
  );
}

function OccupationProfileGroupView({
  group,
  error,
  isLoading,
  onBack,
}: {
  group: PolicyOccupationProfileGroup | null;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
}) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-navy underline-offset-2 hover:text-teal hover:underline"
          >
            Back to aggregates
          </button>
          <h3 className="mt-3 text-base font-semibold text-navy">
            {group ? group.title : "Occupation group"}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {group ? `ISCO ${group.iscoCode}` : "Loading ISCO group"}
          </p>
        </div>
        {group && (
          <div className="grid grid-cols-2 gap-2 text-right text-xs sm:min-w-64">
            <div className="rounded-md bg-muted/60 px-3 py-2">
              <div className="text-muted-foreground">Profiles shown</div>
              <div className="mt-1 text-lg font-bold text-navy">
                {group.totalProfiles.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md bg-muted/60 px-3 py-2">
              <div className="text-muted-foreground">Not employed</div>
              <div className="mt-1 text-lg font-bold text-navy">
                {group.unemployedProfiles.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Fetching candidates in this occupation group..." />
      ) : error ? (
        <EmptyState message={error} />
      ) : group && group.candidates.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 text-right font-medium">Experience</th>
                <th className="px-3 py-2 text-right font-medium">Education skill</th>
                <th className="px-3 py-2 text-right font-medium">Relocation</th>
                <th className="px-3 py-2 text-right font-medium">Profile</th>
              </tr>
            </thead>
            <tbody>
              {group.candidates.map((candidate) => (
                <tr key={candidate.profileId} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">
                    {candidate.fullName}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {[candidate.location, candidate.country].filter(Boolean).join(", ") ||
                      "Unknown"}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {candidate.yearsExperience.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}{" "}
                    yrs
                  </td>
                  <td className="px-3 py-2 text-right capitalize text-muted-foreground">
                    {candidate.educationSkillLevel.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {candidate.willingToRelocate ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <a
                      href={`/profile/${candidate.profileId}`}
                      className="inline-flex items-center justify-end gap-1 text-navy hover:text-teal"
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No not-employed candidates are shown for this occupation group." />
      )}
    </section>
  );
}

function PolicyMetric({ indicator }: { indicator: WorldBankIndicatorData }) {
  return (
    <a
      href={indicator.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-border bg-card p-5 transition hover:bg-muted/40"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {indicator.indicatorName}
      </div>
      <div className="mt-2 text-2xl font-bold text-navy">{formatWdiValue(indicator)}</div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
        {indicator.indicatorId} · {indicator.countryName}, {indicator.year}
      </div>
    </a>
  );
}

function GdpCard({
  indicator,
  isLoading,
}: {
  indicator?: WorldBankIndicatorData;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-navy">GDP per capita</h3>
      {isLoading ? (
        <LoadingState message="Fetching GDP per capita…" />
      ) : indicator ? (
        <>
          <div className="mt-3 text-3xl font-bold text-navy">{formatWdiValue(indicator)}</div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            {indicator.indicatorId} · {indicator.countryName}, {indicator.year}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            World Bank reports the most recent observation only via this endpoint;
            historical series are fetched on demand and not cached client-side.
          </p>
          <a
            href={indicator.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy hover:text-teal"
          >
            Open World Bank series
            <ExternalLink className="h-3 w-3" />
          </a>
        </>
      ) : (
        <EmptyState message="GDP per capita is not available for this country." />
      )}
    </div>
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
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-navy">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// --- Shared --------------------------------------------------------------------

function IndicatorCard({ indicator }: { indicator: WorldBankIndicatorData }) {
  return (
    <a
      href={indicator.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg bg-muted/50 p-3 transition hover:bg-muted"
    >
      <div className="text-xs text-muted-foreground">
        {indicator.indicatorName}{" "}
        <span className="font-mono text-[10px] text-muted-foreground/70">
          ({indicator.indicatorId})
        </span>
      </div>
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
        <LoadingState message="Fetching live employment indicators…" />
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

function ReturnsToEducationCard({
  data,
  isLoading,
}: {
  data: ReturnsToEducation | null;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy">Returns to education</h3>
        {data && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
          >
            World Bank WDI
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Labour force participation rate by education attainment — a direct signal of wage returns to
        staying in school longer.
      </p>
      {isLoading ? (
        <LoadingState message="Fetching education attainment indicators…" />
      ) : data ? (
        <>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {data.countryName}, {data.year} · SL.TLF.BASC/INTM/ADVN.ZS
          </p>
          <div className="mt-4 space-y-3">
            {(
              [
                { label: "Basic (primary)", value: data.basic },
                { label: "Secondary", value: data.intermediate },
                { label: "Tertiary", value: data.advanced },
              ] as const
            ).map(({ label, value }) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="tabular-nums text-muted-foreground">{value.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-sky"
                    style={{ width: `${Math.min(value, 100).toFixed(1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {data.advanced > data.basic && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-semibold text-greenT">
                +{(data.advanced - data.basic).toFixed(1)} pp
              </span>{" "}
              higher participation for tertiary vs. basic education holders.
            </p>
          )}
          <p className="mt-4 text-[10px] text-muted-foreground">
            Source: World Bank WDI API · Values fetched live for the selected country.
          </p>
        </>
      ) : (
        <EmptyState message="Returns-to-education indicators are not available for this country." />
      )}
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

// --- Helpers -------------------------------------------------------------------

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

function formatCount(value: number | undefined) {
  return typeof value === "number" ? value.toLocaleString() : "Loading";
}

function formatWdiValue(indicator: WorldBankIndicatorData) {
  if (indicator.unit === "US$") {
    return `${indicator.unit}${Math.round(indicator.value).toLocaleString()}`;
  }

  return `${indicator.value.toFixed(1)}${indicator.unit}`;
}

function formatRoundedPct(value: number): string {
  return `${Math.round(value)}%`;
}

function interpretSectorShares(countryName: string, shares: LiveBarSignal[]): string {
  if (!shares.length) return "Sector employment data isn't available for this country yet.";
  const dominant = [...shares].sort((a, b) => b.value - a.value)[0];
  const dominantPct = Math.round(dominant.value);
  switch (dominant.label) {
    case "Services":
      return `Most jobs in ${countryName} are in services (${dominantPct}%) — that's where formal wage employment tends to be growing fastest. Industry and agriculture round out the picture.`;
    case "Agriculture":
      return `Agriculture is still the biggest employer in ${countryName} (${dominantPct}%). Many opportunities are in farming, post-harvest processing and food value chains.`;
    case "Industry":
      return `Industry is the largest employer in ${countryName} (${dominantPct}%). Manufacturing, construction and energy roles are common entry points.`;
    default:
      return `${dominant.label} is the largest employer in ${countryName} (${dominantPct}%).`;
  }
}

function composeYouthCallout(
  countryName: string,
  youthUnemp?: WorldBankIndicatorData,
  wageShare?: WorldBankIndicatorData,
): string {
  if (!youthUnemp && !wageShare) {
    return `World Bank signals haven't loaded for ${countryName} yet — try a different country or check back in a moment.`;
  }
  const parts: string[] = [];
  if (youthUnemp) {
    if (youthUnemp.value >= 20) {
      parts.push(
        `Finding work as a young person in ${countryName} is competitive — about ${formatRoundedPct(youthUnemp.value)} of 15–24-year-olds who want a job don't have one yet.`,
      );
    } else if (youthUnemp.value >= 10) {
      parts.push(
        `Youth unemployment in ${countryName} sits around ${formatRoundedPct(youthUnemp.value)} — there's competition, but openings exist if your skills line up.`,
      );
    } else {
      parts.push(
        `Youth unemployment in ${countryName} is relatively low (${formatRoundedPct(youthUnemp.value)}) — the market for young workers is healthier than average.`,
      );
    }
  }
  if (wageShare) {
    if (wageShare.value >= 60) {
      parts.push(
        `Most workers (${formatRoundedPct(wageShare.value)}) are in formal wage or salaried jobs, so traditional employment is the main path.`,
      );
    } else if (wageShare.value >= 30) {
      parts.push(
        `About ${formatRoundedPct(wageShare.value)} of workers earn a wage or salary; the rest run their own work — self-employment and gig opportunities are real options too.`,
      );
    } else {
      parts.push(
        `Only ${formatRoundedPct(wageShare.value)} of workers have formal wage jobs — most income comes from self-employment, day work or family businesses, so building a portable skill set really pays off.`,
      );
    }
  }
  parts.push(
    "Use this dashboard alongside your skill profile — the AI-resilient and rising-demand skills there are the ones that match where this market is heading.",
  );
  return parts.join(" ");
}
