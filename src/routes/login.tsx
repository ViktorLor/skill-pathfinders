import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveStoredAccountSession } from "@/lib/accountSession";
import { verifyAccountLogin } from "@/services/accounts.server";
import { findLatestAccountProfile } from "@/services/profileAccounts.server";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Unmapped" }],
  }),
  component: LoginPage,
});

const loginAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => verifyAccountLogin(data));

const loadLatestAccountProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { accountId: string }) => data)
  .handler(async ({ data }) => findLatestAccountProfile(data.accountId));

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const accountId = window.localStorage.getItem("accountId");
    if (!accountId) return;

    void loadLatestAccountProfile({ data: { accountId } })
      .then((profile) => {
        if (profile?.profileId) {
          navigate({ to: "/profile/$id", params: { id: profile.profileId } });
        }
      })
      .catch(() => undefined);
  }, [navigate]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const account = await loginAccount({ data: { email, password } });
      saveStoredAccountSession(account);
      const profile = await loadLatestAccountProfile({ data: { accountId: account.id } });
      if (profile?.profileId) {
        navigate({ to: "/profile/$id", params: { id: profile.profileId } });
        return;
      }
      setMessage(`Logged in as ${account.email}.`);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.errors.couldNotLogin"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12 sm:px-6">
      <form
        onSubmit={submitLogin}
        className="w-full rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h1 className="text-2xl font-semibold text-navy">{t("nav.login")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("login.subtitle")}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {t("landing.auth.email")}
            </span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {t("landing.auth.password")}
            </span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-md border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-foreground">
            {message}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-md bg-navy text-navy-foreground hover:bg-navy/90"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("nav.login")}
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("login.noAccountYet")} {" "}
          <Link to="/register" className="font-medium text-navy hover:text-teal">
            {t("landing.auth.register")}
          </Link>
        </p>
      </form>
    </main>
  );
}
