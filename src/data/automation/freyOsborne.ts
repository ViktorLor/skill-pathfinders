/**
 * Frey & Osborne (2017) automation probability dataset
 *
 * Source: Frey, C. B., & Osborne, M. A. (2017). The future of employment:
 * How susceptible are jobs to computerisation? Technological Forecasting
 * and Social Change, 114, 254–280.
 * https://doi.org/10.1016/j.techfore.2016.08.019
 *
 * The original paper covers 702 SOC 2010 occupations. The subset below
 * concentrates on occupations relevant to this platform's three tracks
 * (tech, trade, agriculture) plus common LMIC service jobs. Probabilities
 * are reproduced verbatim from Frey & Osborne's Appendix.
 *
 * Probabilities are *US-derived* — they need to be calibrated to LMIC
 * labor markets before use (see `countryModifier.ts`).
 */

export interface FreyOsborneEntry {
  socCode: string;
  occupation: string;
  probability: number;
  /** ISCO-08 4-digit equivalent, used to look up ILO task-content shares */
  iscoCode?: string;
}

export const FREY_OSBORNE_2017: Record<string, FreyOsborneEntry> = {
  // --- Tech / digital occupations ---
  "15-1252": { socCode: "15-1252", occupation: "Software Developer", probability: 0.043, iscoCode: "2512" },
  "15-1251": { socCode: "15-1251", occupation: "Computer Programmer", probability: 0.48, iscoCode: "2514" },
  "15-1254": { socCode: "15-1254", occupation: "Web Developer", probability: 0.21, iscoCode: "2513" },
  "15-1242": { socCode: "15-1242", occupation: "Database Administrator", probability: 0.03, iscoCode: "2521" },
  "15-1244": { socCode: "15-1244", occupation: "Network and Computer Systems Administrator", probability: 0.03, iscoCode: "2522" },
  "15-1241": { socCode: "15-1241", occupation: "Computer Network Architect", probability: 0.017 },
  "15-1212": { socCode: "15-1212", occupation: "Information Security Analyst", probability: 0.21 },
  "15-1211": { socCode: "15-1211", occupation: "Computer Systems Analyst", probability: 0.65 },
  "15-2051": { socCode: "15-2051", occupation: "Data Scientist / Statistician", probability: 0.22 },
  "15-2031": { socCode: "15-2031", occupation: "Operations Research Analyst", probability: 0.035 },
  "15-1299": { socCode: "15-1299", occupation: "Computer Occupations, All Other", probability: 0.21 },
  "11-3021": { socCode: "11-3021", occupation: "Computer and Information Systems Manager", probability: 0.035 },

  // --- Engineering ---
  "17-2141": { socCode: "17-2141", occupation: "Mechanical Engineer", probability: 0.011 },
  "17-2051": { socCode: "17-2051", occupation: "Civil Engineer", probability: 0.019 },
  "17-2071": { socCode: "17-2071", occupation: "Electrical Engineer", probability: 0.10 },
  "17-2112": { socCode: "17-2112", occupation: "Industrial Engineer", probability: 0.029 },

  // --- Office / clerical (high automation risk) ---
  "13-2011": { socCode: "13-2011", occupation: "Accountant or Auditor", probability: 0.94 },
  "43-3031": { socCode: "43-3031", occupation: "Bookkeeping, Accounting, and Auditing Clerk", probability: 0.98, iscoCode: "4311" },
  "43-9061": { socCode: "43-9061", occupation: "Office Clerk, General", probability: 0.96, iscoCode: "4110" },
  "43-6014": { socCode: "43-6014", occupation: "Secretary or Administrative Assistant", probability: 0.96, iscoCode: "4110" },
  "43-4051": { socCode: "43-4051", occupation: "Customer Service Representative", probability: 0.55, iscoCode: "4222" },
  "43-4171": { socCode: "43-4171", occupation: "Receptionist or Information Clerk", probability: 0.96 },
  "43-3071": { socCode: "43-3071", occupation: "Teller", probability: 0.98 },
  "41-9041": { socCode: "41-9041", occupation: "Telemarketer", probability: 0.99 },
  "41-3031": { socCode: "41-3031", occupation: "Securities, Commodities, Financial Services Sales Agent", probability: 0.13 },

  // --- Communication / writing ---
  "27-3041": { socCode: "27-3041", occupation: "Editor", probability: 0.058 },
  "27-3043": { socCode: "27-3043", occupation: "Writer or Author", probability: 0.038 },
  "27-3023": { socCode: "27-3023", occupation: "Reporter or Correspondent", probability: 0.11 },
  "27-3031": { socCode: "27-3031", occupation: "Public Relations Specialist", probability: 0.18 },
  "27-3091": { socCode: "27-3091", occupation: "Interpreter or Translator", probability: 0.38, iscoCode: "2643" },

  // --- Management ---
  "11-2021": { socCode: "11-2021", occupation: "Marketing Manager", probability: 0.014, iscoCode: "1221" },
  "11-2022": { socCode: "11-2022", occupation: "Sales Manager", probability: 0.013 },
  "11-3031": { socCode: "11-3031", occupation: "Financial Manager", probability: 0.069 },
  "11-9111": { socCode: "11-9111", occupation: "Medical and Health Services Manager", probability: 0.073 },
  "11-9013": { socCode: "11-9013", occupation: "Farm, Ranch, and Other Agricultural Manager", probability: 0.47 },

  // --- Education ---
  "25-1099": { socCode: "25-1099", occupation: "Postsecondary Teacher", probability: 0.032 },
  "25-2031": { socCode: "25-2031", occupation: "Secondary School Teacher", probability: 0.0078, iscoCode: "2330" },
  "25-2021": { socCode: "25-2021", occupation: "Elementary School Teacher", probability: 0.0044 },

  // --- Health ---
  "29-1141": { socCode: "29-1141", occupation: "Registered Nurse", probability: 0.009, iscoCode: "2221" },
  "29-1062": { socCode: "29-1062", occupation: "Family or General Practitioner (Physician)", probability: 0.0042 },
  "29-1228": { socCode: "29-1228", occupation: "Surgeon", probability: 0.0042 },

  // --- Trade / repair / construction ---
  "49-2022": { socCode: "49-2022", occupation: "Telecommunications Equipment Installer/Repairer", probability: 0.50 },
  "49-2094": { socCode: "49-2094", occupation: "Electrical and Electronic Equipment Repairer", probability: 0.78, iscoCode: "7421" },
  "49-2092": { socCode: "49-2092", occupation: "Computer Repair Technician", probability: 0.30 },
  "49-9021": { socCode: "49-9021", occupation: "Heating, AC, Refrigeration Mechanic", probability: 0.65 },
  "49-3023": { socCode: "49-3023", occupation: "Automotive Service Technician or Mechanic", probability: 0.59, iscoCode: "7231" },
  "47-2111": { socCode: "47-2111", occupation: "Electrician", probability: 0.15, iscoCode: "7411" },
  "47-2152": { socCode: "47-2152", occupation: "Plumber, Pipefitter, Steamfitter", probability: 0.35, iscoCode: "7126" },
  "47-2031": { socCode: "47-2031", occupation: "Carpenter", probability: 0.72, iscoCode: "7115" },
  "47-2061": { socCode: "47-2061", occupation: "Construction Laborer", probability: 0.88 },

  // --- Service / hospitality ---
  "35-2014": { socCode: "35-2014", occupation: "Cook, Restaurant", probability: 0.96 },
  "35-3031": { socCode: "35-3031", occupation: "Waiter or Waitress", probability: 0.94 },
  "39-5012": { socCode: "39-5012", occupation: "Hairdresser, Hairstylist, Cosmetologist", probability: 0.11 },
  "39-9011": { socCode: "39-9011", occupation: "Childcare Worker", probability: 0.084 },
  "37-2011": { socCode: "37-2011", occupation: "Janitor or Cleaner", probability: 0.66 },

  // --- Retail / sales ---
  "41-2031": { socCode: "41-2031", occupation: "Retail Salesperson", probability: 0.92, iscoCode: "5223" },
  "41-2011": { socCode: "41-2011", occupation: "Cashier", probability: 0.97, iscoCode: "5230" },

  // --- Logistics / transport ---
  "53-3032": { socCode: "53-3032", occupation: "Heavy or Tractor-Trailer Truck Driver", probability: 0.79 },
  "53-3052": { socCode: "53-3052", occupation: "Bus Driver, Transit and Intercity", probability: 0.67 },
  "53-3054": { socCode: "53-3054", occupation: "Taxi Driver", probability: 0.89 },

  // --- Agriculture ---
  "11-9013-A": { socCode: "11-9013-A", occupation: "Farmer, Rancher, or Agricultural Manager (smallholder)", probability: 0.47, iscoCode: "6111" },
  "45-2092": { socCode: "45-2092", occupation: "Farmworker / Crop Laborer", probability: 0.87, iscoCode: "9211" },
  "45-2011": { socCode: "45-2011", occupation: "Agricultural Inspector", probability: 0.16 },
  "45-2041": { socCode: "45-2041", occupation: "Grader/Sorter, Agricultural Products", probability: 0.93 },

  // --- Tailoring / textile ---
  "51-6052": { socCode: "51-6052", occupation: "Tailor, Dressmaker, Custom Sewer", probability: 0.84, iscoCode: "7531" },
  "51-6031": { socCode: "51-6031", occupation: "Sewing Machine Operator", probability: 0.89 },

  // --- Legal ---
  "23-1011": { socCode: "23-1011", occupation: "Lawyer", probability: 0.035 },
  "23-2011": { socCode: "23-2011", occupation: "Paralegal or Legal Assistant", probability: 0.94 },
};

/**
 * Look up a Frey-Osborne entry by SOC code.
 */
export function getFreyOsborneEntry(socCode: string): FreyOsborneEntry | null {
  return FREY_OSBORNE_2017[socCode] ?? null;
}

export const FREY_OSBORNE_CITATION =
  "Frey & Osborne 2017, Technological Forecasting and Social Change 114";
