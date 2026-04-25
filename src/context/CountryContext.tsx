import { createContext, useContext, useState, type ReactNode } from "react";
import { COUNTRY_CONFIGS } from "@/data/mock";
import type { CountryConfig } from "@/types/unmapped";

interface Ctx {
  country: CountryConfig;
  setCountryCode: (code: "GHA" | "BGD" | "NGA") => void;
}

const CountryContext = createContext<Ctx | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<"GHA" | "BGD" | "NGA">("GHA");
  return (
    <CountryContext.Provider value={{ country: COUNTRY_CONFIGS[code], setCountryCode: setCode }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const c = useContext(CountryContext);
  if (!c) throw new Error("useCountry must be used inside CountryProvider");
  return c;
}
