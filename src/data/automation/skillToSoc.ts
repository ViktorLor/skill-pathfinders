/**
 * Maps common skill names (lowercased) to one or more SOC 2010 codes whose
 * Frey-Osborne automation probability is the most representative anchor for
 * the skill in question.
 *
 * When a skill maps to multiple SOC codes, we use the average probability
 * across the matched occupations (a skill rarely belongs to exactly one job).
 *
 * Keys must be lowercased; lookup is exact-match first, then keyword-substring.
 */

export const SKILL_TO_SOC: Record<string, string[]> = {
  // --- Programming languages / web ---
  javascript: ["15-1252", "15-1254"],
  typescript: ["15-1252", "15-1254"],
  react: ["15-1252", "15-1254"],
  "react.js": ["15-1252", "15-1254"],
  vue: ["15-1252", "15-1254"],
  angular: ["15-1252", "15-1254"],
  "next.js": ["15-1252", "15-1254"],
  python: ["15-1252", "15-2051"],
  java: ["15-1252"],
  "java spring": ["15-1252"],
  spring: ["15-1252"],
  kotlin: ["15-1252"],
  swift: ["15-1252"],
  "c++": ["15-1252"],
  "c#": ["15-1252"],
  rust: ["15-1252"],
  go: ["15-1252"],
  golang: ["15-1252"],
  "node.js": ["15-1252", "15-1244"],
  nodejs: ["15-1252", "15-1244"],
  ruby: ["15-1252"],
  php: ["15-1252", "15-1254"],
  html: ["15-1254"],
  css: ["15-1254"],
  "full-stack development": ["15-1252", "15-1254"],
  "fullstack development": ["15-1252", "15-1254"],
  "frontend development": ["15-1254"],
  "backend development": ["15-1252"],
  "software developer": ["15-1252"],
  "software development": ["15-1252"],
  "web developer": ["15-1254"],

  // --- Data / databases / cloud ---
  sql: ["15-1242"],
  postgresql: ["15-1242"],
  mysql: ["15-1242"],
  mongodb: ["15-1242"],
  aws: ["15-1244", "15-1241"],
  "amazon web services": ["15-1244", "15-1241"],
  azure: ["15-1244"],
  "google cloud": ["15-1244"],
  gcp: ["15-1244"],
  cloudflare: ["15-1244"],
  docker: ["15-1244"],
  kubernetes: ["15-1244"],
  devops: ["15-1244", "15-1241"],
  "data engineering": ["15-2051", "15-1242"],
  "data analysis": ["15-2051"],
  analytics: ["15-2051"],
  statistics: ["15-2051"],

  // --- AI / ML ---
  "artificial intelligence": ["15-2031", "15-2051"],
  ai: ["15-2031", "15-2051"],
  "machine learning": ["15-2031", "15-2051"],
  ml: ["15-2031", "15-2051"],
  "ai-agent workflows": ["15-2031", "15-1252"],
  "ai-agent workflow": ["15-2031", "15-1252"],
  rag: ["15-2031", "15-1252"],
  "retrieval-augmented generation": ["15-2031", "15-1252"],
  langchain: ["15-1252", "15-2031"],
  langdock: ["15-1252", "15-2031"],
  "llm orchestration": ["15-1252", "15-2031"],
  "knowledge engineering": ["15-2031"],

  // --- Tech operations ---
  "issue analysis": ["15-1232"], // computer user support specialist (FO 0.70 typical)
  "system maintenance": ["15-1244"],
  "application support": ["15-1232", "15-1244"],
  "ict user support technician": ["15-1232"],
  "user support technician": ["15-1232"],
  "computer user support": ["15-1232"],
  "level 1 support": ["15-1232"],
  "level 2 support": ["15-1232"],
  "incident management": ["15-1244"],
  troubleshooting: ["15-1232", "49-2092"],

  // --- Office / clerical ---
  "basic accounting": ["43-3031", "13-2011"],
  accounting: ["43-3031", "13-2011"],
  bookkeeping: ["43-3031"],
  "data entry": ["43-9061"],
  "office administration": ["43-9061", "43-6014"],
  payroll: ["43-3051"],
  receptionist: ["43-4171"],
  "customer service": ["43-4051"],
  "customer support": ["43-4051"],
  telesales: ["41-9041"],
  telemarketing: ["41-9041"],

  // --- Communication / writing ---
  writing: ["27-3043"],
  "content writing": ["27-3043"],
  copywriting: ["27-3043"],
  editing: ["27-3041"],
  translation: ["27-3091"],
  interpretation: ["27-3091"],
  "public relations": ["27-3031"],

  // --- Management ---
  "project management": ["11-9199"],
  "team leadership": ["11-9199"],
  "people management": ["11-9199"],
  "marketing management": ["11-2021"],
  "sales management": ["11-2022"],

  // --- Trade / repair ---
  "phone repair": ["49-2094"],
  "mobile phone repair": ["49-2094"],
  "electronics repair": ["49-2094"],
  "computer repair": ["49-2092"],
  hvac: ["49-9021"],
  plumbing: ["47-2152"],
  electrical: ["47-2111"],
  electrician: ["47-2111"],
  carpentry: ["47-2031"],
  welding: ["51-4121"],
  "auto repair": ["49-3023"],
  "automotive service": ["49-3023"],
  "telecom installation": ["49-2022"],

  // --- Retail / sales ---
  "retail sales": ["41-2031"],
  cashier: ["41-2011"],
  inventory: ["43-5071"],
  "inventory management": ["43-5071"],
  "stock clerk": ["43-5071"],
  "order filler": ["43-5071"],

  // --- Service / hospitality ---
  cooking: ["35-2014"],
  cleaning: ["37-2011"],
  childcare: ["39-9011"],
  hairdressing: ["39-5012"],
  tailoring: ["51-6052"],
  sewing: ["51-6031"],

  // --- Agriculture ---
  "crop cultivation": ["45-2092", "11-9013-A"],
  farming: ["45-2092", "11-9013-A"],
  "irrigation management": ["45-2092"],
  irrigation: ["45-2092"],
  "pest control": ["45-2092"],
  "record keeping": ["43-3031", "43-9061"],
  "cooperative management": ["11-9013-A"],
  "agricultural technician": ["19-4011"],
  "post-harvest": ["45-2041"],
  "agricultural inspection": ["45-2011"],

  // --- Health ---
  nursing: ["29-1141"],
  "patient care": ["29-1141"],
  "health care assistant": ["31-1011"],
  "healthcare assistant": ["31-1011"],
  "home health aide": ["31-1011"],
  "medical informatics": ["11-9111", "15-1252"],

  // --- Soft skills (low risk anchors via teacher / manager) ---
  communication: ["25-2031"],
  "stakeholder communication": ["27-3031", "11-9199"],
  facilitation: ["25-2031"],
  mentoring: ["25-2031"],
  "training delivery": ["25-2031"],
  negotiation: ["11-2022"],
  collaboration: ["11-9199"],
  "problem solving": ["15-2031"],
  "critical thinking": ["15-2031"],
  leadership: ["11-9199"],
  "project coordination": ["11-9199"],

  // --- Languages (translation anchor) ---
  english: ["27-3091"],
  german: ["27-3091"],
  arabic: ["27-3091"],
  turkish: ["27-3091"],
  french: ["27-3091"],
  spanish: ["27-3091"],
  twi: ["27-3091"],
  bengali: ["27-3091"],
  yoruba: ["27-3091"],
  hausa: ["27-3091"],
  igbo: ["27-3091"],

  // --- Domain knowledge ---
  fhir: ["29-9021"], // health information technologist anchor; FO ≈ 0.40
  "data-driven systems": ["15-2031"],
};

/**
 * Resolve the SOC codes for a skill. Returns an empty array if no match
 * was found in either the exact-name index or via keyword substring.
 */
export function lookupSocForSkill(skillName: string): string[] {
  const name = skillName.trim().toLowerCase();
  if (!name) return [];

  const exact = SKILL_TO_SOC[name];
  if (exact?.length) return exact;

  // Substring fallback: find the longest matching key contained in or that
  // contains the skill name. This handles "Java Spring Boot" → "java spring".
  let bestKey: string | null = null;
  for (const key of Object.keys(SKILL_TO_SOC)) {
    if (name.includes(key) || key.includes(name)) {
      if (!bestKey || key.length > bestKey.length) bestKey = key;
    }
  }
  return bestKey ? SKILL_TO_SOC[bestKey] : [];
}
