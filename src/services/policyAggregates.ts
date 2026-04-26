import { getLocalDatabase } from "@/services/localDb.server";

export interface PolicyAggregateRow {
  rank: number;
  iscoCode: string;
  code: string;
  title: string;
  profiles: number;
  unemployedProfiles: number;
  shareLabel: string;
}

export interface PolicyAggregateCandidate {
  profileId: string;
  fullName: string;
  location: string;
  country: string;
  yearsExperience: number;
  educationSkillLevel: string;
  willingToRelocate: boolean;
  updatedAt: string;
}

export interface PolicyOccupationProfileGroup {
  iscoCode: string;
  title: string;
  totalProfiles: number;
  unemployedProfiles: number;
  shownProfiles: number;
  candidates: PolicyAggregateCandidate[];
}

export interface PolicyProfileAggregates {
  totalProfiles: number;
  availableProfiles: number;
  profileCap: number;
  rowLimit: number;
  uniqueOccupations: number;
  unemployedProfiles: number;
  sourceLabel: string;
  iscoEscoTop10: PolicyAggregateRow[];
  unemploymentTop10: PolicyAggregateRow[];
}

const PROFILE_AGGREGATE_HARD_CAP = 200;
const AGGREGATE_ROW_LIMIT = 10;

const HARDCODED_POLICY_AGGREGATES: PolicyProfileAggregates = {
  totalProfiles: PROFILE_AGGREGATE_HARD_CAP,
  availableProfiles: 1247,
  profileCap: PROFILE_AGGREGATE_HARD_CAP,
  rowLimit: AGGREGATE_ROW_LIMIT,
  uniqueOccupations: 38,
  unemployedProfiles: 66,
  sourceLabel: `${PROFILE_AGGREGATE_HARD_CAP} profiles shown`,
  iscoEscoTop10: [
    row(1, "2512", "ISCO-08 2512", "Software and web developers", 30, 6),
    row(2, "5223", "ISCO-08 5223", "Retail and customer sales workers", 24, 10),
    row(3, "6111", "ISCO-08 6111", "Crop production and farm workers", 19, 8),
    row(4, "5120", "ISCO-08 5120", "Cooks and food preparation workers", 15, 5),
    row(5, "7411", "ISCO-08 7411", "Building and related electricians", 12, 3),
    row(6, "8322", "ISCO-08 8322", "Drivers and delivery workers", 12, 4),
    row(7, "4226", "ISCO-08 4226", "Front desk and client service clerks", 11, 4),
    row(8, "3313", "ISCO-08 3313", "Bookkeeping and accounting clerks", 9, 3),
    row(9, "5322", "ISCO-08 5322", "Care and community support workers", 8, 4),
    row(10, "7126", "ISCO-08 7126", "Plumbers and pipe fitters", 7, 2),
  ],
  unemploymentTop10: [
    row(1, "5223", "ISCO-08 5223", "Retail and customer sales workers", 10, 10),
    row(2, "6111", "ISCO-08 6111", "Crop production and farm workers", 8, 8),
    row(3, "2512", "ISCO-08 2512", "Software and web developers", 6, 6),
    row(4, "5120", "ISCO-08 5120", "Cooks and food preparation workers", 5, 5),
    row(5, "8322", "ISCO-08 8322", "Drivers and delivery workers", 4, 4),
    row(6, "4226", "ISCO-08 4226", "Front desk and client service clerks", 4, 4),
    row(7, "5322", "ISCO-08 5322", "Care and community support workers", 4, 4),
    row(8, "7411", "ISCO-08 7411", "Building and related electricians", 3, 3),
    row(9, "3313", "ISCO-08 3313", "Bookkeeping and accounting clerks", 3, 3),
    row(10, "7126", "ISCO-08 7126", "Plumbers and pipe fitters", 2, 2),
  ],
};

export async function getPolicyProfileAggregates(): Promise<PolicyProfileAggregates> {
  try {
    const db = getLocalDatabase();
    ensurePolicyProfileColumns(db);
    const availableProfiles = readCount(db, "SELECT COUNT(*) AS count FROM account_skill_profiles");

    if (availableProfiles === 0) {
      return HARDCODED_POLICY_AGGREGATES;
    }

    const totalProfiles = Math.min(availableProfiles, PROFILE_AGGREGATE_HARD_CAP);
    const summary = db
      .prepare(
        `WITH capped_profiles AS (
          SELECT *
          FROM account_skill_profiles
          ORDER BY updated_at DESC, created_at DESC, profile_id DESC
          LIMIT ?
        )
        SELECT
          COUNT(DISTINCT isco_code || '|' || isco_title) AS uniqueOccupations,
          SUM(CASE WHEN currently_employed = 0 THEN 1 ELSE 0 END) AS unemployedProfiles
        FROM capped_profiles`,
      )
      .get(PROFILE_AGGREGATE_HARD_CAP) as
      | { uniqueOccupations: number | null; unemployedProfiles: number | null }
      | undefined;

    return {
      totalProfiles,
      availableProfiles,
      profileCap: PROFILE_AGGREGATE_HARD_CAP,
      rowLimit: AGGREGATE_ROW_LIMIT,
      uniqueOccupations: summary?.uniqueOccupations ?? 0,
      unemployedProfiles: summary?.unemployedProfiles ?? 0,
      sourceLabel:
        availableProfiles > PROFILE_AGGREGATE_HARD_CAP
          ? `${PROFILE_AGGREGATE_HARD_CAP.toLocaleString()} profiles shown`
          : "All saved profiles in local aggregate",
      iscoEscoTop10: readAggregateRows(db, false),
      unemploymentTop10: readAggregateRows(db, true),
    };
  } catch (error) {
    console.error("Falling back to demo policy aggregates", error);
    return HARDCODED_POLICY_AGGREGATES;
  }
}

export async function getPolicyOccupationProfileGroup({
  iscoCode,
  onlyUnemployed = true,
}: {
  iscoCode: string;
  onlyUnemployed?: boolean;
}): Promise<PolicyOccupationProfileGroup> {
  const normalizedIscoCode = iscoCode.trim();
  if (!normalizedIscoCode) {
    throw new Error("Missing ISCO code.");
  }

  const db = getLocalDatabase();
  ensurePolicyProfileColumns(db);
  const summary = db
    .prepare(
      `WITH capped_profiles AS (
        SELECT *
        FROM account_skill_profiles
        ORDER BY updated_at DESC, created_at DESC, profile_id DESC
        LIMIT ?
      )
      SELECT
        isco_code AS iscoCode,
        isco_title AS title,
        COUNT(*) AS totalProfiles,
        SUM(CASE WHEN currently_employed = 0 THEN 1 ELSE 0 END) AS unemployedProfiles
      FROM capped_profiles
      WHERE isco_code = ?
      GROUP BY isco_code, isco_title
      LIMIT 1`,
    )
    .get(PROFILE_AGGREGATE_HARD_CAP, normalizedIscoCode) as
    | {
        iscoCode: string;
        title: string;
        totalProfiles: number;
        unemployedProfiles: number;
      }
    | undefined;

  const candidates = db
    .prepare(
      `WITH capped_profiles AS (
        SELECT *
        FROM account_skill_profiles
        ORDER BY updated_at DESC, created_at DESC, profile_id DESC
        LIMIT ?
      )
      SELECT
        profile_id AS profileId,
        full_name AS fullName,
        location,
        country,
        years_experience AS yearsExperience,
        education_skill_level AS educationSkillLevel,
        willing_to_relocate AS willingToRelocate,
        updated_at AS updatedAt
      FROM capped_profiles
      WHERE isco_code = ?
        AND (? = 0 OR currently_employed = 0)
      ORDER BY updated_at DESC, profile_id DESC`,
    )
    .all(PROFILE_AGGREGATE_HARD_CAP, normalizedIscoCode, onlyUnemployed ? 1 : 0) as Array<{
    profileId: string;
    fullName: string;
    location: string;
    country: string;
    yearsExperience: number;
    educationSkillLevel: string;
    willingToRelocate: number;
    updatedAt: string;
  }>;

  return {
    iscoCode: normalizedIscoCode,
    title: summary?.title ?? "Unknown occupation",
    totalProfiles: summary?.totalProfiles ?? 0,
    unemployedProfiles: summary?.unemployedProfiles ?? 0,
    shownProfiles: candidates.length,
    candidates: candidates.map((candidate) => ({
      profileId: candidate.profileId,
      fullName: candidate.fullName || "Unnamed candidate",
      location: candidate.location,
      country: candidate.country,
      yearsExperience: candidate.yearsExperience,
      educationSkillLevel: candidate.educationSkillLevel || "unknown",
      willingToRelocate: Boolean(candidate.willingToRelocate),
      updatedAt: candidate.updatedAt,
    })),
  };
}

function ensurePolicyProfileColumns(db: ReturnType<typeof getLocalDatabase>) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'account_skill_profiles'",
    )
    .all() as Array<{ name: string }>;
  if (tables.length === 0) return;

  ensureColumn(db, "education_taxonomy_level", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(db, "education_skill_level", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(db, "credential_category", "TEXT NOT NULL DEFAULT 'unknown'");
}

function ensureColumn(db: ReturnType<typeof getLocalDatabase>, column: string, definition: string) {
  const columns = db.prepare("PRAGMA table_info(account_skill_profiles)").all() as Array<{
    name: string;
  }>;
  if (columns.some((existingColumn) => existingColumn.name === column)) return;

  db.exec(`ALTER TABLE account_skill_profiles ADD COLUMN ${column} ${definition}`);
}

function readAggregateRows(
  db: ReturnType<typeof getLocalDatabase>,
  onlyUnemployed: boolean,
): PolicyAggregateRow[] {
  const rows = db
    .prepare(
      `WITH capped_profiles AS (
        SELECT *
        FROM account_skill_profiles
        ORDER BY updated_at DESC, created_at DESC, profile_id DESC
        LIMIT ?
      )
      SELECT
        isco_code AS iscoCode,
        isco_title AS iscoTitle,
        COUNT(*) AS profiles,
        SUM(CASE WHEN currently_employed = 0 THEN 1 ELSE 0 END) AS unemployedProfiles
      FROM capped_profiles
      ${onlyUnemployed ? "WHERE currently_employed = 0" : ""}
      GROUP BY isco_code, isco_title
      ORDER BY ${onlyUnemployed ? "unemployedProfiles" : "profiles"} DESC, isco_title ASC
      LIMIT ?`,
    )
    .all(PROFILE_AGGREGATE_HARD_CAP, AGGREGATE_ROW_LIMIT) as Array<{
    iscoCode: string;
    iscoTitle: string;
    profiles: number;
    unemployedProfiles: number;
  }>;

  return rows.map((item, index) =>
    row(
      index + 1,
      item.iscoCode || "unknown",
      `ISCO-08 ${item.iscoCode || "unknown"}`,
      item.iscoTitle || "Unknown occupation",
      item.profiles,
      item.unemployedProfiles,
    ),
  );
}

function readCount(db: ReturnType<typeof getLocalDatabase>, sql: string): number {
  const result = db.prepare(sql).get() as { count: number } | undefined;
  return result?.count ?? 0;
}

function row(
  rank: number,
  iscoCode: string,
  code: string,
  title: string,
  profiles: number,
  unemployedProfiles: number,
): PolicyAggregateRow {
  return {
    rank,
    iscoCode,
    code,
    title,
    profiles,
    unemployedProfiles,
    shareLabel: `${Math.round((unemployedProfiles / profiles) * 100)}% unemployed`,
  };
}
