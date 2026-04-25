import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/onboard/agriculture")({
  head: () => ({
    meta: [{ title: "Agriculture onboarding · Unmapped" }],
  }),
  component: AgriOnboarding,
});

const AGRI_QUESTIONS = [
  "Describe how you prepare your land for planting.",
  "How do you handle pests or disease in your crops or animals?",
  "Do you keep records of your income and expenses?",
  "How do you decide what price to sell at?",
  "Have you used any irrigation or water management?",
];

const CROPS = [
  "Maize",
  "Cassava",
  "Rice",
  "Yam",
  "Vegetables",
  "Cocoa",
  "Poultry",
  "Cattle",
  "Goats",
  "Fish farming",
  "Other",
];

function AgriOnboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [crops, setCrops] = useState<string[]>([]);
  const [hectares, setHectares] = useState("");
  const [coop, setCoop] = useState("yes");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { country, setCountryCode } = useCountry();

  const toggleCrop = (c: string) => {
    setCrops((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const finish = () => {
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/profile/$id", params: { id: "demo-agri" } });
    }, 3500);
  };

  if (loading)
    return (
      <LoadingPipeline
        accent="greenT"
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
        accent="greenT"
        current={step}
        steps={["Your Farm", "Skill Interview", "Your Passport"]}
      />

      <div className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-navy">
              Your farming context
            </h2>

            <div className="mt-5 space-y-4">
              <Field label="Your name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kofi Darko"
                />
              </Field>

              <Field label="What do you mainly grow or raise?">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CROPS.map((c) => (
                    <label
                      key={c}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        crops.includes(c)
                          ? "border-greenT bg-greenT/10 text-greenT"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={crops.includes(c)}
                        onCheckedChange={() => toggleCrop(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="How much land do you farm? (approx. hectares)">
                <Input
                  type="number"
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                  placeholder="e.g. 2.4"
                />
              </Field>

              <Field label="Are you part of a farmers cooperative?">
                <div className="flex gap-2">
                  {[
                    { v: "yes", l: "Yes" },
                    { v: "no", l: "No" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setCoop(o.v)}
                      className={`rounded-md border px-4 py-2 text-sm ${
                        coop === o.v
                          ? "border-greenT bg-greenT/10 text-greenT"
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
                className="rounded-md bg-greenT text-greenT-foreground hover:bg-greenT/90"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <ChatInterview
            accent="greenT"
            questions={AGRI_QUESTIONS}
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
