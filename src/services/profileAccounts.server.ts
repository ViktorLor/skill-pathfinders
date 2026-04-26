import type { CandidateSkillProfile } from "@/types/unmapped";
import type { ProfileSnapshot } from "@/services/profileHandler";
import { getLocalDatabase } from "@/services/localDb.server";

type AnalyticsFields = {
  fullName: string;
  telephoneNumber: string;
  iscoCode: string;
  iscoTitle: string;
  yearsExperience: number;
  hasJob: boolean;
  location: string;
  country: string;
  currentlyEmployed: boolean;
  willingToRelocate: boolean;
  educationTaxonomyLevel: string;
  educationSkillLevel: string;
  credentialCategory: string;
  skillsJson: string;
  profileJson: string;
};

export async function saveAccountProfileSnapshot(snapshot: ProfileSnapshot) {
  const db = await getProfileDatabase();
  await ensureAccountProfilesTable(db);

  const analytics = getAnalyticsFields(snapshot.profile);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO account_skill_profiles (
        profile_id,
        account_id,
        full_name,
        telephone_number,
        isco_code,
        isco_title,
        years_experience,
        has_job,
        location,
        country,
        currently_employed,
        willing_to_relocate,
        education_taxonomy_level,
        education_skill_level,
        credential_category,
        skills_json,
        profile_json,
        status,
        questions_answered,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(profile_id) DO UPDATE SET
        account_id = excluded.account_id,
        full_name = excluded.full_name,
        telephone_number = excluded.telephone_number,
        isco_code = excluded.isco_code,
        isco_title = excluded.isco_title,
        years_experience = excluded.years_experience,
        has_job = excluded.has_job,
        location = excluded.location,
        country = excluded.country,
        currently_employed = excluded.currently_employed,
        willing_to_relocate = excluded.willing_to_relocate,
        education_taxonomy_level = excluded.education_taxonomy_level,
        education_skill_level = excluded.education_skill_level,
        credential_category = excluded.credential_category,
        skills_json = excluded.skills_json,
        profile_json = excluded.profile_json,
        status = excluded.status,
        questions_answered = excluded.questions_answered,
        updated_at = excluded.updated_at`,
  ).run(
    snapshot.profileId,
    snapshot.accountId ?? null,
    analytics.fullName,
    analytics.telephoneNumber,
    analytics.iscoCode,
    analytics.iscoTitle,
    analytics.yearsExperience,
    analytics.hasJob ? 1 : 0,
    analytics.location,
    analytics.country,
    analytics.currentlyEmployed ? 1 : 0,
    analytics.willingToRelocate ? 1 : 0,
    analytics.educationTaxonomyLevel,
    analytics.educationSkillLevel,
    analytics.credentialCategory,
    analytics.skillsJson,
    analytics.profileJson,
    snapshot.status,
    snapshot.questionsAnswered,
    now,
    now,
  );

  return {
    profileId: snapshot.profileId,
    iscoCode: analytics.iscoCode,
    iscoTitle: analytics.iscoTitle,
    yearsExperience: analytics.yearsExperience,
    hasJob: analytics.hasJob,
  };
}

export async function findLatestAccountProfile(accountId: string) {
  const normalizedAccountId = accountId.trim();
  if (!normalizedAccountId) return null;

  const db = await getProfileDatabase();
  await ensureAccountProfilesTable(db);

  const row = await db
    .prepare(
      `SELECT profile_id, status, updated_at
       FROM account_skill_profiles
       WHERE account_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
    .get(normalizedAccountId) as
    | { profile_id: string; status: string; updated_at: string }
    | undefined;

  if (!row) return null;

  return {
    profileId: row.profile_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function deleteAccountProfileSnapshot(profileId: string, accountId?: string) {
  const normalizedProfileId = profileId.trim();
  const normalizedAccountId = accountId?.trim();

  if (!normalizedProfileId) {
    throw new Error("Missing profile id.");
  }

  const db = await getProfileDatabase();
  await ensureAccountProfilesTable(db);

  const query = normalizedAccountId
    ? {
        sql: "DELETE FROM account_skill_profiles WHERE profile_id = ? AND account_id = ?",
        values: [normalizedProfileId, normalizedAccountId],
      }
    : {
        sql: "DELETE FROM account_skill_profiles WHERE profile_id = ?",
        values: [normalizedProfileId],
      };

  db.prepare(query.sql).run(...query.values);

  return { profileId: normalizedProfileId };
}

async function getProfileDatabase() {
  return getLocalDatabase();
}

async function ensureAccountProfilesTable(db: ReturnType<typeof getLocalDatabase>) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS account_skill_profiles (
        profile_id TEXT PRIMARY KEY,
        account_id TEXT,
        full_name TEXT NOT NULL DEFAULT '',
        telephone_number TEXT NOT NULL DEFAULT '',
        isco_code TEXT NOT NULL,
        isco_title TEXT NOT NULL,
        years_experience REAL NOT NULL,
        has_job INTEGER NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        currently_employed INTEGER NOT NULL DEFAULT 0,
        willing_to_relocate INTEGER NOT NULL DEFAULT 0,
        education_taxonomy_level TEXT NOT NULL DEFAULT 'unknown',
        education_skill_level TEXT NOT NULL DEFAULT 'unknown',
        credential_category TEXT NOT NULL DEFAULT 'unknown',
        skills_json TEXT NOT NULL,
        profile_json TEXT NOT NULL,
        status TEXT NOT NULL,
        questions_answered INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
  );

  ensureColumn(db, "account_skill_profiles", "full_name", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "account_skill_profiles", "telephone_number", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "account_skill_profiles", "location", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "account_skill_profiles", "country", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "account_skill_profiles", "currently_employed", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "account_skill_profiles", "willing_to_relocate", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(
    db,
    "account_skill_profiles",
    "education_taxonomy_level",
    "TEXT NOT NULL DEFAULT 'unknown'",
  );
  ensureColumn(
    db,
    "account_skill_profiles",
    "education_skill_level",
    "TEXT NOT NULL DEFAULT 'unknown'",
  );
  ensureColumn(
    db,
    "account_skill_profiles",
    "credential_category",
    "TEXT NOT NULL DEFAULT 'unknown'",
  );

  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_account_skill_profiles_isco ON account_skill_profiles (isco_code, isco_title)",
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_account_skill_profiles_has_job ON account_skill_profiles (has_job)",
  );
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_account_skill_profiles_phone_unique ON account_skill_profiles (telephone_number) WHERE telephone_number <> ''",
  );
}

function getAnalyticsFields(profile: CandidateSkillProfile): AnalyticsFields {
  const credentialMapping = profile.education.credentialMapping;
  return {
    fullName: normalizeText(profile.fullName),
    telephoneNumber: normalizeText(profile.telephoneNumber),
    iscoCode: normalizeRequired(profile.occupation.iscoCode, "unknown"),
    iscoTitle: normalizeRequired(profile.occupation.iscoTitle, "Unknown occupation"),
    yearsExperience: normalizeYears(profile.experience.totalYears),
    hasJob: Boolean(profile.experience.hasJob),
    location: normalizeText(profile.location),
    country: normalizeText(profile.country),
    currentlyEmployed: Boolean(profile.experience.hasJob),
    willingToRelocate: Boolean(profile.willingToRelocate),
    educationTaxonomyLevel: normalizeRequired(
      credentialMapping?.taxonomyLevel,
      "unknown",
    ),
    educationSkillLevel: normalizeRequired(
      credentialMapping?.estimatedSkillLevel,
      "unknown",
    ),
    credentialCategory: normalizeRequired(
      credentialMapping?.credentialCategory,
      "unknown",
    ),
    skillsJson: JSON.stringify(profile.skills),
    profileJson: JSON.stringify(profile),
  };
}

function normalizeRequired(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeYears(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function ensureColumn(
  db: ReturnType<typeof getLocalDatabase>,
  table: string,
  column: string,
  definition: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((existingColumn) => existingColumn.name === column)) return;

  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
