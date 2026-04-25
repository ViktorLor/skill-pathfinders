import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

type Accent = "navy" | "sky" | "greenT";

const accentMap: Record<Accent, string> = {
  navy: "text-navy",
  sky: "text-sky",
  greenT: "text-greenT",
};

export function LoadingPipeline({ stages, accent }: { stages: string[]; accent: Accent }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= stages.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [stage, stages.length]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
      <h2 className="text-xl font-semibold text-navy">Building your Skill Passport</h2>
      <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>

      <ul className="mt-8 w-full space-y-3 text-left">
        {stages.map((s, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li
              key={s}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
            >
              {done ? (
                <CheckCircle2 className={`h-5 w-5 ${accentMap[accent]}`} />
              ) : active ? (
                <Loader2 className={`h-5 w-5 animate-spin ${accentMap[accent]}`} />
              ) : (
                <div className="h-5 w-5 rounded-full border border-border" />
              )}
              <span
                className={`text-sm ${
                  done || active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
