import type {
  CountryConfig,
  CandidateProfile,
  JobMatch,
} from "@/types/unmapped";

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  GHA: {
    code: "GHA",
    name: "Ghana",
    flag: "🇬🇭",
    language: "en",
    currency: "GHS",
    currencySymbol: "₵",
    iloCountryCode: "GHA",
    wbCountryCode: "GH",
    sectors: ["ICT", "Trade & Retail", "Agriculture", "Construction", "Textiles"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (ICT): GHS 2,400/mo",
    youthUnemployment: "Youth unemployment: 12.4%",
  },
  BGD: {
    code: "BGD",
    name: "Bangladesh",
    flag: "🇧🇩",
    language: "en",
    currency: "BDT",
    currencySymbol: "৳",
    iloCountryCode: "BGD",
    wbCountryCode: "BD",
    sectors: ["Garment & Textiles", "Agriculture", "ICT", "Construction", "Fishing"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (Textiles): BDT 8,200/mo",
    youthUnemployment: "Youth unemployment: 10.6%",
  },
  NGA: {
    code: "NGA",
    name: "Nigeria",
    flag: "🇳🇬",
    language: "en",
    currency: "NGN",
    currencySymbol: "₦",
    iloCountryCode: "NGA",
    wbCountryCode: "NG",
    sectors: ["ICT", "Trade & Retail", "Agriculture", "Finance", "Construction"],
    opportunityTypes: ["formal", "self-employment", "gig", "training"],
    avgWageSignal: "Avg. wage (ICT): NGN 180,000/mo",
    youthUnemployment: "Youth unemployment: 19.2%",
  },
};

export const MOCK_TECH_CANDIDATE: CandidateProfile = {
  id: "demo-tech",
  name: "Kwame Asante",
  age: 24,
  location: "Accra, Ghana",
  track: "tech",
  country: COUNTRY_CONFIGS.GHA,
  trustScore: 84,
  escoOccupation: "2512 · Software Developer",
  avgWageInSector: "Avg. wage (ICT, Ghana): GHS 2,400/mo",
  youthUnemploymentRate: "Youth unemployment (Ghana ICT): 12.4%",
  pipelineStatus: "complete",
  skillScores: [
    {
      name: "JavaScript",
      score: 91,
      status: "confirmed",
      yearsClaimed: 3,
      yearsFound: 3.1,
      evidence: ["12 repos found", "consistent commits 2021–2024"],
      flags: [],
      verifiedBy: "github",
    },
    {
      name: "React",
      score: 72,
      status: "partial",
      yearsClaimed: 5,
      yearsFound: 1.5,
      evidence: ["3 React repos found"],
      flags: ["Claimed 5 years — only 18 months of activity found"],
      verifiedBy: "github",
    },
    {
      name: "Node.js",
      score: 85,
      status: "confirmed",
      yearsClaimed: 2,
      yearsFound: 2.2,
      evidence: ["8 backend repos"],
      flags: [],
      verifiedBy: "github",
    },
    {
      name: "AWS",
      score: 23,
      status: "no_evidence",
      evidence: [],
      flags: ["No AWS usage found in any public repo"],
      verifiedBy: "github",
    },
    {
      name: "PostgreSQL",
      score: 78,
      status: "confirmed",
      evidence: ["5 repos with DB schemas"],
      flags: [],
      verifiedBy: "github",
    },
  ],
  experience: [
    {
      title: "Freelance Web Developer",
      context: "self-employed",
      duration: "2021–present",
      description: "Built 8 client websites",
    },
    {
      title: "IT Support",
      context: "informal",
      duration: "2020–2021",
      description: "Hardware and network support",
    },
  ],
};

export const MOCK_TRADE_CANDIDATE: CandidateProfile = {
  id: "demo-trade",
  name: "Amara Mensah",
  age: 22,
  location: "Kumasi, Ghana",
  track: "trade",
  country: COUNTRY_CONFIGS.GHA,
  trustScore: 76,
  escoOccupation: "7521 · Electronics & Telecom Equipment Installer",
  avgWageInSector: "Avg. wage (Repair services, Ghana): GHS 980/mo",
  youthUnemploymentRate: "Youth unemployment (Ghana): 12.4%",
  pipelineStatus: "complete",
  skillScores: [
    {
      name: "Phone repair",
      score: 88,
      status: "confirmed",
      evidence: [
        "5 years running repair business",
        "Community validator: market supervisor",
      ],
      flags: [],
      verifiedBy: "community",
    },
    {
      name: "Customer service",
      score: 82,
      status: "confirmed",
      evidence: ["Self-reported: 200+ customers/month"],
      flags: [],
      verifiedBy: "interview",
    },
    {
      name: "Basic accounting",
      score: 65,
      status: "challenged",
      evidence: ["Passed micro-challenge: calculate profit margins"],
      flags: [],
      verifiedBy: "challenge",
    },
    {
      name: "Inventory management",
      score: 71,
      status: "confirmed",
      evidence: ["Manages spare parts stock independently"],
      flags: [],
      verifiedBy: "interview",
    },
    {
      name: "English (written)",
      score: 55,
      status: "partial",
      evidence: ["Conversational confirmed"],
      flags: ["Written English limited — consider training"],
      verifiedBy: "interview",
    },
  ],
  experience: [
    {
      title: "Phone Repair Technician",
      context: "self-employed",
      duration: "2019–present",
      description:
        "Screen replacement, water damage repair, software flashing",
    },
    {
      title: "Market Trader",
      context: "informal",
      duration: "2017–2019",
      description: "Mobile accessories retail",
    },
  ],
};

export const MOCK_AGRI_CANDIDATE: CandidateProfile = {
  id: "demo-agri",
  name: "Kofi Darko",
  age: 28,
  location: "Brong-Ahafo, Ghana",
  track: "agriculture",
  country: COUNTRY_CONFIGS.GHA,
  trustScore: 79,
  escoOccupation: "6111 · Field Crop Farmer",
  avgWageInSector: "Avg. income (Smallholder farming, Ghana): GHS 600/mo",
  youthUnemploymentRate: "Rural youth underemployment (Ghana): 34%",
  pipelineStatus: "complete",
  skillScores: [
    {
      name: "Crop cultivation",
      score: 90,
      status: "confirmed",
      evidence: ["8 years farming maize and cassava", "2.4ha land managed"],
      flags: [],
      verifiedBy: "community",
    },
    {
      name: "Irrigation management",
      score: 74,
      status: "confirmed",
      evidence: ["Drip irrigation system installed independently"],
      flags: [],
      verifiedBy: "interview",
    },
    {
      name: "Pest control",
      score: 68,
      status: "challenged",
      evidence: ["Passed knowledge challenge on integrated pest management"],
      flags: [],
      verifiedBy: "challenge",
    },
    {
      name: "Record keeping",
      score: 42,
      status: "partial",
      evidence: ["Basic income tracking"],
      flags: ["No systematic records — recommended for training"],
      verifiedBy: "interview",
    },
    {
      name: "Cooperative management",
      score: 60,
      status: "confirmed",
      evidence: ["Member of local farmers cooperative"],
      flags: [],
      verifiedBy: "community",
    },
  ],
  experience: [
    {
      title: "Smallholder Farmer",
      context: "self-employed",
      duration: "2016–present",
      description: "Maize, cassava, yam cultivation on family land",
    },
    {
      title: "Cooperative Member",
      context: "informal",
      duration: "2020–present",
      description: "Group purchasing and collective selling",
    },
  ],
};

export const MOCK_JOB_MATCHES_TECH: JobMatch[] = [
  {
    id: "j1",
    title: "Junior Frontend Developer",
    company: "Paystack",
    location: "Accra (Remote OK)",
    type: "formal",
    matchScore: 88,
    matchStatus: "strong_match",
    matchedSkills: ["JavaScript", "React", "Node.js"],
    missingSkills: ["TypeScript"],
    gapAnalysis:
      "Strong JS foundation confirmed on GitHub. TypeScript learnable in ~3 weeks.",
    wageRange: "GHS 2,000–3,200/mo",
    sourceUrl: "#",
  },
  {
    id: "j2",
    title: "React Engineer",
    company: "Flutterwave",
    location: "Remote Africa",
    type: "formal",
    matchScore: 76,
    matchStatus: "good_match",
    matchedSkills: ["React", "JavaScript"],
    missingSkills: ["AWS", "Docker"],
    gapAnalysis:
      "React partially verified. AWS claim flagged — recommend honest disclosure.",
    wageRange: "GHS 2,500–4,000/mo",
    sourceUrl: "#",
  },
];

export const MOCK_JOB_MATCHES_TRADE: JobMatch[] = [
  {
    id: "j3",
    title: "Electronics Repair Technician",
    company: "Telecel Ghana",
    location: "Accra",
    type: "formal",
    matchScore: 84,
    matchStatus: "strong_match",
    matchedSkills: ["Phone repair", "Customer service", "Inventory management"],
    missingSkills: ["Written English"],
    gapAnalysis:
      "Strong practical skills confirmed via community validation. English writing course recommended.",
    wageRange: "GHS 1,200–1,800/mo",
    sourceUrl: "#",
  },
  {
    id: "j4",
    title: "Tech Hub Repair Trainer",
    company: "iSpace Foundation",
    location: "Kumasi",
    type: "training",
    matchScore: 71,
    matchStatus: "good_match",
    matchedSkills: ["Phone repair", "Customer service"],
    missingSkills: ["Teaching skills", "Written English"],
    gapAnalysis:
      "Repair expertise well above threshold. Teaching certification available at iSpace.",
    wageRange: "GHS 1,400–2,000/mo",
    sourceUrl: "#",
  },
];

export const MOCK_JOB_MATCHES_AGRI: JobMatch[] = [
  {
    id: "j5",
    title: "Agricultural Extension Field Officer",
    company: "MoFA Ghana",
    location: "Brong-Ahafo",
    type: "formal",
    matchScore: 72,
    matchStatus: "good_match",
    matchedSkills: ["Crop cultivation", "Pest control", "Cooperative management"],
    missingSkills: ["Record keeping", "Report writing"],
    gapAnalysis:
      "Deep practical knowledge confirmed. Record-keeping gap flagged — short training available.",
    wageRange: "GHS 1,100–1,600/mo",
    sourceUrl: "#",
  },
  {
    id: "j6",
    title: "Cooperative Coordinator",
    company: "Peasant Farmers Association",
    location: "Sunyani",
    type: "formal",
    matchScore: 68,
    matchStatus: "good_match",
    matchedSkills: ["Cooperative management", "Crop cultivation"],
    missingSkills: ["Financial literacy", "Record keeping"],
    gapAnalysis:
      "Community leadership experience strong. Financial training would unlock this role.",
    wageRange: "GHS 900–1,300/mo",
    sourceUrl: "#",
  },
];

export function getCandidateById(id: string): CandidateProfile | null {
  if (id === "demo-tech" || id === "cand_001") return MOCK_TECH_CANDIDATE;
  if (id === "demo-trade" || id === "cand_002") return MOCK_TRADE_CANDIDATE;
  if (id === "demo-agri" || id === "cand_003") return MOCK_AGRI_CANDIDATE;
  return null;
}

export function getJobMatchesForTrack(track: string): JobMatch[] {
  if (track === "tech") return MOCK_JOB_MATCHES_TECH;
  if (track === "trade") return MOCK_JOB_MATCHES_TRADE;
  return MOCK_JOB_MATCHES_AGRI;
}
