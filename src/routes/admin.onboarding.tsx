import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera } from "lucide-react";
import { useState } from "react";

import { updateDisplayName } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/admin/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Ember Lens" }] }),
  component: AdminOnboarding,
});

function AdminOnboarding() {
  const { user } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const router = useRouter();
  const updateDisplayNameFn = useServerFn(updateDisplayName);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await updateDisplayNameFn({ data: { displayName } });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await router.invalidate();
    navigate({ to: "/admin" });
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
        <div className="mb-8 inline-flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-ember shadow-glow">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-xl">
            Ember <span className="text-gradient-ember">Lens</span>
          </span>
        </div>

        <h1 className="font-display text-3xl">Welcome to the studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a display name for your profile. You can change this later in settings.
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-ember text-lg font-semibold text-primary-foreground">
              {initials || "?"}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ember">Discord connected</p>
            <p className="text-sm text-muted-foreground">You're signed in</p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ember Studio"
              maxLength={48}
              autoFocus
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-ember"
            />
          </label>
          <button
            type="submit"
            disabled={loading || displayName.trim().length < 2}
            className="w-full rounded-full bg-gradient-ember py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? "Saving…" : "Enter studio"}
          </button>
        </form>
      </div>
    </div>
  );
}
