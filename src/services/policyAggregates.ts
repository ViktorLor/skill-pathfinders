export interface PolicyAggregateRow {
  rank: number;
  code: string;
  title: string;
  profiles: number;
  unemployedProfiles: number;
  shareLabel: string;
}

export interface PolicyProfileAggregates {
  totalProfiles: number;
  uniqueOccupations: number;
  unemployedProfiles: number;
  sourceLabel: string;
  iscoEscoTop10: PolicyAggregateRow[];
  unemploymentTop10: PolicyAggregateRow[];
}

const HARDCODED_POLICY_AGGREGATES: PolicyProfileAggregates = {
  totalProfiles: 1247,
  uniqueOccupations: 38,
  unemployedProfiles: 412,
  sourceLabel: "Demo aggregate until live profile analytics are connected",
  iscoEscoTop10: [
    row(1, "ISCO 3512 / ESCO software developer", "Software and web developers", 184, 38),
    row(2, "ISCO 5223 / ESCO shop sales assistant", "Retail and customer sales workers", 142, 61),
    row(3, "ISCO 6111 / ESCO crop farm worker", "Crop production and farm workers", 118, 47),
    row(4, "ISCO 5120 / ESCO cook", "Cooks and food preparation workers", 93, 29),
    row(5, "ISCO 7411 / ESCO electrician", "Building and related electricians", 77, 18),
    row(6, "ISCO 8322 / ESCO car driver", "Drivers and delivery workers", 74, 27),
    row(7, "ISCO 4226 / ESCO receptionist", "Front desk and client service clerks", 67, 25),
    row(8, "ISCO 3313 / ESCO bookkeeper", "Bookkeeping and accounting clerks", 54, 15),
    row(9, "ISCO 5322 / ESCO home-based care worker", "Care and community support workers", 49, 22),
    row(10, "ISCO 7126 / ESCO plumber", "Plumbers and pipe fitters", 43, 12),
  ],
  unemploymentTop10: [
    row(1, "ISCO 5223 / ESCO shop sales assistant", "Retail and customer sales workers", 142, 61),
    row(2, "ISCO 6111 / ESCO crop farm worker", "Crop production and farm workers", 118, 47),
    row(3, "ISCO 3512 / ESCO software developer", "Software and web developers", 184, 38),
    row(4, "ISCO 5120 / ESCO cook", "Cooks and food preparation workers", 93, 29),
    row(5, "ISCO 8322 / ESCO car driver", "Drivers and delivery workers", 74, 27),
    row(6, "ISCO 4226 / ESCO receptionist", "Front desk and client service clerks", 67, 25),
    row(7, "ISCO 5322 / ESCO home-based care worker", "Care and community support workers", 49, 22),
    row(8, "ISCO 7411 / ESCO electrician", "Building and related electricians", 77, 18),
    row(9, "ISCO 3313 / ESCO bookkeeper", "Bookkeeping and accounting clerks", 54, 15),
    row(10, "ISCO 7126 / ESCO plumber", "Plumbers and pipe fitters", 43, 12),
  ],
};

export async function getPolicyProfileAggregates(): Promise<PolicyProfileAggregates> {
  return HARDCODED_POLICY_AGGREGATES;
}

function row(
  rank: number,
  code: string,
  title: string,
  profiles: number,
  unemployedProfiles: number,
): PolicyAggregateRow {
  return {
    rank,
    code,
    title,
    profiles,
    unemployedProfiles,
    shareLabel: `${Math.round((unemployedProfiles / profiles) * 100)}% unemployed`,
  };
}
