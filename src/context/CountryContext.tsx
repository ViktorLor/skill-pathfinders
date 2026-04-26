import { createContext, useContext, useState, type ReactNode } from "react";
import {
  COUNTRY_CONFIGS,
  FEATURED_COUNTRIES,
} from "@/data/countries.config";
import type { CountryConfig } from "@/types/unmapped";

interface Ctx {
  country: CountryConfig;
  setCountryCode: (code: string) => void;
}

const CountryContext = createContext<Ctx | null>(null);

const DEFAULT_COUNTRY_CODE = FEATURED_COUNTRIES[0]?.code ?? "GHA";

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const country = COUNTRY_CONFIGS[code] ?? COUNTRY_CONFIGS[DEFAULT_COUNTRY_CODE];
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
