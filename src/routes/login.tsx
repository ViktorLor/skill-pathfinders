import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login - Unmapped" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-navy">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Account access placeholder.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Email
            </span>
            <Input type="email" placeholder="" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Password
            </span>
            <Input type="password" placeholder="" />
          </label>
        </div>

        <Button className="mt-6 w-full rounded-md bg-navy text-navy-foreground hover:bg-navy/90">
          Login
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link to="/register" className="font-medium text-navy hover:text-teal">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
