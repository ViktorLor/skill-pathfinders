import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboard")({
  head: () => ({
    meta: [{ title: "Opening profile - Unmapped" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    profileId: typeof search.profileId === "string" ? search.profileId : "",
  }),
  component: OnboardRedirect,
});

function OnboardRedirect() {
  const { profileId } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileId) return;
    navigate({ to: "/profile/$id", params: { id: profileId }, replace: true });
  }, [navigate, profileId]);

  if (!profileId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-navy">Profile unavailable</h1>
        <p className="mt-2 text-muted-foreground">No profile was selected.</p>
        <Button asChild className="mt-6 rounded-md bg-navy text-navy-foreground hover:bg-navy/90">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
      <div className="inline-flex items-center rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Opening profile
      </div>
    </main>
  );
}
