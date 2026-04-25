import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Wrench, Sprout } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Unmapped — Your skills, seen. Your opportunity, found." },
      {
        name: "description",
        content:
          "A skill passport for unmapped youth across Ghana, Bangladesh and Nigeria. Three tracks: tech, trade, agriculture.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy">
          A skill passport for unmapped youth
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl">
          Your skills, seen.{" "}
          <span className="text-teal">Your opportunity, found.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Whether you write code, repair phones, or grow food — your skills
          deserve to be recognized.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
          >
            <a href="#tracks">
              Build Your Skill Passport
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Track selector */}
      <section id="tracks" className="mt-20 scroll-mt-24">
        <h2 className="text-center text-2xl font-semibold text-navy">
          Choose your track
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Every kind of work belongs on a passport.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          <TrackCard
            to="/onboard/tech"
            borderClass="border-t-4 border-navy"
            iconBg="bg-navy/10 text-navy"
            icon={<Code2 className="h-6 w-6" />}
            title="Tech Track"
            roles="Developer · Designer · Data Analyst"
            verified="GitHub + Portfolio"
          />
          <TrackCard
            to="/onboard/trade"
            borderClass="border-t-4 border-sky"
            iconBg="bg-sky/10 text-sky"
            icon={<Wrench className="h-6 w-6" />}
            title="Trade Track"
            roles="Repair · Tailoring · Trading · Mechanics"
            verified="Skill Interview + Micro-challenges"
          />
          <TrackCard
            to="/onboard/agriculture"
            borderClass="border-t-4 border-greenT"
            iconBg="bg-greenT/10 text-greenT"
            icon={<Sprout className="h-6 w-6" />}
            title="Agriculture Track"
            roles="Farming · Livestock · Cooperatives"
            verified="Skill Interview + Community Validator"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 rounded-xl border border-border bg-card p-8 sm:grid-cols-3">
        <Stat value="600M+" label="unmapped youth worldwide" />
        <Stat value="3 tracks" label="tech · trade · agriculture" />
        <Stat value="ESCO" label="certified skill profiles" />
      </section>
    </main>
  );
}

function TrackCard({
  to,
  borderClass,
  iconBg,
  icon,
  title,
  roles,
  verified,
}: {
  to: "/onboard/tech" | "/onboard/trade" | "/onboard/agriculture";
  borderClass: string;
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  roles: string;
  verified: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${borderClass}`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{roles}</p>

      <div className="mt-6 border-t border-border pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Verified via
        </div>
        <div className="mt-1 text-sm font-medium text-foreground">
          {verified}
        </div>
      </div>

      <div className="mt-6 inline-flex items-center text-sm font-semibold text-navy group-hover:text-teal">
        Start
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
