import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { saveCandidateSkillProfileJson } from "@/services/profileHandler";
import type { CandidateSkillProfile } from "@/types/unmapped";

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

const MAX_INTERVIEW_QUESTIONS = 5;

type InterviewMessage = {
  role: "assistant" | "user";
  text: string;
};

type InterviewAnswer = {
  question: string;
  answer: string;
};

type ProfileDraftResult = {
  profile: CandidateSkillProfile;
  nextQuestion: string;
  isComplete: boolean;
};

type ProfileInterviewInput = {
  profile: CandidateSkillProfile;
  answers: InterviewAnswer[];
};

type SaveProfileInput = {
  profileId: string;
  profile: CandidateSkillProfile;
  status: "draft" | "complete";
  questionsAnswered: number;
};

const analyzeCv = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }): Promise<ProfileDraftResult> => {
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
            text:
              "Read this CV and create a draft CandidateSkillProfile. Ask one concise follow-up question for the most important missing field.",
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
            text: `Read this CV text and create a draft CandidateSkillProfile. Ask one concise follow-up question for the most important missing field.\n\n${await file.text()}`,
          },
        ];

    const result = await callOpenAIForProfile(apiKey, [
      {
        role: "system",
        content: profileSystemPrompt,
      },
      {
        role: "user",
        content: cvContent,
      },
    ]);

    return normalizeDraftResult(result);
  });

const updateProfileFromAnswer = createServerFn({ method: "POST" })
  .inputValidator((data: ProfileInterviewInput) => data)
  .handler(async ({ data }): Promise<ProfileDraftResult> => {
    const apiKey = process.env.APIKEY;
    if (!apiKey) {
      throw new Error("Missing OpenAI API key in .env as APIKEY.");
    }

    const result = await callOpenAIForProfile(apiKey, [
      {
        role: "system",
        content: profileSystemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Update this CandidateSkillProfile using the interview answers. Ask exactly one next question unless the profile is now complete enough for matching. Maximum total questions is ${MAX_INTERVIEW_QUESTIONS}; if that limit is reached, set isComplete true.\n\nCurrent profile JSON:\n${JSON.stringify(
              data.profile,
              null,
              2,
            )}\n\nInterview answers:\n${JSON.stringify(data.answers, null, 2)}`,
          },
        ],
      },
    ]);

    return normalizeDraftResult(result);
  });

const saveProfileJson = createServerFn({ method: "POST" })
  .inputValidator((data: SaveProfileInput) => data)
  .handler(async ({ data }) => {
    return saveCandidateSkillProfileJson(data);
  });

const profileSystemPrompt = `
You create structured CandidateSkillProfile JSON for employment matching.
Use only evidence from the CV and interview answers. Do not invent employers, degrees, certifications, taxonomies, or years.
Return JSON with this shape:
{
  "profile": { "roleName": string, "normalizedRoleName": string, "summary": string, "seniority": "entry|junior|mid|senior|lead|manager|executive|unknown", "track": "tech|trade|agriculture|other", "confidence": "high|medium|low" },
  "occupation": { "iscoCode": string, "iscoTitle": string, "escoOccupationUri": string, "escoOccupationTitle": string, "alternativeOccupationMatches": [] },
  "experience": { "totalYears": number, "relevantYears": number, "industries": [], "jobTitles": [], "companies": [], "responsibilities": [], "achievements": [] },
  "education": { "highestLevel": string, "degrees": [], "fieldsOfStudy": [], "certifications": [], "trainings": [] },
  "skills": { "technical": [], "tools": [], "domain": [], "business": [], "soft": [], "languages": [] },
  "evidence": [],
  "automationAndReskilling": { "automationRiskOccupationCode": string, "automationRiskScore": number, "riskDrivers": [], "resilientSkills": [], "missingRecommendedSkills": [], "recommendedLearningSkills": [] },
  "nextQuestion": string,
  "isComplete": boolean
}
Each skill item must include name, normalizedName, category, evidence, and confidence. Add proficiency or yearsExperience only when supported.
Ask one natural chatbot question at a time. Prioritize missing role, seniority, years, responsibilities, achievements, education/certifications, tools, languages, and learning goals.
Set isComplete true when the profile is useful for matching or after 5 answered questions.
`;

async function callOpenAIForProfile(apiKey: string, input: unknown[]) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input,
      text: {
        format: {
          type: "json_schema",
          name: "candidate_skill_profile_interview",
          strict: false,
          schema: profileDraftSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI profile analysis failed: ${errorText}`);
  }

  const result = await response.json();
  return JSON.parse(extractResponseText(result)) as unknown;
}

const skillItemSchema = {
  type: "object",
  additionalProperties: true,
  required: ["name", "normalizedName", "category", "evidence", "confidence"],
  properties: {
    name: { type: "string" },
    normalizedName: { type: "string" },
    category: {
      type: "string",
      enum: ["technical", "tool", "domain", "business", "soft", "language"],
    },
    proficiency: {
      type: "string",
      enum: ["basic", "intermediate", "advanced", "expert", "unknown"],
    },
    yearsExperience: { type: "number" },
    evidence: { type: "array", items: { type: "string" } },
    escoSkillUri: { type: "string" },
    escoPreferredLabel: { type: "string" },
    escoSkillType: {
      type: "string",
      enum: ["skill/competence", "knowledge", "language", "transversal", "unknown"],
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
};

const profileDraftSchema = {
  type: "object",
  additionalProperties: false,
  required: ["profile", "occupation", "experience", "education", "skills", "evidence", "nextQuestion", "isComplete"],
  properties: {
    profile: {
      type: "object",
      additionalProperties: true,
      required: ["roleName", "normalizedRoleName", "summary", "seniority", "track", "confidence"],
      properties: {
        roleName: { type: "string" },
        normalizedRoleName: { type: "string" },
        summary: { type: "string" },
        seniority: {
          type: "string",
          enum: ["entry", "junior", "mid", "senior", "lead", "manager", "executive", "unknown"],
        },
        track: { type: "string", enum: ["tech", "trade", "agriculture", "other"] },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      },
    },
    occupation: { type: "object", additionalProperties: true },
    experience: { type: "object", additionalProperties: true },
    education: { type: "object", additionalProperties: true },
    skills: {
      type: "object",
      additionalProperties: false,
      required: ["technical", "tools", "domain", "business", "soft", "languages"],
      properties: {
        technical: { type: "array", items: skillItemSchema },
        tools: { type: "array", items: skillItemSchema },
        domain: { type: "array", items: skillItemSchema },
        business: { type: "array", items: skillItemSchema },
        soft: { type: "array", items: skillItemSchema },
        languages: { type: "array", items: skillItemSchema },
      },
    },
    evidence: { type: "array", items: { type: "object", additionalProperties: true } },
    automationAndReskilling: { type: "object", additionalProperties: true },
    nextQuestion: { type: "string" },
    isComplete: { type: "boolean" },
  },
};

function normalizeDraftResult(result: unknown): ProfileDraftResult {
  const draft = result as Partial<ProfileDraftResult> & Partial<CandidateSkillProfile>;
  const profile = "profile" in draft && "skills" in draft ? (draft as CandidateSkillProfile) : draft.profile;

  if (!profile || typeof profile !== "object") {
    throw new Error("OpenAI response did not contain a candidate profile.");
  }

  return {
    profile: withProfileDefaults(profile as CandidateSkillProfile),
    nextQuestion:
      typeof draft.nextQuestion === "string" && draft.nextQuestion.trim()
        ? draft.nextQuestion.trim()
        : "What important work experience, training, or skill should I add that is missing from this profile?",
    isComplete: Boolean(draft.isComplete),
  };
}

function withProfileDefaults(profile: CandidateSkillProfile): CandidateSkillProfile {
  return {
    ...profile,
    occupation: {
      alternativeOccupationMatches: [],
      ...profile.occupation,
    },
    experience: {
      industries: [],
      jobTitles: [],
      companies: [],
      responsibilities: [],
      achievements: [],
      ...profile.experience,
    },
    education: {
      degrees: [],
      fieldsOfStudy: [],
      certifications: [],
      trainings: [],
      ...profile.education,
    },
    skills: {
      technical: [],
      tools: [],
      domain: [],
      business: [],
      soft: [],
      languages: [],
      ...profile.skills,
    },
    evidence: profile.evidence ?? [],
    automationAndReskilling: {
      riskDrivers: [],
      resilientSkills: [],
      missingRecommendedSkills: [],
      recommendedLearningSkills: [],
      ...profile.automationAndReskilling,
    },
  };
}

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
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileId, setProfileId] = useState(() => createProfileId());
  const [profile, setProfile] = useState<CandidateSkillProfile | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingAnswer, setIsSendingAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [savedPath, setSavedPath] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const questionCount = answers.length + (profile && !isComplete ? 1 : 0);
  const progressValue = isComplete
    ? 100
    : Math.min(100, Math.round((questionCount / MAX_INTERVIEW_QUESTIONS) * 100));
  const latestQuestion = [...messages].reverse().find((message) => message.role === "assistant")?.text;

  const persistProfile = async (
    nextProfile: CandidateSkillProfile,
    status: "draft" | "complete",
    questionsAnswered: number,
  ) => {
    const result = await saveProfileJson({
      data: {
        profileId,
        profile: nextProfile,
        status,
        questionsAnswered,
      },
    });
    setSavedPath(result.path);
  };

  const submitCv = async () => {
    if (!cvFile) return;

    const nextProfileId = createProfileId();
    setProfileId(nextProfileId);
    setIsAnalyzing(true);
    setError("");
    setProfile(null);
    setMessages([]);
    setAnswers([]);
    setIsComplete(false);
    setSavedPath("");

    try {
      const data = new FormData();
      data.append("cv", cvFile);
      const result = await analyzeCv({ data });
      setProfile(result.profile);
      setIsComplete(result.isComplete);
      setMessages(
        result.isComplete
          ? [{ role: "assistant", text: "I have enough information to save this profile." }]
          : [{ role: "assistant", text: result.nextQuestion }],
      );

      const saveResult = await saveProfileJson({
        data: {
          profileId: nextProfileId,
          profile: result.profile,
          status: result.isComplete ? "complete" : "draft",
          questionsAnswered: 0,
        },
      });
      setSavedPath(saveResult.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze the CV.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitInterviewAnswer = async () => {
    const answer = chatInput.trim();
    if (!answer || !profile || !latestQuestion) return;

    const nextAnswers = [...answers, { question: latestQuestion, answer }];
    const limitedOut = nextAnswers.length >= MAX_INTERVIEW_QUESTIONS;

    setChatInput("");
    setAnswers(nextAnswers);
    setMessages((current) => [...current, { role: "user", text: answer }]);
    setIsSendingAnswer(true);
    setError("");

    try {
      const result = limitedOut
        ? { profile, nextQuestion: "", isComplete: true }
        : await updateProfileFromAnswer({
            data: {
              profile,
              answers: nextAnswers,
            },
          });

      const complete = result.isComplete || limitedOut;
      setProfile(result.profile);
      setIsComplete(complete);
      setMessages((current) =>
        complete
          ? [...current, { role: "assistant", text: "Done. I saved the completed skill profile." }]
          : [...current, { role: "assistant", text: result.nextQuestion }],
      );
      await persistProfile(result.profile, complete ? "complete" : "draft", nextAnswers.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the profile.");
    } finally {
      setIsSendingAnswer(false);
    }
  };

  const continueToDynamicOnboarding = () => {
    navigate({ to: "/onboard", search: { profileId } });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy">
          A skill passport for unmapped youth
        </span>
        <h1 className="mt-5 text-4xl font-bold text-navy sm:text-5xl md:text-6xl">
          Your skills, seen. <span className="text-teal">Your opportunity, found.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Upload a CV and we will turn it into a structured skill profile, then ask one question at
          a time to fill the gaps.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
          >
            <a href="#profile-builder">
              Build Your Skill Passport
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <section id="profile-builder" className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-navy">Upload your CV</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                PDF and TXT files are supported. The hidden track is inferred, not chosen by the
                user.
              </p>
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface px-6 py-8 text-center hover:border-navy/40">
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
                setError("");
              }}
            />
          </label>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={submitCv}
              disabled={!cvFile || isAnalyzing || isSendingAnswer}
              className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
            >
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan CV
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {profile && (
            <div className="mt-8 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    Profile interview
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-navy">
                    {isComplete ? "Profile complete" : `Question ${Math.min(questionCount, MAX_INTERVIEW_QUESTIONS)} of ${MAX_INTERVIEW_QUESTIONS}`}
                  </h3>
                </div>
                {isComplete && <CheckCircle2 className="h-5 w-5 text-teal" />}
              </div>

              <Progress value={progressValue} className="mt-4" />

              <div className="mt-5 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "assistant"
                        ? "max-w-[88%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground"
                        : "ml-auto max-w-[88%] rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground"
                    }
                  >
                    {message.text}
                  </div>
                ))}
                {isSendingAnswer && (
                  <div className="inline-flex items-center rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating profile
                  </div>
                )}
              </div>

              {!isComplete && (
                <>
                  <Textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    rows={4}
                    className="mt-4"
                    placeholder="Answer in your own words"
                    disabled={isSendingAnswer}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={submitInterviewAnswer}
                      disabled={!chatInput.trim() || isSendingAnswer}
                      className="rounded-md bg-teal text-white hover:bg-teal/90"
                    >
                      {isSendingAnswer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send answer
                    </Button>
                  </div>
                </>
              )}

              {savedPath && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Saved locally to <span className="font-medium text-foreground">{savedPath}</span>
                </p>
              )}

              {isComplete && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={continueToDynamicOnboarding}
                    className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
                  >
                    Review dynamic profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <ProfileSummary profile={profile} savedPath={savedPath} />
      </section>

      <section className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 rounded-lg border border-border bg-card p-8 sm:grid-cols-3">
        <Stat value="5 max" label="profile questions" />
        <Stat value="JSON" label="local profile handler" />
        <Stat value="ESCO" label="ready for taxonomy mapping" />
      </section>
    </main>
  );
}

function ProfileSummary({
  profile,
  savedPath,
}: {
  profile: CandidateSkillProfile | null;
  savedPath: string;
}) {
  const skills = profile
    ? Object.values(profile.skills)
        .flat()
        .map((skill) => skill.name)
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return (
    <aside className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="text-xs font-medium uppercase text-muted-foreground">Live profile</div>
      <h2 className="mt-2 text-xl font-semibold text-navy">
        {profile?.profile.roleName || "Waiting for CV"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {profile?.profile.summary ||
          "The structured profile will appear here as soon as the CV is scanned."}
      </p>

      {profile && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <SummaryField label="Track" value={profile.profile.track} />
            <SummaryField label="Confidence" value={profile.profile.confidence} />
            <SummaryField label="Seniority" value={profile.profile.seniority} />
            <SummaryField
              label="Years"
              value={
                typeof profile.experience.totalYears === "number"
                  ? `${profile.experience.totalYears}`
                  : "Unknown"
              }
            />
          </div>

          <div className="mt-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">Skills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.length ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No skills extracted yet.</span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">Evidence</div>
            <div className="mt-2 space-y-2">
              {profile.evidence.slice(0, 3).map((item) => (
                <div key={`${item.claim}-${item.sourceText}`} className="text-sm text-foreground">
                  {item.claim}
                </div>
              ))}
              {!profile.evidence.length && (
                <div className="text-sm text-muted-foreground">Evidence will be added here.</div>
              )}
            </div>
          </div>

          {savedPath && (
            <div className="mt-5 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Latest JSON snapshot: <span className="font-medium text-foreground">{savedPath}</span>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 capitalize text-foreground">{value}</div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="mt-1 text-xs uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function createProfileId() {
  return `candidate-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
