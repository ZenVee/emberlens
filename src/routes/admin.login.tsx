import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({ meta: [{ title: "Studio Login — Ember Lens" }] }),
  component: AdminLogin,
});

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function AdminLogin() {
  const { error: callbackError } = Route.useSearch();
  const [error, setError] = useState<string | null>(callbackError ?? null);
  const [loading, setLoading] = useState(false);

  async function signInWithDiscord() {
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Discord sign-in");
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-gradient-night" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-ember/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blush/20 blur-3xl" />

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-ember shadow-glow">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-xl">
            Ember <span className="text-gradient-ember">Lens</span>
          </span>
        </Link>

        <h1 className="font-display text-3xl">Studio access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with Discord to manage photos, projects, and bookings.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={signInWithDiscord}
          disabled={loading}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#5865F2] py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          <DiscordIcon className="h-5 w-5" />
          {loading ? "Redirecting…" : "Continue with Discord"}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Discord sign-in only.{" "}
          <Link to="/" className="text-ember hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
