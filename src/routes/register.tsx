import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { FormEvent } from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveStoredAccountSession } from "@/lib/accountSession";
import { createAccount } from "@/services/accounts.server";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Register - Unmapped" }],
  }),
  component: RegisterPage,
});

const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => createAccount(data));

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const account = await registerAccount({ data: { email, password } });
      saveStoredAccountSession(account);
      setMessage(`Account created for ${account.email}.`);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12 sm:px-6">
      <form
        onSubmit={submitRegister}
        className="w-full rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h1 className="text-2xl font-semibold text-navy">Register</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account with an email and password.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Name
            </span>
            <Input placeholder="" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Email
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
              Password
            </span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
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
          Register
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-navy hover:text-teal">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
