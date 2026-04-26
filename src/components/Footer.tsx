import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

const YEAR = new Date().getFullYear();

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-20 border-t border-border bg-background print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-navy font-bold text-navy-foreground text-sm">
                U
              </div>
              <span className="text-base font-bold tracking-tight text-navy">Unmapped</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.product")}
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm text-muted-foreground transition hover:text-navy"
                >
                  {t("nav.buildProfile")}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-muted-foreground transition hover:text-navy"
                >
                  {t("nav.liveDashboard")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.dataSources")}
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://api.worldbank.org/v2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
                >
                  {t("footer.worldBankWdi")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://esco.ec.europa.eu/en/use-esco/esco-rest-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
                >
                  ESCO API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://ilostat.ilo.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
                >
                  ILO Task Index
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://doi.org/10.1016/j.techfore.2016.08.019"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
                >
                  Frey-Osborne 2017
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.wittgensteincentre.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
                >
                  Wittgenstein Centre
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("footer.about")}
            </h3>
            <ul className="mt-3 space-y-2">
              <li className="text-sm text-muted-foreground">
                {t("footer.aboutText")}
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
                >
                  {t("footer.github")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-[11px] text-muted-foreground">
          <p>
            &copy; {YEAR} Unmapped. {t("footer.copyright")}
          </p>
          <p className="text-right leading-relaxed">
            {t("footer.automationCredit")}
          </p>
        </div>
      </div>
    </footer>
  );
}
