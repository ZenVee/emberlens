import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Camera } from "lucide-react";

import { handleAuthCallback } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  loader: () => handleAuthCallback(),
  component: AuthCallback,
});

function AuthCallback() {
  const result = Route.useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    if (result.error) {
      navigate({ to: "/admin/login", search: { error: result.error } });
      return;
    }
    navigate({ to: result.next });
  }, [navigate, result.error, result.next]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-ember shadow-glow">
          <Camera className="h-5 w-5 text-primary-foreground" />
        </span>
        <p className="font-display text-xl">Signing you in…</p>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting to the studio.</p>
      </div>
    </div>
  );
}
