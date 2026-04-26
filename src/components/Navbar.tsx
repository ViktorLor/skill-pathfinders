import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACCOUNT_SESSION_CHANGED_EVENT,
  clearStoredAccountSession,
  getStoredAccountSession,
  type AccountSession,
} from "@/lib/accountSession";
import {
  SUPPORTED_LANGUAGES,
  getStoredLanguage,
  setStoredLanguage,
} from "@/lib/i18n";
import { BarChart3, ChevronDown, Globe2, LogOut, UserCircle2 } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [account, setAccount] = useState<AccountSession | null>(null);
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(getStoredLanguage);

  useEffect(() => {
    setAccount(getStoredAccountSession());

    const refreshAccount = () => setAccount(getStoredAccountSession());
    window.addEventListener("storage", refreshAccount);
    window.addEventListener(ACCOUNT_SESSION_CHANGED_EVENT, refreshAccount);

    return () => {
      window.removeEventListener("storage", refreshAccount);
      window.removeEventListener(ACCOUNT_SESSION_CHANGED_EVENT, refreshAccount);
    };
  }, []);

  useEffect(() => {
    setAccount(getStoredAccountSession());
  }, [pathname]);

  const logout = () => {
    clearStoredAccountSession();
    setAccount(null);
    navigate({ to: "/" });
  };

  const switchLanguage = (lang: string) => {
    void i18n.changeLanguage(lang);
    setStoredLanguage(lang);
    setCurrentLang(lang);
  };

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo + nav grouped left */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy font-bold text-navy-foreground">
              U
            </div>
            <span className="text-lg font-bold tracking-tight text-navy">Unmapped</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-navy"
              activeProps={{ className: "bg-muted text-navy" }}
              activeOptions={{ exact: true }}
            >
              <UserCircle2 className="h-4 w-4" />
              {t("nav.buildProfile")}
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-navy"
              activeProps={{ className: "bg-muted text-navy" }}
            >
              <BarChart3 className="h-4 w-4" />
              {t("nav.liveDashboard")}
            </Link>
          </nav>
        </div>

        {/* Right side — language + auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language switcher — only shown when more than one language is available */}
          {SUPPORTED_LANGUAGES.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-md text-muted-foreground hover:text-navy"
                >
                  <Globe2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{activeLang.label}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => switchLanguage(lang.code)}
                    className={lang.code === currentLang ? "font-semibold text-navy" : ""}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {account ? (
            <div className="flex items-center gap-2">
              <span className="max-w-[9rem] truncate text-sm font-medium text-muted-foreground sm:max-w-[14rem]">
                {account.email}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={logout}
                className="rounded-md text-muted-foreground hover:text-navy"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-md text-muted-foreground hover:text-navy"
            >
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
