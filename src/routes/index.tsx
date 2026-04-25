import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  LogIn,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  clearStoredAccountSession,
  getStoredAccountSession,
  saveStoredAccountSession,
  type AccountSession,
} from "@/lib/accountSession";
import { createAccount, verifyAccountLogin } from "@/services/accounts.server";
import { findLatestAccountProfile } from "@/services/profileAccounts.server";
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
  accountId?: string;
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

const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => createAccount(data));

const loginAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => verifyAccountLogin(data));

const loadLatestAccountProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { accountId: string }) => data)
  .handler(async ({ data }) => findLatestAccountProfile(data.accountId));

const profileSystemPrompt = `
You create structured CandidateSkillProfile JSON for employment matching.
Use only evidence from the CV if provided and the interview answers. Do not invent employers, degrees, certifications, taxonomies, or years.
Return JSON with this shape:
{
  "profile": { "roleName": string, "normalizedRoleName": string, "summary": string, "seniority": "entry|junior|mid|senior|lead|manager|executive|unknown", "track": "tech|trade|agriculture|other", "confidence": "high|medium|low" },
  "occupation": { "iscoCode": string, "iscoTitle": string, "escoOccupationCode": string, "escoOccupationUri": string, "escoOccupationTitle": string, "alternativeOccupationMatches": [] },
  "experience": { "hasJob": boolean, "totalYears": number, "relevantYears": number, "industries": [], "jobTitles": [], "companies": [], "responsibilities": [], "achievements": [] },
  "education": { "highestLevel": string, "degrees": [], "fieldsOfStudy": [], "certifications": [], "trainings": [] },
  "skills": { "technical": [], "tools": [], "domain": [], "business": [], "soft": [], "languages": [] },
  "evidence": [],
  "automationAndReskilling": { "automationRiskOccupationCode": string, "automationRiskScore": number, "riskDrivers": [], "resilientSkills": [], "missingRecommendedSkills": [], "recommendedLearningSkills": [] },
  "nextQuestion": string,
  "isComplete": boolean
}
Each skill item must include name, normalizedName, category, evidence, and confidence. Add proficiency or yearsExperience only when supported.
Always include escoOccupationCode when an ESCO occupation is mapped. Use the ESCO concept identifier or notation, not the full URL. Keep escoOccupationUri only for internal linking.
Ask one natural chatbot question at a time. If there is no CV, start by discovering the person's target work, whether they currently have a job, past practical experience, tools, tasks, languages, education/training, and learning goals. Prioritize missing role, ISCO code/title, current job status, years, responsibilities, achievements, education/certifications, tools, languages, and learning goals.
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
      iscoCode: normalizeRequiredText(profile.occupation.iscoCode, "unknown"),
      iscoTitle: normalizeRequiredText(profile.occupation.iscoTitle, "Unknown occupation"),
    },
    experience: {
      hasJob: false,
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
  const [account, setAccount] = useState<AccountSession | null>(null);
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [isCheckingAccountProfile, setIsCheckingAccountProfile] = useState(false);
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

  useEffect(() => {
    const storedAccount = getStoredAccountSession();

    if (!storedAccount) return;
    setAccount(storedAccount);
    void redirectToExistingProfile(storedAccount);
  }, []);

  const redirectToExistingProfile = async (nextAccount: AccountSession) => {
    setIsCheckingAccountProfile(true);
    setAuthStatus("");
    setAuthError("");

    try {
      const latestProfile = await loadLatestAccountProfile({
        data: { accountId: nextAccount.id },
      });

      if (latestProfile?.profileId) {
        navigate({ to: "/profile/$id", params: { id: latestProfile.profileId } });
        return;
      }

      setAuthStatus(`Signed in as ${nextAccount.email}. You can start a new questionnaire.`);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not check saved profile data.");
    } finally {
      setIsCheckingAccountProfile(false);
    }
  };

  const saveAccountSession = (nextAccount: AccountSession) => {
    saveStoredAccountSession(nextAccount);
    setAccount(nextAccount);
  };

  const clearAccountSession = () => {
    clearStoredAccountSession();
    setAccount(null);
    setAuthStatus("");
    setAuthError("");
  };

  const handleAuthenticated = async (nextAccount: AccountSession, status: string) => {
    saveAccountSession(nextAccount);
    setAuthStatus(status);
    await redirectToExistingProfile(nextAccount);
  };

  const persistProfile = async (
    nextProfile: CandidateSkillProfile,
    status: "draft" | "complete",
    questionsAnswered: number,
  ) => {
    const result = await saveProfileJson({
      data: {
        profileId,
        accountId: account?.id,
        profile: nextProfile,
        status,
        questionsAnswered,
      },
    });
    setSavedPath(result.path);
    return result;
  };

  const submitCv = async () => {
    if (!cvFile) return;
    if (!account) {
      setAuthError("Please register or log in before adding questionnaire data.");
      return;
    }

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
          accountId: account.id,
          profile: result.profile,
          status: result.isComplete ? "complete" : "draft",
          questionsAnswered: 0,
        },
      });
      setSavedPath(saveResult.path);

      if (result.isComplete) {
        navigate({ to: "/profile/$id", params: { id: nextProfileId } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze the CV.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startNoCvInterview = async () => {
    if (!account) {
      setAuthError("Please register or log in before adding questionnaire data.");
      return;
    }

    const nextProfileId = createProfileId();
    setProfileId(nextProfileId);
    setCvFile(null);
    setProfile(createEmptySkillProfile());
    setMessages([
      {
        role: "assistant",
        text:
          "What kind of work would you like to do, and what practical tasks have you already done at work, school, home, in business, or in your community?",
      },
    ]);
    setAnswers([]);
    setChatInput("");
    setIsComplete(false);
    setSavedPath("");
    setError("");
    window.requestAnimationFrame(() => {
      document.getElementById("profile-builder")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const submitInterviewAnswer = async () => {
    const answer = chatInput.trim();
    if (!answer || !profile || !latestQuestion) return;

    const nextAnswers = [...answers, { question: latestQuestion, answer }];

    setChatInput("");
    setAnswers(nextAnswers);
    setMessages((current) => [...current, { role: "user", text: answer }]);
    setIsSendingAnswer(true);
    setError("");

    try {
      const result = await updateProfileFromAnswer({
        data: {
          profile,
          answers: nextAnswers,
        },
      });

      const complete = result.isComplete || nextAnswers.length >= MAX_INTERVIEW_QUESTIONS;
      setProfile(result.profile);
      setIsComplete(complete);
      setMessages((current) =>
        complete
          ? [...current, { role: "assistant", text: "Done. I saved the completed skill profile." }]
          : [...current, { role: "assistant", text: result.nextQuestion }],
      );
      await persistProfile(result.profile, complete ? "complete" : "draft", nextAnswers.length);

      if (complete) {
        navigate({ to: "/profile/$id", params: { id: profileId } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the profile.");
    } finally {
      setIsSendingAnswer(false);
    }
  };

  const openCandidateProfile = () => {
    navigate({ to: "/profile/$id", params: { id: profileId } });
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
          Upload a CV or answer profile questions, and we will turn your experience into a
          structured skill profile.
        </p>
      </section>

      <AuthStartPanel
        account={account}
        authStatus={authStatus}
        authError={authError}
        isCheckingAccountProfile={isCheckingAccountProfile}
        onAuthenticated={handleAuthenticated}
        onLogout={clearAccountSession}
      />

      {account && (
        <section id="profile-builder" className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-navy">Build your skill profile</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload a CV, or answer questions if you do not have one.
                  The hidden track is inferred, not chosen by the user.
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={startNoCvInterview}
                disabled={isCheckingAccountProfile || isAnalyzing || isSendingAnswer}
                className="rounded-md"
              >
                No written CV
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
                      onClick={openCandidateProfile}
                      className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
                    >
                      Open candidate profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <ProfileSummary profile={profile} savedPath={savedPath} />
        </section>
      )}

      <section className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 rounded-lg border border-border bg-card p-8 sm:grid-cols-3">
        <Stat value="5 max" label="profile questions" />
        <Stat value="JSON" label="local profile handler" />
        <Stat value="ESCO" label="ready for taxonomy mapping" />
      </section>
    </main>
  );
}

function AuthStartPanel({
  account,
  authStatus,
  authError,
  isCheckingAccountProfile,
  onAuthenticated,
  onLogout,
}: {
  account: AccountSession | null;
  authStatus: string;
  authError: string;
  isCheckingAccountProfile: boolean;
  onAuthenticated: (account: AccountSession, status: string) => Promise<void>;
  onLogout: () => void;
}) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [localError, setLocalError] = useState("");

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingAuth(true);
    setLocalError("");

    try {
      const nextAccount = await loginAccount({
        data: { email: loginEmail, password: loginPassword },
      });
      setLoginPassword("");
      await onAuthenticated(nextAccount, `Logged in as ${nextAccount.email}.`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingAuth(true);
    setLocalError("");

    try {
      const nextAccount = await registerAccount({
        data: { email: registerEmail, password: registerPassword },
      });
      setRegisterPassword("");
      await onAuthenticated(nextAccount, `Account created for ${nextAccount.email}.`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  return (
    <section className="mx-auto mb-14 mt-10 max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Start with your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Register or log in before the questionnaire so your profile data is saved to your
            account.
          </p>
        </div>
        {account && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="rounded-md"
          >
            Log out
          </Button>
        )}
      </div>

      {account ? (
        <div className="mt-6 rounded-md border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-foreground">
          {isCheckingAccountProfile ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking for your saved profile...
            </span>
          ) : (
            authStatus || `Signed in as ${account.email}.`
          )}
        </div>
      ) : (
        <Tabs defaultValue="login" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5">
            <form onSubmit={submitLogin} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                autoComplete="email"
                placeholder="Email"
                required
              />
              <Input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                minLength={8}
                required
              />
              <Button
                type="submit"
                disabled={isSubmittingAuth}
                className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
              >
                {isSubmittingAuth && <Loader2 className="h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-5">
            <form onSubmit={submitRegister} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                autoComplete="email"
                placeholder="Email"
                required
              />
              <Input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Password"
                minLength={8}
                required
              />
              <Button
                type="submit"
                disabled={isSubmittingAuth}
                className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
              >
                {isSubmittingAuth && <Loader2 className="h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      )}

      {(localError || authError) && (
        <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {localError || authError}
        </div>
      )}
    </section>
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
        {profile?.profile.roleName || "Waiting for profile"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {profile?.profile.summary ||
          "The structured profile will appear here as soon as a CV is scanned or the profile questions begin."}
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

function createEmptySkillProfile(): CandidateSkillProfile {
  return {
    profile: {
      roleName: "New skill profile",
      normalizedRoleName: "",
      summary: "Answer the profile questions to build a structured skill profile.",
      seniority: "unknown",
      track: "other",
      confidence: "low",
    },
    occupation: {
      iscoCode: "unknown",
      iscoTitle: "Unknown occupation",
      alternativeOccupationMatches: [],
    },
    experience: {
      hasJob: false,
      industries: [],
      jobTitles: [],
      companies: [],
      responsibilities: [],
      achievements: [],
    },
    education: {
      degrees: [],
      fieldsOfStudy: [],
      certifications: [],
      trainings: [],
    },
    skills: {
      technical: [],
      tools: [],
      domain: [],
      business: [],
      soft: [],
      languages: [],
    },
    evidence: [],
    automationAndReskilling: {
      riskDrivers: [],
      resilientSkills: [],
      missingRecommendedSkills: [],
      recommendedLearningSkills: [],
    },
  };
}

function normalizeRequiredText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}
