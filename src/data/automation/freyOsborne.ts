import data from "./freyOsborne.json";

export interface FreyOsborneRow {
  title: string;
  probability: number;
}

const occupations = data.occupations as Record<string, FreyOsborneRow>;

export const FREY_OSBORNE_META = data._meta;

export function lookupFreyOsborne(socCode: string): FreyOsborneRow | null {
  return occupations[socCode] ?? null;
}
