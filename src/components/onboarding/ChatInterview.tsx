import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Accent = "navy" | "sky" | "greenT";

const accentBg: Record<Accent, string> = {
  navy: "bg-navy text-navy-foreground hover:bg-navy/90",
  sky: "bg-sky text-sky-foreground hover:bg-sky/90",
  greenT: "bg-greenT text-greenT-foreground hover:bg-greenT/90",
};

export function ChatInterview({
  questions,
  accent,
  onComplete,
}: {
  questions: string[];
  accent: Accent;
  onComplete: (answers: string[]) => void;
}) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  const last = idx === questions.length - 1;

  const next = () => {
    const newAnswers = [...answers, current.trim()];
    setAnswers(newAnswers);
    setCurrent("");
    if (last) {
      onComplete(newAnswers);
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-navy">{t("chatInterview.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("chatInterview.questionOf", { current: idx + 1, total: questions.length })}
      </p>

      {/* Conversation history */}
      <div className="mt-5 space-y-3">
        {questions.slice(0, idx).map((q, i) => (
          <div key={q} className="space-y-2">
            <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground">
              {q}
            </div>
            <div className="ml-auto max-w-[85%] rounded-lg bg-surface px-4 py-2 text-sm text-foreground border border-border">
              {answers[i]}
            </div>
          </div>
        ))}

        {/* Current question */}
        <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground">
          {questions[idx]}
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          rows={4}
          placeholder={t("chatInterview.placeholder")}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={next}
          disabled={current.trim().length === 0}
          className={`rounded-md ${accentBg[accent]}`}
        >
          {last ? t("chatInterview.finish") : t("chatInterview.nextQuestion")}
        </Button>
      </div>
    </div>
  );
}
