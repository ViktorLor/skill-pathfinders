import { Check } from "lucide-react";

type Accent = "navy" | "sky" | "greenT";

const accentMap: Record<Accent, { active: string; text: string }> = {
  navy: { active: "bg-navy text-navy-foreground", text: "text-navy" },
  sky: { active: "bg-sky text-sky-foreground", text: "text-sky" },
  greenT: { active: "bg-greenT text-greenT-foreground", text: "text-greenT" },
};

export function Stepper({
  steps,
  current,
  accent,
}: {
  steps: string[];
  current: number; // 1-indexed
  accent: Accent;
}) {
  const a = accentMap[accent];
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <li key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done || active ? a.active : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : idx}
            </div>
            <span
              className={`text-sm ${active ? `font-semibold ${a.text}` : "text-muted-foreground"}`}
            >
              {s}
            </span>
            {idx < steps.length && <div className="hidden h-px w-6 bg-border sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}
