import {
  createFileRoute,
  Outlet,
  redirect,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { AdminPageMetaProvider } from "@/components/admin-page-meta";
import { useAdminPageMetaState } from "@/components/use-admin-page-meta";
import { AdminShell } from "@/components/admin-shell";
import { prefetchAdminDashboard } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location, preload }) => {
    const isLogin = location.pathname === "/admin/login";
    const isOnboarding = location.pathname === "/admin/onboarding";

    if (isLogin) {
      if (!preload && context.user?.isAdmin) {
        throw redirect({
          to: context.user.needsOnboarding ? "/admin/onboarding" : "/admin",
        });
      }
      return;
    }

    if (preload) return;

    if (!context.user) {
      throw redirect({ to: "/admin/login", search: { error: undefined } });
    }

    if (!context.user.isAdmin) {
      throw redirect({
        to: "/admin/login",
        search: { error: "You do not have studio admin access." },
      });
    }

    if (context.user.needsOnboarding && !isOnboarding) {
      throw redirect({ to: "/admin/onboarding" });
    }

    if (!context.user.needsOnboarding && isOnboarding) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminLayout,
});

const BARE_ADMIN_PATHS = ["/admin/login", "/admin/onboarding"] as const;

function isBareAdminPath(pathname: string) {
  return (BARE_ADMIN_PATHS as readonly string[]).includes(pathname);
}

function adminLayoutMode(s: {
  location: { pathname: string };
  resolvedLocation?: { pathname: string };
  isTransitioning: boolean;
  status: "pending" | "idle";
}) {
  const current = s.resolvedLocation?.pathname ?? s.location.pathname;
  const target = s.location.pathname;
  const transitioning = s.isTransitioning || s.status === "pending";

  if (transitioning && current.startsWith("/admin") && !target.startsWith("/admin")) {
    return "exit" as const;
  }

  if (isBareAdminPath(current) || (transitioning && isBareAdminPath(target))) {
    return "bare" as const;
  }

  return "shell" as const;
}

function AdminLayout() {
  const mode = useRouterState({ select: adminLayoutMode });

  if (mode === "exit") return null;

  return (
    <AdminPageMetaProvider>
      {mode === "bare" ? <Outlet /> : <AdminLayoutShell />}
    </AdminPageMetaProvider>
  );
}

function AdminLayoutShell() {
  const meta = useAdminPageMetaState();
  const { queryClient } = useRouteContext({ from: "__root__" });

  useEffect(() => {
    prefetchAdminDashboard(queryClient);
  }, [queryClient]);

  return (
    <AdminShell title={meta.title} subtitle={meta.subtitle}>
      <Outlet />
    </AdminShell>
  );
}
