import type { CandidateSkillProfile } from "@/types/unmapped";
import { withEducationCredentialMapping } from "@/data/educationTaxonomy";
import {
  deleteAccountProfileSnapshot,
  saveAccountProfileSnapshot,
} from "@/services/profileAccounts.server";

export type ProfileSnapshotStatus = "draft" | "complete";

export type ProfileSnapshot = {
  profileId: string;
  accountId?: string;
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
  const mappedSnapshot = {
    ...snapshot,
    profile: withEducationCredentialMapping(snapshot.profile),
  };

  await writeFile(
    resolve(dir, filename),
    JSON.stringify(
      {
        ...mappedSnapshot,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  await saveAccountProfileSnapshot(mappedSnapshot);

  return { path: `candidate-profiles/${filename}` };
}

export async function readCandidateSkillProfileJson(profileId: string) {
  const [{ readFile }, { resolve }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const filename = `${profileId.replace(/[^a-zA-Z0-9_-]/g, "-")}.json`;
  const file = await readFile(resolve(process.cwd(), "candidate-profiles", filename), "utf8");

  const snapshot = JSON.parse(file) as ProfileSnapshot & { savedAt?: string };
  return {
    ...snapshot,
    profile: withEducationCredentialMapping(snapshot.profile),
  };
}

export async function deleteCandidateSkillProfileJson(profileId: string, accountId?: string) {
  const [{ unlink }, { resolve }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const filename = `${profileId.replace(/[^a-zA-Z0-9_-]/g, "-")}.json`;

  await deleteAccountProfileSnapshot(profileId, accountId);

  try {
    await unlink(resolve(process.cwd(), "candidate-profiles", filename));
  } catch (err) {
    if (!isMissingFileError(err)) {
      throw err;
    }
  }

  return { profileId };
}

function isMissingFileError(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "ENOENT"
  );
}
