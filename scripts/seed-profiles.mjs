import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const count = parsePositiveInteger(process.argv[2], 200);
const shouldWriteFiles = !process.argv.includes("--db-only");
const shouldPurgeSeeded = process.argv.includes("--purge-seeded");
const shouldPurgeOnly = process.argv.includes("--purge-only");
const now = new Date().toISOString();
const batchId = compactTimestamp(new Date());
const dbPath = resolve(process.cwd(), "database", "skill-pathfinders.sqlite");
const profileDir = resolve(process.cwd(), "candidate-profiles");

mkdirSync(dirname(dbPath), { recursive: true });
if (shouldWriteFiles) mkdirSync(profileDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
ensureSchema(db);

if (shouldPurgeSeeded) {
  db.prepare("DELETE FROM account_skill_profiles WHERE profile_id LIKE 'seed-candidate-%'").run();
}

if (shouldPurgeOnly) {
  const result = db.prepare("DELETE FROM account_skill_profiles WHERE profile_id LIKE 'seed-candidate-%'").run();
  console.log(`Deleted ${result.changes} seeded profiles from ${dbPath}.`);
  process.exit(0);
}

const insertProfile = db.prepare(`
  INSERT INTO account_skill_profiles (
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
    updated_at = excluded.updated_at
`);

function insertSnapshots(profiles) {
  db.exec("BEGIN");

  try {
    for (const snapshot of profiles) {
      const profile = snapshot.profile;
      const occupation = profile.occupation;
      const experience = profile.experience;

      insertProfile.run(
        snapshot.profileId,
        snapshot.accountId,
        profile.fullName,
        profile.telephoneNumber,
        occupation.iscoCode,
        occupation.iscoTitle,
        experience.totalYears,
        experience.hasJob ? 1 : 0,
        profile.location,
        profile.country,
        profile.experience.hasJob ? 1 : 0,
        profile.willingToRelocate ? 1 : 0,
        profile.education.credentialMapping.taxonomyLevel,
        profile.education.credentialMapping.estimatedSkillLevel,
        profile.education.credentialMapping.credentialCategory,
        JSON.stringify(profile.skills),
        JSON.stringify(profile),
        snapshot.status,
        snapshot.questionsAnswered,
        now,
        now,
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function createSnapshot(index) {
  const role = roles[index % roles.length];
  const country = countries[index % countries.length];
  const city = country.cities[Math.floor(index / countries.length) % country.cities.length];
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const fullName = `${firstName} ${lastName}`;
  const yearsExperience = 1 + ((index * 3) % 14);
  const hasJob = index % 4 !== 0;
  const willingToRelocate = index % 3 === 0;
  const profileId = `seed-candidate-${batchId}-${String(index + 1).padStart(3, "0")}`;
  const phoneSuffix = String(index + 1).padStart(6, "0");
  const technicalSkills = pickSkills(role.technical, index, 4, "technical", yearsExperience);
  const toolSkills = pickSkills(role.tools, index + 1, 3, "tool", yearsExperience);
  const softSkills = pickSkills(softSkillNames, index + 2, 3, "soft", yearsExperience);
  const languageSkills = createLanguageSkills(index, country);
  const allSkillNames = [...technicalSkills, ...toolSkills, ...softSkills].map((skill) => skill.name);
  const education = createEducation(role, index);

  const candidateProfile = {
    fullName,
    telephoneNumber: `${country.phonePrefix} ${phoneSuffix.slice(0, 3)} ${phoneSuffix.slice(3)}`,
    location: `${city}, ${country.name}`,
    country: country.code,
    willingToRelocate,
    profile: {
      roleName: role.roleName,
      normalizedRoleName: normalizeName(role.roleName),
      summary: `${role.roleName} with ${yearsExperience} years of experience in ${sentenceList(
        allSkillNames.slice(0, 4),
      )}. Interested in practical training and job opportunities in ${country.name}.`,
      seniority: seniorityForYears(yearsExperience),
      track: role.track,
      confidence: index % 7 === 0 ? "medium" : "high",
    },
    occupation: {
      iscoCode: role.iscoCode,
      iscoTitle: role.iscoTitle,
      escoOccupationCode: role.escoOccupationCode,
      escoOccupationUri: role.escoOccupationUri,
      escoOccupationTitle: role.escoOccupationTitle,
      alternativeOccupationMatches: role.alternatives,
    },
    experience: {
      hasJob,
      totalYears: yearsExperience,
      relevantYears: Math.max(1, yearsExperience - (index % 3)),
      industries: role.industries,
      jobTitles: role.jobTitles,
      companies: createCompanies(index),
      responsibilities: role.responsibilities,
      achievements: role.achievements,
    },
    education,
    skills: {
      technical: technicalSkills,
      tools: toolSkills,
      domain: pickSkills(role.domain, index + 3, 2, "domain", yearsExperience),
      business: pickSkills(businessSkillNames, index + 4, 2, "business", yearsExperience),
      soft: softSkills,
      languages: languageSkills,
    },
    evidence: [
      {
        claim: `${yearsExperience} years of experience as ${article(role.roleName)} ${role.roleName}.`,
        sourceText: "Synthetic seed profile generated for local testing.",
        confidence: "medium",
      },
      {
        claim: `Core skills include ${sentenceList(allSkillNames.slice(0, 5))}.`,
        sourceText: "Synthetic seed profile generated for local testing.",
        confidence: "medium",
      },
    ],
    automationAndReskilling: {
      automationRiskOccupationCode: role.iscoCode,
      automationRiskScore: role.automationRiskScore,
      riskDrivers: role.riskDrivers,
      resilientSkills: role.resilientSkills,
      missingRecommendedSkills: role.missingRecommendedSkills,
      recommendedLearningSkills: role.recommendedLearningSkills,
    },
  };

  return {
    profileId,
    accountId: null,
    profile: candidateProfile,
    status: "complete",
    questionsAnswered: 5 + (index % 4),
  };
}

function ensureSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS account_skill_profiles (
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
    );

    CREATE INDEX IF NOT EXISTS idx_account_skill_profiles_isco
      ON account_skill_profiles (isco_code, isco_title);

    CREATE INDEX IF NOT EXISTS idx_account_skill_profiles_has_job
      ON account_skill_profiles (has_job);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_account_skill_profiles_phone_unique
      ON account_skill_profiles (telephone_number)
      WHERE telephone_number <> '';
  `);

  ensureColumn(database, "education_taxonomy_level", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(database, "education_skill_level", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(database, "credential_category", "TEXT NOT NULL DEFAULT 'unknown'");
}

function pickSkills(source, seed, amount, category, yearsExperience) {
  return Array.from({ length: Math.min(amount, source.length) }, (_, offset) => {
    const name = source[(seed + offset) % source.length];
    return createSkill(name, category, yearsExperience, offset);
  });
}

function createSkill(name, category, yearsExperience, offset) {
  const proficiency = proficiencyForYears(Math.max(0, yearsExperience - offset));
  return {
    name,
    normalizedName: normalizeName(name),
    category,
    proficiency,
    yearsExperience: Math.max(1, yearsExperience - offset),
    evidence: [`Synthetic seed evidence for ${name}.`],
    escoSkillUri: "",
    escoPreferredLabel: "",
    escoSkillType: category === "language" ? "language" : category === "domain" ? "knowledge" : "skill/competence",
    confidence: offset > 1 ? "medium" : "high",
  };
}

function createLanguageSkills(index, country) {
  const languageSet = country.languageSets[index % country.languageSets.length];

  return languageSet.map((language, offset) => ({
    ...createSkill(language, "language", 4 - offset, offset),
    proficiency: offset === 0 ? "advanced" : offset === 1 ? "intermediate" : "basic",
  }));
}

function createEducation(role, index) {
  const education = {
    highestLevel: educationLevels[index % educationLevels.length],
    degrees: role.degrees,
    fieldsOfStudy: role.fieldsOfStudy,
    certifications: role.certifications,
    trainings: role.trainings,
  };

  return {
    ...education,
    credentialMapping: mapEducationCredential(education),
  };
}

function mapEducationCredential(education) {
  const evidenceText = [
    education.highestLevel,
    ...education.degrees,
    ...education.fieldsOfStudy,
    ...education.certifications,
    ...education.trainings,
  ]
    .filter(Boolean)
    .join(" ");
  const normalized = evidenceText.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const taxonomyLevel = detectTaxonomyLevel(normalized);
  const mapping = EDUCATION_MAPPINGS[taxonomyLevel];
  const hasCredentialItems =
    education.degrees.length > 0 || education.certifications.length > 0 || education.trainings.length > 0;

  return {
    ...mapping,
    confidence: taxonomyLevel === "unknown" ? "low" : hasCredentialItems ? "high" : "medium",
    rationale:
      taxonomyLevel === "unknown"
        ? "No education or credential evidence was captured in this seed profile."
        : `Estimated from synthetic seed education: ${evidenceText.slice(0, 140)}`,
  };
}

function detectTaxonomyLevel(value) {
  if (!value) return "unknown";
  if (/\b(no formal|none|no school|did not attend)\b/.test(value)) return "no_formal";
  if (/\b(phd|doctorate|doctoral|master|msc|ma |mba|postgraduate|graduate degree)\b/.test(value)) {
    return "postgraduate";
  }
  if (/\b(bachelor|bsc|ba |undergraduate|university degree|college degree)\b/.test(value)) {
    return "bachelor";
  }
  if (/\b(diploma|advanced diploma|associate)\b/.test(value)) return "diploma";
  if (/\b(certificate|certification|certified|short course|bootcamp|itil|cisco|aws)\b/.test(value)) {
    return "certificate";
  }
  if (/\b(vocational|technical school|trade school|apprentice|apprenticeship|tvet|polytechnic)\b/.test(value)) {
    return "vocational";
  }
  if (/\b(high school|senior secondary|upper secondary|secondary|shs|ssce|wassce|a level)\b/.test(value)) {
    return "upper_secondary";
  }
  if (/\b(junior secondary|middle school|lower secondary|jhs|o level)\b/.test(value)) {
    return "lower_secondary";
  }
  if (/\b(primary|elementary|basic school)\b/.test(value)) return "primary";

  return "unknown";
}

function ensureColumn(database, column, definition) {
  const columns = database.prepare("PRAGMA table_info(account_skill_profiles)").all();
  if (columns.some((existingColumn) => existingColumn.name === column)) return;

  database.exec(`ALTER TABLE account_skill_profiles ADD COLUMN ${column} ${definition}`);
}

function parsePositiveInteger(value, fallback) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function compactTimestamp(date) {
  return date.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function normalizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function proficiencyForYears(years) {
  if (years >= 8) return "expert";
  if (years >= 4) return "advanced";
  if (years >= 2) return "intermediate";
  return "basic";
}

function seniorityForYears(years) {
  if (years >= 12) return "lead";
  if (years >= 7) return "senior";
  if (years >= 4) return "mid";
  if (years >= 2) return "junior";
  return "entry";
}

function sentenceList(values) {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

function article(value) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}

function createCompanies(index) {
  const first = companies[index % companies.length];
  const second = companies[(index + 7) % companies.length];
  return first === second ? [first] : [first, second];
}

const firstNames = [
  "Amina",
  "Kwame",
  "Abena",
  "Chinedu",
  "Ama",
  "Kofi",
  "Fatou",
  "Yao",
  "Ngozi",
  "Kojo",
  "Adjoa",
  "Emeka",
  "Mariam",
  "Ifeoma",
  "Ibrahim",
  "Akosua",
];

const lastNames = [
  "Mensah",
  "Okafor",
  "Traore",
  "Boateng",
  "Adeyemi",
  "Kone",
  "Owusu",
  "Nwosu",
  "Bamba",
  "Agyeman",
  "Eze",
  "Coulibaly",
  "Osei",
  "Balogun",
  "Toure",
  "Acheampong",
];

const countries = [
  {
    code: "GHA",
    name: "Ghana",
    phonePrefix: "+233",
    cities: ["Accra", "Kumasi", "Tamale", "Takoradi"],
    languageSets: [
      ["English", "Twi"],
      ["English", "Ga"],
      ["English", "Ewe"],
      ["English", "Dagbani"],
    ],
  },
  {
    code: "NGA",
    name: "Nigeria",
    phonePrefix: "+234",
    cities: ["Lagos", "Abuja", "Ibadan", "Kano", "Port Harcourt"],
    languageSets: [
      ["English", "Yoruba"],
      ["English", "Igbo"],
      ["English", "Hausa"],
      ["English", "Pidgin English"],
    ],
  },
  {
    code: "CIV",
    name: "Ivory Coast",
    phonePrefix: "+225",
    cities: ["Abidjan", "Yamoussoukro", "Bouake", "San Pedro"],
    languageSets: [
      ["French", "Dioula"],
      ["French", "Baoule"],
      ["French", "Bete"],
      ["French", "English"],
    ],
  },
  {
    code: "GHA",
    name: "Ghana",
    phonePrefix: "+233",
    cities: ["Cape Coast", "Sunyani", "Tema", "Ho"],
    languageSets: [
      ["English", "Fante"],
      ["English", "Twi"],
      ["English", "Hausa"],
      ["English", "Ewe"],
    ],
  },
  {
    code: "NGA",
    name: "Nigeria",
    phonePrefix: "+234",
    cities: ["Enugu", "Abeokuta", "Kaduna", "Benin City"],
    languageSets: [
      ["English", "Igbo"],
      ["English", "Yoruba"],
      ["English", "Hausa"],
      ["English", "Pidgin English"],
    ],
  },
];

const companies = [
  "City Services Group",
  "Alpine Digital",
  "GreenWorks Cooperative",
  "CarePlus Clinic",
  "LogiMove",
  "Bright Retail",
  "Urban Build",
  "FoodCraft Kitchen",
  "Northstar Manufacturing",
  "Open Learning Center",
];

const educationLevels = [
  "upper secondary",
  "vocational",
  "bachelor",
  "postgraduate",
  "certificate",
  "diploma",
  "primary",
];

const EDUCATION_MAPPINGS = {
  no_formal: educationMapping("no_formal", "No formal education", "none", "No credential captured", "foundational"),
  primary: educationMapping("primary", "Primary education", "school", "School credential", "basic"),
  lower_secondary: educationMapping(
    "lower_secondary",
    "Lower secondary education",
    "school",
    "School credential",
    "basic",
  ),
  upper_secondary: educationMapping(
    "upper_secondary",
    "Upper secondary education",
    "school",
    "School credential",
    "intermediate",
  ),
  vocational: educationMapping(
    "vocational",
    "Vocational or trade training",
    "vocational_training",
    "Vocational/trade credential",
    "intermediate",
  ),
  certificate: educationMapping(
    "certificate",
    "Short certificate",
    "short_certificate",
    "Short certificate",
    "intermediate",
  ),
  diploma: educationMapping("diploma", "Diploma or advanced diploma", "diploma", "Diploma", "advanced"),
  bachelor: educationMapping("bachelor", "Bachelor degree", "degree", "Degree", "advanced"),
  postgraduate: educationMapping(
    "postgraduate",
    "Postgraduate degree",
    "postgraduate_degree",
    "Postgraduate degree",
    "specialized",
  ),
  unknown: educationMapping("unknown", "Unknown education level", "unknown", "Unknown credential", "unknown"),
};

function educationMapping(
  taxonomyLevel,
  taxonomyLabel,
  credentialCategory,
  credentialLabel,
  estimatedSkillLevel,
) {
  return {
    taxonomyLevel,
    taxonomyLabel,
    credentialCategory,
    credentialLabel,
    estimatedSkillLevel,
  };
}

const softSkillNames = [
  "Communication",
  "Teamwork",
  "Problem solving",
  "Adaptability",
  "Customer orientation",
  "Time management",
  "Conflict resolution",
  "Attention to detail",
];

const businessSkillNames = [
  "Project coordination",
  "Customer service",
  "Inventory planning",
  "Quality assurance",
  "Process improvement",
  "Documentation",
  "Stakeholder communication",
  "Training coordination",
];

const roles = [
  {
    roleName: "Software Developer",
    track: "tech",
    iscoCode: "2512",
    iscoTitle: "Software developers",
    escoOccupationCode: "2512.1",
    escoOccupationUri: "http://data.europa.eu/esco/occupation/0728f6bf-e2f4-4b42-9526-f76c971a8b5d",
    escoOccupationTitle: "Software developer",
    alternatives: [],
    industries: ["Software Development", "Information Technology", "Digital Services"],
    jobTitles: ["Junior Developer", "Full-stack Developer", "Application Developer"],
    responsibilities: ["Build web applications", "Maintain APIs", "Fix software defects", "Review code"],
    achievements: ["Delivered internal workflow tools", "Improved deployment documentation"],
    technical: ["React", "TypeScript", "Node.js", "SQL", "REST APIs", "Testing"],
    tools: ["GitHub", "Visual Studio Code", "Docker", "Postman", "Jira"],
    domain: ["Web applications", "API integration", "Data management"],
    degrees: ["BSc Computer Science", "Software engineering certificate"],
    fieldsOfStudy: ["Computer Science", "Software Engineering"],
    certifications: ["Scrum Fundamentals", "Cloud practitioner training"],
    trainings: ["Web development bootcamp"],
    automationRiskScore: 28,
    riskDrivers: ["Routine coding tasks", "Repeated bug triage"],
    resilientSkills: ["System design", "Debugging", "Stakeholder communication"],
    missingRecommendedSkills: ["Cloud architecture", "AI-assisted development"],
    recommendedLearningSkills: ["Advanced TypeScript", "Cloud deployment"],
  },
  {
    roleName: "ICT Support Technician",
    track: "tech",
    iscoCode: "3512",
    iscoTitle: "Information and communications technology user support technicians",
    escoOccupationCode: "3512.1",
    escoOccupationUri: "https://data.europa.eu/esco/occupation/d513b2e0-b1f1-4553-89e2-217eb66e5b42",
    escoOccupationTitle: "ICT user support technician",
    alternatives: [],
    industries: ["Information Technology", "Retail", "Business Services"],
    jobTitles: ["IT Support Agent", "Service Desk Technician", "Application Support Specialist"],
    responsibilities: ["Resolve user incidents", "Document support cases", "Install software", "Escalate defects"],
    achievements: ["Reduced ticket backlog", "Created onboarding checklists"],
    technical: ["Troubleshooting", "Windows administration", "Networking basics", "SQL queries", "ITIL practices"],
    tools: ["ServiceNow", "Jira", "Microsoft 365", "Remote Desktop", "Confluence"],
    domain: ["Service desk operations", "Incident management", "User support"],
    degrees: ["Vocational IT diploma", "IT systems certificate"],
    fieldsOfStudy: ["Information Technology", "Systems Support"],
    certifications: ["ITIL Foundation", "Microsoft 365 fundamentals"],
    trainings: ["Customer support training"],
    automationRiskScore: 45,
    riskDrivers: ["Repeated password and access requests", "Scriptable diagnostics"],
    resilientSkills: ["User empathy", "Escalation judgment", "Incident analysis"],
    missingRecommendedSkills: ["Cloud support", "Security operations"],
    recommendedLearningSkills: ["Azure administration", "Cybersecurity basics"],
  },
  {
    roleName: "Electrician",
    track: "trade",
    iscoCode: "7411",
    iscoTitle: "Building and related electricians",
    escoOccupationCode: "7411.1",
    escoOccupationUri: "https://data.europa.eu/esco/occupation",
    escoOccupationTitle: "Building electrician",
    alternatives: [],
    industries: ["Construction", "Facility Services", "Energy"],
    jobTitles: ["Apprentice Electrician", "Maintenance Electrician", "Installation Technician"],
    responsibilities: ["Install wiring", "Read technical drawings", "Test electrical systems", "Follow safety rules"],
    achievements: ["Completed renovation wiring", "Improved inspection checklist"],
    technical: ["Electrical installation", "Circuit testing", "Blueprint reading", "Safety compliance", "Maintenance"],
    tools: ["Multimeter", "Cable tester", "Power drill", "Hand tools", "Safety equipment"],
    domain: ["Building systems", "Facility maintenance", "Energy efficiency"],
    degrees: ["Electrical apprenticeship", "Vocational school diploma"],
    fieldsOfStudy: ["Electrical Engineering", "Building Services"],
    certifications: ["Electrical safety certificate"],
    trainings: ["Workplace safety training"],
    automationRiskScore: 32,
    riskDrivers: ["Standardized inspection routines"],
    resilientSkills: ["On-site problem solving", "Safety judgment", "Manual installation"],
    missingRecommendedSkills: ["Smart building systems", "Solar PV installation"],
    recommendedLearningSkills: ["Photovoltaics", "Building automation"],
  },
  {
    roleName: "Nursing Assistant",
    track: "other",
    iscoCode: "5321",
    iscoTitle: "Health care assistants",
    escoOccupationCode: "5321.1",
    escoOccupationUri: "https://data.europa.eu/esco/occupation",
    escoOccupationTitle: "Health care assistant",
    alternatives: [],
    industries: ["Healthcare", "Elder Care", "Community Services"],
    jobTitles: ["Care Assistant", "Nursing Assistant", "Home Care Worker"],
    responsibilities: ["Support daily care", "Record patient observations", "Assist mobility", "Communicate with families"],
    achievements: ["Supported patient discharge process", "Mentored new care staff"],
    technical: ["Patient care", "Vital signs monitoring", "Hygiene support", "Mobility assistance", "Care documentation"],
    tools: ["Care records system", "Mobility aids", "Blood pressure monitor", "Medication trolley"],
    domain: ["Elder care", "Patient safety", "Health documentation"],
    degrees: ["Care assistant certificate", "Healthcare vocational training"],
    fieldsOfStudy: ["Healthcare", "Nursing Assistance"],
    certifications: ["First aid", "Basic life support"],
    trainings: ["Dementia care training"],
    automationRiskScore: 20,
    riskDrivers: ["Administrative documentation"],
    resilientSkills: ["Human care", "Observation", "Empathy"],
    missingRecommendedSkills: ["Digital care records", "Specialized elder care"],
    recommendedLearningSkills: ["Care technology", "Dementia support"],
  },
  {
    roleName: "Warehouse Operator",
    track: "trade",
    iscoCode: "4321",
    iscoTitle: "Stock clerks",
    escoOccupationCode: "4321.1",
    escoOccupationUri: "https://data.europa.eu/esco/occupation",
    escoOccupationTitle: "Stock clerk",
    alternatives: [],
    industries: ["Logistics", "Retail", "Manufacturing"],
    jobTitles: ["Warehouse Assistant", "Inventory Clerk", "Forklift Operator"],
    responsibilities: ["Pick and pack orders", "Check inventory", "Prepare shipments", "Operate warehouse systems"],
    achievements: ["Improved stock count accuracy", "Trained seasonal staff"],
    technical: ["Inventory control", "Order picking", "Forklift operation", "Barcode scanning", "Quality checks"],
    tools: ["Warehouse management system", "Barcode scanner", "Forklift", "Pallet jack"],
    domain: ["Logistics", "Stock management", "Shipment preparation"],
    degrees: ["Logistics vocational certificate"],
    fieldsOfStudy: ["Logistics", "Supply Chain"],
    certifications: ["Forklift license", "Workplace safety"],
    trainings: ["Inventory accuracy training"],
    automationRiskScore: 58,
    riskDrivers: ["Automated picking", "Warehouse robotics"],
    resilientSkills: ["Exception handling", "Equipment operation", "Quality awareness"],
    missingRecommendedSkills: ["WMS administration", "Lean logistics"],
    recommendedLearningSkills: ["Warehouse software", "Process optimization"],
  },
  {
    roleName: "Agricultural Technician",
    track: "agriculture",
    iscoCode: "3142",
    iscoTitle: "Agricultural technicians",
    escoOccupationCode: "3142.1",
    escoOccupationUri: "https://data.europa.eu/esco/occupation",
    escoOccupationTitle: "Agricultural technician",
    alternatives: [],
    industries: ["Agriculture", "Food Production", "Environmental Services"],
    jobTitles: ["Farm Technician", "Crop Assistant", "Irrigation Technician"],
    responsibilities: ["Monitor crop health", "Maintain equipment", "Collect field data", "Support harvest planning"],
    achievements: ["Reduced irrigation waste", "Improved field reporting"],
    technical: ["Crop monitoring", "Irrigation systems", "Soil sampling", "Equipment maintenance", "Pest control"],
    tools: ["GPS mapping", "Irrigation controller", "Soil test kit", "Tractor"],
    domain: ["Crop production", "Sustainable agriculture", "Farm operations"],
    degrees: ["Agriculture vocational diploma"],
    fieldsOfStudy: ["Agriculture", "Environmental Management"],
    certifications: ["Pesticide handling certificate"],
    trainings: ["Precision agriculture training"],
    automationRiskScore: 39,
    riskDrivers: ["Sensor-based monitoring", "Automated irrigation"],
    resilientSkills: ["Field judgment", "Equipment maintenance", "Local crop knowledge"],
    missingRecommendedSkills: ["Drone mapping", "Data-driven farming"],
    recommendedLearningSkills: ["Precision agriculture", "Farm data analysis"],
  },
];

const snapshots = Array.from({ length: count }, (_, index) => createSnapshot(index));
insertSnapshots(snapshots);

if (shouldWriteFiles) {
  for (const snapshot of snapshots) {
    writeFileSync(
      resolve(profileDir, `${snapshot.profileId}.json`),
      `${JSON.stringify({ ...snapshot, savedAt: now }, null, 2)}\n`,
      "utf8",
    );
  }
}

console.log(
  `Seeded ${snapshots.length} profiles into ${dbPath}${shouldWriteFiles ? ` and ${profileDir}` : ""}.`,
);
