import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Stepper } from "@/components/onboarding/Stepper";
import { LoadingPipeline } from "@/components/onboarding/LoadingPipeline";
import { ChatInterview } from "@/components/onboarding/ChatInterview";
import { useCountry } from "@/context/CountryContext";

export const Route = createFileRoute("/onboard/trade")({
  head: () => ({
    meta: [{ title: "Trade onboarding · Unmapped" }],
  }),
  component: TradeOnboarding,
});

const TRADE_QUESTIONS = [
  "Tell us about a typical day in your work.",
  "What's the most complex repair or task you've done?",
  "How do you handle difficult customers?",
  "Do you manage any stock or money for your work?",
  "Have you ever trained or taught someone else?",
];

function TradeOnboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [years, setYears] = useState("");
  const [employment, setEmployment] = useState("self");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { country, setCountryCode } = useCountry();

  const finish = () => {
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/profile/$id", params: { id: "demo-trade" } });
    }, 3500);
  };

  if (loading)
    return (
      <LoadingPipeline
        accent="sky"
        stages={[
          "Understanding your experience...",
          "Mapping your skills...",
          "Finding matching opportunities...",
        ]}
      />
    );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Stepper
        accent="sky"
        current={step}
        steps={["Your Work", "Skill Interview", "Your Passport"]}
      />

      <div className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-navy">
              Tell us about your work
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No formal credentials needed — we work from your experience.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Your name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amara Mensah"
                />
              </Field>

              <Field label="What kind of work do you do?">
                <Select value={trade} onValueChange={setTrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">
                      Phone / electronics repair
                    </SelectItem>
                    <SelectItem value="tailoring">
                      Tailoring & sewing
                    </SelectItem>
                    <SelectItem value="mechanic">
                      Mechanics & auto repair
                    </SelectItem>
                    <SelectItem value="carpentry">
                      Carpentry & woodwork
                    </SelectItem>
                    <SelectItem value="food">
                      Food preparation & catering
                    </SelectItem>
                    <SelectItem value="trading">General trading</SelectItem>
                    <SelectItem value="beauty">Hair & beauty</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="How many years have you been doing this?">
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  placeholder="e.g. 5"
                />
              </Field>

              <Field label="Do you work for yourself or for someone?">
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "self", l: "Self-employed" },
                    { v: "employed", l: "Employed" },
                    { v: "both", l: "Both" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setEmployment(o.v)}
                      className={`rounded-md border px-4 py-2 text-sm ${
                        employment === o.v
                          ? "border-sky bg-sky/10 text-sky"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Country">
                <Select
                  value={country.code}
                  onValueChange={(v) =>
                    setCountryCode(v as "GHA" | "BGD" | "NGA")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GHA">🇬🇭 Ghana</SelectItem>
                    <SelectItem value="BGD">🇧🇩 Bangladesh</SelectItem>
                    <SelectItem value="NGA">🇳🇬 Nigeria</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="rounded-md bg-sky text-sky-foreground hover:bg-sky/90"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <ChatInterview
            accent="sky"
            questions={TRADE_QUESTIONS}
            onComplete={finish}
          />
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
