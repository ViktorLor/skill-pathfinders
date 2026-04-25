import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Code2, FileText, Loader2, MessageCircle, Sprout, Wrench } from "lucide-react";
import type { TrackType } from "@/types/unmapped";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Unmapped - Your skills, seen. Your opportunity, found." },
      {
        name: "description",
        content:
          "A skill passport for unmapped youth across Ghana, Bangladesh and Nigeria. Three tracks: tech, trade, agriculture.",
      },
    ],
  }),
  component: LandingPage,
});

type CvAnalysis = {
  roleName: string;
  track: TrackType;
  confidence: "high" | "medium" | "low";
  summary: string;
  skills: {
    technical: string[];
    tools: string[];
    domain: string[];
    business: string[];
    soft: string[];
  };
  evidence: string[];
};

type WorkdayAnswers = {
  role: string;
  typicalDay: string;
};

const analyzeCv = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }): Promise<CvAnalysis> => {
    const file = data.get("cv");

    if (!(file instanceof File)) {
      throw new Error("Please upload a CV file.");
    }

    const apiKey = process.env.APIKEY;
    if (!apiKey) {
      throw new Error("Missing OpenAI API key in .env as APIKEY.");
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const cvContent = isPdf
      ? [
          {
            type: "input_text",
            text: "Read this CV and return the structured profile. Keep skills short and concrete. If unsure, choose the closest track and set confidence to low.",
          },
          {
            type: "input_file",
            filename: file.name,
            file_data: `data:application/pdf;base64,${arrayBufferToBase64(
              await file.arrayBuffer(),
            )}`,
          },
        ]
      : [
          {
            type: "input_text",
            text: `Read this CV text and return the structured profile. Keep skills short and concrete. If unsure, choose the closest track and set confidence to low.\n\n${await file.text()}`,
          },
        ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Extract a skill profile from the CV and classify the person into exactly one hidden onboarding track: tech, trade, or agriculture. Choose tech for software, data, IT, digital, analytics, or design work. Choose trade for practical services, repair, retail, tailoring, mechanics, hospitality, beauty, or hands-on business work. Choose agriculture for farming, crops, livestock, fishing, cooperatives, irrigation, or agricultural selling.",
          },
          {
            role: "user",
            content: cvContent,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "cv_skill_profile",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["roleName", "track", "confidence", "summary", "skills", "evidence"],
              properties: {
                roleName: { type: "string" },
                track: {
                  type: "string",
                  enum: ["tech", "trade", "agriculture"],
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                },
                summary: { type: "string" },
                skills: {
                  type: "object",
                  additionalProperties: false,
                  required: ["technical", "tools", "domain", "business", "soft"],
                  properties: {
                    technical: { type: "array", items: { type: "string" } },
                    tools: { type: "array", items: { type: "string" } },
                    domain: { type: "array", items: { type: "string" } },
                    business: { type: "array", items: { type: "string" } },
                    soft: { type: "array", items: { type: "string" } },
                  },
                },
                evidence: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI CV analysis failed: ${errorText}`);
    }

    const result = await response.json();
    const outputText = extractResponseText(result);
    return JSON.parse(outputText) as CvAnalysis;
  });

const analyzeWorkday = createServerFn({ method: "POST" })
  .inputValidator((data: WorkdayAnswers) => data)
  .handler(async ({ data }): Promise<CvAnalysis> => {
    if (!data.role.trim() || !data.typicalDay.trim()) {
      throw new Error("Please answer both questions first.");
    }

    const apiKey = process.env.APIKEY;
    if (!apiKey) {
      throw new Error("Missing OpenAI API key in .env as APIKEY.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are a skill-path advisor. Classify the person into exactly one hidden onboarding track: tech, trade, or agriculture. Choose tech for software, data, IT, digital, analytics, or design work. Choose trade for practical services, repair, retail, tailoring, mechanics, hospitality, beauty, or hands-on business work. Choose agriculture for farming, crops, livestock, fishing, cooperatives, irrigation, or agricultural selling. Infer skills only from the answers. If unsure, choose the closest track and set confidence to low.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Role: ${data.role}\n\nTypical workday: ${data.typicalDay}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "workday_skill_profile",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["roleName", "track", "confidence", "summary", "skills", "evidence"],
              properties: {
                roleName: { type: "string" },
                track: {
                  type: "string",
                  enum: ["tech", "trade", "agriculture"],
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                },
                summary: { type: "string" },
                skills: {
                  type: "object",
                  additionalProperties: false,
                  required: ["technical", "tools", "domain", "business", "soft"],
                  properties: {
                    technical: { type: "array", items: { type: "string" } },
                    tools: { type: "array", items: { type: "string" } },
                    domain: { type: "array", items: { type: "string" } },
                    business: { type: "array", items: { type: "string" } },
                    soft: { type: "array", items: { type: "string" } },
                  },
                },
                evidence: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI workday analysis failed: ${errorText}`);
    }

    const result = await response.json();
    const outputText = extractResponseText(result);
    return JSON.parse(outputText) as CvAnalysis;
  });

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

type OpenAIResponseContent = {
  text?: unknown;
};

type OpenAIResponseItem = {
  content?: OpenAIResponseContent[];
};

type OpenAIResponseResult = {
  output_text?: unknown;
  output?: OpenAIResponseItem[];
};

function extractResponseText(result: OpenAIResponseResult) {
  if (typeof result.output_text === "string") return result.output_text;

  const text = result.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((content) => content.text)
    ?.filter((text): text is string => typeof text === "string")
    ?.join("");

  if (!text) throw new Error("OpenAI response did not contain structured text.");
  return text;
}

function LandingPage() {
  const [hasCv, setHasCv] = useState<boolean | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [chatStep, setChatStep] = useState<0 | 1>(0);
  const [roleAnswer, setRoleAnswer] = useState("");
  const [dayAnswer, setDayAnswer] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatAnalyzing, setIsChatAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submitCv = async () => {
    if (!cvFile) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);

    try {
      const data = new FormData();
      data.append("cv", cvFile);
      const result = await analyzeCv({ data });
      console.log("CV analysis result", result);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze the CV.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitChatAnswer = async () => {
    const answer = chatInput.trim();
    if (!answer) return;

    setError("");

    if (chatStep === 0) {
      setRoleAnswer(answer);
      setChatInput("");
      setChatStep(1);
      return;
    }

    setDayAnswer(answer);
    setChatInput("");
    setIsChatAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzeWorkday({
        data: {
          role: roleAnswer,
          typicalDay: answer,
        },
      });
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not recommend a path from your answers.",
      );
    } finally {
      setIsChatAnalyzing(false);
    }
  };

  const continueToTrack = (track: TrackType) => {
    navigate({ to: `/onboard/${track}` });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy">
          A skill passport for unmapped youth
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl">
          Your skills, seen. <span className="text-teal">Your opportunity, found.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Upload a CV if you have one. If not, answer two quick questions and we will recommend the
          right path.
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

      <section id="tracks" className="mt-20 scroll-mt-24">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-navy">Do you have a CV?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload it and we will read out your skills, then choose the best path automatically.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setHasCv(true);
                setAnalysis(null);
                setError("");
              }}
              className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
            >
              Yes, I have a CV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setHasCv(false);
                setAnalysis(null);
                setChatStep(0);
                setRoleAnswer("");
                setDayAnswer("");
                setChatInput("");
                setError("");
              }}
            >
              No, answer questions
            </Button>
          </div>

          {hasCv && (
            <div className="mt-6 border-t border-border pt-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface px-6 py-8 text-center hover:border-navy/40">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <span className="mt-2 text-sm font-medium text-foreground">
                  {cvFile ? cvFile.name : "Upload your CV"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">PDF or TXT</span>
                <input
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                  onChange={(event) => {
                    setCvFile(event.target.files?.[0] ?? null);
                    setAnalysis(null);
                    setError("");
                  }}
                />
              </label>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={submitCv}
                  disabled={!cvFile || isAnalyzing}
                  className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
                >
                  {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Analyze CV
                </Button>
              </div>

              {error && (
                <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {analysis && (
                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Recommended path
                      </div>
                      <h3 className="mt-1 text-lg font-semibold capitalize text-navy">
                        {analysis.track} track
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{analysis.summary}</p>
                    </div>
                    <Button
                      onClick={() => continueToTrack(analysis.track)}
                      className="rounded-md bg-teal text-white hover:bg-teal/90"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.values(analysis.skills)
                      .flat()
                      .slice(0, 10)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {hasCv === false && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-navy">Tell us about your work</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We will use your answers to recommend tech, trade, or agriculture automatically.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground">
                What is your role?
              </div>
              {roleAnswer && (
                <>
                  <div className="ml-auto max-w-[85%] rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground">
                    {roleAnswer}
                  </div>
                  <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground">
                    How is a typical day in your workday?
                  </div>
                </>
              )}
              {dayAnswer && (
                <div className="ml-auto max-w-[85%] rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground">
                  {dayAnswer}
                </div>
              )}
            </div>

            {!analysis && (
              <>
                <div className="mt-4">
                  <Textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    rows={4}
                    placeholder={
                      chatStep === 0
                        ? "e.g. I repair phones in a small shop"
                        : "e.g. I diagnose faults, replace screens, order parts, and talk to customers"
                    }
                    disabled={isChatAnalyzing}
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={submitChatAnswer}
                    disabled={!chatInput.trim() || isChatAnalyzing}
                    className="rounded-md bg-sky text-sky-foreground hover:bg-sky/90"
                  >
                    {isChatAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {chatStep === 0 ? "Next question" : "Recommend path"}
                  </Button>
                </div>
              </>
            )}

            {error && (
              <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {analysis && (
              <RecommendationCard
                analysis={analysis}
                onContinue={() => continueToTrack(analysis.track)}
              />
            )}
          </div>
        )}
      </section>

      <section className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 rounded-xl border border-border bg-card p-8 sm:grid-cols-3">
        <Stat value="600M+" label="unmapped youth worldwide" />
        <Stat value="3 paths" label="tech · trade · agriculture" />
        <Stat value="ESCO" label="certified skill profiles" />
      </section>
    </main>
  );
}

function RecommendationCard({
  analysis,
  onContinue,
}: {
  analysis: CvAnalysis;
  onContinue: () => void;
}) {
  return (
    <div className="mt-5 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Recommended path
          </div>
          <h3 className="mt-1 text-lg font-semibold capitalize text-navy">
            {analysis.track} track
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{analysis.summary}</p>
        </div>
        <Button onClick={onContinue} className="rounded-md bg-teal text-white hover:bg-teal/90">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.values(analysis.skills)
          .flat()
          .slice(0, 10)
          .map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              {skill}
            </span>
          ))}
      </div>
    </div>
  );
}

function TrackGrid() {
  return (
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
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{roles}</p>

      <div className="mt-6 border-t border-border pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Verified via
        </div>
        <div className="mt-1 text-sm font-medium text-foreground">{verified}</div>
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
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
