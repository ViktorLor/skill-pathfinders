import { Link } from "@tanstack/react-router";
import { useCountry } from "@/context/CountryContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Navbar() {
  const { country, setCountryCode } = useCountry();
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy text-navy-foreground font-bold">
            U
          </div>
          <span className="text-lg font-bold tracking-tight text-navy">Unmapped</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-navy"
            activeProps={{ className: "text-navy" }}
          >
            For Organizations
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-md text-muted-foreground hover:text-navy"
          >
            <Link to="/login">Login</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-md border-border">
                <span className="mr-1">{country.flag}</span>
                <span className="hidden sm:inline">{country.name}</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCountryCode("GHA")}>🇬🇭 Ghana</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCountryCode("BGD")}>
                🇧🇩 Bangladesh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCountryCode("NGA")}>🇳🇬 Nigeria</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            size="sm"
            className="rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
          >
            <Link to="/">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
