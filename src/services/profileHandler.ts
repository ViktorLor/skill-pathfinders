import type { CandidateSkillProfile } from "@/types/unmapped";

export type ProfileSnapshotStatus = "draft" | "complete";

export type ProfileSnapshot = {
  profileId: string;
  status: ProfileSnapshotStatus;
  questionsAnswered: number;
  profile: CandidateSkillProfile;
};

export async function saveCandidateSkillProfileJson(snapshot: ProfileSnapshot) {
  const [{ mkdir, writeFile }, { resolve }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const dir = resolve(process.cwd(), "candidate-profiles");
  const filename = `${snapshot.profileId.replace(/[^a-zA-Z0-9_-]/g, "-")}.json`;

  await mkdir(dir, { recursive: true });
  await writeFile(
    resolve(dir, filename),
    JSON.stringify(
      {
        ...snapshot,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  return { path: `candidate-profiles/${filename}` };
}

export async function readCandidateSkillProfileJson(profileId: string) {
  const [{ readFile }, { resolve }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const filename = `${profileId.replace(/[^a-zA-Z0-9_-]/g, "-")}.json`;
  const file = await readFile(resolve(process.cwd(), "candidate-profiles", filename), "utf8");

  return JSON.parse(file) as ProfileSnapshot & { savedAt?: string };
}
