import { getYouthUnemployment as getWorldBankYouthUnemployment } from "@/services/worldBank";

export async function getWageSignal(iscoCode: string, countryCode: string): Promise<string> {
  console.log("TODO: implement getWageSignal", iscoCode, countryCode);
  return "Avg. wage: data unavailable";
}

export async function getYouthUnemployment(countryCode: string): Promise<string> {
  try {
    return await getWorldBankYouthUnemployment(countryCode);
  } catch (error) {
    console.error("Failed to fetch World Bank youth unemployment", error);
    return "Youth unemployment: data unavailable";
  }
}
