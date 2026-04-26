import type {
  CandidateProfile,
  JobMatch,
  SkillScore,
  TrackType,
} from "@/types/unmapped";
import {
  MOCK_TECH_CANDIDATE,
  MOCK_TRADE_CANDIDATE,
  MOCK_AGRI_CANDIDATE,
  getJobMatchesForTrack,
} from "@/data/mock";

export async function parseCV(
  _cvText: string,
  track: TrackType,
): Promise<CandidateProfile> {
  console.log("TODO: implement parseCV");
  if (track === "tech") return MOCK_TECH_CANDIDATE;
  if (track === "trade") return MOCK_TRADE_CANDIDATE;
  return MOCK_AGRI_CANDIDATE;
}

export async function runSkillInterview(
  _answers: string[],
  track: TrackType,
): Promise<SkillScore[]> {
  console.log("TODO: implement runSkillInterview");
  if (track === "tech") return MOCK_TECH_CANDIDATE.skillScores;
  if (track === "trade") return MOCK_TRADE_CANDIDATE.skillScores;
  return MOCK_AGRI_CANDIDATE.skillScores;
}

export async function verifyGitHub(
  _githubUrl: string,
  skills: SkillScore[],
): Promise<SkillScore[]> {
  console.log("TODO: implement verifyGitHub");
  return skills;
}

export async function matchJobs(
  profile: CandidateProfile,
): Promise<JobMatch[]> {
  console.log("TODO: implement matchJobs");
  return getJobMatchesForTrack(profile.track);
}

// generateCoverLetter removed — not implemented
  profile: CandidateProfile,
  job: JobMatch,
): Promise<string> {
  console.log("TODO: implement generateCoverLetter");
  const isTech = profile.track === "tech";
  const intro = isTech
    ? `I am writing to apply for the ${job.title} role at ${job.company ?? "your organization"}.`
    : `I am writing to express my interest in the ${job.title} role at ${job.company ?? "your organization"}.`;

  const skillsLine = job.matchedSkills.length
    ? `My verified skills include ${job.matchedSkills.join(", ")}.`
    : "";

  const experienceLine = profile.experience[0]
    ? `For the past several years I have worked as a ${profile.experience[0].title.toLowerCase()} (${profile.experience[0].duration}), ${profile.experience[0].description.toLowerCase()}.`
    : "";

  const trustLine = isTech
    ? `My Unmapped Skill Passport score is ${profile.trustScore}/100, with skills independently verified through GitHub activity and project review.`
    : `My Unmapped Skill Passport score is ${profile.trustScore}/100, with my practical skills validated through structured interview and community validators in my region.`;

  const gapLine = job.missingSkills.length
    ? `I am aware that ${job.missingSkills.join(" and ")} are areas to grow into, and I am committed to learning quickly on the job.`
    : "";

  return `Dear Hiring Team at ${job.company ?? "your organization"},

${intro}

${experienceLine} ${skillsLine}

${trustLine}

${gapLine}

I would welcome the opportunity to discuss how my background can contribute to your team.

Sincerely,
${profile.name}
${profile.location ?? ""}`;
}
