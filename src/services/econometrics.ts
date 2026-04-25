export async function getWageSignal(
  iscoCode: string,
  countryCode: string,
): Promise<string> {
  console.log("TODO: implement getWageSignal", iscoCode, countryCode);
  return "Avg. wage: data unavailable";
}

export async function getYouthUnemployment(
  countryCode: string,
): Promise<string> {
  console.log("TODO: implement getYouthUnemployment", countryCode);
  return "Youth unemployment: data unavailable";
}
