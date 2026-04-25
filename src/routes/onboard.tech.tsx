import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/onboarding/Stepper";
import { LoadingPipeline } from "@/components/onboarding/LoadingPipeline";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/onboard/tech")({
  head: () => ({
    meta: [{ title: "Tech onboarding · Unmapped" }],
  }),
  component: TechOnboarding,
});

function TechOnboarding() {
  const [step, setStep] = useState(1);
  const [cv, setCv] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const stages = [
    "Parsing your CV...",
    "Scanning GitHub activity...",
    "Verifying skill claims...",
    "Mapping to ESCO taxonomy...",
    "Finding opportunities...",
  ];

  const start = () => {
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/profile/$id", params: { id: "demo-tech" } });
    }, stages.length * 900 + 400);
  };

  if (loading) return <LoadingPipeline stages={stages} accent="navy" />;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Stepper
        accent="navy"
        current={step}
        steps={["Upload CV", "Connect GitHub", "Your Passport"]}
      />

      <div className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-navy">Upload your CV</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop a PDF or paste your CV text below.
            </p>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface px-6 py-10 text-center hover:border-navy/40">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium text-foreground">
                Drop PDF here or click to upload
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                PDF up to 5 MB
              </span>
              <input type="file" accept=".pdf" className="hidden" />
            </label>

            <div className="my-4 text-center text-xs uppercase tracking-wide text-muted-foreground">
              or paste CV text
            </div>
            <Textarea
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              rows={6}
              placeholder="Paste your CV here..."
            />

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-navy">
              Connect your profiles
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              GitHub is required for the tech track. Others are optional.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="GitHub URL (required)">
                <Input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/your-handle"
                />
              </Field>
              <Field label="Portfolio URL (optional)">
                <Input
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://your-portfolio.com"
                />
              </Field>
              <Field label="LinkedIn URL (optional)">
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={start}
                className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
              >
                Analyze My Skills
              </Button>
            </div>
          </>
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
