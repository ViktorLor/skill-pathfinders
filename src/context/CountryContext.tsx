import { createContext, useContext, useState, type ReactNode } from "react";
import { COUNTRY_CONFIGS, FEATURED_COUNTRIES } from "@/data/countries.config";
import { getIsoCountry } from "@/data/isoCountries";
import type { CountryConfig } from "@/types/unmapped";

interface Ctx {
  country: CountryConfig;
  setCountryCode: (code: string) => void;
}

const CountryContext = createContext<Ctx | null>(null);

const DEFAULT_COUNTRY_CODE = FEATURED_COUNTRIES[0]?.code ?? "GHA";

function getCountryConfig(code: string): CountryConfig {
  const normalized = code.trim().toUpperCase();
  const featuredCountry = COUNTRY_CONFIGS[normalized];
  if (featuredCountry) return featuredCountry;

  const isoCountry = getIsoCountry(normalized);
  if (isoCountry) {
    return {
      code: isoCountry.code,
      name: isoCountry.name,
      flag: isoCountry.flag,
      language: "en",
      currency: "",
      currencySymbol: "",
      iloCountryCode: isoCountry.code,
      wbCountryCode: isoCountry.code,
      sectors: [],
      opportunityTypes: ["formal", "self-employment", "gig", "training"],
    };
  }

  return COUNTRY_CONFIGS[DEFAULT_COUNTRY_CODE];
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const country = getCountryConfig(code);
  return (
    <CountryContext.Provider value={{ country, setCountryCode: setCode }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const c = useContext(CountryContext);
  if (!c) throw new Error("useCountry must be used inside CountryProvider");
  return c;
}
